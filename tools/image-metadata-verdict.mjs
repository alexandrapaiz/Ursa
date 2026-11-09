// The verdict `tools/image-metadata.mjs` prints, as a pure function.
//
//   import { verdict, unusable, GATE } from './image-metadata-verdict.mjs'
//
// SEVENTH GATE EXTRACTED under `docs/ideas.md`, "Every gate exports its
// verdict as data, so the sweep is a program and not a table". Written in this
// shape from the start, like the sixth.
//
// WHAT THE GATE IS ABOUT. This repository tracks 1,302 image files, 1,296 of
// them PNG screenshots from the design review practice, and the number grows
// every day a review runs. `redaction-gate.yml` has never read one of them:
// its scan is `grep -rInE`, and `-I` tells grep to treat a binary file as
// holding no match. PWC-13 asks HQ to drop that flag and has been live with
// HQ's project manager since 2026-10-26, so the flag is still in the gate.
//
// WHY THIS IS NOT A SECOND COPY OF PWC-13, which is the first objection it
// should have to answer. Dropping `-I` applies the gate's THREE PATTERNS to
// binary files: a home path with a real username, a Claude Code project slug,
// a full session UUID. This gate asks a different and narrower question that
// no pattern can ask, which is whether a committed image carries a text
// channel AT ALL. A PNG's text lives in its `tEXt`, `zTXt`, `iTXt` and `eXIf`
// chunks, and a file with none of them cannot be carrying a string of any
// shape, matched or unmatched. So the two compose: this one closes the
// channel, PWC-13 reads what comes through a channel somebody opens on
// purpose. Neither waits for the other.
//
// THE RULE IS ZERO AND THAT IS WHY IT IS WORTH HAVING. Every one of the 1,302
// tracked images was parsed at the chunk level on 2026-11-02 and not one
// carries a text or EXIF chunk, which is the second time this seat has
// measured that by hand -- the first was 1,170 files on 2026-10-26, written
// into the redaction standard as "checked rather than assumed". A fact
// re-established by hand on each of two runs is a convention, and
// `docs/agents/pending-workflow-changes.md` PWC-13 says in its own words that
// a convention a run has to remember is not a control. The allowance is
// therefore zero, the tree already obeys it, and the gate costs nothing until
// the day the capture tooling changes -- which is the day it is for. Several
// ordinary image tools write a `tEXt` chunk without being asked.
//
// WHAT IT STILL CANNOT DO, which is the larger half and is not this gate's.
// A path or an identifier drawn into a screenshot is pixels, and no gate of
// any kind reads those. The control there is the redaction standard's rule for
// people, capture fixtures and never a real project's records, and naming it
// as a rule for people rather than pretending otherwise is the honest half of
// surface 5.
//
// WHY AN UNCLASSIFIED CHUNK IS A FINDING AND NOT A SHRUG. A chunk type this
// gate's table does not know is a chunk whose contents it cannot speak to, so
// reporting the file as clean would be a clean report from a scan that did not
// happen -- the one failure `scripts/redaction-check.mjs` was written to
// avoid. It is a separate locus because the repair is separate: a reader
// classifies the type in the table here, which is an edit to a tracked file,
// while a text chunk is in `main` and comes off in a commit.
//
// WHY A BINARY NOTHING PARSES IS GROUND, AND WHY THAT IS A WIDER QUESTION
// THAN THE ONE ABOVE. The clause after this one is about an IMAGE whose
// format has no reader. This one is about a tracked file that is binary and
// is not an image at all, which until 2026-11-02 was outside this gate's
// enumerator entirely rather than refused by it. Both gates missed it: the
// extension list here did not select it, and the redaction gate's `grep -I`
// treats a binary file as holding no match, so a string in a font or an
// archive or a compiled artifact was read by nothing in this repository.
// PWC-13 names that surface and is HQ's to land; this is the half that can be
// held here, which is that the gate says so instead of reporting a clean it
// did not establish. It is ground and not a finding because the repair is a
// reader or a landed flag, not a commit removing a chunk, and because the
// gate genuinely does not know what the file holds -- it knows only that
// nobody looked.
//
// WHY A FORMAT WITH NO PARSER IS GROUND. Today the tree holds PNG and one ICO,
// and both are walked. SVG is text, so the redaction gate's own patterns
// already read all five of them and this gate leaves them alone by name
// rather than by accident. A JPEG committed tomorrow would have an EXIF
// channel this file has no reader for, and the gate refuses rather than
// reporting a clean it did not establish, for the same reason
// `tools/secret-scan.mjs --history` refuses a shallow clone.

