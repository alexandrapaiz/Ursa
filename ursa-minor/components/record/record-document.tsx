"use client";

import type { FinalFile, FinalSpan, GenerationSpan } from "@/lib/record/types";

type AnySpan = FinalSpan | GenerationSpan;

interface Segment {
  text: string;
  span?: AnySpan;
  index?: number;
}

/**
 * Cut a document into the spans the record classified plus the stretches
 * it did not.
 *
 * The gaps matter and are rendered unstyled on purpose. `coveredChars`
 * is routinely less than `finalChars` — separators, whitespace and
 * trivial runs are not claimed by anything — and a viewer that drew the
 * whole file as classified would be making a claim the record declines
 * to make. Unstyled text on this page means exactly "no classification
 * here", and the summary prints the two totals so the difference is
 * visible rather than inferred.
 *
 * Offsets are read against the document's own text rather than taken
 * from `span.text`, so a span whose stored text disagrees with the file
 * it indexes shows the file, which is the thing the person actually has.
 */
export function cutIntoSegments(text: string, spans: AnySpan[]): Segment[] {
  const out: Segment[] = [];
  let cursor = 0;
  spans.forEach((span, index) => {
    const start = Math.max(0, Math.min(span.start, text.length));
    const end = Math.max(start, Math.min(span.end, text.length));
    if (start > cursor) out.push({ text: text.slice(cursor, start) });
    if (end > start) out.push({ text: text.slice(start, end), span, index });
    cursor = Math.max(cursor, end);
  });
  if (cursor < text.length) out.push({ text: text.slice(cursor) });
  return out;
}

function spanClassName(span: AnySpan, selected: boolean, highlighted: boolean): string {
  const kind = "class" in span ? span.class : span.fate;
  const base =
    kind === "generated_deleted"
      ? "sp sp-deleted"
      : kind === "not_generated"
        ? "sp sp-no_generation_provenance"
        : `sp sp-${kind}`;
  return [base, selected ? "sp-selected" : "", highlighted ? "sp-hl" : ""]
    .filter(Boolean)
    .join(" ");
}

function spanLabel(span: AnySpan): string {
  const kind = "class" in span ? span.class : span.fate;
  return kind.replace(/_/g, " ");
}

/**
 * The finished work with its provenance laid over it.
 *
 * Spans are not <button>s. A button is a block-level box in every
 * browser's default and cannot sit inside a line of running prose
 * without breaking the line box, which is the one thing this panel must
 * not do: the document has to read as the document. So the role, the tab
 * stop and the keyboard handler are put on a <span> by hand, which is
 * the cost of keeping the text intact.
 */
export function RecordDocument({
  file,
  selectedIndex,
  highlightRange,
  onSelect,
  label,
}: {
  file: Pick<FinalFile, "text"> & { spans: AnySpan[] };
  selectedIndex?: number | null;
  highlightRange?: { start: number; end: number } | null;
  onSelect?: (index: number) => void;
  label: string;
}) {
  const segments = cutIntoSegments(file.text, file.spans);

  return (
    <pre
      className="rec-doc border border-[var(--line)] p-5 font-mono text-[0.76rem] leading-[1.9] text-[var(--star)] sm:p-7 sm:text-[0.8rem]"
      aria-label={label}
    >
      {segments.map((seg, i) => {
        if (!seg.span) return <span key={i}>{seg.text}</span>;
        const selected = selectedIndex === seg.index;
        const highlighted =
          !!highlightRange &&
          seg.span.start < highlightRange.end &&
          seg.span.end > highlightRange.start;
        if (!onSelect) {
          return (
            <span key={i} className={spanClassName(seg.span, selected, highlighted)}>
              {seg.text}
            </span>
          );
        }
        return (
          <span
            key={i}
            role="button"
            tabIndex={0}
            aria-pressed={selected}
            aria-label={`${spanLabel(seg.span)}: ${seg.text.slice(0, 60)}`}
            className={spanClassName(seg.span, selected, highlighted)}
            onClick={() => onSelect(seg.index!)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelect(seg.index!);
              }
            }}
          >
            {seg.text}
          </span>
        );
      })}
    </pre>
  );
}

export default RecordDocument;
