"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { parseRecord } from "@/lib/record/parse";
import {
  fetchFailure,
  formatRecordAddress,
  parseRecordAddress,
  permanenceNote,
  recordAddressHost,
  recordAddressPageUrl,
  recordAddressUrl,
  type RecordAddress,
} from "@/lib/record/address";
import { humanBytes, integrityCopy, unverifiableDigest, type Integrity } from "@/lib/record/integrity";
import type { OutcomeRecord } from "@/lib/record/types";
import RecordView from "./record-view";

interface Opened {
  address: RecordAddress;
  url: string;
  record: OutcomeRecord;
  integrity: Integrity;
}

/**
 * One record, read at its own address.
 *
 * ## What is different about this surface
 *
 * The set view next door starts from a site and an index. This one
 * starts from a string somebody was sent, which is the thing a person
 * actually has when a colleague says "look at what came out of this".
 * There is no index in the path, no directory to list, and nothing of
 * ours between the address and the bytes: the address resolves to one
 * URL by a rule written down in `address.ts`, and this page's own
 * browser fetches it.
 *
 * ## Three honesties this page owes the person reading it
 *
 * 1. **It cannot say "verified".** The index is what carries a digest,
 *    and an address carries no index. So the integrity line says there
 *    was nothing to check against, and shows the digest of what arrived
 *    so it can be read back to whoever published it. A record opened
 *    through a site's index does get checked, and the page says where.
 * 2. **A missing record and an unreadable host are different failures**,
 *    and both GitHub hosts make the difference visible by sending a
 *    permissive cross-origin header on a 404 as well as on a hit. That
 *    measurement is the resolver seat's, taken on 2026-10-18, and it is
 *    the only reason the sentences below can be specific.
 * 3. **An address in the path is seen by whoever serves this page.** Not
 *    a byte of the record passes through it, which is the design, but
 *    the request line does say which record was opened. Pasting an
 *    address into the field instead resolves it without navigating, so
 *    that version of reading stays between the reader and the host
 *    holding the record. Saying so is cheaper than being caught at it.
 */
