// The verdict `tools/capture-provenance.mjs` prints, as a pure function.
//
//   import { verdict, unusable, GATE } from './capture-provenance-verdict.mjs'
//
// TENTH GATE EXTRACTED under `docs/ideas.md`, "Every gate exports its verdict
// as data, so the sweep is a program and not a table". Written in this shape
// from the start.
//
// WHAT THE GATE IS ABOUT, and why it is not a third copy of PWC-13. Surface 5
// of `docs/security/redaction-standard.md` is a screenshot, and this
// repository tracks 1,474 of them. Two gates already read them and neither
// reads what they depict. `tools/image-metadata.mjs` asks whether a capture
// carries a text CHANNEL, which is a container question. PWC-13 asks HQ to
// drop `grep -I` so the gate's three patterns reach binary BYTES. A path
// drawn into a PNG is neither: it is pixels, it survives both, and the
// standard says so plainly -- "the rendered half is not checkable by
// anything".
//
// THAT SENTENCE IS TRUE ABOUT PIXELS AND WRONG ABOUT THE QUESTION. What makes
// a capture safe is not a property of its pixels, it is a property of the
// store the page was rendering when the shutter opened. The standard already
// knows this, because the rule it writes for people is about provenance and
// not about content: "capture fixtures, never a real project's records." A
// rule about provenance is checkable whenever provenance is written down. So
// this gate reads no pixels and asks the one question that can be answered
// from committed text: does a directory whose captures render an
// outcome-record surface say which store it pointed at?
//
// WHY THE RULE IS NARROW, which is the objection it should answer first. The
// obvious gate -- every capture directory must declare its provenance -- goes
// red on 7 of the 36 directories in the tree today and would go red on the
// frontend seat's every run thereafter, for a corpus that is 539 screenshots
// of a public marketing site. A gate that fires on the safe majority is a
// gate somebody turns off. So the finding is the CONJUNCTION: an
// outcome-record surface AND no declared store. A directory that captures
// `localhost:3100/no-such-page` has no record surface and is not asked for a
// declaration, which is also the honest answer, because there is no store
// behind a 404 page to declare.
//
// WHAT THE DECLARED SET IS WORTH, stated so nobody reads more into a green
// run than it holds. A declaration is a sentence a seat wrote, so this gate
// verifies that the question was answered and not that the answer is true. It
// is the same standing as `secret-print-exemptions`: a written reason, in the
// tree, that a reviewer can find and argue with. What it removes is the case
// the redaction standard names as its own weakest point -- a fact
// re-established by hand on each of two runs, which is a convention rather
// than a control. The hand check becomes `node tools/capture-provenance.mjs`.
//
// THE GAP THIS GATE HAS, named here rather than discovered later. Both halves
// of the question are read from the directory's own committed text, so a
// directory that captures the record viewer and commits NOTHING naming the
// surface -- no README, no capture script, and no telling filename -- is
// classified as having no record surface and is never asked for a
// declaration. That is a silent exemption and it is the gate's weakest edge.
// Two things hold it today, one measured and one structural. Measured: all 36
// capture directories in the tree commit text, and none is bare. Structural,
// and this is the load-bearing half: `prompts/frontend-agent.md` §5 requires
// screenshots "named by page and viewport", so the surface is in the
// FILENAME by the practice's own rule, and this gate reads image paths as
// evidence alongside the prose for exactly that reason. A capture of the
// record viewer called `record-mini-fixture/phone.png` declares both its
// surface and its store in its name with no README at all.
//
// What that argument does not cover is a directory that commits captures,
// names them by page, and whose notes live only in the pull request body --
// which §5 permits, since it asks for the notes in the pull request and not
// in a tracked file. There the filename carries the surface and nothing
// carries the store, so the gate would fire, which is the right outcome. The
// uncovered case is narrower than it first looks: captures named against the
// rule AND no recipe AND no prose. A directory holding captures and no text
// at all would be worth refusing outright, and `docs/ideas.md` carries that
// as a proposal rather than this run adding a second rule nothing in the tree
// exercises.
//
// WHY AN UNDECLARED RECORD SURFACE IS THE READER'S AND NOT THE TREE'S. The
// repair is one line in the directory's own README naming the store, which is
// an edit to a tracked file a reader makes today. The capture itself may well
// be fine; what is missing is the sentence that says so. If the sentence
// cannot honestly be written, the images come off in a commit, and that is a
// second and larger repair this gate deliberately does not presume.

import { describeGate, LOCUS, POSITION, verdictOf } from './gates/verdict-shape.mjs'

/**
 * One line per directory that captures a record surface and declares no store.
 *
 * @param {{dir: string, images: number, surfaces: string[]}} f
 * @returns {string}
 */
export function undeclaredLine(f) {
  return (
    `  ${f.dir}  ${f.images} capture(s) of ${f.surfaces.join(', ')} and no store named ` +
    'in the directory: name it in the README, per redaction-standard.md surface 5'
  )
}

/**
 * The findings-derived verdict.
 *
 * @param {Array<{dir: string, images: number, surfaces: string[]}>} undeclared
 * @param {{dirs?: number, images?: number, declared?: number, recordDirs?: number}} seen
 * @returns {import('./gates/verdict-shape.mjs').Verdict}
 */
