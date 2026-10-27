/**
 * Prove that `check-redaction.mjs` can still fail, and can still refuse.
 *
 * A checker that reads its rules out of another file has two ways to go
 * quietly wrong, and both of them print a passing result. It can read
 * zero rules and report a clean tree. It can read the rules and then
 * drop every hit through a broken allowlist. Neither is visible from a
 * repository that is already clean, which is the state this repository
 * is in almost all of the time, so the real tree cannot calibrate it.
 *
 * ITS FIXTURES ARE WRITTEN AT RUN TIME AND NEVER COMMITTED. A fixture
 * for this tool has to contain the three things the gate refuses, so
 * committing one makes the gate red on the repository that holds the
 * tool for making the gate green. Every fixture below is built under
 * `tmpdir()` from pieces assembled in code, and the assembly is why
 * none of the three patterns appears as a literal in this file.
 *
 * usage: node check-redaction.mjs
 * exit 0 on pass, 1 on fail, and it says which expectation missed.
 */
import { spawnSync } from 'node:child_process'
import { mkdtempSync, mkdirSync, writeFileSync, copyFileSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const TOOL = join(here, '..', 'check-redaction.mjs')
const GATE = join(here, '..', '..', '..', '..', '.github/workflows/redaction-gate.yml')

// Assembled, so this file is not itself a gate hit.
const hex = (n) => '0123456789abcdef'.repeat(4).slice(0, n)
const uuid = [hex(8), hex(4), hex(4), hex(4), hex(12)].join('-')
const homePath = ['', 'home', 'someuser', 'notes'].join('/')
const slug = '.claude' + '/projects/' + '-Users-someone-Desktop'
const allowedRunner = ['', 'home', 'runner', 'work', 'x'].join('/')
const allowedPlaceholder = '/Users/' + '<you>' + '/x'

const root = mkdtempSync(join(tmpdir(), 'redaction-selftest-'))
const run = (r) => {
  const p = spawnSync('node', [TOOL, '--root', r], { encoding: 'utf8' })
  return { code: p.status, out: (p.stdout || '') + (p.stderr || '') }
}
const gateInto = (r) => { mkdirSync(join(r, '.github/workflows'), { recursive: true }); copyFileSync(GATE, join(r, '.github/workflows/redaction-gate.yml')) }

let bad = 0
const want = []
const check = (what, cond, detail = '') => { want.push(what); if (!cond) bad++; console.log(`${cond ? 'ok  ' : 'FAIL'}  ${what}${detail ? '  — ' + detail : ''}`) }

try {
  // 1. A clean tree passes.
  const clean = join(root, 'clean'); mkdirSync(clean); gateInto(clean)
  writeFileSync(join(clean, 'a.txt'), 'nothing private here\n')
  let r = run(clean)
  check('clean tree exits 0', r.code === 0, r.out.trim().split('\n').pop())

  // 2. Each of the three rules fires, one fixture at a time, so a rule
  //    that stopped working cannot hide behind another rule's hit.
  for (const [name, body] of [['home path', homePath + '/'], ['project slug', slug], ['session uuid', uuid]]) {
    const d = join(root, 'hit-' + name.replace(/\W/g, '')); mkdirSync(d); gateInto(d)
    writeFileSync(join(d, 'f.txt'), 'x ' + body + '\n')
    r = run(d)
    check(`${name} is caught`, r.code === 1 && /1 hit/.test(r.out), r.out.trim().split('\n').pop())
  }

  // 3. The allowlist still drops what the gate drops. If it stopped,
  //    this tool would report hits the gate forgives and a run would
  //    "fix" a line that was never broken.
  const allowed = join(root, 'allowed'); mkdirSync(allowed); gateInto(allowed)
  writeFileSync(join(allowed, 'f.txt'), `a ${allowedRunner}\nb ${allowedPlaceholder}\n`)
  r = run(allowed)
  check('allowlisted paths are forgiven', r.code === 0, r.out.trim().split('\n').pop())

  // 4. A gate it cannot parse is a refusal, not a pass. This is the
  //    expectation the tool failed when it was first written: the rule
  //    regex was unanchored, so renaming `scan` to `noscan` still
  //    matched and the tool reported three rules and a clean tree.
  const broken = join(root, 'broken'); mkdirSync(broken); gateInto(broken)
  const yml = readFileSync(join(broken, '.github/workflows/redaction-gate.yml'), 'utf8')
  writeFileSync(join(broken, '.github/workflows/redaction-gate.yml'), yml.replace(/^(\s*)scan /gm, '$1noscan '))
  writeFileSync(join(broken, 'f.txt'), 'x ' + uuid + '\n')
  r = run(broken)
  check('an unparseable gate exits 2, not 0', r.code === 2, r.out.trim().split('\n').pop())

  // 5. No gate at all is also a refusal.
  const nogate = join(root, 'nogate'); mkdirSync(nogate)
  writeFileSync(join(nogate, 'f.txt'), 'x ' + uuid + '\n')
  r = run(nogate)
  check('a missing gate exits 2, not 0', r.code === 2, r.out.trim().split('\n').pop())

  console.log(bad ? `\n${bad} of ${want.length} expectations failed` : `\nall ${want.length} expectations hold`)
} finally {
  rmSync(root, { recursive: true, force: true })
}
process.exit(bad ? 1 : 0)
