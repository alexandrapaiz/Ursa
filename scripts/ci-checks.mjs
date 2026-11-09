#!/usr/bin/env node
// The repository's own checks, as one command, so the workflow that runs
// them can be three lines instead of twenty.
//
// Why this exists. The board item behind it asks that every test and gate
// we have built run before a change can reach the default branch. Nothing
// runs them today: eleven of our twelve workflows launch a seat on
// `repository_dispatch` or `workflow_dispatch` and so no pull request can
// trigger them, and the twelfth, `redaction-gate.yml`, runs three grep
// patterns. PWC-15 in docs/agents/pending-workflow-changes.md queues the
// missing workflow with HQ, because `.github/workflows/` is theirs under
// docs/standards/pm.md §15 and this seat may not write there.
//
// What this file is for, which is not the same thing. PWC-15 as queued
// asks HQ to write about twenty steps of OUR logic into a file only HQ can
// edit: the gate list, the per-gate exit semantics, the checkout depth
// each one needs. Every gate we add after that is another round trip
// through a path we do not control, and the entry has already been
// re-queued and amended twice on exactly that bottleneck. So the content
// moves here, where Ursa seats may maintain it, and the workflow HQ
// writes shrinks to a checkout, a setup-node and `node
// scripts/ci-checks.mjs`. The HQ dependency is then paid once instead of
// once per gate.
//
// The property this file exists to hold, and the reason it fails loudly.
// Finding F73 of docs/security/audit-2026-11-02k.md measured what PWC-15's
// prescribed test step actually reaches: `node --test $(find . -name
// '*.test.mjs' ...)` matches 47 tooling suites carrying 811 cases, and
// none of `ursa-major`'s 52 suites carrying 874 cases, because the product
// is TypeScript behind `tsc --noEmit && vitest run`. All 47 of the suites
// it does reach import nothing but `node:` builtins, so on a fresh runner
// with no install step that command runs and goes GREEN while covering
// half the repository and none of the shipped product. That is the board
// item's own thesis one layer in: a gate that fails invisibly is worse
// than no gate, and a gate that passes invisibly is worse again, because
// now there is a green tick next to it.
//
// So: a declared check that CANNOT be run is a failure here, never a skip.
// If `ursa-major/node_modules` is absent, this does not quietly run the
// tooling half and report success. It reports that the product's suites
// could not be run and exits non-zero. Skipping is possible, but only
// when a caller asks for it by name on the command line, which leaves a
// record in the job log of what was not checked.
//
// Exit codes: 0 all declared checks ran and passed. 1 at least one ran and
// failed. 2 at least one could not be run at all, so the result is not a
// verdict on the branch.

import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

// Scopes exist so that `--list` shows at a glance whether all three parts
// of this repository are covered. F73 was invisible for as long as it was
// because the one step in the queued entry looked complete on its own.
export const SCOPES = ['tooling', 'product', 'site']