import { LOCUS, POSITION, describeGate, verdictOf } from './gates/verdict-shape.mjs'

/**
 * @typedef {object} Carrier
 * @property {string} path the image, as git names it.
 * @property {string} chunk the container chunk type, e.g. `tEXt`.
 * @property {'committed' | 'reader'} locus which of the two shapes it is.
 */

/**
 * @typedef {object} Census
 * @property {number} images how many tracked images were parsed.
 * @property {number} chunks how many container chunks were read across them.
 * @property {string[]} formats the extensions parsed, lower-cased.
 */

/** One per-finding line: the file, the chunk, and who repairs it. */
export function carrierLine(c) {
  return c.locus === LOCUS.COMMITTED
    ? `  ${c.path}  carries a ${c.chunk} chunk: strip it at the source and re-commit the image`
    : `  ${c.path}  carries a ${c.chunk} chunk: classify that type in tools/image-metadata-verdict.mjs`
}

/**
 * The findings-derived verdict.
 *
 * @param {Carrier[]} carriers
 * @param {Census} seen
 * @returns {import('./gates/verdict-shape.mjs').Verdict}
 */
export function verdict(carriers, seen) {
  const { images = 0, chunks = 0, formats = [] } = seen
  const named = carriers.filter((c) => c.locus === LOCUS.COMMITTED).length
  const unknown = carriers.filter((c) => c.locus === LOCUS.READER).length

  if (carriers.length === 0) {
    return verdictOf({
      exitCode: 0,
      cause: 'NO_TEXT_CHANNEL',
      position: POSITION.BEFORE,
      line:
        `image-metadata: ${images} tracked images in ${formats.length} format(s), ` +
        `${chunks} container chunks read, and no text channel in any of them.`,
    })
  }

  if (named === 0) {
    return verdictOf({
      exitCode: 1,
      cause: 'CHUNK_UNCLASSIFIED',
      position: POSITION.BEFORE,
      cites: [LOCUS.READER],
      line:
        `image-metadata: ${unknown} of ${images} tracked images carry a chunk this gate ` +
        `cannot classify, so what those ${unknown} hold is unestablished rather than clean.`,
      trailer: [
        '',
        'A type absent from the table is not a type known to be safe. Classify it',
        'there and run this again; until then this is a scan that did not finish.',
      ],
    })
  }

  return verdictOf({
    exitCode: 1,
    cause: 'TEXT_CHUNK_PRESENT',
    position: POSITION.BEFORE,
    cites: [LOCUS.COMMITTED, LOCUS.READER],
    line:
      `image-metadata: ${carriers.length} of ${images} tracked images carry a chunk that can ` +
      `hold text, ${named} by a named metadata chunk and ${unknown} by one this gate cannot classify.`,
    trailer: [
      '',
      'A metadata chunk is in main and every clone has it, so it comes off in a',
      'commit and not in a working copy. See docs/security/redaction-standard.md',
      'surface 5, and PWC-13 for the half of this that belongs to HQ.',
    ],
  })
}

/**
 * The ground verdict: the gate could not establish the facts, which is never
 * reported as clean.
 *
 * @param {string} cause one of the ground causes below.
 * @param {string} why
 * @param {string} [detail]
 * @returns {import('./gates/verdict-shape.mjs').Verdict}
 */
export function unusable(cause, why, detail) {
  return verdictOf({
    exitCode: 2,
    stream: 'err',
    derivedFrom: 'ground',
    cause,
    position: POSITION.BEFORE,
    line: `image-metadata: cannot do its job: ${why}`,
    trailer: detail ? [`  ${detail}`] : [],
  })
}

/** The chunk types that can hold a string a person could read. */
export const TEXT_CHUNKS = ['tEXt', 'zTXt', 'iTXt', 'eXIf']

