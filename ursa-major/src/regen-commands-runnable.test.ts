// Every literal command `tools/regen.ts` prints, resolved against the
// directory a reader is standing in when it arrives.
//
// WHY THIS IS A SEPARATE FILE FROM `regen.test.ts`. That file opens by
// saying its subject is asserted "so no build, git repository or clock is
// involved", and it is right to: the state table is a pure function and
// its tests should stay that way. The property here is the opposite kind.
// Whether `bash ../tools/ensure-full-clone.sh` is a command that runs is
// not a fact about the string, it is a fact about the filesystem, so the
// only test that can hold it has to read the filesystem.
//
// WHY THE PROPERTY NEEDED A TEST OF ITS OWN. `regen.test.ts` already
// asserted the repair was named, with
// `expect(v.message).toContain('bash tools/ensure-full-clone.sh')`, and
// that assertion passed against a path that did not exist. It could not
// have failed: it compared the message to a copy of itself. The script
// lives at the repository root's `tools/`, an npm script runs with its
// cwd set to the package that declares it, and so the sentence `npm run
// regen:check` printed sent every reader to `bash:
// tools/ensure-full-clone.sh: No such file or directory`. Measured on
// 2026-10-26 in a `--depth 1` clone of this repository, which is the only
// checkout shape that reaches the message at all.
//
// So the generalisation, and the reason this file enumerates rather than
// spot-checks: a message naming a command is a promise, the promise is
// kept by the filesystem and the package manifest, and a test written in
// the same words as the message tests nothing. Every state of both
// functions is walked here, every `bash <path>` found in any of them is
// resolved, and every `npm run <script>` found in any of them is looked
// up in `package.json`. A new state that names a new command is covered
// the day it is written, without an edit to this file.

