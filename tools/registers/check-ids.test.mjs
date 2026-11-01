// The scan rules, driven against fixture repositories, because they are the
// half of this gate the pure verdict module cannot reach.
//
// WHY A REAL GIT REPOSITORY AND NOT A STUB. The gate's unit of evidence is
// `git show <ref>:<path>`, so a stub that handed it file contents would prove
// nothing about the thing it actually does: read one path at several refs and
// decide whether two readings are one decision or two. Each fixture here is
// built with `git init` and real commits on real branches, and the base is
// passed as `--base main` because a fixture has no `origin`.
//
// THE TWO RULES UNDER TEST, and the first one is the one that decides whether
// this gate is usable at all. Seventeen open branches in the real repository
// carry the same `## PWC-EXO-2` heading. If a head's copy counted as a second
// definition, every healthy identifier would be reported as a collision and
// the gate would be switched off within a day. So: identity is the text, two
// texts under one identifier is the collision, and the same text twice inside
// a single ref is also a collision because a text-identity rule would
// otherwise hide a copy-paste.

import { strict as assert } from 'node:assert'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { after, describe, it } from 'node:test'
import { rmSync } from 'node:fs'

const HERE = dirname(fileURLToPath(import.meta.url))
const GATE = resolve(HERE, 'check-ids.mjs')
const MANIFEST = {
  namespaces: [
    {
      name: 'ADR',
      register: 'docs/decisions.md',
      pad: 3,
      define: '^## (ADR-(\\d+)) \\u2014 (.+)$',
      repair: 'owner',
      why: 'the fixture register',
      burned: [{ id: 'ADR-002', why: 'burned in the fixture so a reissue is detectable' }],
    },
    {
      name: 'PWC',
      register: 'docs/queue.md',
      pad: 1,
      define: '^## (PWC-(\\d+)) \\u2014 (.+)$',
      repair: 'seat',
      why: 'the fixture queue, repaired by a seat rather than the owner',
      burned: [],
    },
  ],
}

const temps = []
after(() => {
  for (const dir of temps) rmSync(dir, { recursive: true, force: true })
})

/**
 * @param {Record<string, Record<string, string>>} branches branch name to the
 *   file contents that branch should carry.
 */
function fixture(branches) {
  const dir = mkdtempSync(join(tmpdir(), 'check-ids-'))
  temps.push(dir)
  const git = (...a) => execFileSync('git', ['-C', dir, ...a], { encoding: 'utf8' })
  git('init', '--quiet', '--initial-branch=main')
  git('config', 'user.email', 'fixture@example.invalid')
  git('config', 'user.name', 'fixture')
  mkdirSync(join(dir, 'tools/registers'), { recursive: true })
  mkdirSync(join(dir, 'docs'), { recursive: true })
  writeFileSync(join(dir, 'tools/registers/id-namespaces.json'), JSON.stringify(MANIFEST, null, 2))
  let first = true
  for (const [branch, files] of Object.entries(branches)) {
    if (first) first = false
    else git('checkout', '--quiet', '-B', branch, 'main')
    for (const [path, body] of Object.entries(files)) writeFileSync(join(dir, path), body)
    git('add', '-A')
    // --allow-empty because two branches in the head-copy fixture carry
    // byte-identical content on purpose, which is the case under test.
    git('commit', '--quiet', '--allow-empty', '-m', branch)
  }
  git('checkout', '--quiet', 'main')
  return dir
}

function run(dir, ...args) {
  // `--base main` is the fixture default and is omitted when a case names its
  // own base, because the gate reads the first occurrence of a repeated flag
  // and a duplicate would make the override silently lose.
  const base = args.includes('--base') ? [] : ['--base', 'main']
  try {
    const stdout = execFileSync('node', [GATE, '--repo', dir, ...base, ...args], {
      encoding: 'utf8',
    })
    return { code: 0, stdout }
  } catch (error) {
    return { code: error.status, stdout: `${error.stdout ?? ''}${error.stderr ?? ''}` }
  }
}

