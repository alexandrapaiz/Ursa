import { CLASS_COPY, SPAN_CLASSES, type OutcomeRecord } from "@/lib/record/types";
import { pct, pctFixed, provenanceReach } from "@/lib/record/provenance";

const FILL: Record<string, string> = {
  survived_verbatim: "rgba(168, 199, 250, 0.55)",
  survived_mutated: "rgba(168, 199, 250, 0.28)",
  no_generation_provenance: "rgba(232, 237, 247, 0.12)",
};

/**
 * What survived, first.
 *
 * The order is not a design choice and must not be re-sorted by size:
 * the record's own summary leads with what survived because that is the
 * reading the artifact is for, and a bar sorted by magnitude would put a
 * different sentence at the top of every record.
 */
export function RecordSummary({ record }: { record: OutcomeRecord }) {
  const { byClass, coveredChars, finalChars, generated } = record.stats;
  const reach = provenanceReach(record);
  const present = SPAN_CLASSES.filter((c) => (byClass[c]?.chars ?? 0) > 0);

  return (
    <section className="border-t border-[var(--line)] py-12">
      <h2 className="font-mono text-[0.68rem] uppercase tracking-[0.28em] text-[var(--dim)]">
        <span className="text-[var(--polar)]">✦</span> What the work kept
      </h2>

      <div className="rec-bar mt-9" role="presentation">
        {present.map((c) => (
          <div
            key={c}
            style={{
              width: `${((byClass[c]?.chars ?? 0) / Math.max(coveredChars, 1)) * 100}%`,
              backgroundColor: FILL[c],
            }}
          />
        ))}
      </div>

      <dl className="mt-8">
        {SPAN_CLASSES.map((c, i) => {
          const stat = byClass[c];
          return (
            <div
              key={c}
              className={`grid grid-cols-[1fr_auto] gap-x-6 gap-y-2 py-5 sm:grid-cols-[13rem_1fr_auto] ${
                i > 0 ? "border-t border-[var(--line)]" : ""
              }`}
            >
              <dt className="flex items-baseline gap-2 font-mono text-[0.72rem] tracking-[0.06em] text-[var(--polar)]">
                <span
                  aria-hidden="true"
                  className="mt-[0.3em] h-[0.5rem] w-[0.5rem] shrink-0"
                  style={{ backgroundColor: FILL[c] }}
                />
                {CLASS_COPY[c].label}
              </dt>
              <dd className="order-last col-span-2 text-[0.95rem] text-[#b7c0d4] sm:order-none sm:col-span-1">
                {CLASS_COPY[c].gloss}
              </dd>
              {/* whitespace-nowrap and an auto column, because a fixed 7rem
                  broke "127 chars · 2 spans" across three lines at every
                  viewport, leaving the word "spans" alone under the count it
                  belongs to. Measured 2026-10-18 at 390, 820 and 1440: the
                  longest of these lines is 19 characters of mono, which is
                  8.2rem, so no fixed measure short enough to look tidy ever
                  fits it. */}
              <dd className="whitespace-nowrap text-right font-mono text-[0.72rem] text-[var(--star)] tabular-nums">
                {stat ? pctFixed(stat.pct) : "0.0%"}
                <span className="block text-[0.66rem] text-[var(--dim)]">
                  {stat ? `${stat.chars} chars · ${stat.spans} span${stat.spans === 1 ? "" : "s"}` : "none"}
                </span>
              </dd>
            </div>
          );
        })}
      </dl>

      {/* The counts the page is asking to be trusted on, printed rather
          than claimed. Every figure here is computed from the record in
          front of the reader, including the broken-pointer count, which
          is shown when it is not zero precisely because that is the case
          a viewer is tempted to hide. */}
      <ul className="mt-6 flex flex-wrap gap-x-8 gap-y-2 border-t border-[var(--line)] pt-6 font-mono text-[0.68rem] tracking-[0.04em] text-[var(--dim)]">
        <li>
          {coveredChars} of {finalChars} characters classified
        </li>
        {generated ? (
          <li>
            models generated {generated.totalChars} characters, {pct(generated.deletedPct)} thrown
            away
          </li>
        ) : null}
        <li>
          {reach.spansReachingPrompt} of {reach.spansWithSource} model-sourced spans reach the words
          you typed
        </li>
        {reach.brokenSources > 0 ? (
          <li className="text-[var(--star)]">
            {reach.brokenSources} span{reach.brokenSources === 1 ? "" : "s"} point at a generation
            this record does not contain
          </li>
        ) : null}
      </ul>
    </section>
  );
}

export default RecordSummary;
