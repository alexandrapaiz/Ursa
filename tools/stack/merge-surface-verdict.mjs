// The verdict `tools/stack/merge-surface.mjs` prints, as a pure function.
//
//   import { verdict, unusable, pathLine, GATE } from './merge-surface-verdict.mjs'
//
// EIGHTH GATE EXTRACTED under `docs/ideas.md`, "Every gate exports its verdict
// as data, so the sweep is a program and not a table". Written in this shape
// from the start, like `root-entries-verdict.mjs` and unlike the five that
// were retrofitted.
//
// WHAT THE GATE IS ABOUT. "Does this branch conflict with `main`, and in which
// files" is the question that routes work in this organization: the ExO seat
// publishes it in `docs/agents/merge-order.md`, the PM reads that page to
// order the owner's queue, and the authoring seat reads its own row to decide
// whether it owes a rebase. The instrument is one command,
// `git merge-tree --write-tree --name-only <base> <head>`, and this repository
// has now recorded FOUR separate occasions on which that command returned a
// confident answer that was wrong, with no error on any of them:
//
//   1. 2026-10-18, `INC-2026-10-18-shallow-clone-false-conflicts`: five of
//      nine open branches reported conflicting. The clone was shallow.
//   2. 2026-10-24, lesson L-A55: a single-branch refspec made `origin/<branch>`
//      absent, so every merge failed with `not something we can merge` and
//      every failure was counted as a conflict in zero files.
//   3. 2026-10-25, `INC-2026-10-25-the-merge-sweep-this-charter-mandates-reports-four-false-conflicts-in-a-clone-as-handed`:
//      four false conflicts on `docs/ideas.md` because a clone as handed has
//      neither of this repository's declared merge drivers registered. Then
//      SIXTEEN more, in the same window, produced by fixing the first four:
//      the sweep idiom was `out=$(git merge-tree ... 2>&1)`, a driver writes
//      its diagnostic to stderr, and the redirect puts that line where the
//      tree object identifier belongs.
//   4. 2026-11-02, this gate's trigger. The ExO seat's window-79 sweep
//      reported this seat's `#615` as conflicting in TWO files. Run without
//      the redirect, the same pair of commits conflicts in THREE, and the
//      third is `tools/secret-scan-verdict.mjs`. A seat handed the two-file
//      verdict rebases, pushes, and is refused on a file nobody named.
//
// Every one of the four has a written rule now, and the fourth happened
// anyway, which is the whole argument for this file. `docs/agents/merge-order.md`
// says **No `2>&1`** in bold, five lines above the table whose first sweep
// used it. A rule a seat obeys by remembering is a rule that is sometimes
// obeyed; the repair is to make the correct invocation the only one the
// program can perform.
//
// SO THE DESIGN IS: THE PRECONDITIONS ARE FINDINGS, NOT DOCUMENTATION. The
// clone's completeness, the drivers' registration, and the drivers' resolved
// paths are checked before any merge is attempted, and a failure in any of
// them is `derivedFrom: 'ground'` -- "I could not establish the facts" -- and
// never a conflict count. This is the same refusal `tools/secret-scan.mjs`
// makes on a shallow clone and `tools/root-entries.mjs` makes on a missing
// ignore rule.
//
// WHY THE TREE IDENTIFIER IS VALIDATED AND NOT JUST READ. The stream-collapse
// fault is not detectable from the exit code: `merge-tree` exits 1 for a
// genuine conflict and the collapsed stream still exits 1. What distinguishes
// them is the FIRST LINE OF STDOUT, which is a 40-character object id when the
// streams are separate and a sentence of English when they are not. So this
// gate requires line one to match `/^[0-9a-f]{40}$/` and to name an object
// that exists, and reports `TREE_ID_UNREADABLE` when it does not. That check
// is what makes the collapse impossible to mistake for a conflict surface, and
// it holds whatever the diagnostic text happens to say, which matters because
// the text belongs to whichever driver this repository registers next.
//
// WHY THERE ARE THREE LOCI AND NOT ONE. The question "who repairs this" has
// three different answers here and they are not interchangeable:
//
//   CLONE   the drivers are not registered, or the clone is shallow or narrow.
//           One command, no diff, no review, true of one working copy only.
//   SEAT    the branch genuinely conflicts. The authoring seat rebases; it is
//           not the owner's to resolve and not the reporter's.
//   READER  the invocation itself is wrong: a revision that does not resolve,
//           or a stream the caller collapsed. The person at the keyboard edits
//           the command.
//
// An instrument that reported all three as "conflicting" is exactly how the
// three incidents above each cost a day, so the locus is on every finding and
// the verdict line names the counts separately.
//
// WHAT THIS GATE DOES NOT DO. It does not merge into the working tree, so it
// is not `tools/stack/integrate.sh` and does not replace it: that script
// answers "would the union of every open branch build and pass", which needs a
// real worktree and the test suites. This answers "what is the conflict
// surface of one pair of commits", cheaply enough to run over twenty branches,
// and it writes nothing outside the object database.

