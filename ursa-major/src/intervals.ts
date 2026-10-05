// One shared definition of "how many distinct characters do these extents
// cover". Kept in its own module because stats.ts and invariants.ts both
// need it and two implementations of interval merging would drift: the
// defect that produced invariants.ts was a sum taken over overlapping
// extents in one place and non-overlapping extents in another.

/**
 * Total length of the union of half-open intervals `[start, end)`.
 * Overlapping and touching intervals collapse, so a character covered by
 * three extents counts once. Input is not mutated.
 */
export function mergedLength(intervals: Array<[number, number]>): number {
  const sorted = [...intervals].sort((a, b) => a[0] - b[0] || a[1] - b[1])
  let total = 0
  let runStart = -1
  let runEnd = -1
  for (const [start, end] of sorted) {
    if (end <= start) continue
    if (start > runEnd) {
      if (runEnd > runStart) total += runEnd - runStart
      runStart = start
      runEnd = end
    } else if (end > runEnd) {
      runEnd = end
    }
  }
  if (runEnd > runStart) total += runEnd - runStart
  return total
}