export function RecordAtAddress({ initial }: { initial: string }) {
  const [typed, setTyped] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState<Opened | null>(null);
  /** true when what is open came from the path rather than from the field */
  const [fromPath, setFromPath] = useState(false);

  const read = useCallback(async (input: string, viaPath: boolean) => {
    const parsed = parseRecordAddress(input);
    if (!parsed.ok) {
      setError(parsed.error);
      setOpen(null);
      return;
    }
    const address = parsed.address;
    const url = recordAddressUrl(address);
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) {
        setError(fetchFailure(address, res.status));
        setOpen(null);
        return;
      }
      // The body exactly as it arrived, hashed before anything parses
      // it: a digest is over bytes, and a record parsed and written back
      // out is a different string with the same meaning.
      const text = await res.text();
      const integrity = await unverifiableDigest(text);
      const record = parseRecord(text);
      if (!record.ok) {
        setError(
          `That address answered, and what came back is not an outcome record: ${record.error}`,
        );
        setOpen(null);
        return;
      }
      setOpen({ address, url, record: record.record, integrity });
      setFromPath(viaPath);
      // The field becomes the canonical address, which is what a person
      // copies out of it. What arrived may have been percent-encoded by
      // whatever carried it here, and `url/https%3A%2F%2F…` is the same
      // address written in a way nobody would type or want to paste on.
      setTyped(formatRecordAddress(address));
    } catch {
      setError(fetchFailure(address, "threw"));
      setOpen(null);
    } finally {
      setBusy(false);
    }
  }, []);

  // An address in the path is read on arrival, because a person who
  // followed a link did not come here to press a button.
  //
  // A fragment is read the same way and is not the same thing: a
  // fragment is never sent to a server, so an address that arrives that
  // way has been seen by nobody but the reader, and the "this page saw
  // which record you opened" line below is false for it. That is why the
  // two arrivals are told apart here rather than merged.
  //
  // The fetch starts on a timer of zero rather than in the effect body,
  // for a reason that shows up on a slow connection: reading
  // synchronously here sets the busy flag before this render has
  // committed, so the chrome, the heading and the address all wait for a
  // second render that is already queued behind a network call. On a
  // timer the page paints first and the word "reading" appears into a
  // page that is already there. React's own lint rule asks for the same
  // shape, since a timer is the external system it wants state changes
  // to come from.
  const started = useRef(false);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const hash = typeof window === "undefined" ? "" : window.location.hash.replace(/^#/, "");
    const first = initial || hash;
    if (!first) return;
    const t = setTimeout(() => void read(first, Boolean(initial)), 0);
    return () => clearTimeout(t);
  }, [initial, read]);

  return (
    <>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void read(typed, false);
        }}
        className="mt-8 flex w-full min-w-0 flex-col items-start gap-3 sm:flex-row sm:items-baseline sm:gap-5"
      >
        {/* The filled example the placeholder used to carry,
            `pages/you/your-repo/your-repo-2026-10-18-abc1234`, needs 336px of
            its own monospace, and the field is 326px wide at a 390 viewport
            and 256px at 320. So a phone silently cut two characters off it
            and a smaller phone cut twelve, leaving `...your-repo-2026-1`. A
            placeholder cannot scroll and gives no sign that it was trimmed,
            so the reader's only example of the format was a malformed
            address with nothing saying so, on the page whose whole argument
            is that an address is exact. The schematic below is the one this
            same component already prints in AddressForms, so the two now
            agree, and at 32 characters it fits the narrowest field. */}
        <input
          type="text"
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          placeholder="pages/<owner>/<repo>/<record-id>"
          aria-label="a record address"
          spellCheck={false}
          autoCapitalize="off"
          className="w-full min-w-0 border-b border-[var(--line)] bg-transparent pb-2 font-mono text-[0.72rem] text-[var(--star)] placeholder:text-[var(--dim)] focus:border-[var(--polar)] focus:outline-none sm:flex-1 sm:text-[0.76rem]"
        />
        <button
          type="submit"
          disabled={busy || !typed}
          className="rec-action shrink-0 font-mono text-[0.7rem] tracking-[0.06em] text-[var(--polar)] disabled:cursor-not-allowed disabled:text-[var(--dim)]"
        >
          {busy ? "reading…" : "read the record"}
        </button>
      </form>

      {/* Every sentence this page refuses with names the URL it is
          about, and a raw address is one 104-character run with no
          space in it. Measured at 390px before this class existed: the
          document was 500px wide against a 390px viewport, with the
          host and the path walking off the right edge. Breaking inside
          the word is the only thing that holds at that measure. */}
      {error ? (
        <p role="alert" className="mt-7 max-w-2xl break-words text-[0.85rem] leading-[1.7] text-[var(--star)]">
          {error}
        </p>
      ) : null}

      {open ? <OpenedAtAddress open={open} fromPath={fromPath} /> : null}

      {!open && !error && !busy ? <AddressForms /> : null}
    </>
  );
}

