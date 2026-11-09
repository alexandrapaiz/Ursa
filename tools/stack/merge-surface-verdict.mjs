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
 * @property {string} [driver] the merge driver that REFUSED this path, when
 *   one did. Absent on an ordinary line conflict.
 * @property {string} [reason] why that driver refused, taken off stderr and
 *   printed beside the path it belongs to.
 *
 *   WHY THE TWO EXTRA FIELDS, added 2026-11-02 after `Ursa/exo` reported a
 *   merge gate that held the complete path list and still reported one
 *   conflict of two. The two kinds of conflicted path do not have the same
 *   repair, and a surface that prints them identically tells the resolving
 *   seat it has two of the cheap kind:
 *
 *     an ordinary line conflict -- both sides appended to the same region, so
 *     the resolution is KEEP BOTH and no information is lost by it.
 *
 *     a register driver's refusal naming one heading both sides edited -- two
 *     seats wrote different text under the same entry, so somebody has to
 *     CHOOSE, and keeping both would publish two contradictory copies of one
 *     entry under one identifier. This is the case where the cheap resolution
 *     is actively wrong, and the sentence that says so was on stderr while the
 *     path was on stdout.
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
 * @property {number} [attributed] how many of those diagnostic lines carried a
 *   `merge-driver-result:` attribution this gate could read. Reported as a
 *   fraction of `diagnostics.length` rather than as a list, because a
 *   third-party driver emits none and a reader must be told the limit of the
 *   measurement instead of being shown an empty list that reads as "no
 *   refusals".
 * @property {number} [collapseCost] how many lines a `2>&1` read of this
 *   particular pair would have been off by. A number and not the phrase "off
 *   by one", because it is a property of the branch and of the drivers
 *   installed: one `ledger` diagnostic on the pair where the fault was found,
 *   five on `refs/prs/668` before the attribution grammar existed, and nine on
 *   that same pair after it, because the grammar added a line per driver
 *   invocation. A sweep "repaired" by skipping one line is still wrong by
 *   eight, and the figure that would have been committed as prose this morning
 *   is already stale. Hence a measured field rather than a documented number.
 */

/** One line per conflicted path, plus a second line when a merge driver
 *  refused it and said why.
 *
 *  The locus is the same for every conflicted path -- the authoring seat
 *  rebases -- and is stated once in the trailer rather than repeated. The
 *  REASON is not the same for every path and is not derivable from the path,
 *  so it goes here, indented under the path it belongs to. See the `Finding`
 *  typedef for why the two kinds of conflict need different work from the
 *  seat that resolves them. */
