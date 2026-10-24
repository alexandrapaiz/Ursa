"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { parseRecord } from "@/lib/record/parse";
import { recordAddressHref } from "@/lib/record/address";
import {
  FACT_SEPARATOR,
  indexUrlFor,
  parsePublishedIndex,
  recordUrlFor,
  pairingCopy,
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
      <p className="mt-7 measure text-[0.95rem] leading-[1.7] text-[#b7c0d4]">
        <span className="font-mono text-[0.85rem] text-[var(--star)]">ursa publish</span> turns your
        records into a static site on hosting you own. Paste its address and this page reads the
        index at its root, which is how you see the whole set before fetching any of it. If what you
        were sent is one record rather than a whole site,{" "}
        <Link href="/record/at" className="rec-action text-[var(--polar)]">
          read it at its own address
        </Link>
        .
      </p>

      <form onSubmit={readSite} className="mt-8 flex w-full min-w-0 flex-col items-start gap-4 sm:flex-row sm:items-baseline sm:gap-5">
        {/* The label is the target and the field is the drawing. It
            carries the overlay that makes this a 44px press (`.rec-field`
            in globals.css) and forwards the press to the field inside it,
            which keeps its own box and so keeps its own focus ring. The
            sizing lives out here for the same reason: the thing the row
            lays out is the target. */}
        <label className="rec-field w-full min-w-0 sm:flex-1">
          <input
            type="url"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="https://you.github.io/your-repo/"
            aria-label="the address of a published site"
            className="w-full min-w-0 border-b border-[var(--line)] bg-transparent pb-2 font-mono text-[0.72rem] text-[var(--star)] placeholder:text-[var(--dim)] focus:border-[var(--polar)] focus:outline-none sm:text-[0.76rem]"
          />
        </label>
        <button
          type="submit"
          disabled={busy || !address}
          className="rec-action rec-hit shrink-0 font-mono text-[0.7rem] tracking-[0.06em] text-[var(--polar)] disabled:cursor-not-allowed disabled:text-[var(--dim)]"
        >
          {busy ? "reading…" : "read the site"}
        </button>
      </form>

      {error ? (
        <p role="alert" className="mt-6 measure text-[0.85rem] leading-[1.6] text-[var(--star)]">
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

/**
 * A middot line that breaks between its facts and never inside one.
 *
 * Both lines in the set header are lists of short facts joined by a
 * middot, and at 390px both of them used to break wherever the measure
 * ran out. The count line split `published` from its date and `no
 * record` from `fetched`; the bounds list split `2` from `interposed
 * generations`, which leaves a bare numeral at the end of a line with
 * nothing saying what it counts. The middot is what tells the reader
 * where one fact stops, so a break that lands anywhere else contradicts
 * the punctuation.
 *
 * So each fact keeps its own separator glued to its right, the way a
 * comma stays with the word before it, and the only breaking space left
 * is the one between facts. The line then folds at the middots and
 * nowhere else.
 *
 * The exception is the fact that is one token, which here is the
 * repository name. It has no internal space to protect, and it is the
 * only fact whose length a stranger controls, so it is left breakable:
 * `someone/a-very-long-repository-name` must be allowed to wrap inside
 * itself rather than push the viewport sideways on a phone. Refusing to
 * break a word is only safe when something else bounds its length.
 */
function FactLine({ facts }: { facts: string[] }) {
  const shown = facts.filter((f) => f.length > 0);
  return (
    <>
      {shown.map((f, i) => {
        const last = i === shown.length - 1;
        const multiWord = f.includes(" ");
        return (
          <span key={f}>
            <span className={multiWord ? "whitespace-nowrap" : "[overflow-wrap:anywhere]"}>
              {f}
              {last ? null : "\u00a0·"}
            </span>
            {last ? null : " "}
          </span>
        );
      })}
    </>
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

  // Whether this page may promise a check at all. A digest arrived in
  // index contract 0.3, so every site published before 2026-10-18 states
  // none, and this paragraph used to promise one for all of them. The
  // record page then said the opposite one click later, which is the
  // page contradicting itself about the one thing it exists to be
  // trusted on. See `integrity.ts`.
  const pairing = pairingCopy(index);

  const withDigest = index.records.filter((r) => typeof r.sha256 === "string" && r.sha256.length > 0).length;
  const digests = withDigest === 0 ? "none" : withDigest === index.records.length ? "all" : "some";

  // An empty set has two causes and this page used to name only the
  // kinder one. The other arrived with index contract 0.4: a resolver
  // run whose pairing bounds were too narrow for this history finds
  // nothing, writes an honest empty set, and looks identical to a site
  // nobody has resolved anything on. An empty index carries no `pairing`
  // to show either, because the field is derived from the records, so the
  // only honest thing this page can do is name both causes.
  if (index.records.length === 0) {
    return (
      <>
        <p className="mt-10 measure text-[0.95rem] leading-[1.7] text-[#b7c0d4]">
          This is a published Ursa site and it lists no records. Either nobody has resolved any work
          here yet, which is the ordinary order to do it in, or the resolver did run and its pairing
          bounds were narrower than this history needed, in which case it found nothing to pair and
          published that honestly.
        </p>
        <p className="mt-5 measure text-[0.85rem] leading-[1.6] text-[var(--dim)]">
          This page cannot tell you which of the two it is. The bounds a run used are stated per
          record, so a set with no records in it states none, and whoever published this is the only
          person who can say how far their resolver was allowed to look.
        </p>
      </>
    );
  }

  return (
    <div className="mt-10">
      <p className="font-mono text-[0.7rem] leading-[1.8] tracking-[0.04em] text-[var(--dim)]">
        <FactLine
          facts={[
            `${index.records.length} record${index.records.length === 1 ? "" : "s"}`,
            index.repository ?? "",
            index.publishedAt ? `published ${index.publishedAt.slice(0, 10)}` : "",
            `${humanBytes(site.bytes)} of index read, no record fetched`,
          ]}
        />
      </p>

      {site.note ? (
        <p className="mt-5 measure text-[0.85rem] leading-[1.6] text-[var(--dim)]">{site.note}</p>
      ) : null}

      {/* New in index contract 0.4: how far the resolver was allowed to
          walk when it found this set. It sits here, under the count and
          above the records, rather than in the closing paragraph with
          the digest sentence, because it is not a caveat about the
          numbers in each row. It is the question the count itself is the
          answer to, and a reader who has already scrolled past ten
          records has read the count as a total. */}
      <p className="mt-6 measure text-[0.85rem] leading-[1.7] text-[var(--dim)]">{pairing.line}</p>
      {pairing.sets.length > 0 ? (
        <ul className="mt-4 max-w-2xl">
          {pairing.sets.map((b) => (
            <li
              key={b}
              className="border-l border-[var(--line)] py-1 pl-5 font-mono text-[0.68rem] leading-[1.9] tracking-[0.04em] text-[var(--dim)]"
            >
              <FactLine facts={b.split(FACT_SEPARATOR)} />
            </li>
          ))}
        </ul>
      ) : null}

      <ul className="mt-9">
        {index.records.map((s, i) => {
          const shares = sharesOf(s);
          return (
            <li key={s.id} className={`py-7 ${i > 0 ? "border-t border-[var(--line)]" : ""}`}>
              {/* The padding is the item's rather than the button's, so
                  that the address line below can sit inside the same
                  block without stacking two paddings between rows. An
                  anchor may not live inside a button, which is the other
                  reason it is a sibling and not part of the control. */}
              <button
                type="button"
                onClick={() => onOpen(s)}
                disabled={opening !== null}
                className="rec-row block w-full text-left disabled:cursor-wait"
              >
                {/* The id gets the full measure and breaks anywhere. It is
                    a slug long enough to overflow a phone on its own. */}
                <span className="rec-row-id block [overflow-wrap:anywhere] font-mono text-[0.76rem] leading-[1.6] tracking-[0.04em] text-[var(--polar)]">
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
                        className={`rec-seg rec-seg-${x.cls}`}
                        style={{ width: `${x.pct}%` }}
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

              {/* New in index contract 0.2: the record states its own
                  address, so the set stops being a place you can only
                  look and becomes a place you can share out of. This is
                  the link to that record alone, with the address itself
                  beside it, because the string is the thing a person
                  pastes into a message. */}
              {s.address ? (
                <p className="mt-5 font-mono text-[0.68rem] leading-[1.9] tracking-[0.04em] text-[var(--dim)]">
                  <Link href={recordAddressHref(s.address)} className="rec-action text-[var(--polar)]">
                    a link to this record alone
                  </Link>
                  <span className="[overflow-wrap:anywhere]"> · {s.address}</span>
                </p>
              ) : null}
            </li>
          );
        })}
      </ul>

      <p className="mt-9 measure text-[0.85rem] leading-[1.6] text-[var(--dim)]">
        The three shares divide the whole finished work rather than the classified part of it, so
        they fall short of 100% by however much a run could not account for. Every number above came
        out of this site&rsquo;s index. Opening a record fetches that record and nothing else
        {digests === "all"
          ? ", and this page then checks the bytes it got against the digest the index states for it."
          : digests === "some"
            ? ", and this page checks the bytes it got against the digest the index states, on the records that state one. This index states a digest for some of its records and not others, so the record you open will say which it was."
            : ". This site\u2019s index states no digest for its records, so there is nothing here to check those bytes against, and the record you open will say so rather than implying it checked."}
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
        <span className="[overflow-wrap:anywhere] font-mono text-[0.76rem] leading-[1.6] tracking-[0.04em] text-[var(--star)]">
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
        <p className={`measure text-[0.85rem] leading-[1.7] ${tone}`}>{copy.line}</p>
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
          {open.summary.address ? (
            <>
              {" · "}
              <Link
                href={recordAddressHref(open.summary.address)}
                className="rec-action text-[var(--polar)]"
              >
                a link to this record alone
              </Link>
            </>
          ) : null}
        </p>
      </div>

      <RecordView record={open.record} />
    </>
  );
}

export default PublishedSite;