export function verdict(undeclared, seen) {
  const { dirs = 0, images = 0, declared = 0, recordDirs = 0 } = seen

  if (dirs === 0) {
    return verdictOf({
      exitCode: 0,
      cause: 'NO_CAPTURES',
      position: POSITION.BEFORE,
      line: 'capture-provenance: no tracked captures under docs/design/reviews/, so there is no provenance to establish.',
    })
  }

  if (undeclared.length === 0) {
    return verdictOf({
      exitCode: 0,
      cause: 'EVERY_RECORD_SURFACE_DECLARED',
      position: POSITION.BEFORE,
      line:
        `capture-provenance: ${images} tracked capture(s) across ${dirs} directory(ies), ` +
        `${recordDirs} of which render an outcome-record surface, and all ${recordDirs} name their store ` +
        `(${declared} directory(ies) carry a declaration in total).`,
    })
  }

  return verdictOf({
    exitCode: 1,
    cause: 'RECORD_SURFACE_UNDECLARED',
    position: POSITION.BEFORE,
    cites: [LOCUS.READER],
    line:
      `capture-provenance: ${undeclared.length} of ${recordDirs} directory(ies) that render an ` +
      'outcome-record surface name no store, so what those captures depict is unestablished rather than safe.',
    trailer: [
      '',
      'A capture of the record viewer is a second copy of the prompt text it embeds',
      '(redaction-standard.md surface 2), and no gate reads pixels. The control is the',
      'store, declared in the directory that holds the captures.',
    ],
  })
}

/**
 * The ground verdict: the gate could not establish the facts, which is never
 * reported as clean.
 *
 * @param {string} cause
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
    line: `capture-provenance: cannot do its job: ${why}`,
    trailer: detail ? [`  ${detail}`] : [],
  })
}

/**
 * The routes and commands that put an outcome record on the screen, with the
 * name this gate reports each one under.
 *
 * Every one of these renders a store rather than static marketing copy, which
 * is the distinction the whole gate turns on. `/record` and `/dashboard` are
 * the two overlay routes that read a store; `ursa serve` is the command that
 * puts one behind them; `.ursa` is the store directory itself, named because a
 * capture recipe that copies one has a store whether or not it says which.
 */
export const RECORD_SURFACES = [
  { name: 'the record viewer', pattern: /\/record\b/ },
  { name: 'the dashboard', pattern: /\/dashboard\b/ },
  { name: 'a served store', pattern: /\bursa(?:\.ts)?\s+serve\b/ },
  { name: 'a store directory', pattern: /(?:^|[^\w.])\.ursa\b/ },
]

/**
 * The phrases that count as naming the store a capture rendered.
 *
 * `store-demo` is the recipe in several review READMEs: a shallow clone of
 * this repository, which is public, run through `ursa run`. `mini-fixture`
 * and `fixtures/mini` are the committed fixture store. The bare word
 * `fixture` is accepted because the standard's own rule is phrased with it,
 * and a gate that refuses the wording its own standard uses teaches seats to
 * write a token instead of a sentence.
 */
export const DECLARATIONS = [
  /\bstore-demo\b/,
  /\bmini-fixture\b/,
  /\bfixtures?\/mini\b/,
  /\bdemo store\b/,
  /\bfixtures?\b/,
]

// Measured on 2026-11-09 by the security seat's fourth message run of that
// day: 1,473 tracked captures in 36 directories, 29 carrying a declaration,
// 28 rendering a record surface and every one of those declared. The
// repository tracks 1,474 images; the one outside this count is a favicon,
// which is not a capture.
const CENSUS = { dirs: 36, images: 1473, declared: 29, recordDirs: 28 }

/** The input space. Outcomes are measured by the enumerator, never declared. */
export const GATE = describeGate({
  id: 'tools/capture-provenance.mjs',
  verdict,
  findingsLocus: LOCUS.READER,
  loci: {
    // Named by `name no store`, the clause the failing line attaches the
    // reader's repair to. Not the bare word `store`, which the clean line and
    // the trailer both use for other purposes.
    [LOCUS.READER]: { noun: /name no store/ },
  },
  probes: [
    { name: 'the tree as it stands, every record surface declared', findings: [], seen: CENSUS },
    {
      name: 'no captures tracked at all, which is clean and not unmeasured',
      findings: [],
      seen: { dirs: 0, images: 0, declared: 0, recordDirs: 0 },
    },
    {
      name: 'one directory captures the dashboard and names no store',
      findings: [{ dir: 'docs/design/reviews/2026-11-09-x', images: 12, surfaces: ['the dashboard'] }],
      seen: { dirs: 37, images: 1486, declared: 29, recordDirs: 12 },
    },
    {
      name: 'two directories undeclared, which is the count the line has to carry',
      findings: [
        { dir: 'docs/design/reviews/2026-11-09-x', images: 12, surfaces: ['the dashboard'] },
        { dir: 'docs/design/reviews/2026-11-09-y', images: 3, surfaces: ['the record viewer', 'a served store'] },
      ],
      seen: { dirs: 38, images: 1489, declared: 29, recordDirs: 13 },
    },
  ],
})