/** The three forms, for a person who has arrived here without one. */
function AddressForms() {
  const rows: Array<[string, string]> = [
    [
      "git/<owner>/<repo>/<ref>/<record-id>",
      "The record committed to a repository and pushed. No deployment of any kind: commit the file, push, and the address exists.",
    ],
    [
      "pages/<owner>/<repo>/<record-id>",
      "The record in a site written by ursa publish. One workflow file more than the first, and it buys back erasure, because publishing again without a record takes it down.",
    ],
    [
      "url/<https address>",
      "A record published anywhere else. It resolves to itself, and this page can promise nothing about a host it has never measured.",
    ],
  ];
  return (
    <div className="mt-11">
      <h2 className="font-mono text-[0.68rem] uppercase tracking-[0.28em] text-[var(--dim)]">
        <span className="text-[var(--polar)]">✦</span> The three forms
      </h2>
      <ul className="mt-8">
        {rows.map(([form, why], i) => (
          <li
            key={form}
            className={`grid grid-cols-[22rem_1fr] gap-8 py-6 max-lg:grid-cols-1 max-lg:gap-2 ${
              i > 0 ? "border-t border-[var(--line)]" : ""
            }`}
          >
            <span className="[overflow-wrap:anywhere] pt-1 font-mono text-[0.72rem] leading-[1.7] tracking-[0.04em] text-[var(--polar)]">
              {form}
            </span>
            <span className="text-[0.95rem] leading-[1.7] text-[#b7c0d4]">{why}</span>
          </li>
        ))}
      </ul>
      <p className="mt-8 max-w-2xl text-[0.85rem] leading-[1.6] text-[var(--dim)]">
        Your own records print their address when you ask the resolver for it, and a published site
        states one for every record in its index. If what you have is a site rather than a single
        record,{" "}
        <Link href="/record" className="rec-action text-[var(--polar)]">
          read the whole set instead
        </Link>
        .
      </p>
    </div>
  );
}

/** One record, with everything the address itself can be held to. */
function OpenedAtAddress({ open, fromPath }: { open: Opened; fromPath: boolean }) {
  const { address, url, integrity } = open;
  const copy = integrityCopy(integrity);
  const page = recordAddressPageUrl(address);
  const permanence = permanenceNote(address);
  const digest = integrity.state === "unverifiable" ? integrity.sha256 : undefined;

  return (
    <>
      <div className="mt-10">
        <p className="[overflow-wrap:anywhere] font-mono text-[0.76rem] leading-[1.6] tracking-[0.04em] text-[var(--star)]">
          {formatRecordAddress(address)}
        </p>
        <p className="mt-3 font-mono text-[0.68rem] leading-[1.9] tracking-[0.04em] text-[var(--dim)]">
          {humanBytes(integrity.bytes)} fetched from {recordAddressHost(address)}
          {" · "}
          <a href={url} className="rec-action text-[var(--polar)]" target="_blank" rel="noreferrer">
            the bytes themselves
          </a>
          {page ? (
            <>
              {" · "}
              <a href={page} className="rec-action text-[var(--polar)]" target="_blank" rel="noreferrer">
                the site&rsquo;s own page for it
              </a>
            </>
          ) : null}
        </p>
      </div>

      {/* The integrity line sits above the record rather than under it,
          because it governs how everything below should be read. */}
      <div className="mt-6 border-l border-[var(--line)] pl-5">
        <p className="max-w-2xl text-[0.85rem] leading-[1.7] text-[var(--dim)]">{copy.line}</p>
        {digest ? (
          <p className="mt-3 [overflow-wrap:anywhere] font-mono text-[0.66rem] leading-[1.9] tracking-[0.04em] text-[var(--dim)]">
            sha256 {digest}
          </p>
        ) : null}
      </div>

      {address.scheme === "git" ? (
        <p className="mt-6 max-w-2xl text-[0.85rem] leading-[1.7] text-[var(--dim)]">
          A committed record is served as plain text, so the page the resolver writes beside it
          arrives at a browser as source code rather than as a page. On this form of address, this
          viewer is not the nicer way to read the record; it is the only one.
        </p>
      ) : null}

      {permanence ? (
        <p className="mt-6 max-w-2xl text-[0.85rem] leading-[1.7] text-[var(--dim)]">{permanence}</p>
      ) : null}

      {fromPath ? (
        <p className="mt-6 max-w-2xl text-[0.85rem] leading-[1.7] text-[var(--dim)]">
          You opened this by its address, so whoever serves this page saw which record you asked
          for, and not one byte of it: the record itself went straight from{" "}
          {recordAddressHost(address)} to your browser. Pasting an address into the field above
          resolves it without navigating, which keeps even that much to yourself.
        </p>
      ) : null}

      <RecordView record={open.record} />
    </>
  );
}

export default RecordAtAddress;