// `passExit` lists every exit code that counts as a pass, and each entry
// that is not just [0] carries the reason inline, because an unexplained
// tolerated exit code is how a gate becomes a no-op.
export const CHECKS = [
  {
    id: 'tooling-suites',
    scope: 'tooling',
    title: 'Tooling unit suites',
    // Resolved at run time rather than hardcoded: the suite count has gone
    // 34 -> 47 since PWC-15 was written, and a list in a file would be the
    // next thing to go stale (finding F75).
    argv: () => ['node', '--test', ...toolingSuites()],
    passExit: [0],
  },
  {
    id: 'product-typecheck',
    scope: 'product',
    title: 'Product typecheck (ursa-major)',
    cwd: 'ursa-major',
    needsNodeModules: 'ursa-major',
    // The binary, not just the directory. See needsBin below.
    needsBin: 'tsc',
    // `--no-install` is load-bearing and not tidiness: without it a missing
    // local binary makes npx FETCH AND RUN a package of that name from the
    // public registry. Measured 2026-11-09, in this check: it printed
    // `the following package was not found and will be installed: tsc@2.0.4`
    // and executed it.
    argv: () => ['npx', '--no-install', 'tsc', '--noEmit'],
    passExit: [0],
  },
  {
    id: 'product-suites',
    scope: 'product',
    title: 'Product unit suites (ursa-major, vitest)',
    cwd: 'ursa-major',
    needsNodeModules: 'ursa-major',
    needsBin: 'vitest',
    argv: () => ['npx', '--no-install', 'vitest', 'run'],
    passExit: [0],
  },
  {
    id: 'site-example-record',
    scope: 'site',
    title: 'Site: example record contract',
    cwd: 'ursa-minor',
    argv: () => ['node', '--no-warnings=MODULE_TYPELESS_PACKAGE_JSON', 'scripts/check-example-record.mjs'],
    passExit: [0],
  },
  {
    id: 'site-index-contract',
    scope: 'site',
    title: 'Site: index contract',
    cwd: 'ursa-minor',
    argv: () => ['node', '--experimental-strip-types', '--no-warnings', 'scripts/check-index-contract.mjs'],
    passExit: [0],
  },
  {
    id: 'site-address-route',
    scope: 'site',
    title: 'Site: address route',
    cwd: 'ursa-minor',
    argv: () => ['node', '--experimental-strip-types', '--no-warnings', 'scripts/check-address-route.mjs'],
    passExit: [0],
  },
  {
    id: 'ledger-contract',
    scope: 'tooling',
    title: 'Ledger contract',
    argv: () => ['node', 'tools/ledger/check.mjs'],
    // 2 is an owner-held violation, which no seat may legally repair, and
    // `main` carries some today. A job that goes red on a line no branch
    // can turn green is one every seat learns to ignore. PWC-15 states
    // this and it is the one piece of its exit semantics carried verbatim.
    passExit: [0, 2],
  },
  {
    id: 'register-ids',
    scope: 'tooling',
    title: 'Register identifiers',
    // Added 2026-11-02 by security run m, and the reason is this file's own
    // board item: two register gates existed in `tools/registers/` and were
    // named in no gate list, so nothing ran them. That is the item's thesis
    // one layer in, a gate built and then not run, and it cost this seat a
    // duplicate finding identifier the same day (F80).
    //
    // Single-ref on purpose, which is a real limit and not an oversight. The
    // tool's `--heads` mode fetches every open pull request head and is what
    // catches two branches allocating the same identifier before either
    // merges; it also needs network and a token, so it belongs on a schedule
    // rather than in a per-change gate. This form catches a collision in the
    // tree being merged, which is the one a merge can actually introduce.
    argv: () => ['node', 'tools/registers/check-ids.mjs', '--no-fetch', '--base', 'HEAD'],
    // Same semantics as the ledger contract below, from the same reasoning:
    // `tools/registers/id-verdict.mjs` exits 1 for a collision a seat may
    // repair and 2 when every remaining one is the owner's. `main` carries two
    // of the owner's today, ADR-005 and ADR-006.
    passExit: [0, 2],
  },
  {
    id: 'register-closure',
    scope: 'tooling',
    title: 'Production dependency closure',
    argv: () => ['node', 'tools/registers/check-closure.mjs'],
    passExit: [0],
  },
  {
    id: 'root-entries',
    scope: 'tooling',
    title: 'Root-entry allowlist',
    argv: () => ['node', 'tools/root-entries.mjs'],
    passExit: [0],
  },
  {
    id: 'redaction-tree',
    scope: 'tooling',
    title: 'Redaction, working tree',
    argv: () => ['node', 'scripts/redaction-check.mjs'],
    passExit: [0],
  },
  {
    id: 'secret-scan-tree',
    scope: 'tooling',
    title: 'Credential scan, working tree',
    // Working tree only, deliberately. The all-refs mode is `--history`,
    // it reads thousands of blobs and takes minutes, so it belongs on a
    // schedule and not on a pull request.
    argv: () => ['node', 'tools/secret-scan.mjs'],
    passExit: [0],
  },
  {
    id: 'image-metadata',
    scope: 'tooling',
    title: 'Image text channels',
    argv: () => ['node', 'tools/image-metadata.mjs'],
    passExit: [0],
  },
  {
    id: 'secret-print-tree',
    scope: 'tooling',
    title: 'Secret-print shapes, working tree',
    // Added 2026-11-09, and the reason is the same one that added
    // `register-ids` a week earlier: this seat landed HQ's vendored L-X5
    // checker with three runners beside it and registered none of them, so
    // the only thing that ever ran them was a seat who remembered to. That
    // is this file's own board item committed by the seat that filed it.
    //
    // The sweep and not the bare checker. `tools/check-secret-print.py`'s
    // default scan roots are HQ's five, three of which Ursa does not have,
    // and a missing root is skipped in silence, so the bare command reads
    // as repository-wide while covering 24 files. The sweep builds Ursa's
    // list and passes the baseline. Both of those are upstream defects this
    // seat reported, and HQ built the fix for both in the shared file with
    // five tests.
    //
    // Corrected 2026-11-09, because the sentence here said the fix was in a
    // pull request of HQ's and that the wrapper comes out at the next
    // re-vendor. That pull request (alexandra-systems#653) was closed while
    // still a draft, so HQ main's newest commit touching the checker is
    // still 08ba7f53, the one this repository vendored from, and both
    // defects are live here. Measured, not assumed: the bare command exits 1
    // on 68 lines of findings this repository's own baseline already
    // accepts, and names none of its three missing roots. The wrapper stays
    // until a re-vendor from HQ main actually carries the fix, which
    // `secret-print-dump-holes` below is what notices.
    argv: () => ['bash', 'tools/secret-print-sweep.sh'],
    passExit: [0],
  },
  {
    id: 'secret-print-dump-holes',
    scope: 'tooling',
    title: 'Env-dump spellings the vendored checker misses',
    // Added 2026-11-09. The checker's X5-ENVDUMP arm is the one rule in that
    // file with L-X5's four recorded incidents behind it, and it catches the
    // dump spelled `env | ...` while missing it spelled `printenv | ...`,
    // `env > file`, or `declare -p | ...`. The fix belongs in the shared
    // file and not here, which is this seat's own argument and is why
    // nothing in `tools/check-secret-print.py` is edited by this branch.
    //
    // What this check is for is the other half. The two layout defects this
    // seat reported upstream were acknowledged, built, and then lost when
    // their pull request was closed as a draft, and no file here would ever
    // have said so. So each miss is pinned as a row, with four caught
    // controls beside it, and the check fails in both directions: a miss
    // that starts being caught means re-vendor and delete the row, and a
    // control that starts being missed means a re-vendor dropped a rule.
    argv: () => ['python3', 'tools/secret-print-dump-holes.py'],
    passExit: [0],
  },
  {
    id: 'secret-print-exempt',
    scope: 'tooling',
    title: 'Secret-print exemptions are decided and in date',
    // The sweep above is green only because 32 findings are suppressed. This
    // asks whether anybody is still on the hook for having argued for them.
    // It is a separate check and not a flag on the sweep, because the two
    // fail for unrelated reasons: the sweep goes red when the tree gains a
    // defect, this goes red when an argument about the tree comes due.
    argv: () => ['python3', 'tools/secret-print-exemptions.py'],
    passExit: [0],
  },
  {
    id: 'secret-print-suite',
    scope: 'tooling',
    title: 'Secret-print checker suite (vendored, 74 tests)',
    // `toolingSuites()` resolves `*.test.mjs`, so this Python suite was
    // reachable by nothing. The runner wrapper rather than unittest
    // directly: two of the 74 tests assert against HQ's directory layout
    // and the wrapper holds that knowledge, including the half that fails
    // when either of them starts passing.
    argv: () => ['python3', 'tools/secret-print-tests.py'],
    passExit: [0],
  },
  {
    id: 'capture-provenance',
    scope: 'tooling',
    title: 'Capture provenance (record surfaces name their store)',
    // Reads committed text, never a pixel and never a chunk, so it composes
    // with `image-metadata` rather than overlapping it. The question is which
    // store a screenshot was rendering, which is the only part of redaction
    // standard surface 5 that a gate can answer at all.
    argv: () => ['node', 'tools/capture-provenance.mjs'],
    passExit: [0],
  },
  {
    id: 'board-message-rules',
    scope: 'tooling',
    title: 'Board message rules',
    argv: () => ['node', 'tools/board/check.mjs', '--self-test'],
    passExit: [0],
  },
  {
    id: 'code-census',
    scope: 'tooling',
    // Registered on 2026-11-09 by the seat that wrote it on 2026-11-09 and did
    // not register it. It had a suite, so `tooling-suites` proved its RULES
    // worked, and nothing ran it over the tree, so its ANSWER about the tree
    // was never read. That is the same shape as the gate below and as
    // Ursa/exo's 874: a guard whose rules are tested and whose verdict nobody
    // asks for is outside the path. Clean at this commit, which is how it
    // could be added without a repair.
    title: 'Code census (no defect code is watched by nothing)',
    argv: () => ['node', 'tools/gates/code-census.mjs'],
    passExit: [0],
  },
  {
    id: 'import-effects',
    scope: 'tooling',
    // In the path on purpose. Ursa/exo measured on 2026-11-09 that the board's
    // message rules, a guard nothing invoked, were bypassed in 874 of 1803
    // stored rows, and its sentence back was that a guard outside the path does
    // not merely fail to prevent, it fails to learn. This gate detects a class
    // whose previous guard was a paragraph in a file header, which one seat had
    // read before writing the sixth instance of the defect.
    title: 'Import effects (no module runs its program when imported)',
    argv: () => ['node', 'tools/gates/import-effects.mjs'],
    passExit: [0],
  },
  {
    id: 'tmpdir-leak',
    scope: 'tooling',
    // In the path because the leak it watches is invisible from inside the
    // lane that causes it. The host's reclaimer sweeps /tmp on a six-hour
    // floor, so this class never accumulates into anything a daily reading
    // can see; it presents as a disk that is full again, and it presents to
    // OTHER seats as their browser and package installs being evicted
    // mid-run. One file of this repository's suite took the shared host to 95
    // per cent on 2026-11-09 at 91M a run, and the seat that found it was HQ's
    // engineer reading a disk, not any gate of ours.
    title: 'Temp-dir leaks (no test file joins the set that removes nothing)',
    argv: () => ['node', 'tools/testing/tmpdir-leak.mjs'],
    passExit: [0],
  },
  {
    id: 'verdict-shapes',
    scope: 'tooling',
    title: 'Verdict shapes',
    argv: () => ['node', 'tools/gates/enumerate-verdicts.mjs', '--census'],
    passExit: [0],
  },
  {
    id: 'gate-registry',
    scope: 'tooling',
    title: 'Gate registry (no gate we built is reached by nothing)',
    // This file's own completeness, asked of the tree instead of of a reader.
    // Four entries above record the same history in their own comments: a gate
    // was built, nobody registered it, and the only thing that ever ran it was
    // a seat who remembered. That is a method which works as often as somebody
    // looks. Measured when this was added: 60 candidates and 16 run by a check,
    // so 44 reached by nothing; six of those are real tree gates that run clean
    // and offline, and they are the six entries below this one. Adding this file
    // makes 61, because the registry is a candidate for its own sweep.
    argv: () => ['node', 'tools/gates/gate-registry.mjs'],
    passExit: [0],
  },
  {
    id: 'prompt-slots',
    scope: 'tooling',
    title: 'Prompt slots (untrusted event text cannot step out of its fence)',
    argv: () => ['node', 'tools/prompt-slots.mjs'],
    // Registered 2026-11-09 by security run 13, closing F116. It was excused
    // as red-on-main until today for a real reason: every finding it reports
    // is in .github/workflows/, which no seat here may edit, and the tool had
    // no exit code for that, so registering it meant either a permanent red
    // or a green tick next to eleven open slots.
    //
    // It has one now. 2 is the owner's standing prompt-layer backlog, which
    // is what `main` carries. 1 is an untrusted interpolation inside a
    // `run:` block, which is shell injection rather than a prompt-layer
    // finding, and there are none today, so that code is green now and fires
    // on a regression a change introduces. 3 is an unreadable workflow
    // directory, which is no verdict at all and so is not tolerated here.
    passExit: [0, 2],
  },
  {
    id: 'fetch-exec',
    scope: 'tooling',
    title: 'Fetch-and-execute census (every registry fetch is deliberate or declared)',
    argv: () => ['node', 'tools/gates/fetch-exec.mjs'],
    // Added 2026-11-09 by security run 13, generalising F113. That finding
    // was a flag on one call site in THIS file, and the test that closed it
    // asserts over this file's own CHECKS array, so it could see neither the
    // second call site in tools/stack/integrate.sh (F122) nor the surface
    // that actually matters, which is a charter sentence telling a future
    // seat to write a call site. HQ's exo-centralizer seat measured that
    // class upstream and its note is why the gate reads instructions as well
    // as code.
    //
    // 2 is tolerated on exactly the ground `ledger-contract` and
    // `register-ids` tolerate it: the one finding left on `main` is in
    // prompts/, which no seat here may edit, and a job that goes red on a
    // line no branch can turn green is one every seat learns to ignore. The
    // gate separates that from a seat-repairable finding, which is 1, so
    // tolerating 2 does not tolerate a new one. tools/prompt-slots.mjs is
    // registered red-on-main for lacking this exact distinction.
    passExit: [0, 2],
  },
  {
    id: 'excuse-control',
    scope: 'tooling',
    title: 'Excused gates: the reason is executed, not read',
    // The layer above `gate-registry`. That gate requires every unreached
    // candidate to carry a reason under one of ten kinds; this one EXECUTES
    // the reason for the largest kind. `needs-token` claims the file answers
    // nothing without a credential, so the control is to run it with the
    // credential removed and require that it does not report clean.
    //
    // Two of the fourteen were false when this was added, in the two ways a
    // claim of that shape can be false: `tools/board/bypass.mjs --audit`
    // exited 0 over a window that answered 401, and
    // `tools/stack/repair-pending.mjs` exited 1, its own code for a finding
    // about the queue, from an uncaught `gh` failure. Both are fixed in the
    // same pull request, so this arrives green rather than as a red gate
    // every seat learns to ignore.
    //
    // Runs here and not on a schedule because its subject is this tree and
    // its environment is the one a pull request gate actually gets: it
    // REMOVES the credentials, so it needs none, and on a runner with no
    // network every row still refuses.
    argv: () => ['node', 'tools/gates/excuse-control.mjs', '--gate'],
    passExit: [0],
  },
  {
    id: 'ledger-attributes',
    scope: 'tooling',
    title: 'Merge attribute declarations',
    // Reached by nothing until now, and not for want of a plan:
    // `tools/ledger/ci/ledger-gate.yml` has been queueing this gate and
    // `ledger-closures` below with HQ, in a file under `.github/workflows/`
    // that only HQ may write. That is the bottleneck this whole file exists to
    // pay once instead of once per gate, so the two move here.
    argv: () => ['node', 'tools/ledger/check-attributes.mjs'],
    passExit: [0],
  },
  {
    id: 'ledger-closures',
    scope: 'tooling',
    title: 'Ledger closure markers',
    // Same seat/owner exit split as `ledger-contract`, from the same file's
    // reasoning, and `main` carries the owner's today: this exits 2 on the
    // current tree over closure markers in `docs/ideas.md` and `docs/runs/`.
    argv: () => ['node', 'tools/ledger/check-closures.mjs'],
    passExit: [0, 2],
  },
  {
    id: 'doc-model-drift',
    scope: 'tooling',
    title: 'Documented-model drift',
    // Board rows are an OPTIONAL extra corpus here, taken only when
    // BOARD_API_URL and BOARD_RUNTIME_TOKEN are both set, and appended rather
    // than substituted, so it cannot clear a finding the committed corpus
    // found. A runner without those variables measures less and never more,
    // which is why this is registered with no credential of its own.
    argv: () => ['node', 'tools/doc-model/check.mjs'],
    passExit: [0],
  },
  {
    id: 'instant-lint',
    scope: 'tooling',
    title: 'Timestamp handling (tools/instant.mjs lint, every code decided)',
    // The gate and not `tools/instant-sweep.mjs`, which reports the same
    // findings and returns 0 on all of them. Registering the sweep would have
    // put a green tick next to a count nobody decided.
    argv: () => ['node', 'tools/instant-gate.mjs'],
    passExit: [0],
  },
  {
    id: 'vendored-register',
    scope: 'tooling',
    title: 'Vendored register merger matches the recorded hash',
    // Offline by construction: it compares the vendored bytes against a
    // recorded sha256 in this repository rather than asking HQ.
    argv: () => ['node', 'tools/registers/check-vendored.mjs'],
    passExit: [0],
  },
  {
    id: 'env-facts-audit',
    scope: 'tooling',
    title: 'Host facts: every class is cited and every citation resolves',
    // The gate the facts table itself names, in the one line every charter
    // carries: `--audit` fails when a charter stops citing it. Offline, 481ms,
    // and it was the last of sixty gate candidates reached by nothing.
    argv: () => ['node', 'tools/seat/env-facts.mjs', '--audit'],
    passExit: [0],
  },
  {
    id: 'clone-integrity',
    scope: 'tooling',
    title: 'Clone integrity',
    // This one guards the others rather than the branch: several gates and
    // suites read history, and on a truncated graph they answer from it. So
    // on a shallow clone it is reported unrunnable and the whole run exits
    // 2, which is the honest answer. Running it there and calling the exit
    // 1 a gate failure would blame the branch for the runner's checkout.
    needsFullClone: true,
    argv: () => ['bash', 'tools/ensure-full-clone.sh', '--check'],
    passExit: [0],
  },
]

