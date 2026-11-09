// Which side of the merge a gate's hit came from.
//
//   import { attribute, attributionLines } from './hit-attribution.mjs'
//
// WHY THIS EXISTS. HQ's exo-centralizer filed one sentence in this seat's lane
// on 2026-11-09: a gate whose subject lies outside its own repository has two
// owners and one exit code, so either the failure message says so or the red is
// attributed to the wrong branch by default. This module is the "says so" half
// for the commonest instance of it, which is not a remote service and not
// another checkout. It is the base branch.
//
// THE INSTANCE THAT PROMPTED IT, measured, and it is worth stating because it
// is not hypothetical and the cost was paid by two seats who were both right.
// `.github/workflows/redaction-gate.yml` triggers on `pull_request`, and for
// that event GitHub checks out a MERGE of the head with the base. So the gate's
// subject is `head + main` while every reader of the result treats a red as a
// fact about the head. On 2026-11-09 the PM seat's pass committed a full
// private session identifier that reached `main` at 10:21:14Z; the security
// seat's `#859` went red at 10:32:36Z and again at 10:37:40Z naming that file;
// the file is absent from every commit of that branch, so the branch could
// neither cause the red nor clear it. It cleared at 10:45:09Z when someone else
// fixed `main`. In between, a third seat spent part of a pass triaging it.
// Recorded as F133 in `docs/security/audit-2026-11-09-message-15.md`.
//
// WHAT THIS MODULE DOES NOT DO. It does not change any exit code, and it must
// not. Whether an inherited leak should fail the branch is a policy question
// with a real answer on both sides: failing is noisy and misattributed, and not
// failing lets a leak sit on `main` with every branch's gate green. That call
// belongs to whoever owns the gate. All this does is make the output name the
// side, so that a reader deciding anything at all is deciding with the fact in
// front of them. The gates that call it keep their verdicts byte-identical on
// every clean run and on every run whose hits are all introduced.
//
// WHY THE REFUSAL PATH IS NOT AN ERROR. The clone this repository's seats are
// handed is shallow and single-branch (`tools/ensure-full-clone.sh`, and
// `node tools/seat/env-facts.mjs` fact `clone-shallow-and-single-branch`), so
// `merge-base` against the base genuinely cannot be computed in some
// checkouts. A helper that threw there would turn an attribution nicety into a
// new way for a working gate to die, which is the defect class this seat
// recorded as F132 four hours earlier: four board gates published an
// unreachable dependency as a certain finding. So an unresolvable base yields
// `scope: 'unknown'` and a line that says the attribution could not be made,
// and the caller prints its hits exactly as it did before.

import { execFileSync } from 'node:child_process'

/** @typedef {'introduced' | 'inherited' | 'mixed' | 'unknown'} Side */

/**
 * @typedef {object} Attribution
 * @property {Side} scope           the single word for the whole hit set
 * @property {string[]} introduced  paths this branch changed relative to base
 * @property {string[]} inherited   paths it did not
 * @property {string|null} base     the ref the comparison resolved against
 * @property {string|null} why      why the comparison could not be made
 */

/**
 * The set of paths that differ between `base` and `HEAD`, or null when the
 * comparison cannot be made in this checkout.
 *
 * Three dots, not two, and it is load-bearing: `base...HEAD` diffs HEAD
 * against the merge base, which is the set of paths the BRANCH touched.
 * `base..HEAD` would also list every path that moved on the base since the
 * branch started, which is the exact population this module exists to
 * separate out, so two dots here would make the helper confidently wrong
 * rather than merely unhelpful.
 *
 * @param {string} base
 * @param {(cmd: string, args: string[]) => string} [git] seam for the tests
 * @returns {{paths: Set<string>} | {why: string}}
 */
export function changedPaths(base, git = defaultGit) {
  try {
    git('git', ['rev-parse', '--verify', '--quiet', `${base}^{commit}`])
  } catch {
    return {
      why:
        `${base} does not resolve in this checkout, so there is nothing to compare against. ` +
        'The clone this host hands a seat is single-branch; run `bash tools/ensure-full-clone.sh`.',
    }
  }
  try {
    const out = git('git', ['diff', '--name-only', `${base}...HEAD`])
    const paths = new Set(out.split('\n').filter((l) => l !== ''))
    // THE UNCOMMITTED SET BELONGS IN HERE, and leaving it out would have made
    // this helper wrong in exactly the mode a seat runs it in most. The tree
    // gates scan the WORKING TREE, so a hit can sit in an edit that is not a
    // commit yet. Against the committed diff alone, an uncommitted leak in a
    // file inherited from the base reads as `inherited`, and the note then
    // tells the seat that caused it, correctly for the commit graph and
    // falsely for the thing it is looking at, that the repair is somebody
    // else's. So `inherited` is defined as: this checkout did not touch it,
    // by commit or otherwise. Both reads are cheap and neither can fail
    // independently of the diff above.
    for (const p of localEdits(git)) paths.add(p)
    return { paths: new Set([...paths].map(normalisePath)) }
  } catch (err) {
    // `merge-base`'s own failure arrives here, as exit 128 from the diff.
    // `env-facts` fact `merge-tree-128-is-not-a-conflict` is the same trap in
    // its sibling command: 128 is an unresolved graph, never a verdict.
    return { why: `git diff ${base}...HEAD could not be computed: ${firstLine(err.message)}` }
  }
}

