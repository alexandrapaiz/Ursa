"use client";

import { useCallback, useState } from "react";
import { parseRecord } from "@/lib/record/parse";
import {
  indexUrlFor,
  parsePublishedIndex,
  recordUrlFor,
  sharesOf,
  type PublishedIndex,
  type PublishedRecordSummary,
} from "@/lib/record/published-index";
import { humanBytes, integrityCopy, verify, type Integrity } from "@/lib/record/integrity";
import { CLASS_COPY, SPAN_CLASSES, type OutcomeRecord } from "@/lib/record/types";
import RecordView from "./record-view";

interface OpenedRecord {
  summary: PublishedRecordSummary;
  record: OutcomeRecord;
  integrity: Integrity;
}

const FILL: Record<string, string> = {
  survived_verbatim: "rgba(168, 199, 250, 0.55)",
  survived_mutated: "rgba(168, 199, 250, 0.28)",
  no_generation_provenance: "rgba(232, 237, 247, 0.12)",
};

/**
 * Read a published site: the set first, then one record.
 *
 * ## The shape, and why it is this one
 *
 * Someone who ran `ursa publish` has a site address and ten records
 * behind it. The two things they can do with that address are see what
 * is there and read one of them, and those are two different costs:
 *
 * 1. **The set costs the index and nothing else.** Every number in the
 *    list below is already in `index.json`. Ten records measured here on
 *    2026-10-18 came to 9,353 bytes, 1,267 over a connection that
 *    compresses, so the whole set is browsable for about a kilobyte. No
 *    record is fetched to draw this.
 * 2. **A record costs that record.** It is fetched when it is asked for,
 *    once, and nothing else is fetched with it.
 *
 * That split is the answer to the problem the resolver seat left here.
 * Its fallback writes one page per record with the whole record inlined,
 * which is correct and needs no network and, measured on the same ten
 * records, is 2,568,965 bytes at its worst. The cost was being paid at
 * the wrong moment: to look at a list, you downloaded a record.
 *
 * ## The integrity claim, kept rather than traded
 *
 * Inlining cannot be shown the wrong record, because the page and the
 * record are one file. Fetching gives that up and has to earn it back,
 * which is `integrity.ts`: the index states a digest, the viewer hashes
 * what arrived, and the page says which of the two it is looking at.
 * Where a site's index predates the digest field the page says that too,
 * rather than quietly implying a check it did not perform.
 *
 * ## No table
 *
 * The set is a list of blocks, not rows. A record id is a slug of
 * fifty-odd characters and a table of them measured 522px wide inside a
 * 390px phone, overflowing by 132px with every id broken one word per
 * line. Blocks give the id the full measure and the numbers a row of
 * their own at every width.
 */