export function toolingSuites() {
  const out = spawnSync(
    'git',
    ['ls-files', '-z', '*.test.mjs'],
    { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 },
  )
  if (out.status !== 0) throw new Error(`git ls-files failed: ${out.stderr}`)
  return out.stdout.split('\0').filter(Boolean).sort()
}

// A check whose dependencies are absent is unrunnable, not passing. Kept as
// a pure function so the test suite can assert the classification without
// executing anything.
// `installedBins` defaults to none rather than to all. A caller that forgets
// it gets `unrunnable`, which is red; defaulting the other way would make a
// forgotten argument read as a passing check, and the bias has to run toward
// the refusal here for the same reason it does in the npx call above.
export function classify(check, { installedPackages, installedBins = [], skip, shallow }) {
  if (skip.includes(check.id)) return { state: 'skipped', why: 'named in --skip' }
  if (check.needsFullClone && shallow) {
    return {
      state: 'unrunnable',
      why: 'this clone is shallow, so this check would answer from a truncated graph; '
        + 'the workflow needs `actions/checkout` with `fetch-depth: 0`',
    }
  }
  if (check.needsNodeModules && !installedPackages.includes(check.needsNodeModules)) {
    return {
      state: 'unrunnable',
      why: `${check.needsNodeModules}/node_modules is absent, so this check cannot run; `
        + `run \`npm ci\` in ${check.needsNodeModules} first, or pass --skip=${check.id} to record it as unchecked`,
    }
  }
  // The directory is not the condition. A tree where `node_modules/` exists
  // and the binary does not passes the test above, and then the check runs
  // `npx <tool>`, which without `--no-install` FETCHES AND EXECUTES a
  // registry package of that name. That tree is not hypothetical: it is the
  // documented npm failure mode on this host, `exit 0 with no
  // node_modules/.bin` (node tools/seat/env-facts.mjs,
  // npm-cache-is-a-shared-home-path), and this run hit it while an install
  // was still in flight. So the condition is read off the binary the check
  // actually needs. Same correction as the one made to
  // EXPECTED_ABSENT_FIXTURES today: a condition keyed on a name near the
  // thing, rather than on the thing.
  if (check.needsBin && !installedBins.includes(`${check.needsNodeModules}/${check.needsBin}`)) {
    return {
      state: 'unrunnable',
      why: `${check.needsNodeModules}/node_modules/.bin/${check.needsBin} is absent, so this `
        + 'check cannot run. The directory exists, so the install is partial rather than '
        + `missing; re-run \`npm ci\` in ${check.needsNodeModules}, or pass --skip=${check.id} `
        + 'to record it as unchecked. It is reported unrunnable rather than attempted because '
        + `\`npx ${check.needsBin}\` on a tree without it resolves against the public registry`,
    }
  }
  return { state: 'runnable', why: '' }
}

