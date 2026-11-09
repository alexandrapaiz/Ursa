#!/usr/bin/env node
// Whose finding is it? A whole-tree gate scans the tree it is handed and the
// company reads its red against the BRANCH it names. Those are different
// subjects, and when they diverge every seat the gate wakes triages a fault it
// did not write.
//
//   node tools/gates/inherited-finding.mjs                  # HEAD against its merge-base with origin/main
//   node tools/gates/inherited-finding.mjs --base <ref> --head <ref>
//   node tools/gates/inherited-finding.mjs --only <substr>
//   node tools/gates/inherited-finding.mjs --json
//   node tools/gates/inherited-finding.mjs --self-test       # the positive control
//
// Exit 0  every declared gate was classified and this branch introduced none
//         of the findings in the tree it will be judged on.
// Exit 1  this branch introduced at least one finding: a gate is green at the
//         base and red at the tip. This is the only exit code that is a claim
//         about the branch.
// Exit 2  I DID NOT ANSWER. The ground could not be established: not a git
//         checkout, a ref that does not resolve, a worktree that would not
//         build, or an unreadable gate declaration.
// Exit 3  I DID NOT ANSWER. Nothing was classified. Zero introduced findings
//         among zero comparisons is not a clean branch.
// Exit 4  I DID NOT ANSWER. The floor failed: the two arms are the same tree,
//         so the experiment did not happen.
//
// Codes 2, 3 and 4 all mean "I did not answer", and they are listed that way
// on purpose. Ursa/security's rule from 2026-11-09, in their words: a bare
// non-zero is not a pass, because `verdict-without-reach` returns non-zero
// with a code that also means a real finding, "so nothing downstream can tell
// `I did not answer` from `I answered no`". Their example was
// tools/stack/repair-pending.mjs, whose uncaught `gh` failure exits 1 and
// whose documented code for genuinely unrepaired is also 1. So this tool
// reserves 1 for the single claim it makes about a branch and puts every
// non-answer somewhere else.
//
// WHY THIS IS A FOURTH AXIS AND NOT A FOURTH RUN OF THE FIRST THREE.
// premise-differential removes THE REPOSITORY. empty-premise empties the
// DECLARED FILES. Ursa/security's third reading makes the endpoint
// UNREACHABLE. All three damage the premise and ask whether the gate notices.
// This one damages nothing. The premise is intact, the gate reads it
// correctly, the finding is real, and the verdict is still false -- because
// the thing it is false about is not the finding, it is the SUBJECT. The three
// premise axes could all be green on a gate that misattributes every finding
// it makes, and on 2026-11-09 they were.
//
// THE MEASUREMENT THIS FILE WAS BUILT FROM, which is one incident read whole.
// Ursa's PM wrote a full session id into docs/agents/pm-2026-11-09-message-29-run.md
// and it reached `main` at 10:22:37Z. Over the next 24 minutes redaction-gate
// failed 17 times. Every one of the 17 named the same file and the same line 17
// -- confirmed by reading all 17 job logs, not by sampling. One was the push to
// `main`. The other 16 were pull_request runs against 10 branches belonging to 5
// seats, and of those 10 branches exactly one had the file in its own diff: the
// PM branch that wrote it. The PM fixed `main` at 10:40:45Z. Branches kept going
// red after that, because a pull_request check is computed against the merge ref
// GitHub snapshotted when the run was CREATED, so a branch can be handed a red
// about a trunk that was already repaired.
//
// What that cost is on the record in other seats' own words rather than this
// one's. Ursa/engineer, 10:57Z: "two of those fixes I wrote a second time
// before I found that out, forty minutes apart, against two different seats",
// and "both were caught by reading this board rather than by any check, which
// is luck."
//
// AND THE PART THAT MAKES IT A CLASS RATHER THAN AN INCIDENT. Ursa/security
// named this collision structurally on 2026-11-02, in docs/security/audit-2026-11-02e.md:
// board message and item ids ARE full UUIDs, the standard that tells a seat to
// cite the message it acted on hands it a string the gate refuses, and that
// audit closed the paragraph "That is a convention, not a fix, and the fix is
// not this seat's to choose." Seven days later the convention was not kept
// once and cost 17 red runs across 5 seats. A known recurrence with no
// instrument watching it is the thing this family of gates exists to remove.
//
// HOW THE ARMS ARE BUILT, and why there are three of them.
// Two `git worktree` checkouts, one at the base and one at the tip, with each
// arm running THAT worktree's own copy of the gate -- the same construction
// empty-premise uses and for the same measured reason, that 40 of 61 tools
// here resolve their inputs against the script's own directory rather than the
// working one. The TIP arm is read twice. That is window 109's third reading:
// a row is classified only where the pair agrees with itself, because a tool
// whose two readings at the same tree disagree cannot be compared across trees
// at all, and this seat produced exactly one of those by committing to the tree
// while its own measurement ran.
//
// THE FLOOR, which is a control on the experiment and not on any gate.
// If the two arms are the same tree, every gate comes back CLEAN_BOTH or
// INHERITED by construction and this tool reports a branch that introduced
// nothing, over an experiment that never ran. So the arms are proved different
// FROM TWO SURFACES: the tree object each ref resolves to, and the file list
// `git diff --name-only base head` returns. They are read separately and a
// disagreement is reported rather than resolved, because the whole point of a
// second surface is that it can refuse. That shape is alexandria/engineer's
// floor generalised one layer, and the reason it needs two surfaces is this
// seat's own clause: a changed-file count is legal at every value including
// zero, so it has no illegal value to fail on, and a quantity with no illegal
// value is not a control until something else can contradict it.
//
// AND THE CLASS THIS TOOL REFUSES TO RESOLVE. If the branch edits the gate's
// own definition, then green-at-base and red-at-tip no longer separates "the
// branch added a violation" from "the branch tightened the gate". Both are
// real and they are opposite in meaning. `defines` in inherited-finding.json
// names the files that ARE each gate, this tool hashes them in both arms, and
// a difference is GATE_CHANGED: reported, counted, and never folded into
// either INTRODUCED or INHERITED.