export function PublishedSite() {
  const [address, setAddress] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [site, setSite] = useState<{ index: PublishedIndex; url: string; note: string | null; bytes: number } | null>(
    null,
  );
  const [open, setOpen] = useState<OpenedRecord | null>(null);
  const [opening, setOpening] = useState<string | null>(null);

  const readSite = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const url = indexUrlFor(address);
      if (!url) {
        setError("That is not a web address. Paste the address your published site is served at.");
        return;
      }
      setBusy(true);
      setError(null);
      setOpen(null);
      try {
        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) {
          setError(
            `${url} answered ${res.status}. If your site is published somewhere else, paste that address; this page looked for the index at the root of the one you gave.`,
          );
          setSite(null);
          return;
        }
        const text = await res.text();
        const parsed = parsePublishedIndex(text);
        if (!parsed.ok) {
          setError(parsed.error);
          setSite(null);
          return;
        }
        setSite({
          index: parsed.index,
          url,
          note: parsed.note,
          bytes: new TextEncoder().encode(text).length,
        });
      } catch {
        setError(
          "Your browser could not read that address. A site that sends no cross-origin header will refuse to load here, and nothing on our side will fetch it on your behalf; that is the point. GitHub Pages sends one.",
        );
        setSite(null);
      } finally {
        setBusy(false);
      }
    },
    [address],
  );

  const openRecord = useCallback(
    async (summary: PublishedRecordSummary) => {
      if (!site) return;
      const url = recordUrlFor(site.url, summary);
      if (!url) {
        setError(`The index gives no machine-readable address for ${summary.id}, so there is nothing to fetch.`);
        return;
      }
      setOpening(summary.id);
      setError(null);
      try {
        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) {
          setError(`${summary.id} is listed in the index but its record answered ${res.status}.`);
          return;
        }
        // The body as it arrived. The digest is over bytes, so this
        // string is hashed before anything parses or reserialises it.
        const text = await res.text();
        const integrity = await verify(summary, text);
        const parsed = parseRecord(text);
        if (!parsed.ok) {
          // Order matters here. Bytes that fail the digest often also
          // fail to parse, and "that is not JSON" is the less useful of
          // the two sentences: it describes the symptom while the
          // integrity check already knows the cause. So when both are
          // true the person is told the record is not the published one
          // first, and what the parser made of it second.
          setError(
            integrity.state === "mismatch"
              ? `${integrityCopy(integrity).line} The parser then stopped on it: ${parsed.error}`
              : parsed.error,
          );
          return;
        }
        setOpen({ summary, record: parsed.record, integrity });
      } catch {
        setError(`Your browser could not fetch ${summary.id} from this site.`);
      } finally {
        setOpening(null);
      }
    },
    [site],
  );

  return (
    <section className="border-t border-[var(--line)] py-12">
      <h2 className="font-mono text-[0.68rem] uppercase tracking-[0.28em] text-[var(--dim)]">
        <span className="text-[var(--polar)]">✦</span> Read a published site
      </h2>
      <p className="mt-7 max-w-2xl text-[0.95rem] leading-[1.7] text-[#b7c0d4]">
        <span className="font-mono text-[0.85rem] text-[var(--star)]">ursa publish</span> turns your
        records into a static site on hosting you own. Paste its address and this page reads the
        index at its root, which is how you see the whole set before fetching any of it.
      </p>

      <form onSubmit={readSite} className="mt-8 flex w-full min-w-0 flex-col items-start gap-3 sm:flex-row sm:items-baseline sm:gap-5">
        <input
          type="url"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="https://you.github.io/your-repo/"
          aria-label="the address of a published site"
          className="w-full min-w-0 border-b border-[var(--line)] bg-transparent pb-2 font-mono text-[0.72rem] text-[var(--star)] placeholder:text-[var(--dim)] focus:border-[var(--polar)] focus:outline-none sm:flex-1 sm:text-[0.76rem]"
        />
        <button
          type="submit"
          disabled={busy || !address}
          className="rec-action shrink-0 font-mono text-[0.7rem] tracking-[0.06em] text-[var(--polar)] disabled:cursor-not-allowed disabled:text-[var(--dim)]"
        >
          {busy ? "reading…" : "read the site"}
        </button>
      </form>

      {error ? (
        <p role="alert" className="mt-6 max-w-2xl text-[0.85rem] leading-[1.6] text-[var(--star)]">
          {error}
        </p>
      ) : null}

      {site && !open ? <SiteSet site={site} onOpen={openRecord} opening={opening} /> : null}

      {open ? (
        <OpenRecord
          open={open}
          siteUrl={site?.url ?? ""}
          onBack={() => setOpen(null)}
        />
      ) : null}
    </section>
  );
}