export function pathLine(finding) {
  const head = `  ${finding.path}`
  if (!finding.reason) return head
  return `${head}\n      refused by the ${finding.driver} driver: ${finding.reason}`
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
  const refused = findings.filter((f) => f.reason)

  // How much of stderr this gate could actually read, as a fraction and never
  // as a list. `attributed` is undefined for a caller that predates the
  // attribution grammar, and the clause is dropped rather than printed as
  // `undefined of 5`, because a census line that prints a missing field is how
  // a reader learns to stop reading census lines.
  const attribution =
    typeof seen.attributed === 'number'
      ? ` ${seen.attributed} of ${diagnostics.length} diagnostic line(s) carried a driver attribution this gate could read.`
      : ''
  // The cost of the idiom `docs/agents/merge-order.md` forbids, for THIS pair.
  // Printed on both verdicts, including the clean one, because a seat that
  // only ever sees clean merges is exactly the seat that will reach for `2>&1`
  // on its first conflicted one.
  const collapse =
    typeof seen.collapseCost === 'number' && seen.collapseCost > 0
      ? ` A 2>&1 read of this pair would have put ${seen.collapseCost} line(s) of stderr where the tree id belongs.`
      : ''

  if (findings.length === 0) {
    return verdictOf({
      exitCode: 0,
      cause: 'MERGES_CLEAN',
      position: POSITION.BEFORE,
      line:
        `merge-surface ${where}: clean, 0 conflicted path(s), ` +
        `measured with ${drivers} merge driver key(s) registered and ` +
        `${diagnostics.length} driver diagnostic(s) read off stderr.` +
        `${attribution}${collapse}`,
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
      `${refused.length} of them refused by a merge driver with a reason, ` +
      `which the authoring seat rebases, measured with ${drivers} merge ` +
      `driver key(s) registered and ${diagnostics.length} driver ` +
      `diagnostic(s) read off stderr.` +
      `${attribution}${collapse}`,
    trailer: [
      '',
      `measured on ${seen.baseOid} .. ${seen.headOid}, and on no other pair.`,
      'Both revisions are resolved and printed because a conflict verdict',
      'names a pair of commits or it names nothing: the ExO seat re-ran a',
      'whole sweep on 2026-11-02 when `main` moved mid-measurement, and the',
      'only reason that was possible to notice is that the commit was in the',
      'output.',
      ...(refused.length > 0
        ? [
            '',
            `${refused.length} of these ${findings.length} path(s) is a merge driver refusing, not a`,
            'line conflict, and the two do not have the same resolution: a line',
            'conflict is both sides appending and keeps both, while a driver',
            'refusing one entry both sides edited needs somebody to choose, because',
            'keeping both would publish two contradictory copies of one entry under',
            'one identifier.',
          ]
        : []),
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
 * `cause` is taken from the caller's code rather than fixed, because the seven
 * grounds here have seven different repairs held by four different people, and
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

/** The seven grounds, as constructors, so the program and the probes below
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

  /** A merge driver reported refusing a path that git did not list as
   *  conflicted. The conflict surface is then an UNDER-REPORT while looking
   *  complete, which is the exact state the 2026-11-02 census was in, so it is
   *  reported as ground and never as a verdict about the branch.
   *
   *  Not reachable from either driver this repository registers today: both
   *  call `process.exit(1)` on every refusal path and git records a conflict
   *  for a non-zero driver. It is reachable from a driver that exits 0 after
   *  writing a degraded result, which is the silent-corruption shape both
   *  drivers' headers say they exist to remove. So this branch is the
   *  executable form of that claim, and `driver-report.mjs`'s `reconcile` is
   *  pure precisely so it can be driven red without writing such a driver. */
  driverRefusalUnlisted: (refusals) =>
    unusable({
      code: 'DRIVER_REFUSAL_UNLISTED',
      locus: LOCUS.COMMITTED,
      why: `${refusals.length} merge driver refusal(s) name a path git did not list as conflicted (${refusals.map((r) => `${r.driver}: ${r.path}`).join(', ')}), so this conflict surface is an under-report that looks complete`,
      repair:
        'the driver exited 0 after refusing, or git stopped recording a conflict for a non-zero driver; fix the driver before trusting any surface it appears in',
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
  attributed: 0,
  collapseCost: 1,
}

/** The real stderr of `origin/main`@`9c3c52dc` against `refs/prs/668`, which
 *  is the pair `Ursa/exo` reported on 2026-11-02 and the pair every number in
 *  this file's headers was measured on. Kept verbatim, five lines, so the
 *  five-line collapse cost in the `Census` typedef is a transcript and not a
 *  recollection. */
const CENSUS_668 = {
  base: 'origin/main',
  head: 'refs/prs/668',
  baseOid: '9c3c52dc2569132896ff2fc0f67a2ce6aa0ea9ae',
  headOid: '5eb30620a8decfff13b3881115f1ae4850c6398d',
  tree: '4be68ba2ee30e18c12b1de99f8cf911eba0a88b4',
  drivers: 2,
  diagnostics: [
    'register driver: docs/agents/runner-facts.md merged by entry identity (heading ^## , identifier ^## ([0-9]+[a-z]?)\\.).',
    'merge-driver-result: driver=register disposition=merged path="docs/agents/runner-facts.md"',
    'register driver: docs/agents/learning-log.md merged by entry identity (heading ^## ).',
    'merge-driver-result: driver=register disposition=merged path="docs/agents/learning-log.md"',
    'register driver: docs/agents/incidents.md merged by entry identity (heading ^## , identifier ^## (Incident [0-9]+[a-z]?|INC-[0-9]{4}-[0-9]{2}-[0-9]{2}-[a-z0-9-]+)).',
    'merge-driver-result: driver=register disposition=merged path="docs/agents/incidents.md"',
    "register driver: the merger refused docs/agents/improvements.md. Its reason: merge-register: both sides edited '## Week of 2026-11-02' differently",
    'merge-driver-result: driver=register disposition=refused path="docs/agents/improvements.md" reason=merge-register: both sides edited \'## Week of 2026-11-02\' differently',
    "register driver: wrote git's own line-based merge into the working tree instead, conflict markers included, so the file shows that it needs a human.",
  ],
  attributed: 4,
  collapseCost: 9,
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
      seen: { ...CENSUS, diagnostics: [], attributed: 0, collapseCost: 0 },
    },
    {
      name: "refs/prs/668's two paths, one of them a register driver refusing one heading both sides edited",
      findings: [
        {
          path: 'docs/agents/improvements.md',
          locus: LOCUS.SEAT,
          driver: 'register',
          reason: "merge-register: both sides edited '## Week of 2026-11-02' differently",
        },
        { path: 'docs/agents/merge-order.md', locus: LOCUS.SEAT },
      ],
      seen: CENSUS_668,
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
    {
      name: 'a driver that refused a path git did not list, which is an under-report that looks complete',
      call: () =>
        GROUND.driverRefusalUnlisted([
          { driver: 'register', path: 'docs/agents/improvements.md' },
        ]),
    },
  ],
})