import { execFileSync, spawnSync } from 'node:child_process'
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { pathToFileURL } from 'node:url'
import { ARM_TIMEOUT_MS, REPO_ROOT, STRIPPED_ENV } from './premise-differential.mjs'

const SPEC = join(REPO_ROOT, 'tools', 'gates', 'inherited-finding.json')

export const SUBJECT_CLASSES = {
  CLEAN_BOTH: 'green at the base and green at the tip: nothing to attribute',
  INHERITED: 'red at the base and red at the tip with the same findings, so this branch did '
    + 'not cause it. Answer it once by reference and do not repair it here (L-A31)',
  INTRODUCED: 'green at the base and red at the tip: this branch\'s own finding, and the only '
    + 'class that is a claim about the branch',
  REPAIRED: 'red at the base and green at the tip: this branch fixes the trunk. Named because '
    + 'it is the state that looks from the outside exactly like nothing happened',
  MIXED: 'red at both arms and the finding sets differ, so part is inherited and part is this '
    + 'branch\'s. Partitioned rather than rounded to either',
  GATE_CHANGED: 'the files that DEFINE this gate differ between the arms, so a colour change '
    + 'cannot be attributed to tree content at all',
  UNSTABLE: 'two readings at the tip disagree, so no cross-arm comparison is available',
  UNATTRIBUTABLE: 'red at both arms and the gate names no path in either, so the two reds '
    + 'cannot be compared and provenance is not established for this row',
  NOT_REACHED: 'an arm timed out, was killed, or could not run the gate: this run did not '
    + 'establish anything for this row',
}

/** Exit codes that mean "I did not answer", declared so a caller can branch on
 *  reach rather than on colour. */
export const NO_ANSWER_EXITS = [2, 3, 4]

export function loadSpec(path = SPEC) {
  const doc = JSON.parse(readFileSync(path, 'utf8'))
  if (!Array.isArray(doc.gates) || !doc.gates.length) {
    throw new Error('the gate declaration names no gates, so there is no experiment to run')
  }
  return doc
}

function git(args, cwd = REPO_ROOT) {
  return execFileSync('git', args, { cwd, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 }).trim()
}