/**
 * The chunk types known to hold no free text, so a file built only from these
 * cannot be carrying one. Every type in the PNG first edition plus the APNG
 * triple, less the four above. `iCCP` is here for its profile DATA and in
 * spite of its profile NAME, which is a latin-1 string a tool chooses: no
 * tracked image carries the chunk at all today, and listing it as a carrier
 * would red the gate on the first colour-managed capture for a field that has
 * never held anything but a profile name.
 */
export const INERT_CHUNKS = [
  'IHDR', 'PLTE', 'IDAT', 'IEND', 'tRNS', 'cHRM', 'gAMA', 'iCCP',
  'sBIT', 'sRGB', 'bKGD', 'hIST', 'pHYs', 'sPLT', 'tIME',
  'acTL', 'fcTL', 'fdAT',
]

const CENSUS = { images: 1302, chunks: 7960, formats: ['ico', 'png'] }

/** The input space. Outcomes are measured by the enumerator, never declared. */
export const GATE = describeGate({
  id: 'tools/image-metadata.mjs',
  verdict,
  loci: {
    // Named by `a named metadata chunk`, a phrase and not the bare word
    // `metadata`, because the gate's own name is in every line it prints and a
    // one-word pattern would match that instead of the locus.
    [LOCUS.COMMITTED]: { noun: /a named metadata chunk/ },
    // Named by `cannot classify`, which is the clause both failing lines
    // attach the reader's repair to.
    [LOCUS.READER]: { noun: /cannot classify/ },
  },
  probes: [
    { name: 'the tree as it stands, every chunk inert', findings: [], seen: CENSUS },
    {
      name: 'no images tracked at all, which is clean and not unmeasured',
      findings: [],
      seen: { images: 0, chunks: 0, formats: [] },
    },
    {
      name: 'one capture carrying a tEXt chunk, which is what the tooling would add',
      findings: [{ path: 'docs/design/reviews/2026-11-02/after/home.png', chunk: 'tEXt', locus: LOCUS.COMMITTED }],
      seen: CENSUS,
    },
    {
      name: 'one chunk type absent from the table, so the file is unestablished',
      findings: [{ path: 'ursa-minor/app/favicon.ico', chunk: 'caNv', locus: LOCUS.READER }],
      seen: CENSUS,
    },
    {
      name: 'both shapes at once, which is what MIXED_LOCI_NAMED is for',
      findings: [
        { path: 'docs/design/reviews/2026-11-02/after/home.png', chunk: 'iTXt', locus: LOCUS.COMMITTED },
        { path: 'docs/design/reviews/2026-11-02/after/record.png', chunk: 'caNv', locus: LOCUS.READER },
      ],
      seen: CENSUS,
    },
  ],
  /** Ground branches: exempt from the findings checks, declared separately so
   *  the exemption is visible rather than implied by an empty array. */
  groundProbes: [
    {
      name: 'a tracked image in a format this gate has no parser for',
      call: () =>
        unusable(
          'FORMAT_UNPARSED',
          '1 tracked image is in a format this gate cannot parse, so its text channel is unread',
          'docs/brand/mark.jpeg — add a reader for jpeg, or this gate is blind to it',
        ),
    },
    {
      name: 'a container whose chunk lengths do not reach its end',
      call: () =>
        unusable(
          'CONTAINER_UNWALKABLE',
          "1 tracked image's chunk lengths run past the end of the file, so its chunk list is unknown",
          'docs/design/reviews/2026-11-02/after/home.png — truncated, or not the format its name claims',
        ),
    },
    {
      name: 'a tracked binary in no format this gate parses, which nothing else reads either',
      call: () =>
        unusable(
          'BINARY_UNREAD',
          "1 tracked binary file is in no format this gate parses, and the redaction gate's `-I` skips binaries, so nothing reads it",
          'docs/brand/Inter.woff2 — parse it here, or land PWC-13 so the redaction gate reaches it',
        ),
    },
    {
      name: 'not a git repository, so there is no tracked set to scan',
      call: () => unusable('SCAN_GROUND_UNUSABLE', 'git could not list the tracked files here'),
    },
  ],
})
