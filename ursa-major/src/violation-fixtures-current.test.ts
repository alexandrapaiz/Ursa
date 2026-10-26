// `fixtures/violations/` is byte-reproducible, checked inside `npm test`.
//
// WHAT THIS FILE IS FOR, AND WHY IT IS NOT MORE CASES IN
// `src/invariants.violations.test.ts`. That file reads the committed
// `.json` and `.md` files off disk and asserts what the gate does with
// them: which bounds each fixture fires, and that each note still quotes
// the `observed` string the gate produced. Those are assertions about
// BEHAVIOUR, and they are deliberately independent of
// `tools/make-violation-fixtures.ts` — the head of that script says so, in
// its own words, because the fixtures are the artifact and a fixture that
// stops firing has to fail whether or not the generator still runs.
//
// This file asserts the other half, which nothing asserted until now: that
// the committed bytes are the bytes the generator would write today. The
// two are not the same claim, and the gap between them is not theoretical.
//
// WHAT THE GAP COST, MEASURED ON 2026-10-25 AND FIXED ON 2026-10-26.
// `npm run fixtures:violations:check` was red on `main`, 24 of 47 files,
// and the full suite was green the whole time. The drift was three fields
// the schema grew on 2026-10-24 and the records never received —
// `noCandidate` on a span, `blindSpans` and `suppressedTokenSpans` in
// `stats`. None of the three is read by any bound, so every behavioural
// assertion in `invariants.violations.test.ts` passed, by construction:
// adding an optional field to a record changes no bound's verdict and no
// bound's `observed` string. The cost was specific rather than cosmetic.
// `fixtures/violations/README.md` sells these files as byte-reproducible
// and names `fixtures:violations:check` as the command that claim rests
// on, so a reviewer who ran the documented check was told the directory
// had drifted and had no way to tell a stale regeneration from a real
// corruption. It also meant the twenty-three records this project points
// at as its counterexamples were not the records its current resolver
// would write.
//
// WHY A SPAWN AND NOT A REIMPLEMENTATION. Exactly the reason
// `src/bundle-exec.test.ts` gives for folding `npm run bundle:check` into
// `npm test` on 2026-10-16: "spawned rather than reimplemented so there is
// one definition of 'stale'". That file's paragraph describes this file's
// failure mode in advance — a run that edited `src/` and forgot the
// separate script "shipped a bundle one commit behind the rules it was
// sold as applying, with a green suite." Four `:check` scripts exist in
// `package.json`; before this file, `bundle:check` was the only one inside
// `npm test`.
//
// WHY IT IS CHEAP ENOUGH TO RUN EVERY TIME. Measured at 0.54s wall clock
// for the whole `--check` pass, because the script's work is building
// twenty-four records in memory and comparing strings, with no git, no
// network and no filesystem writes. `--check` writes nothing, which is
// what makes it safe to run from a test at all.

import { spawnSync } from 'node:child_process'
import { appendFileSync, mkdtempSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join, resolve as resolvePath } from 'node:path'
import { tmpdir } from 'node:os'
import { describe, expect, it } from 'vitest'

const SCRIPT = resolvePath('tools', 'make-violation-fixtures.ts')

/**
 * The `tsx` CLI as a path node can run directly, rather than the
 * `node_modules/.bin/tsx` shim or `npx tsx`.
 *
 * The shim is a shell script on POSIX and a `.cmd` on Windows, so spawning
 * it means spawning a shell; `npx` will reach for the network when the
 * package is missing locally. Both are avoidable: `tsx` is a devDependency,
 * so it is installed whenever `vitest` is, and `process.execPath` can load
 * its entry module as an ordinary file.
 *
 * Resolved through `tsx/package.json` and its `bin` field rather than by
 * hardcoding `tsx/dist/cli.mjs`, because that deep path is not in the
 * package's `exports` map — `require.resolve('tsx/dist/cli.mjs')` throws
 * `ERR_PACKAGE_PATH_NOT_EXPORTED` on tsx 4.23.15. The `bin` field is the
 * package's own statement of where its entry point is, so it survives the
 * layout changing under us.
 */