/** The floor's two surfaces, read apart and compared after.
 *
 *  `tree` is the tree object each ref resolves to. Two refs with the same tree
 *  are the same content however many commits separate them, and this is the
 *  surface with an illegal value: equal trees cannot coexist with a non-empty
 *  diff. `files` is what `git diff --name-only` returns, which is the surface
 *  every reader would reach for first and which is legal at zero. */
export function readFloor(base, head, cwd = REPO_ROOT) {
  const baseTree = git(['rev-parse', `${base}^{tree}`], cwd)
  const headTree = git(['rev-parse', `${head}^{tree}`], cwd)
  const files = git(['diff', '--name-only', base, head], cwd).split('\n').filter(Boolean)
  const commits = Number(git(['rev-list', '--count', `${base}..${head}`], cwd))
  return { baseTree, headTree, files, commits }
}

export function floorFindings(floor) {
  const out = []
  if (floor.baseTree === floor.headTree) {
    out.push({
      code: 'ARMS_IDENTICAL',
      why: 'the base and the tip resolve to the same tree object, so both arms are the same '
        + 'content and every row below is CLEAN_BOTH or INHERITED by construction',
    })
  }
  if (floor.baseTree !== floor.headTree && floor.files.length === 0) {
    out.push({
      code: 'FLOOR_SURFACES_DISAGREE',
      why: 'the trees differ and git diff --name-only lists no file. Two surfaces disagree '
        + 'about whether this branch changed anything, and this tool does not pick one',
    })
  }
  if (floor.baseTree === floor.headTree && floor.files.length > 0) {
    out.push({
      code: 'FLOOR_SURFACES_DISAGREE',
      why: `the trees are identical and git diff --name-only lists ${floor.files.length} `
        + 'file(s). Two surfaces disagree, and this tool does not pick one',
    })
  }
  return out
}

/** The gate's own definition, hashed from the arm's copy. A gate is its
 *  `defines` files, which are declared and not inferred: inferring them from
 *  argv would catch the entrypoint and miss every baseline beside it, and a
 *  baseline edit alone is enough to move a colour. */
export function defineHash(armPath, defines) {
  const h = createHash('sha256')
  const missing = []
  for (const rel of [...defines].sort()) {
    h.update(`${rel}\u0000`)
    try {
      h.update(readFileSync(join(armPath, rel)))
    } catch {
      missing.push(rel)
      h.update('\u0000ABSENT\u0000')
    }
  }
  return { digest: h.digest('hex').slice(0, 16), missing }
}

/** Run one declared gate inside one arm, using THAT arm's own check list.
 *
 *  The gate list is imported from the arm rather than from this checkout for
 *  the same reason the gate itself is: if the branch changed what a check
 *  runs, the tip arm has to run the branch's version or the comparison is
 *  against a gate that exists in neither tree. A cache-busting query keeps the
 *  two arms' modules from collapsing onto one import. */
export async function runGateInArm(armPath, id) {
  let checks
  try {
    const url = pathToFileURL(join(armPath, 'scripts', 'ci-checks.mjs'))
    url.searchParams.set('arm', armPath)
    ;({ CHECKS: checks } = await import(url.href))
  } catch (err) {
    return { reached: false, why: `the arm's scripts/ci-checks.mjs would not load: ${err.message}` }
  }
  const check = (checks || []).find((c) => c.id === id)
  if (!check) return { reached: false, why: `the arm's check list has no gate with id ${id}` }

  let argv
  try {
    argv = check.argv()
  } catch (err) {
    return { reached: false, why: `the arm's argv() threw: ${err.message}` }
  }
  const env = { ...process.env }
  for (const key of STRIPPED_ENV) delete env[key]
  const r = spawnSync(argv[0], argv.slice(1), {
    cwd: join(armPath, check.cwd || '.'),
    env,
    timeout: ARM_TIMEOUT_MS,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    maxBuffer: 16 * 1024 * 1024,
  })
  if (r.error || r.signal) {
    return { reached: false, why: `the gate did not complete: ${r.signal || r.error?.message}` }
  }
  const text = `${r.stdout || ''}${r.stderr || ''}`
  const pass = (check.passExit || [0]).includes(r.status)
  return {
    reached: true,
    pass,
    status: r.status,
    passExit: check.passExit || [0],
    findings: findingKeys(text, armPath),
    firstLine: (text.split('\n').find((l) => l.trim()) || '').trim().slice(0, 140),
  }
}

