# What is in here, and which of it is the tool's own output

- **`contrast.txt`** — `measure-contrast.mjs`'s report, verbatim. This is
  the artifact to diff against another run's, and it is what §2 and §3 of
  `../../NOTES.md` quote. The 2026-10-25c review committed the same file
  under `data/contrast-site.txt`, so the two sort-diff directly.

- **`contrast.json`** — the same run's `--json` record, **post-processed
  twice and therefore not byte-for-byte what the tool wrote**:

  1. the `rects` array was dropped from every row (861 rect objects). It
     is glyph geometry in page coordinates, which nothing compares across
     runs and which changes whenever a page's height does.
  2. it was re-serialised one row per line, compact, so a later run can
     diff it line by line. 276K to 168K across both steps.

  Every measured number is untouched: `min`, `p5`, `median`, `pixels`,
  `maxCov`, `drift`, `threshold`, `colour`, and the element identity.
  The reason to keep it at all is that `contrast.txt` prints only the
  rows that are not `ok`, so the medians of the other 509 runs exist
  nowhere else.

  Regenerate the unprocessed form with `--json` and no post-processing;
  the command is in `../../README.md`.
