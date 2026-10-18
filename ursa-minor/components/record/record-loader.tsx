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

      <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-4">
        <label className="cta tracked-label inline-block cursor-pointer border border-[rgba(168,199,250,0.4)] py-3.5 font-mono text-[0.72rem] uppercase tracking-[0.22em] text-[var(--polar)]">
          Open a record
          <input
            type="file"
            accept="application/json,.json"
            className="sr-only"
            onChange={(e) => void onFile(e.target.files?.[0])}
          />
        </label>

        <form onSubmit={onUrl} className="flex flex-1 items-baseline gap-4">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="or the address you published one at"
            aria-label="the address of a published record"
            className="min-w-0 flex-1 border-b border-[var(--line)] bg-transparent pb-2 font-mono text-[0.76rem] text-[var(--star)] placeholder:text-[var(--dim)] focus:border-[var(--polar)] focus:outline-none"
          />
          <button
            type="submit"
            disabled={busy || !url}
            className="rec-action font-mono text-[0.7rem] tracking-[0.06em] text-[var(--polar)] disabled:cursor-not-allowed disabled:text-[var(--dim)]"
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