/** The findings a gate's own output names, as a comparable set.
 *
 *  LINE-ANCHORED, and the first version of this function was not, which cost
 *  its author a wrong answer on the instrument's own validation run. Scraping
 *  every path out of the whole output captured `docs/security/redaction-standard.md`
 *  from the gate's closing advice -- "See docs/security/redaction-standard.md
 *  and Ursa incident 4" -- and reported it as a path this branch introduced.
 *  The gates here print a finding at the START of a line, indented, and cite
 *  documentation mid-sentence, so the anchor is the discriminator and a word
 *  list would not have been.
 *
 *  Why it mattered more than a cosmetic over-count: a spurious key appears in
 *  the tip arm's set, and if the prose differs between the arms it lands in
 *  the symmetric difference and turns an INHERITED row into MIXED. MIXED tells
 *  a seat part of the finding is theirs. That is the exact misattribution this
 *  whole file exists to remove, produced inside it.
 *
 *  Line numbers are deliberately dropped from the key: the same violation
 *  moves line when a branch edits the file above it, and a key that changed
 *  with an unrelated edit would read that as a new finding.
 *
 *  A gate that reports its findings only in prose returns an empty set here.
 *  That is not treated as agreement -- see UNATTRIBUTABLE in classify(). */
export function findingKeys(text, armPath) {
  const keys = new Set()
  const re = /^[\s>*-]*(?:\.\/)?((?:docs|tools|scripts|prompts|ursa-major|ursa-minor|\.github)\/[A-Za-z0-9._/-]+?)(?::\d+)?\s*$/
  for (const line of text.replaceAll(armPath, '').split('\n')) {
    const m = re.exec(line)
    if (m) keys.add(m[1])
  }
  return [...keys].sort()
}

export function classify({ baseRun, tip1, tip2, gateMoved }) {
  if (gateMoved) return { cls: 'GATE_CHANGED' }
  if (!baseRun.reached || !tip1.reached || !tip2.reached) {
    const why = [baseRun, tip1, tip2].find((r) => !r.reached)?.why
    return { cls: 'NOT_REACHED', why }
  }
  if (tip1.pass !== tip2.pass || tip1.status !== tip2.status
      || String(tip1.findings) !== String(tip2.findings)) {
    return { cls: 'UNSTABLE' }
  }
  if (baseRun.pass && tip1.pass) return { cls: 'CLEAN_BOTH' }
  if (baseRun.pass && !tip1.pass) return { cls: 'INTRODUCED', introduced: tip1.findings }
  if (!baseRun.pass && tip1.pass) return { cls: 'REPAIRED' }
  // Both arms red. Provenance now rests entirely on the two finding sets, so
  // if the gate named nothing in either arm there is no evidence the two reds
  // are the same red, and calling that INHERITED would be this tool telling a
  // seat to ignore a finding it never compared.
  if (!tip1.findings.length && !baseRun.findings.length) {
    return { cls: 'UNATTRIBUTABLE', why: 'red at both arms and this gate names no path in '
      + 'either, so there is nothing to compare and provenance is not established' }
  }
  const inherited = tip1.findings.filter((k) => baseRun.findings.includes(k))
  const introduced = tip1.findings.filter((k) => !baseRun.findings.includes(k))
  if (introduced.length) return { cls: 'MIXED', inherited, introduced }
  return { cls: 'INHERITED', inherited }
}

function worktree(ref, label) {
  const dir = mkdtempSync(join(tmpdir(), `inherited-${label}-`))
  const path = join(dir, 'wt')
  execFileSync('git', ['worktree', 'add', '--detach', '--quiet', path, ref],
    { cwd: REPO_ROOT, encoding: 'utf8' })
  return { dir, path }
}

function removeWorktree(wt) {
  if (!wt) return
  try {
    execFileSync('git', ['worktree', 'remove', '--force', wt.path], { cwd: REPO_ROOT })
  } catch { /* the rm below is the post-condition that matters */ }
  rmSync(wt.dir, { recursive: true, force: true })
}

/** A `finally` does not run when the process is killed by a signal, and on
 *  this host a run is ended by a cap it does not choose. empty-premise.mjs
 *  paid for this clause with two orphan worktrees; this file inherits it
 *  rather than rediscovering it. */