/**
 * Partition hit paths by which side of the merge they came from.
 *
 * @param {Iterable<string>} paths the files a gate found hits in
 * @param {{base?: string, git?: (cmd: string, args: string[]) => string}} [opts]
 * @returns {Attribution}
 */
export function attribute(paths, opts = {}) {
  const { base = 'origin/main', git = defaultGit } = opts
  // NORMALISED ON BOTH SIDES BEFORE THEY MEET. `grep -rn .` emits `./a/b`
  // and `git` emits `a/b`, so comparing them raw makes every hit from a
  // dot-rooted scan `inherited`. That is not a cosmetic bug: it is this
  // module's own failure mode, a confident attribution of the wrong side,
  // and it is the thing the finding behind this file says is worse than
  // saying nothing. Caught 2026-11-09 driving the real redaction gate over a
  // planted hit, which reported `./docs/vision.md` as the base's while it sat
  // uncommitted in this checkout.
  const unique = [...new Set([...paths].map(normalisePath))].sort()
  const changed = changedPaths(base, git)

  if ('why' in changed) {
    return { scope: 'unknown', introduced: [], inherited: [], base: null, why: changed.why }
  }

  const introduced = unique.filter((p) => changed.paths.has(p))
  const inherited = unique.filter((p) => !changed.paths.has(p))
  // `unknown` for the empty set rather than one of the two sides, because
  // with no hits there is no attribution to make and a caller asserting on
  // `scope` should not read a verdict out of an absence.
  const scope =
    unique.length === 0
      ? 'unknown'
      : inherited.length === 0
        ? 'introduced'
        : introduced.length === 0
          ? 'inherited'
          : 'mixed'
  return { scope: /** @type {Side} */ (scope), introduced, inherited, base, why: null }
}

/**
 * The lines a gate prints under its hits. One per case, each naming the actor
 * who can repair what it describes, because that is the whole point: the
 * previous output named a path and left the reader to guess the owner.
 *
 * Returns an empty array when there is nothing to say, so a caller can splice
 * it in unconditionally without an `if` and without changing a clean run.
 *
 * @param {Attribution} a
 * @returns {string[]}
 */
export function attributionLines(a) {
  if (a.scope === 'unknown' && a.why) {
    return [`note: which side of the merge these came from was not established. ${a.why}`]
  }
  if (a.scope === 'unknown') return []
  if (a.scope === 'introduced') {
    const n = a.introduced.length
    return [
      n === 1
        ? `note: the 1 hit path was changed by this branch against ${a.base}.`
        : `note: all ${n} hit paths were changed by this branch against ${a.base}.`,
    ]
  }
  if (a.scope === 'inherited') {
    return [
      `note: none of these paths were changed by this branch against ${a.base}, so this branch did not`,
      `  introduce them and cannot clear them. The repair is on ${a.base}, and the red here will follow it.`,
    ]
  }
  return [
    `note: mixed. ${plural(a.introduced.length, 'path')} changed by this branch: ${a.introduced.join(', ')}.`,
    `  ${plural(a.inherited.length, 'path')} inherited from ${a.base} and not repairable here: ${a.inherited.join(', ')}.`,
  ]
}

/** @param {number} n @param {string} noun */
function plural(n, noun) {
  return `${n} ${noun}${n === 1 ? '' : 's'}`
}

/** @param {string} s */
function firstLine(s) {
  return String(s).split('\n')[0]
}

/**
 * Paths this checkout has touched without committing: staged, unstaged and
 * untracked alike. `--porcelain` is parsed rather than three separate
 * commands because its rename form (`R  old -> new`) has to be split, and a
 * plain `diff --name-only` would report the old path for a rename a hit now
 * lives in the new path of.
 *
 * @param {(cmd: string, args: string[]) => string} git
 * @returns {string[]}
 */
function localEdits(git) {
  let out
  try {
    out = git('git', ['status', '--porcelain', '--untracked-files=all'])
  } catch {
    // A status that fails leaves the committed diff as the answer. Partial
    // attribution beats none, and the note never claims completeness.
    return []
  }
  const paths = []
  for (const line of out.split('\n')) {
    if (line.trim() === '') continue
    const rest = line.slice(3)
    const arrow = rest.indexOf(' -> ')
    if (arrow !== -1) paths.push(unquote(rest.slice(arrow + 4)))
    else paths.push(unquote(rest))
  }
  return paths
}

/**
 * One spelling for one file. Strips a leading `./` and any leading `/`-free
 * duplication of separators, and nothing else: this is a key normaliser for
 * two producers that already agree on case and on separator, not a resolver.
 * It deliberately does not touch `..` or absolute paths, because a hit path
 * outside the repository is a different finding and should not be quietly
 * folded into one inside it.
 *
 * @param {string} p
 */
function normalisePath(p) {
  let out = String(p).trim()
  while (out.startsWith('./')) out = out.slice(2)
  return out.replace(/\/{2,}/g, '/')
}

/** `git status` quotes a path with unusual bytes in it. */
function unquote(p) {
  return p.startsWith('"') && p.endsWith('"') ? p.slice(1, -1) : p
}

/** @param {string} cmd @param {string[]} args */
function defaultGit(cmd, args) {
  return execFileSync(cmd, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })
}