const EM = '—'
const adr = (lines) => `# Decisions\n\n${lines.join('\n\n')}\n`
const heading = (id, title) => `## ${id} ${EM} ${title}`

describe('the scan', () => {
  it('exit 0 on a register where every identifier is defined once', () => {
    const dir = fixture({
      main: {
        'docs/decisions.md': adr([heading('ADR-001', 'the first'), heading('ADR-003', 'the third')]),
        'docs/queue.md': `# Queue\n\n${heading('PWC-1', 'a queued change')}\n`,
      },
    })
    const { code, stdout } = run(dir)
    assert.equal(code, 0)
    assert.match(stdout, /3 identifier\(s\) in 2 namespace\(s\) across 1 ref\(s\)/)
    assert.match(stdout, /every one defined once and no burned one reissued\. Exit 0\./)
  })

  it('reports one identifier with two titles, and names both lines', () => {
    const dir = fixture({
      main: {
        'docs/decisions.md': adr([heading('ADR-001', 'the first'), heading('ADR-001', 'something else')]),
        'docs/queue.md': '# Queue\n',
      },
    })
    const { code, stdout } = run(dir)
    // The owner holds an ADR collision, so this is the exit-2 findings branch.
    assert.equal(code, 2)
    assert.match(stdout, /ADR-001: 2 distinct definition\(s\), 2 occurrence\(s\)/)
    assert.match(stdout, /docs\/decisions\.md:3 \(main\)/)
    assert.match(stdout, /docs\/decisions\.md:5 \(main\)/)
    assert.match(stdout, /clean as far as a seat can take it/)
  })

  it('exit 1 when the collision is in a namespace a seat repairs', () => {
    const dir = fixture({
      main: {
        'docs/decisions.md': '# Decisions\n',
        'docs/queue.md': `# Queue\n\n${heading('PWC-1', 'one change')}\n\n${heading('PWC-1', 'a different change')}\n`,
      },
    })
    const { code, stdout } = run(dir)
    assert.equal(code, 1)
    assert.match(stdout, /Repair held by the seat/)
    assert.match(stdout, /1 collision\(s\) a seat can repair\. Exit 1\./)
  })

  it('does not count a head copy of one decision as a second definition', () => {
    // The rule the gate's usability rests on. Three refs carry the identical
    // heading; that is one decision seen three times.
    const base = {
      'docs/decisions.md': adr([heading('ADR-001', 'the first')]),
      'docs/queue.md': '# Queue\n',
    }
    const dir = fixture({ main: base, 'seat/a': base, 'seat/b': base })
    const git = (...a) => execFileSync('git', ['-C', dir, ...a], { encoding: 'utf8' })
    git('update-ref', 'refs/prs/1', 'seat/a')
    git('update-ref', 'refs/prs/2', 'seat/b')
    const { code, stdout } = run(dir, '--heads')
    assert.equal(code, 0)
    assert.match(stdout, /1 identifier\(s\) in 2 namespace\(s\) across 3 ref\(s\)/)
  })

  it('catches the same heading twice inside one ref, which text identity alone would hide', () => {
    const dir = fixture({
      main: {
        'docs/decisions.md': adr([heading('ADR-001', 'the first'), heading('ADR-001', 'the first')]),
        'docs/queue.md': '# Queue\n',
      },
    })
    const { code, stdout } = run(dir)
    assert.equal(code, 2)
    assert.match(stdout, /ADR-001: 1 distinct definition\(s\), 2 occurrence\(s\)/)
  })

  it('catches a burned identifier being reissued, and prints why it was burned', () => {
    const dir = fixture({
      main: {
        'docs/decisions.md': adr([heading('ADR-002', 'taking a burned number')]),
        'docs/queue.md': '# Queue\n',
      },
    })
    const { code, stdout } = run(dir)
    assert.equal(code, 2)
    assert.match(stdout, /ADR-002: reissued although it is burned/)
    assert.match(stdout, /burned in the fixture so a reissue is detectable/)
  })

  it('treats a register absent at a ref as nothing to say, not as a finding', () => {
    const dir = fixture({ main: { 'docs/queue.md': `# Queue\n\n${heading('PWC-1', 'x')}\n` } })
    const { code, stdout } = run(dir)
    assert.equal(code, 0)
    assert.match(stdout, /1 identifier\(s\) in 2 namespace\(s\)/)
  })

  it('does not read a mention in a paragraph as a definition', () => {
    const dir = fixture({
      main: {
        'docs/decisions.md': adr([
          heading('ADR-001', 'the first'),
          'This paragraph cites ADR-001 and also ## ADR-001 mid-sentence.',
        ]),
        'docs/queue.md': '# Queue\n',
      },
    })
    const { code } = run(dir)
    assert.equal(code, 0)
  })
})

