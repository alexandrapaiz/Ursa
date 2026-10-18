// One reader for the `source:` line of an evidence ref, shared by the three
// tools that parse it: check-evidence.mjs, relocate-anchors.mjs and
// relevance-sweep.mjs.
//
// It exists because the same regex lived in all three, and the relevance sweep
// of 2026-10-18 found two faults in it at once. Neither announced itself: a
// path the pattern cannot see produces no error, only silence.
//
//  1. The extension list was an allowlist of four, so `.gitignore:8-9` in
//     `distilling-a-tuning-record/E32` matched nothing at all. That citation
//     had no existence check, no bounds check and no fingerprint from the day
//     it was written, while the checker counted the library green.
//  2. `.ts` was tried against `.tsx` with no right boundary, so a citation to
//     `foo.tsx:1-3` matched the path `foo.ts` and dropped the range. It would
//     have fingerprinted a different file, or reported `foo.ts` missing, and
//     in neither case named the real file. No skill cites a `.tsx` today,
//     which is why this one was still latent rather than shipped.
//
// So the pattern is still an allowlist, because the alternative is matching
// decimals like `0.35` out of prose and calling them missing files, but it is
// a complete one with the longest extensions first and a boundary after the
// match. A leading `[\w./-]*` rather than `+` is what lets a dotfile through.
export const SOURCE_PATH_RE =
  /([\w./-]*\.(?:gitignore|tsx|ts|jsx|js|mjs|mdx|md|json|yml|yaml|toml|txt|sh|css|html))(?![\w])(?::([\d,-]+))?/g

/**
 * Every path a source line names, each with the raw range string beside it.
 * One source line may hold several paths plus prose, and a comma separates two
 * paths as well as two ranges of one path, which is why this scans rather than
 * splitting on commas: splitting dropped every range after the first, and
 * `segment.ts:1-3,900-999` passed on a 70-line file.
 */
export function sourcePaths(sourceLine) {
  return [...sourceLine.matchAll(SOURCE_PATH_RE)].map(([, path, ranges]) => ({ path, ranges }))
}

/**
 * The well-formed line ranges in a raw range string, as [from, to] pairs.
 * Only `N` or `N-M`: `Number('')` is 0 rather than NaN, so a trailing comma
 * used to invent a line 0 and fail an otherwise sound citation.
 */
export function ranges(rangeString) {
  if (!rangeString) return []
  const out = []
  for (const part of rangeString.split(',')) {
    if (!/^\d+(?:-\d+)?$/.test(part)) continue
    const nums = part.split('-').map(Number)
    out.push({ part, from: nums[0], to: nums[1] ?? nums[0] })
  }
  return out
}
