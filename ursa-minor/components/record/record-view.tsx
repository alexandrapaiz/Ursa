"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { OutcomeRecord } from "@/lib/record/types";
import RecordSummary from "./record-summary";
import RecordDocument from "./record-document";
import RecordInspector from "./record-inspector";
import RecordGenerations from "./record-generations";

function Meta({ record }: { record: OutcomeRecord }) {
  const verdict = record.signals?.verdict;
  const declared =
    verdict?.accepted === true
      ? "you declared it satisfied"
      : verdict?.accepted === false
        ? "you declared it unsatisfied"
        : "undeclared";
  const items = [
    `${record.files.length} file${record.files.length === 1 ? "" : "s"}`,
    `${record.generations.length} generation${record.generations.length === 1 ? "" : "s"}`,
    `${record.conversations.length} conversation${record.conversations.length === 1 ? "" : "s"}`,
    record.task.finished ? "finished" : "unfinished",
    declared,
    `resolved ${record.task.generatedAt.slice(0, 10)}`,
  ];
  return (
    <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-1 font-mono text-[0.68rem] tracking-[0.04em] text-[var(--dim)]">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

/**
 * One outcome record, read by whoever has it.
 *
 * The page's state is three things and they are deliberately not URL
 * state: which file is showing, which span is selected, which generation
 * is open. A record loaded from a stranger's own disk has no address to
 * put them in, and a selection that survives a reload is worth less than
 * one surface that behaves the same whichever way the record arrived.
 */
export function RecordView({ record }: { record: OutcomeRecord }) {
  const [fileIndex, setFileIndex] = useState(0);
  const [spanIndex, setSpanIndex] = useState<number | null>(null);
  const [openGeneration, setOpenGeneration] = useState<number | null>(null);
  const [highlight, setHighlight] = useState<{ start: number; end: number } | null>(null);
  const jumpTarget = useRef<number | null>(null);

  const file = record.files[fileIndex];
  const span = spanIndex === null ? null : (file?.spans[spanIndex] ?? null);

  const jump = useCallback((generationIndex: number, range: { start: number; end: number }) => {
    setOpenGeneration(generationIndex);
    setHighlight(range);
    jumpTarget.current = generationIndex;
  }, []);

  /* The scroll happens after the generation has actually opened, not in
     the click handler, because the element it scrolls to does not have
     its final height until the panel renders. Smooth scrolling is the
     document's own, and globals.css turns it off under
     prefers-reduced-motion, so this inherits that. */
  useEffect(() => {
    if (jumpTarget.current === null) return;
    const el = document.getElementById(`generation-${jumpTarget.current}`);
    jumpTarget.current = null;
    el?.scrollIntoView({ block: "start" });
  }, [openGeneration, highlight]);

  if (!file) {
    return (
      <p className="py-12 text-[0.95rem] text-[var(--dim)]">
        This record classified no files, so there is nothing to lay provenance over.
      </p>
    );
  }

  return (
    <>
      <Meta record={record} />
      <RecordSummary record={record} />

      <section className="border-t border-[var(--line)] py-12">
        <h2 className="font-mono text-[0.68rem] uppercase tracking-[0.28em] text-[var(--dim)]">
          <span className="text-[var(--polar)]">✦</span> The finished work
        </h2>

        {record.files.length > 1 ? (
          <div className="mt-7 flex flex-wrap gap-x-6 gap-y-2" role="tablist">
            {record.files.map((f, i) => (
              <button
                key={f.path}
                type="button"
                role="tab"
                aria-selected={i === fileIndex}
                onClick={() => {
                  setFileIndex(i);
                  setSpanIndex(null);
                }}
                className={`rec-action font-mono text-[0.7rem] tracking-[0.06em] ${
                  i === fileIndex ? "text-[var(--polar)]" : "text-[var(--dim)]"
                }`}
              >
                {f.path}
              </button>
            ))}
          </div>
        ) : (
          <p className="mt-7 font-mono text-[0.7rem] tracking-[0.06em] text-[var(--dim)]">
            {file.path}
          </p>
        )}

        {/* The inspector is a second column only where there is room for
            the document to stay readable beside it. Below lg it follows
            the document instead, because a 390px viewport split two ways
            gives the finished work about thirty characters a line and the
            document stops being the thing you are reading. */}
        <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_22rem] lg:items-start">
          <RecordDocument
            file={file}
            selectedIndex={spanIndex}
            onSelect={(i) => setSpanIndex(i === spanIndex ? null : i)}
            label={`${file.path}, with its provenance`}
          />
          <div className="lg:sticky lg:top-8">
            <RecordInspector record={record} span={span} onJump={jump} />
          </div>
        </div>
      </section>

      <RecordGenerations
        record={record}
        openIndex={openGeneration}
        highlight={highlight}
        onToggle={(i) => {
          setOpenGeneration(openGeneration === i ? null : i);
          if (openGeneration === i) setHighlight(null);
        }}
      />
    </>
  );
}

export default RecordView;