describe('the allocator', () => {
  const dir = () =>
    fixture({
      main: {
        'docs/decisions.md': adr([heading('ADR-001', 'the first'), heading('ADR-003', 'the third')]),
        'docs/queue.md': `# Queue\n\n${heading('PWC-4', 'a queued change')}\n`,
      },
    })

  it('refuses to answer from a single branch', () => {
    const { code, stdout } = run(dir(), '--next', 'ADR')
    assert.equal(code, 2)
    assert.match(stdout, /NEXT_WITHOUT_HEADS/)
    assert.match(stdout, /how PWC-7 came to mean two changes at once/)
  })

  it('answers highest plus one, padded to the register, never the lowest gap', () => {
    // ADR-002 is burned in the fixture manifest and ADR-002 is also the lowest
    // free number. Filling it is what makes an old citation resolve silently
    // to a new decision, so the answer is 004 and not 002.
    const { code, stdout } = run(dir(), '--next', 'ADR', '--heads', '--no-fetch')
    assert.equal(code, 0)
    assert.match(stdout, /^ADR-004$/m)
    assert.match(stdout, /highest is 3, so the next free one is 4/)
  })

  it('skips a burned tail even when it is the highest number', () => {
    const d = fixture({
      main: {
        'docs/decisions.md': adr([heading('ADR-001', 'the first')]),
        'docs/queue.md': '# Queue\n',
      },
    })
    const { stdout } = run(d, '--next', 'ADR', '--heads', '--no-fetch')
    // ADR-002 is burned, so the highest of (defined, burned) is 2 and the
    // answer is 003 rather than the 002 a defined-only maximum would give.
    assert.match(stdout, /^ADR-003$/m)
  })

  it('names the namespaces it has when asked for one it does not', () => {
    const { code, stdout } = run(dir(), '--next', 'INC', '--heads', '--no-fetch')
    assert.equal(code, 2)
    assert.match(stdout, /NAMESPACE_UNKNOWN/)
    assert.match(stdout, /it declares ADR, PWC/)
  })
})

describe('ground', () => {
  it('refuses when the manifest is absent rather than reporting a clean repository', () => {
    const dir = mkdtempSync(join(tmpdir(), 'check-ids-bare-'))
    temps.push(dir)
    execFileSync('git', ['-C', dir, 'init', '--quiet', '--initial-branch=main'])
    const { code, stdout } = run(dir)
    assert.equal(code, 2)
    assert.match(stdout, /MANIFEST_ABSENT/)
  })

  it('refuses when the base does not resolve, and names the repair', () => {
    const dir = fixture({
      main: { 'docs/decisions.md': '# Decisions\n', 'docs/queue.md': '# Queue\n' },
    })
    const { code, stdout } = run(dir, '--base', 'origin/nope')
    assert.equal(code, 2)
    assert.match(stdout, /BASE_ABSENT/)
    assert.match(stdout, /ensure-full-clone\.sh/)
  })
})
