"use client";

import { useCallback, useState } from "react";
import { parseRecord } from "@/lib/record/parse";
import type { OutcomeRecord } from "@/lib/record/types";
import RecordView from "./record-view";

/**
 * Read your own record, in your own browser.
 *
 * Nothing here uploads anything, and that is the whole design rather
 * than a feature of it. `ursa run` writes the record to
 * `.ursa/records/<id>.json` on the machine that did the work, and the
 * record is the person's finished work joined to the prompts they typed,
 * which is the most private file this project produces. So the file is
 * opened with the browser's own file reader and parsed in the page. No
 * request is made, no route receives it, and there is nothing on any
 * server of ours to delete afterwards.
 *
 * The URL field is the same promise in the harder case: the fetch is the
 * browser's, from wherever the person published their own record, so the
 * bytes still never pass through anything Ursa operates. A record served
 * from somewhere that sends no permissive CORS header will refuse to
 * load, and the message says so plainly rather than blaming the file,
 * because the alternative is proxying it through a server here and that
 * would quietly undo the paragraph above.
 */
export function RecordLoader() {
  const [record, setRecord] = useState<OutcomeRecord | null>(null);
  const [name, setName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);

  const take = useCallback((text: string, label: string) => {
    const parsed = parseRecord(text);
    if (!parsed.ok) {
      setError(parsed.error);
      setRecord(null);
      return;
    }
    setError(null);
    setName(label);
    setRecord(parsed.record);
  }, []);

  const onFile = useCallback(
    async (file: File | undefined) => {
      if (!file) return;
      take(await file.text(), file.name);
    },
    [take],
  );

  const onUrl = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!url) return;
      setBusy(true);
      try {
        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) {
          setError(`That address answered ${res.status}.`);
          setRecord(null);
          return;
        }
        take(await res.text(), url);
      } catch {
        setError(
          "Your browser could not read that address. If the record is served from somewhere that sends no cross-origin header, download it and open the file instead; nothing here will fetch it on your behalf.",
        );
        setRecord(null);
      } finally {
        setBusy(false);
      }
    },
    [take, url],
  );

  if (record) {
    return (
      <>
        <div className="flex flex-wrap items-baseline justify-between gap-4 border-t border-[var(--line)] pt-10">
          <h2 className="font-mono text-[0.68rem] uppercase tracking-[0.28em] text-[var(--dim)]">
            <span className="text-[var(--polar)]">✦</span> Your record
          </h2>
          <button
            type="button"
            onClick={() => {
              setRecord(null);
              setName(null);
            }}
            className="rec-action font-mono text-[0.7rem] tracking-[0.06em] text-[var(--dim)]"
          >
            close it
          </button>
        </div>
        <p className="mt-4 font-mono text-[0.7rem] tracking-[0.04em] text-[var(--dim)]">
          {name} · read in this browser, never sent anywhere
        </p>
        <RecordView record={record} />
      </>
    );
  }

  return (
    <section className="border-t border-[var(--line)] py-12">
      <h2 className="font-mono text-[0.68rem] uppercase tracking-[0.28em] text-[var(--dim)]">
        <span className="text-[var(--polar)]">✦</span> Read your own
      </h2>
      <p className="mt-7 max-w-xl text-[0.95rem] leading-[1.7] text-[#b7c0d4]">
        A run writes your record to{" "}
        <span className="font-mono text-[0.85rem] text-[var(--star)]">
          .ursa/records/&lt;id&gt;.json
        </span>{" "}
        in the project you pointed it at. Open it here and it is read in this browser. It is not
        uploaded, and there is nothing of yours on any machine of ours to delete afterwards.
      </p>

      {/* The two controls stack below sm and sit on one row above it.
          Measured 2026-10-18 at 390: on one row the address field was left
          230px beside the button, its placeholder was clipped mid-word, and
          "read it" sat hard against the field's right edge with no gap the
          eye could read as separate. There is no phone width where both
          controls fit a row, so below sm they do not share one. */}
      <div className="mt-8 flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:gap-x-8">
        <label className="cta tracked-label inline-block shrink-0 cursor-pointer border border-[rgba(168,199,250,0.4)] py-3.5 font-mono text-[0.72rem] uppercase tracking-[0.22em] text-[var(--polar)]">
          Open a record
          <input
            type="file"
            accept="application/json,.json"
            className="sr-only"
            onChange={(e) => void onFile(e.target.files?.[0])}
          />
        </label>

        {/* The field and its button stack too, below sm. Measured again at
            390 after they were taken off the button's row: the field was
            left 229px against a 234px placeholder, so the hint was cut one
            character before its last word. Stacked, the field takes the full
            measure and nothing is clipped at any width. */}
        <form
          onSubmit={onUrl}
          className="flex w-full min-w-0 flex-col items-start gap-4 sm:flex-1 sm:flex-row sm:items-baseline sm:gap-5"
        >
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://somewhere/your-record.json"
            aria-label="the address of a published record"
            className="rec-field w-full min-w-0 border-b border-[var(--line)] sm:flex-1 bg-transparent pb-2 font-mono text-[0.72rem] text-[var(--star)] placeholder:text-[var(--dim)] focus:border-[var(--polar)] focus:outline-none sm:text-[0.76rem]"
          />
          <button
            type="submit"
            disabled={busy || !url}
            className="rec-action rec-hit shrink-0 font-mono text-[0.7rem] tracking-[0.06em] text-[var(--polar)] disabled:cursor-not-allowed disabled:text-[var(--dim)]"
          >
            {busy ? "reading…" : "read it"}
          </button>
        </form>
      </div>

      {error ? (
        <p role="alert" className="mt-6 max-w-xl text-[0.85rem] leading-[1.6] text-[var(--star)]">
          {error}
        </p>
      ) : null}
    </section>
  );
}

export default RecordLoader;