import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, statSync } from 'node:fs'
import { dirname, isAbsolute, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { regenCheckVerdict, regenStep } from '../tools/regen'

/** `ursa-major/`, the package directory, which is the cwd `npm run`
 *  gives a script declared in this `package.json` and therefore the cwd
 *  the reader of any message below is standing in. Derived from this
 *  file's own location so it survives the repository being checked out
 *  anywhere. */
const PKG = resolve(dirname(fileURLToPath(import.meta.url)), '..')

const A = 'f497687433163312eb6dfcd1bfd7d90e228504d06a931f9a7e6660af07eb6f32'
const B = 'a6580c3119dcb33a6ac2ae8ec6edcbea16a87bbd1b6b4ee4b02c1aa7ffb0d3a2'
const BLOCKED = 'this is a shallow clone, so the commits the index names are not all present'

/** One entry per state either function can reach, named by the state it
 *  reaches, so a failure says which message is wrong rather than which
 *  array index is. Kept exhaustive by the two assertions below it. */
const MESSAGES: ReadonlyArray<{ state: string; message: string }> = [
  ...([
    { ...{ rebuiltSha256: A, headSha256: B, historyBlocked: null, indexDrifted: [] } },
    { ...{ rebuiltSha256: A, headSha256: null, historyBlocked: null, indexDrifted: [] } },
    { ...{ rebuiltSha256: A, headSha256: A, historyBlocked: BLOCKED, indexDrifted: [] } },
    { ...{ rebuiltSha256: A, headSha256: A, historyBlocked: null, indexDrifted: ['docs/provenance/bundle-digests.json'] } },
    { ...{ rebuiltSha256: A, headSha256: A, historyBlocked: null, indexDrifted: [] } },
  ] as const).map((input) => {
    const step = regenStep(input)
    return { state: `regenStep/${step.state}`, message: step.message }
  }),
  ...([
    { bundle: 1, index: 0, historyBlocked: null },
    { bundle: 0, index: 1, historyBlocked: null },
    { bundle: 1, index: 1, historyBlocked: null },
    { bundle: 0, index: 0, historyBlocked: BLOCKED },
    { bundle: 0, index: 0, historyBlocked: null },
  ] as const).map((input, i) => {
    const v = regenCheckVerdict(input)
    return { state: `regenCheckVerdict/${i}/exit-${v.exit}/verified-${v.bothVerified}`, message: v.message }
  }),
]

/** Paths handed to `bash`, as they appear inside the message. Deliberately
 *  tolerant of the backticks the messages wrap commands in, because the
 *  backticks are for the reader and are not part of the command. */
function bashPaths(message: string): string[] {
  return [...message.matchAll(/bash\s+([^\s`'"]+)/g)].map((m) => m[1])
}

/** npm scripts the message tells the reader to run. `[\w:-]+` rather than
 *  `\S+` so a trailing backtick or full stop is not read as part of the
 *  script name. */
function npmScripts(message: string): string[] {
  return [...message.matchAll(/npm run ([\w:-]+)/g)].map((m) => m[1])
}

const SCRIPTS: Record<string, string> =
  JSON.parse(readFileSync(join(PKG, 'package.json'), 'utf8')).scripts ?? {}

describe('every command tools/regen.ts prints is runnable from the cwd it prints it in', () => {
  it('walks every state of both functions, so a new one cannot be added uncovered', () => {
    // The guard on the enumeration above. If a state is added to either
    // function and not to `MESSAGES`, the count moves and this fails,
    // which is the only way the rest of this file stays exhaustive.
    const states = MESSAGES.map((m) => m.state)
    expect(states.filter((s) => s.startsWith('regenStep/'))).toEqual([
      'regenStep/bundle-rebuilt',
      'regenStep/bundle-rebuilt',
      'regenStep/index-unverifiable',
      'regenStep/index-rewritten',
      'regenStep/clean',
    ])
    expect(states.filter((s) => s.startsWith('regenCheckVerdict/'))).toEqual([
      'regenCheckVerdict/0/exit-1/verified-false',
      'regenCheckVerdict/1/exit-1/verified-false',
      'regenCheckVerdict/2/exit-1/verified-false',
      'regenCheckVerdict/3/exit-0/verified-false',
      'regenCheckVerdict/4/exit-0/verified-true',
    ])
  })

  it('names at least one shell script and several npm scripts, so the resolvers below are not vacuous', () => {
    // Without this, a refactor that stopped printing commands altogether
    // would turn every assertion below into a loop over nothing and leave
    // the file green while deleting the only instruction the tool exists
    // to give.
    const bash = MESSAGES.flatMap((m) => bashPaths(m.message))
    const npm = MESSAGES.flatMap((m) => npmScripts(m.message))
    expect(bash.length).toBeGreaterThanOrEqual(2)
    expect(npm.length).toBeGreaterThanOrEqual(4)
    expect(Object.keys(SCRIPTS).length).toBeGreaterThan(0)
  })

  it.each(MESSAGES)('$state: every `bash <path>` it names exists and is a file', ({ message }) => {
    for (const path of bashPaths(message)) {
      const abs = isAbsolute(path) ? path : join(PKG, path)
      expect(existsSync(abs), `${message}\n  -> bash ${path} does not resolve from ursa-major/ (${abs})`).toBe(true)
      expect(statSync(abs).isFile(), `bash ${path} resolves to something that is not a file`).toBe(true)
    }
  })

  it.each(MESSAGES)('$state: every `npm run <script>` it names is declared in package.json', ({ message }) => {
    for (const script of npmScripts(message)) {
      expect(
        SCRIPTS[script],
        `${message}\n  -> npm run ${script} is not a script in ursa-major/package.json`,
      ).toBeDefined()
    }
  })

  it('the repair it names actually answers the condition it is printed for, run for real', () => {
    // The end-to-end half. The three assertions above prove the path
    // resolves; this proves the thing at the path is the right thing, by
    // running it in the one mode that writes nothing. `--check` exits 1
    // when a repair is needed and 0 when the clone is already complete,
    // so both are a pass here: what is being asserted is that the script
    // understands the question, not what this particular checkout's
    // answer is.
    const unverifiable = regenStep({
      rebuiltSha256: A, headSha256: A, historyBlocked: BLOCKED, indexDrifted: [],
    })
    const path = bashPaths(unverifiable.message)[0]
    expect(path).toBeDefined()

    let status = 0
    let out = ''
    try {
      out = execFileSync('bash', [path, '--check'], { cwd: PKG, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })
    } catch (e) {
      const err = e as { status?: number; stdout?: string; stderr?: string }
      status = err.status ?? -1
      out = `${err.stdout ?? ''}${err.stderr ?? ''}`
    }
    // 127 is the measured failure this file was written for: bash could
    // not find the script. 2 is the script's own "nothing here to repair",
    // which a checkout with no `origin` reaches and which is not a defect
    // in the message.
    expect([0, 1, 2], `bash ${path} --check from ursa-major/ exited ${status}\n${out}`).toContain(status)

    // The script has TWO outputs and which one is correct here depends on
    // the shape of the checkout, so the assertion is over the set rather
    // than over one member. On an incomplete clone `--check` exits 1 and
    // writes `ensure-full-clone: <fault>` per fault to STDERR; on a
    // complete one it exits 0 and writes `clone is complete: N commits,
    // M remote-tracking refs under origin/.` to STDOUT, with no prefix,
    // because `say()` does not prefix and `fail()` does.
    //
    // What this replaced was `expect(out).toContain('ensure-full-clone')`,
    // which only the first shape satisfies. That made this file's verdict
    // a property of the checkout, which is the exact defect the file
    // exists to catch, inverted: green on every seat sandbox, which
    // arrives `--depth 1 --single-branch`, and red the moment anyone runs
    // the repair the rest of this suite tells them to run. Measured
    // 2026-10-26 on a checkout repaired with `bash
    // tools/ensure-full-clone.sh`: `npx vitest run`, 993 tests, 1 failed,
    // and this was it.
    expect(
      out,
      `bash ${path} --check printed neither of the script's two outputs:\n${out}`,
    ).toMatch(/^(ensure-full-clone: |clone is complete: )/m)

    // The other half of what the old assertion was reaching for, kept and
    // made shape-independent: that the file at this path is THIS script
    // and not some other file that happens to tolerate `--check`. `--help`
    // prints the usage block out of the script's own header and exits 0 on
    // every checkout, so it names the script without asking the checkout
    // anything.
    const help = execFileSync('bash', [path, '--help'], { cwd: PKG, encoding: 'utf8' })
    expect(help, `bash ${path} --help did not identify the script:\n${help}`)
      .toContain('ensure-full-clone.sh')
  })
})