function onSignal(fn) {
  for (const sig of ['SIGINT', 'SIGTERM', 'SIGHUP']) {
    process.on(sig, () => { fn(); process.exit(2) })
  }
}

export function verdict(rows, floor) {
  const findings = floorFindings(floor)
  if (findings.length) return { findings, classified: 0, exitCode: 4 }
  const classified = rows.filter(
    (r) => !['NOT_REACHED', 'UNSTABLE', 'UNATTRIBUTABLE'].includes(r.cls),
  ).length
  const own = rows.filter((r) => r.cls === 'INTRODUCED' || r.cls === 'MIXED')
  if (!classified) return { findings, classified, exitCode: 3 }
  if (own.length) {
    return {
      findings: own.map((r) => ({
        code: r.cls === 'MIXED' ? 'PARTLY_THIS_BRANCH' : 'THIS_BRANCH',
        gate: r.id,
        paths: r.introduced,
      })),
      classified,
      exitCode: 1,
    }
  }
  return { findings, classified, exitCode: 0 }
}

/** The positive control. An all-INHERITED table and a classifier that cannot
 *  see INTRODUCED at all print the same thing, so this proves the instrument
 *  can return the one class it exists to find, before any table is believed.
 *  It writes a violation the redaction gate's own patterns match into a copy of
 *  the tip arm and asserts the classification moves to INTRODUCED. */
async function selfTest() {
  const head = git(['rev-parse', 'HEAD'])
  let base = null
  let dirty = null
  const out = []
  try {
    base = worktree(head, 'ctl-base')
    dirty = worktree(head, 'ctl-tip')
    const clean = await runGateInArm(base.path, 'redaction-tree')
    writeFileSync(join(dirty.path, 'docs', 'zz-positive-control.md'),
      '# positive control\n\nsession: 12345678-1234-4123-8123-1234567890ab\n')
    const red1 = await runGateInArm(dirty.path, 'redaction-tree')
    const red2 = await runGateInArm(dirty.path, 'redaction-tree')
    const { cls } = classify({ baseRun: clean, tip1: red1, tip2: red2, gateMoved: false })
    out.push(['base arm green', clean.reached && clean.pass]) 
    out.push(['tip arm red', red1.reached && !red1.pass])
    out.push(['tip arm names the planted path',
      red1.findings.some((k) => k.includes('zz-positive-control'))])
    out.push(['classified INTRODUCED', cls === 'INTRODUCED'])
  } finally {
    removeWorktree(base)
    removeWorktree(dirty)
  }
  for (const [what, ok] of out) console.log(`${ok ? 'ok  ' : 'FAIL'}  ${what}`)
  const bad = out.filter(([, ok]) => !ok).length
  console.log(bad
    ? `positive control FAILED on ${bad} of ${out.length} assertions: this tool cannot be `
      + 'trusted to find the class it exists to find'
    : `positive control passed, ${out.length} of ${out.length}: the classifier returns `
      + 'INTRODUCED on a planted violation');
  process.exit(bad ? 1 : 0)
}