import { LOCUS, POSITION, describeGate, verdictOf } from '../gates/verdict-shape.mjs'

/** The three exit statuses `git merge-tree` can hand back, named. */
export const MERGE_TREE = {
  /** Exit 0: the merge succeeded and stdout line one is the tree it wrote. */
  CLEAN: 0,
  /** Exit 1: a genuine content conflict, and the paths are on stdout. */
  CONFLICT: 1,
  /** Anything else, 128 in practice: git refused to attempt the merge at all.
   *  Reported as ground, never as a conflict, because a conflict count that
   *  includes refusals is not a measurement (`integrate.sh`'s own rule). */
  REFUSED: 'other',
}

/**
 * @typedef {object} Finding
 * @property {string} path the conflicted path, exactly as git named it.
 * @property {'seat'} locus always SEAT. A conflicted path is the authoring
 *   seat's rebase; this gate has no other kind of finding, and the other two
 *   loci are reached through `unusable` because they are grounds and not
 *   findings. Carried explicitly anyway so the enumerator's actor check runs
 *   against a field rather than against an assumption.
 */

/**
 * @typedef {object} Census
 * @property {string} base the revision merged into, as the caller spelled it.
 * @property {string} head the revision merged, as the caller spelled it.
 * @property {string} baseOid the 40-character commit the base resolved to.
 * @property {string} headOid the 40-character commit the head resolved to.
 * @property {string} tree the tree `merge-tree` wrote, conflicted or not.
 * @property {number} drivers how many `merge.*.driver` keys are registered.
 * @property {string[]} diagnostics the lines the drivers wrote to STDERR,
 *   kept and reported rather than discarded. They are the evidence that the
 *   two streams were read separately: a run that reports a diagnostic here and
 *   a 40-character tree id above cannot have collapsed them.
 */

/** One line per conflicted path. The repair is the same one every time and it
 *  belongs to one person, so it is stated once in the trailer rather than
 *  repeated per path. */
export function pathLine(finding) {
  return `  ${finding.path}`
}

/**
 * The findings-derived verdict: the merge was attempted and this is its
 * surface.
 *
 * @param {Finding[]} findings
 * @param {Census} seen
 * @returns {import('../gates/verdict-shape.mjs').Verdict}
 */
export function verdict(findings, seen) {
  const { base = '', head = '', drivers = 0, diagnostics = [] } = seen
  const where = `${base}..${head}`

  if (findings.length === 0) {
    return verdictOf({
      exitCode: 0,
      cause: 'MERGES_CLEAN',
      position: POSITION.BEFORE,
      line:
        `merge-surface ${where}: clean, 0 conflicted path(s), ` +
        `measured with ${drivers} merge driver key(s) registered and ` +
        `${diagnostics.length} driver diagnostic(s) read off stderr.`,
      trailer: ['', `measured on ${seen.baseOid} .. ${seen.headOid}, and on no other pair.`],
    })
  }

  return verdictOf({
    exitCode: 1,
    cause: 'PATHS_CONFLICT',
    position: POSITION.BEFORE,
    cites: [LOCUS.SEAT],
    line:
      `merge-surface ${where}: ${findings.length} conflicted path(s), ` +
      `which the authoring seat rebases, measured with ${drivers} merge ` +
      `driver key(s) registered and ${diagnostics.length} driver ` +
      `diagnostic(s) read off stderr.`,
    trailer: [
      '',
      `measured on ${seen.baseOid} .. ${seen.headOid}, and on no other pair.`,
      'Both revisions are resolved and printed because a conflict verdict',
      'names a pair of commits or it names nothing: the ExO seat re-ran a',
      'whole sweep on 2026-11-02 when `main` moved mid-measurement, and the',
      'only reason that was possible to notice is that the commit was in the',
      'output.',
      ...(diagnostics.length > 0
        ? ['', 'Driver diagnostics, from stderr:', ...diagnostics.map((d) => `  ${d}`)]
        : []),
    ],
  })
}

