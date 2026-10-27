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
import { deflateSync, crc32 } from 'node:zlib'
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

// A one pixel PNG carrying the home-path fixture in an uncompressed
// `tEXt` chunk. Built here for the same reason as every string above:
// committing an image that trips the gate would make the gate red on
// the repository that holds the tool for making it green. This is the
// only fixture in this file whose surface a `grep` of the tree cannot
// read, which is the whole point of expectations 6 and 7.
const pngChunk = (type, data) => {
  const t = Buffer.from(type, 'ascii')
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length)
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(Buffer.concat([t, data])) >>> 0)
  return Buffer.concat([len, t, data, crc])
}
const pngCarrying = (text) => {
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(1, 0); ihdr.writeUInt32BE(1, 4)
  ihdr[8] = 8; ihdr[9] = 2
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    pngChunk('IHDR', ihdr),
    pngChunk('tEXt', Buffer.concat([Buffer.from('Comment\0', 'ascii'), Buffer.from(text, 'ascii')])),
    pngChunk('IDAT', deflateSync(Buffer.from([0x00, 0xff, 0x00, 0x00]))),
    pngChunk('IEND', Buffer.alloc(0)),
  ])
}

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

  // 6. The tool follows the gate's grep flags rather than holding its
  //    own copy of them. Until 2026-10-27 the cluster was the literal
  //    `-rInE` in this tool while the patterns came from the gate, so
  //    these two expectations are the same expectation pointed in
  //    opposite directions: with `-I` in the gate the image is skipped,
  //    and with `-I` gone it is caught. A tool with a fixed opinion
  //    about binary files fails exactly one of them.
  const imgDir = (name, dropI) => {
    const d = join(root, name); mkdirSync(d); gateInto(d)
    if (dropI) {
      const f = join(d, '.github/workflows/redaction-gate.yml')
      writeFileSync(f, readFileSync(f, 'utf8').replace('grep -rInE "$pattern"', 'grep -rnE "$pattern"'))
    }
    writeFileSync(join(d, 'shot.png'), pngCarrying(homePath + '/'))
    return run(d)
  }

  r = imgDir('image-with-I', false)
  check('an image is skipped while the gate passes -I', r.code === 0, r.out.trim().split('\n').pop())

  r = imgDir('image-without-I', true)
  check('an image is caught once the gate drops -I', r.code === 1 && /shot\.png/.test(r.out), r.out.trim().split('\n').pop())

  // 7. The flags are read from a real call, so a gate whose grep
  //    invocation this tool cannot find is a refusal and not a pass.
  //    Without this, the flag read could fail open to `undefined` and
  //    grep would be handed a pattern as its first argument.
  const noflags = join(root, 'noflags'); mkdirSync(noflags); gateInto(noflags)
  const nf = join(noflags, '.github/workflows/redaction-gate.yml')
  writeFileSync(nf, readFileSync(nf, 'utf8').replace('grep -rInE "$pattern"', 'grep "$pattern"'))
  writeFileSync(join(noflags, 'f.txt'), 'x ' + uuid + '\n')
  r = run(noflags)
  check('a gate with no readable flag cluster exits 2, not 0', r.code === 2, r.out.trim().split('\n').pop())

  // 8. And a flag cluster that lost a flag the tool depends on is also
  //    a refusal. `-n` going missing would silently change every hit's
  //    shape, which is the allowlist's input.
  const lostn = join(root, 'lostn'); mkdirSync(lostn); gateInto(lostn)
  const ln = join(lostn, '.github/workflows/redaction-gate.yml')
  writeFileSync(ln, readFileSync(ln, 'utf8').replace('grep -rInE "$pattern"', 'grep -rIE "$pattern"'))
  writeFileSync(join(lostn, 'f.txt'), 'x ' + uuid + '\n')
  r = run(lostn)
  check('a flag cluster missing -n exits 2, not 0', r.code === 2, r.out.trim().split('\n').pop())

  console.log(bad ? `\n${bad} of ${want.length} expectations failed` : `\nall ${want.length} expectations hold`)
} finally {
  rmSync(root, { recursive: true, force: true })
}
process.exit(bad ? 1 : 0)