async function main() {
  const argv = process.argv.slice(2)
  const flag = (n) => (argv.includes(`--${n}`) ? argv[argv.indexOf(`--${n}`) + 1] : null)
  const json = argv.includes('--json')
  const only = flag('only')

  if (argv.includes('--self-test')) return selfTest()

  let doc
  try {
    doc = loadSpec()
  } catch (err) {
    console.error(`SPEC_UNREADABLE: ${SPEC}: ${err.message}`)
    process.exit(2)
  }

  const headRef = flag('head') || 'HEAD'
  let baseRef = flag('base')
  let head
  let base
  try {
    head = git(['rev-parse', headRef])
    if (!baseRef) {
      const trunk = git(['rev-parse', '--verify', 'origin/main'])
      baseRef = git(['merge-base', head, trunk])
    }
    base = git(['rev-parse', baseRef])
  } catch (err) {
    console.error(`GROUND_UNESTABLISHED: could not resolve the pair to compare: ${err.message}`)
    process.exit(2)
  }

  let floor
  try {
    floor = readFloor(base, head)
  } catch (err) {
    console.error(`GROUND_UNESTABLISHED: the floor could not be read: ${err.message}`)
    process.exit(2)
  }

  // The denominator before the rows, so an interrupted read is visibly
  // partial. This charter's own §0 earns that rule from a scan whose
  // progress line printed last.
  let gates = doc.gates
  if (only) gates = gates.filter((g) => g.id.includes(only))
  const header = `inherited-finding: base ${base.slice(0, 8)} -> tip ${head.slice(0, 8)}, `
    + `${floor.commits} commit(s), ${floor.files.length} changed file(s), `
    + `${gates.length} declared gate(s), ${(doc.not_swept || []).length} not-swept class(es)`
  if (!json) console.log(header)

  const early = floorFindings(floor)
  if (early.length) {
    for (const f of early) console.error(`${f.code}: ${f.why}`)
    console.error('inherited-finding: the floor failed, so this run makes no claim about any '
      + 'gate and no claim about this branch.')
    process.exit(4)
  }

  let baseArm = null
  let tipArm = null
  const rows = []
  try {
    onSignal(() => { removeWorktree(baseArm); removeWorktree(tipArm) })
    baseArm = worktree(base, 'base')
    tipArm = worktree(head, 'tip')

    for (const g of gates) {
      const bh = defineHash(baseArm.path, g.defines || [])
      const th = defineHash(tipArm.path, g.defines || [])
      const gateMoved = bh.digest !== th.digest
      const baseRun = await runGateInArm(baseArm.path, g.id)
      const tip1 = await runGateInArm(tipArm.path, g.id)
      const tip2 = gateMoved ? tip1 : await runGateInArm(tipArm.path, g.id)
      const c = classify({ baseRun, tip1, tip2, gateMoved })
      rows.push({
        id: g.id,
        ...c,
        baseExit: baseRun.status ?? null,
        tipExit: tip1.status ?? null,
        definesMissing: [...new Set([...bh.missing, ...th.missing])],
        tipFirstLine: tip1.firstLine || '',
      })
      if (!json) {
        console.log(`  ${c.cls.padEnd(13)} ${g.id.padEnd(22)} base=${baseRun.status ?? '-'} `
          + `tip=${tip1.status ?? '-'}`
          + (c.inherited?.length ? `  inherited:${c.inherited.length}` : '')
          + (c.introduced?.length ? `  introduced:${c.introduced.join(',')}` : '')
          + (c.why ? `  ${c.why}` : ''))
      }
    }
  } catch (err) {
    console.error(`GROUND_UNESTABLISHED: the arms could not be built or driven: ${err.message}`)
    removeWorktree(baseArm)
    removeWorktree(tipArm)
    process.exit(2)
  } finally {
    removeWorktree(baseArm)
    removeWorktree(tipArm)
  }

  const v = verdict(rows, floor)
  const ungraded = rows.filter(
    (r) => ['NOT_REACHED', 'UNSTABLE', 'UNATTRIBUTABLE'].includes(r.cls),
  )
  if (json) {
    console.log(JSON.stringify({ header, base, head, floor, rows, verdict: v }, null, 2))
  } else {
    // The ungraded total beside every count. A count over a population with
    // ungraded rows is not a verdict about that population, which is window
    // 109's own correction to a zero it had already sent to another seat.
    console.log(`inherited-finding: ${v.classified} of ${rows.length} gate(s) classified, `
      + `${ungraded.length} ungraded, and this run makes no claim about those `
      + `${ungraded.length}.`)
    for (const f of v.findings) {
      console.error(`${f.code}: ${f.gate || ''} ${f.paths ? f.paths.join(' ') : (f.why || '')}`)
    }
    const inh = rows.filter((r) => r.cls === 'INHERITED' || r.cls === 'MIXED')
    if (inh.length) {
      console.log(`inherited-finding: ${inh.length} gate(s) carry a finding this branch did `
        + 'not cause. Answer those once by reference (L-A31) and do not repair them here: '
        + inh.map((r) => r.id).join(', '))
    }
    if (v.exitCode === 0) {
      console.log('inherited-finding: this branch introduced no finding into the tree it will '
        + 'be judged on.')
    }
  }
  process.exit(v.exitCode)
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main()
}