/**
 * The ground verdict: the facts could not be established, so there is no
 * surface to report. Never reported as clean and never as a conflict.
 *
 * `cause` is taken from the caller's code rather than fixed, because the six
 * grounds here have six different repairs held by three different people, and
 * collapsing them into one name is the defect `verdict-shape.mjs`'s header
 * calls "three disjoint conditions behind one sentence".
 *
 * @param {{code: string, locus: string, why: string, repair: string}} fault
 * @returns {import('../gates/verdict-shape.mjs').Verdict}
 */
export function unusable(fault) {
  const { code, locus, why, repair } = fault
  return verdictOf({
    exitCode: 2,
    stream: 'err',
    derivedFrom: 'ground',
    cause: code,
    position: POSITION.BEFORE,
    line: `merge-surface: cannot measure a conflict surface: ${why}`,
    trailer: [`  repair (${locus}): ${repair}`],
  })
}

/** The six grounds, as constructors, so the program and the probes below
 *  cannot drift apart: each is called from exactly one place in
 *  `merge-surface.mjs` and from exactly one probe here. */
export const GROUND = {
  /** The clone cannot answer history questions, so every merge is suspect.
   *  INC-2026-10-18 and L-A55. */
  cloneIncomplete: (detail) =>
    unusable({
      code: 'CLONE_INCOMPLETE',
      locus: LOCUS.CLONE,
      why: `this checkout is shallow or its refspec is narrowed, so git answers merge questions wrongly rather than refusing them (${detail})`,
      repair: 'bash tools/ensure-full-clone.sh',
    }),

  /** `.gitattributes` declares a driver that this clone has not registered.
   *  INC-2026-10-25, first half: four false conflicts on docs/ideas.md. */
  driversUnregistered: (names) =>
    unusable({
      code: 'DRIVERS_UNREGISTERED',
      locus: LOCUS.CLONE,
      why: `.gitattributes declares ${names.length} merge driver name(s) this clone has not registered (${names.join(', ')}), so git falls back to the line merge on exactly the files that exist because the line merge is wrong for them`,
      repair: 'bash tools/registers/install-drivers.sh',
    }),

  /** A driver is registered to a command whose path is outside this checkout.
   *  `install-drivers.sh` writes ABSOLUTE paths, so a clone made by copying
   *  another clone's `.git` carries a driver pointing at a directory that may
   *  not exist, and `merge-tree` then reports a conflict rather than an error.
   *  `docs/agents/merge-order.md` requires the path be "asserted against
   *  `$PWD`"; this is that assertion, executed. */
  driverPathForeign: (names, root) =>
    unusable({
      code: 'DRIVER_PATH_FOREIGN',
      locus: LOCUS.CLONE,
      why: `${names.length} registered merge driver(s) (${names.join(', ')}) name a program outside ${root}, so this clone's drivers belong to a different checkout`,
      repair: 'bash tools/registers/install-drivers.sh',
    }),

  /** `merge.<name>.driver` set to the empty string. Returns ours verbatim on
   *  every file, prints `error: cannot run :` to stderr, and exits 1 -- which
   *  is the same exit a genuine conflict returns. Measured over eighteen of
   *  this repository's own merges; `docs/ideas.md` carries the catalogue. */
  driverEmpty: (names) =>
    unusable({
      code: 'DRIVER_EMPTY',
      locus: LOCUS.CLONE,
      why: `${names.length} merge driver key(s) (${names.join(', ')}) are set to the empty string, which returns one side verbatim and exits 1, the same exit a genuine conflict returns`,
      repair: 'git config --unset merge.<name>.driver, then bash tools/registers/install-drivers.sh',
    }),

  /** A revision the caller named does not resolve, or git refuses the merge
   *  outright (unrelated histories). Exit 128, and the one thing it must never
   *  be counted as is a conflict in zero files. L-A55. */
  mergeRefused: (detail) =>
    unusable({
      code: 'MERGE_REFUSED',
      locus: LOCUS.READER,
      why: `git refused to attempt this merge rather than conflicting on it (${detail})`,
      repair: 'check both revisions resolve: git rev-parse <base> <head>',
    }),

  /** The first line of stdout is not an object id. Either the caller collapsed
   *  stderr into stdout, or `merge-tree`'s output shape has changed. Either
   *  way the path list below it cannot be trusted, and this is the branch that
   *  makes the 2026-11-02 under-report impossible to ship. */
  treeIdUnreadable: (firstLine) =>
    unusable({
      code: 'TREE_ID_UNREADABLE',
      locus: LOCUS.READER,
      why: `the first line of merge-tree's stdout is not a 40-character object id, so the path list under it is not a conflict surface (got: ${JSON.stringify(firstLine.slice(0, 72))})`,
      repair: 'read stdout and stderr on separate handles; never 2>&1 (docs/agents/merge-order.md)',
    }),
}