/** The set, drawn from the index alone. No record is fetched for this. */
function SiteSet({
  site,
  onOpen,
  opening,
}: {
  site: { index: PublishedIndex; url: string; note: string | null; bytes: number };
  onOpen: (s: PublishedRecordSummary) => void;
  opening: string | null;
}) {
  const { index } = site;

  if (index.records.length === 0) {
    return (
      <p className="mt-10 max-w-2xl text-[0.95rem] leading-[1.7] text-[#b7c0d4]">
        This is a published Ursa site and it lists no records yet. Somebody set up publishing before
        resolving any work, which is the ordinary order to do it in.
      </p>
    );
  }

  return (
    <div className="mt-10">
      <p className="font-mono text-[0.7rem] leading-[1.8] tracking-[0.04em] text-[var(--dim)]">
        {index.records.length} record{index.records.length === 1 ? "" : "s"}
        {index.repository ? ` · ${index.repository}` : ""}
        {index.publishedAt ? ` · published ${index.publishedAt.slice(0, 10)}` : ""}
        {" · "}
        {humanBytes(site.bytes)} of index read, no record fetched
      </p>

      {site.note ? (
        <p className="mt-5 max-w-2xl text-[0.85rem] leading-[1.6] text-[var(--dim)]">{site.note}</p>
      ) : null}

      <ul className="mt-9">
        {index.records.map((s, i) => {
          const shares = sharesOf(s);
          return (
            <li key={s.id} className={i > 0 ? "border-t border-[var(--line)]" : ""}>
              <button
                type="button"
                onClick={() => onOpen(s)}
                disabled={opening !== null}
                className="group block w-full py-7 text-left disabled:cursor-wait"
              >
                {/* The id gets the full measure and breaks anywhere. It is
                    a slug long enough to overflow a phone on its own. */}
                <span className="block break-all font-mono text-[0.76rem] leading-[1.6] tracking-[0.04em] text-[var(--polar)] group-hover:underline group-hover:decoration-[var(--polar)] group-hover:underline-offset-4">
                  {opening === s.id ? `${s.id} — fetching…` : s.id}
                </span>

                <span className="mt-3 block font-mono text-[0.68rem] leading-[1.9] tracking-[0.04em] text-[var(--dim)]">
                  {s.generatedAt ? s.generatedAt.slice(0, 10) : "undated"}
                  {typeof s.finalChars === "number" ? ` · ${s.finalChars.toLocaleString()} characters of finished work` : ""}
                  {s.resolvedBy?.value ? ` · resolved at ${s.resolvedBy.value}` : ""}
                  {s.finished === false ? " · abandoned" : ""}
                </span>

                <span className="rec-bar mt-4 block" role="presentation">
                  {shares
                    .filter((x) => x.pct > 0)
                    .map((x) => (
                      <span
                        key={x.cls}
                        className="block h-full"
                        style={{ width: `${x.pct}%`, backgroundColor: FILL[x.cls] }}
                      />
                    ))}
                </span>

                <span className="mt-4 flex flex-wrap gap-x-8 gap-y-2 font-mono text-[0.68rem] tracking-[0.04em]">
                  {SPAN_CLASSES.map((c) => {
                    const x = shares.find((y) => y.cls === c);
                    return (
                      <span key={c} className="text-[var(--dim)]">
                        <span className="text-[var(--star)]">{(x?.pct ?? 0).toFixed(1)}%</span>{" "}
                        {CLASS_COPY[c].label}
                      </span>
                    );
                  })}
                </span>

              </button>
            </li>
          );
        })}
      </ul>

      <p className="mt-9 max-w-2xl text-[0.85rem] leading-[1.6] text-[var(--dim)]">
        The three shares divide the whole finished work rather than the classified part of it, so
        they fall short of 100% by however much a run could not account for. Every number above came
        out of this site&rsquo;s index. Opening a record fetches that record and nothing else, and
        this page then checks the bytes it got against what the index says they should be.
      </p>
    </div>
  );
}

/** One record, fetched, checked, and shown. */
function OpenRecord({
  open,
  siteUrl,
  onBack,
}: {
  open: OpenedRecord;
  siteUrl: string;
  onBack: () => void;
}) {
  const copy = integrityCopy(open.integrity);
  const url = recordUrlFor(siteUrl, open.summary);
  const tone =
    copy.tone === "bad"
      ? "text-[var(--star)]"
      : copy.tone === "good"
        ? "text-[#b7c0d4]"
        : "text-[var(--dim)]";

  return (
    <>
      <div className="mt-10 flex flex-wrap items-baseline justify-between gap-4">
        <span className="break-all font-mono text-[0.76rem] leading-[1.6] tracking-[0.04em] text-[var(--star)]">
          {open.summary.id}
        </span>
        <button
          type="button"
          onClick={onBack}
          className="rec-action shrink-0 font-mono text-[0.7rem] tracking-[0.06em] text-[var(--dim)]"
        >
          back to the set
        </button>
      </div>

      {/* The integrity line sits above the record rather than under it,
          because it governs how everything below should be read. A
          mismatch is the one state that earns the brighter ink. */}
      <div
        className={`mt-6 border-l pl-5 ${
          copy.tone === "bad" ? "border-[var(--star)]" : "border-[var(--line)]"
        }`}
      >
        <p className={`max-w-2xl text-[0.85rem] leading-[1.7] ${tone}`}>{copy.line}</p>
        <p className="mt-3 font-mono text-[0.66rem] leading-[1.9] tracking-[0.04em] text-[var(--dim)]">
          {humanBytes(open.integrity.bytes)} fetched
          {open.integrity.state === "verified" ? ` · sha256 ${open.integrity.sha256.slice(0, 16)}…` : ""}
          {open.integrity.state === "mismatch"
            ? ` · index says ${open.integrity.expected.slice(0, 16)}… · you got ${open.integrity.got.slice(0, 16)}…`
            : ""}
          {url ? (
            <>
              {" · "}
              <a href={url} className="rec-action text-[var(--polar)]" target="_blank" rel="noreferrer">
                the bytes themselves
              </a>
            </>
          ) : null}
        </p>
      </div>

      <RecordView record={open.record} />
    </>
  );
}

export default PublishedSite;