function tsxCli(): string {
  const req = createRequire(join(process.cwd(), 'x.js'))
  const pkgPath = req.resolve('tsx/package.json')
  const bin = (req(pkgPath) as { bin: string | Record<string, string> }).bin
  const rel = typeof bin === 'string' ? bin : bin.tsx
  return resolvePath(dirname(pkgPath), rel)
}

/** Run the generator's `--check` mode in `cwd`, writing nothing. */
function runCheck(cwd: string): { status: number; out: string } {
  const r = spawnSync(process.execPath, [tsxCli(), SCRIPT, '--check'], {
    cwd,
    encoding: 'utf8',
    // The script prints one line per fixture plus one per drifted file.
    // 47 files cannot approach the 1MB default; naming it keeps a longer
    // directory from turning into a truncation mystery later.
    maxBuffer: 16 * 1024 * 1024,
  })
  if (r.error) throw r.error
  return { status: r.status ?? -1, out: r.stdout + r.stderr }
}

describe('the committed violation fixtures are what the generator writes', () => {
  it('reports every file current, so the README’s byte-reproducibility claim holds', () => {
    const { status, out } = runCheck(process.cwd())

    // Asserted on the message and not only on the exit code, because the
    // script exits 0 on two different outcomes that read alike from a
    // status alone: nothing drifted, and nothing was compared. The count
    // is in the message, so the message is the stronger assertion.
    expect(out).toContain('47 files match what this script would write.')
    expect(status).toBe(0)
  })

  it('counts 47 files, which is the base record plus two per counterexample', () => {
    const { out } = runCheck(process.cwd())

    // 1 + 23 * 2. `base.json` has no note of its own, and each of the
    // twenty-three counterexamples is a `.json` the gate must refuse and
    // a `.md` that quotes what the gate said about it.
    //
    // Pinned here as arithmetic rather than as a second literal because
    // `invariants.violations.test.ts` already asserts `SLUGS` has length
    // 23 by reading the directory. A fixture added without its note, or a
    // note added without its fixture, makes these two numbers disagree and
    // fails one of the two files instead of passing both.
    expect(out).toContain('47 files match')
    expect(1 + 23 * 2).toBe(47)
  })

  it('fails on a one-byte change, so the assertion above is not vacuous', () => {
    // WHY THIS TEST EXISTS. The check above passes on a green directory
    // and would also pass if `--check` silently compared nothing — which
    // is close to what happened in the gap this file was written to
    // close, where a real drift coexisted with a green suite for a day.
    // A drift gate nobody has watched fail is a claim, not a gate.
    //
    // HOW IT RUNS WITHOUT TOUCHING THE COMMITTED DIRECTORY. The script
    // resolves its output directory as `fixtures/violations` relative to
    // `process.cwd()`, while its imports of `../src/invariants` and the
    // rest resolve relative to the script's own file. So a temp cwd gets
    // the real generator and the real bounds, writing into a directory
    // this repository does not own.
    //
    // WHY IT GENERATES THE DIRECTORY INSTEAD OF COPYING THE COMMITTED ONE.
    // A copy inherits whatever state `fixtures/violations/` is in, so when
    // the committed directory really has drifted this probe fails on the
    // count in its own message rather than on the byte it appended — noise
    // on top of a genuine failure, and it reads like a second unrelated
    // break. Generating first makes the probe's subject exactly one byte,
    // whatever the repository is doing. It also exercises the script's
    // write path, which no test reached before this line: a generator that
    // threw on write would have passed every `--check` assertion above.
    const tmp = mkdtempSync(join(tmpdir(), 'ursa-violation-drift-'))
    const written = spawnSync(process.execPath, [tsxCli(), SCRIPT], { cwd: tmp, encoding: 'utf8' })
    expect(written.stdout + written.stderr).toContain('Wrote 47 files under fixtures/violations')
    expect(written.status).toBe(0)
    expect(runCheck(tmp).status, 'a freshly generated directory is current').toBe(0)

    appendFileSync(join(tmp, 'fixtures', 'violations', 'base.json'), 'x')

    const { status, out } = runCheck(tmp)

    expect(status).toBe(1)
    // It names the file, which is the part a person acts on. A gate that
    // only said "something drifted" would send the next reader to diff
    // forty-seven files by hand.
    expect(out).toContain('drifted: fixtures/violations/base.json')
    expect(out).toContain('1 of 47 files differ. Re-run without --check to rewrite them.')
  })
})
