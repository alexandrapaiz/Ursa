"use client";

import { CLASS_COPY, type FinalSpan, type OutcomeRecord } from "@/lib/record/types";
import { conversationTitle, elicitingPrompt } from "@/lib/record/provenance";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-[var(--line)] py-4">
      <div className="font-mono text-[0.62rem] uppercase tracking-[0.2em] text-[var(--dim)]">
        {label}
      </div>
      <div className="mt-2 text-[0.85rem] leading-[1.6] text-[#b7c0d4]">{children}</div>
    </div>
  );
}

/**
 * Everything the record knows about one span, including the things it
 * does not know.
 *
 * The order answers the reader's questions in the order they arrive:
 * what happened to this text, then who wrote it, then what you asked for
 * that produced it, then what it looked like before you changed it. The
 * eliciting prompt is third rather than last because it is the half of
 * the provenance chain that used to be in the file and rendered nowhere,
 * and burying it under the diff would repeat that in a softer form.
 */
export function RecordInspector({
  record,
  span,
  onJump,
}: {
  record: OutcomeRecord;
  span: FinalSpan | null;
  onJump: (generationIndex: number, range: { start: number; end: number }) => void;
}) {
  if (!span) {
    return (
      <aside className="border border-[var(--line)] p-5 sm:p-6">
        <p className="text-[0.85rem] leading-[1.6] text-[var(--dim)]">
          Choose any highlighted passage to see what happened to it, which model wrote it, and the
          words of yours that produced it.
        </p>
      </aside>
    );
  }

  const copy = CLASS_COPY[span.class];
  const src = span.source;
  const prompt = src ? elicitingPrompt(record.conversations, src.conversationId, src.turnIndex) : null;
  const candidate = span.candidate;

  return (
    <aside className="border border-[var(--line)] p-5 sm:p-6">
      <div className="font-mono text-[0.68rem] uppercase tracking-[0.22em] text-[var(--polar)]">
        {copy.label}
      </div>
      <p className="mt-3 text-[0.85rem] leading-[1.6] text-[#b7c0d4]">{copy.gloss}</p>

      <div className="mt-5">
        {src ? (
          <Field label="Which model, and when">
            {conversationTitle(record, src.conversationId)} · turn {src.turnIndex} ·{" "}
            <span className="font-mono text-[0.78rem] text-[var(--star)]">{src.model}</span>
            {typeof span.score === "number" ? (
              <span className="text-[var(--dim)]"> · similarity {span.score.toFixed(3)}</span>
            ) : null}
            <button
              type="button"
              onClick={() => onJump(src.generationIndex, { start: src.start, end: src.end })}
              className="rec-action mt-3 block font-mono text-[0.7rem] tracking-[0.06em] text-[var(--polar)]"
            >
              See it inside the generation →
            </button>
          </Field>
        ) : (
          <Field label="Which model, and when">
            No generation produced this. It is in the finished work and traceable to nothing a model
            wrote.
          </Field>
        )}

        {src ? (
          <Field label="What you asked for">
            {prompt ? (
              <q className="text-[var(--star)]">{prompt.text}</q>
            ) : (
              <span className="text-[var(--dim)]">
                Nothing of yours came before this turn, so no prompt elicited it. The record says so
                rather than guessing.
              </span>
            )}
          </Field>
        ) : null}

        {span.diff?.length ? (
          <Field label="Your edit">
            <p className="rec-diff font-mono text-[0.76rem] leading-[1.8]">
              {span.diff.map((part, i) =>
                part.added ? (
                  <ins key={i}>{part.value}</ins>
                ) : part.removed ? (
                  <del key={i}>{part.value}</del>
                ) : (
                  <span key={i}>{part.value}</span>
                ),
              )}
            </p>
            <p className="mt-3 text-[0.78rem] text-[var(--dim)]">
              Struck text is the model&rsquo;s wording you removed. The change itself is the
              correction, and nobody had to write it down.
            </p>
          </Field>
        ) : null}

        {candidate ? (
          <Field label="The wording you did not keep">
            <q className="text-[var(--dim)]">{candidate.text}</q>
            <span className="block pt-2 font-mono text-[0.7rem] text-[var(--dim)]">
              {conversationTitle(record, candidate.source.conversationId)} · turn{" "}
              {candidate.source.turnIndex} · similarity {candidate.score.toFixed(3)}, under the bar
              to call this an edit of it
            </span>
          </Field>
        ) : null}

        {span.descent?.basis === "rival" ? (
          <Field label="Why this is not called an edit">
            This text already existed, in{" "}
            <span className="font-mono text-[0.78rem]">{span.descent.sha?.slice(0, 7)}</span>
            {span.descent.subject ? ` (${span.descent.subject})` : ""}, so it was not composed by
            editing the generation that resembles it.
          </Field>
        ) : null}

        {span.lifespan && typeof span.lifespan.survivedRevisions === "number" ? (
          <Field label="How long it lasted">
            Still present after {span.lifespan.survivedRevisions} of {span.lifespan.revisions} later
            revisions of this file.
          </Field>
        ) : null}

        {span.uncertain ? (
          <Field label="Held as uncertain">
            The match behind this label is weak enough that the record flags it rather than selling
            it.
          </Field>
        ) : null}
      </div>
    </aside>
  );
}

export default RecordInspector;
