"use client";

import { FATE_COPY, type OutcomeRecord } from "@/lib/record/types";
import { elicitingPrompts, pctFixed } from "@/lib/record/provenance";
import RecordDocument from "./record-document";

/**
 * Every model generation that fed the work, with the person's own words
 * ahead of the turn they produced.
 *
 * The prompt is rendered above its generation rather than beside it
 * because that is the order the exchange happened in, and because the
 * whole point of the panel is that a reader can see a request and its
 * answer without holding either in their head.
 *
 * The row's header is the only way to open a generation, and it is a
 * 17px box, so it carries `.rec-hit`: the hit area is 44px while the
 * drawn row stays 17. The `py-5` below is what makes room for it. Two
 * neighbouring rows leave 41px between their headers and the overlay
 * takes 26.7px of that, so no row answers for the one beneath it. See
 * the `.rec-hit` note in globals.css.
 *
 * Each generation's own spans are tinted by fate, so the text the person
 * threw away is visible as text rather than as a percentage. That is the
 * category the record calls `generated_deleted`, and a number in a table
 * is a much weaker thing to look at than the struck-through sentence
 * somebody decided not to use.
 */
export function RecordGenerations({
  record,
  openIndex,
  highlight,
  onToggle,
}: {
  record: OutcomeRecord;
  openIndex: number | null;
  highlight: { start: number; end: number } | null;
  onToggle: (index: number) => void;
}) {
  const elicited = elicitingPrompts(record);
  const perConv = record.stats.perConversation ?? [];

  return (
    <section className="border-t border-[var(--line)] py-12">
      <h2 className="font-mono text-[0.68rem] uppercase tracking-[0.28em] text-[var(--dim)]">
        <span className="text-[var(--polar)]">✦</span> Every generation behind it
      </h2>

      <div className="mt-9">
        {record.generations.map((gen) => {
          const open = openIndex === gen.generationIndex;
          const prompt = elicited[gen.generationIndex];
          const conv = perConv.find((c) => c.conversationId === gen.conversationId);
          return (
            <div
              key={gen.generationIndex}
              id={`generation-${gen.generationIndex}`}
              className="border-t border-[var(--line)] py-5 first:border-t-0 first:pt-0"
            >
              <button
                type="button"
                onClick={() => onToggle(gen.generationIndex)}
                aria-expanded={open}
                className="rec-action rec-hit flex w-full flex-wrap items-baseline justify-between gap-x-6 gap-y-1 text-left font-mono text-[0.72rem] tracking-[0.06em] text-[var(--polar)]"
              >
                <span>
                  {gen.conversationId} · turn {gen.turnIndex} · {gen.model}
                  {gen.filePath ? ` · ${gen.filePath}` : ""}
                </span>
                <span className="text-[var(--dim)]">
                  {conv ? `${pctFixed(conv.survivalRate)} survived` : `${gen.text.length} chars`}
                  <span className="pl-3 text-[var(--star)]">{open ? "−" : "+"}</span>
                </span>
              </button>

              {open ? (
                <div className="mt-5">
                  {prompt ? (
                    <div className="mb-5 border-l border-[var(--line)] pl-5">
                      <div className="font-mono text-[0.62rem] uppercase tracking-[0.2em] text-[var(--dim)]">
                        You asked
                      </div>
                      <q className="mt-2 block text-[0.9rem] leading-[1.6] text-[var(--star)]">
                        {prompt.text}
                      </q>
                    </div>
                  ) : (
                    <p className="mb-5 font-mono text-[0.68rem] text-[var(--dim)]">
                      Nothing of yours came before this turn.
                    </p>
                  )}

                  <RecordDocument
                    file={{ text: gen.text, spans: gen.spans }}
                    highlightRange={open ? highlight : null}
                    label={`Generation ${gen.generationIndex} from ${gen.model}`}
                  />

                  <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-1 font-mono text-[0.66rem] tracking-[0.04em] text-[var(--dim)]">
                    {Object.entries(
                      gen.spans.reduce<Record<string, number>>((acc, s) => {
                        acc[s.fate] = (acc[s.fate] ?? 0) + (s.end - s.start);
                        return acc;
                      }, {}),
                    ).map(([fate, chars]) => (
                      <li key={fate}>
                        {chars} chars {FATE_COPY[fate as keyof typeof FATE_COPY] ?? fate}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default RecordGenerations;