const CENSUS = {
  base: 'origin/main',
  head: 'refs/prs/615',
  baseOid: 'cdbdcdff4ccd0361e8873aba56cfac8306cf6660',
  headOid: '886baf9bcabce8efac511d3fe3408fe063e53c7f',
  tree: '355465d0805569750aa309eaee680cf12eccbb05',
  drivers: 2,
  diagnostics: [
    'ledger driver: docs/ideas.md merged by block identity. 13 block(s) taken from the other branch, 0 removed.',
  ],
}

/** The input space. Outcomes are measured by the enumerator, never declared. */
export const GATE = describeGate({
  id: 'tools/stack/merge-surface.mjs',
  verdict,
  findingsLocus: LOCUS.SEAT,
  loci: {
    // Named by the phrase `the authoring seat rebases`, not by the bare word
    // `seat`: the trailer talks about commits and revisions, and a one-word
    // pattern would match prose that is not about this locus.
    [LOCUS.SEAT]: { noun: /the authoring seat rebases/ },
  },
  probes: [
    {
      name: 'clean, which is what nineteen of twenty-one open branches were',
      findings: [],
      seen: { ...CENSUS, head: 'refs/prs/665', diagnostics: [] },
    },
    {
      name: 'the three-file surface of #615, measured with the streams separate',
      findings: [
        { path: 'tools/gates/enumerate-verdicts.mjs', locus: LOCUS.SEAT },
        { path: 'tools/gates/enumerate-verdicts.test.mjs', locus: LOCUS.SEAT },
        { path: 'tools/secret-scan-verdict.mjs', locus: LOCUS.SEAT },
      ],
      seen: CENSUS,
    },
    {
      name: 'one conflicted path and no driver diagnostic, so the trailer drops that block',
      findings: [{ path: 'docs/agents/incidents.md', locus: LOCUS.SEAT }],
      seen: { ...CENSUS, diagnostics: [] },
    },
  ],
  /** Ground branches: six of them, driven directly, exempt from the findings
   *  checks. Declared separately so the exemption is visible rather than
   *  implied by an empty findings array. Each one is a real occasion on which
   *  `merge-tree` answered confidently and wrongly; the header names the
   *  incident for each. */
  groundProbes: [
    {
      name: 'a shallow or narrowed clone, which produced five false conflicts in 2026-10-18',
      call: () => GROUND.cloneIncomplete('shallow: .git/shallow exists'),
    },
    {
      name: 'a declared driver this clone never registered, which produced four in 2026-10-25',
      call: () => GROUND.driversUnregistered(['ledger', 'register']),
    },
    {
      name: 'a driver registered to a program in another checkout, which install-drivers.sh writes absolutely',
      call: () => GROUND.driverPathForeign(['ledger'], '/tmp/example-checkout'),
    },
    {
      name: 'a driver key set to the empty string, which exits 1 exactly as a conflict does',
      call: () => GROUND.driverEmpty(['ledger']),
    },
    {
      name: 'a merge git refused outright, which must never be a conflict in zero files',
      call: () =>
        GROUND.mergeRefused('refs/prs/999 - not something we can merge'),
    },
    {
      name: 'a first line that is English, which is what 2>&1 produces',
      call: () =>
        GROUND.treeIdUnreadable(
          'ledger driver: docs/ideas.md merged by block identity. 13 block(s) taken from the other branch, 0 removed.',
        ),
    },
  ],
})