export function parseArgs(argv) {
  const opts = { list: false, skip: [], only: [] }
  for (const a of argv) {
    if (a === '--list') opts.list = true
    else if (a.startsWith('--skip=')) opts.skip.push(...a.slice(7).split(',').filter(Boolean))
    else if (a.startsWith('--only=')) opts.only.push(...a.slice(7).split(',').filter(Boolean))
    else throw new Error(`unknown argument: ${a}`)
  }
  const ids = CHECKS.map((c) => c.id)
  for (const id of [...opts.skip, ...opts.only]) {
    if (!ids.includes(id)) throw new Error(`unknown check id: ${id}`)
  }
  return opts
}

// Exit 2 beats exit 1: an unrunnable check means the run is not a verdict on
// the branch at all, which the caller needs to be able to tell apart from a
// branch that genuinely failed a gate.
export function exitCodeFor(results) {
  if (results.some((r) => r.state === 'unrunnable')) return 2
  if (results.some((r) => r.state === 'failed')) return 1
  return 0
}

function installedPackages() {
  return ['ursa-major', 'ursa-minor'].filter((p) => existsSync(path.join(ROOT, p, 'node_modules')))
}

// Which declared binaries actually exist, as `<package>/<bin>`. Read off the
// filesystem here, so `classify` stays a pure function of what it is handed
// and its suite does not depend on whether this sandbox happens to have run
// `npm ci`.
function installedBins() {
  return CHECKS.filter((c) => c.needsBin).map((c) => `${c.needsNodeModules}/${c.needsBin}`)
    .filter((k) => existsSync(path.join(ROOT, k.split('/')[0], 'node_modules', '.bin',
      k.split('/')[1])))
}

function isShallow() {
  const out = spawnSync('git', ['rev-parse', '--is-shallow-repository'], { cwd: ROOT, encoding: 'utf8' })
  return out.stdout.trim() === 'true'
}

function main(argv) {
  let opts
  try {
    opts = parseArgs(argv)
  } catch (e) {
    process.stderr.write(`ci-checks: ${e.message}\n`)
    return 2
  }

  const selected = opts.only.length ? CHECKS.filter((c) => opts.only.includes(c.id)) : CHECKS

  if (opts.list) {
    for (const scope of SCOPES) {
      const inScope = selected.filter((c) => c.scope === scope)
      process.stdout.write(`${scope} (${inScope.length})\n`)
      for (const c of inScope) process.stdout.write(`  ${c.id.padEnd(22)} ${c.title}\n`)
    }
    return 0
  }

  const installed = installedPackages()
  const bins = installedBins()
  const shallow = isShallow()
  const results = []

  for (const check of selected) {
    const { state, why } = classify(check, {
      installedPackages: installed, installedBins: bins, skip: opts.skip, shallow,
    })
    if (state !== 'runnable') {
      process.stdout.write(`\n=== ${check.title} [${state}] ===\n${why}\n`)
      results.push({ ...check, state, why, exit: null })
      continue
    }
    const argvForCheck = check.argv()
    process.stdout.write(`\n=== ${check.title} ===\n$ ${argvForCheck.join(' ')}\n`)
    const run = spawnSync(argvForCheck[0], argvForCheck.slice(1), {
      cwd: check.cwd ? path.join(ROOT, check.cwd) : ROOT,
      stdio: 'inherit',
    })
    // A signal or a spawn error leaves `status` null. That is unrunnable,
    // not a pass, and reading it as 0 is the exact failure this file is
    // written to prevent.
    if (run.status === null) {
      results.push({
        ...check,
        state: 'unrunnable',
        why: run.error ? `could not spawn: ${run.error.message}` : `killed by signal ${run.signal}`,
        exit: null,
      })
      continue
    }
    results.push({
      ...check,
      state: check.passExit.includes(run.status) ? 'passed' : 'failed',
      why: '',
      exit: run.status,
    })
  }

  process.stdout.write('\n=== summary ===\n')
  for (const scope of SCOPES) {
    const inScope = results.filter((r) => r.scope === scope)
    if (!inScope.length) continue
    process.stdout.write(`${scope}:\n`)
    for (const r of inScope) {
      const detail = r.state === 'passed' || r.state === 'failed' ? `exit ${r.exit}` : r.why
      process.stdout.write(`  ${r.state.padEnd(10)} ${r.id.padEnd(22)} ${detail}\n`)
    }
  }
  const code = exitCodeFor(results)
  const counts = results.reduce((a, r) => ({ ...a, [r.state]: (a[r.state] || 0) + 1 }), {})
  process.stdout.write(
    `\n${results.length} check(s): ${SCOPES.map((s) => `${results.filter((r) => r.scope === s).length} ${s}`).join(', ')}. `
    + `${Object.entries(counts).map(([k, v]) => `${v} ${k}`).join(', ')}. exit ${code}\n`,
  )
  if (code === 2) {
    process.stdout.write(
      'At least one check could not be run, so this is not a verdict on the branch.\n',
    )
  }
  return code
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
  process.exit(main(process.argv.slice(2)))
}
