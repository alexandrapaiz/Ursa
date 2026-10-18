// `ursa address`: the identity of a record, and whether a stranger can
// actually read it.
//
// What is worth a test here, and why it is these and not coverage of the
// whole module:
//
//   1. the grammar round-trips and refuses what it must refuse. Every
//      address is a string a person types that this process turns into a
//      URL another process fetches, so the refusals are the point: `..`,
//      a non-https scheme, a credential in the URL.
//   2. a `pages` address for the one repository GitHub serves at the
//      host root rather than under its name. That exception is the
//      difference between an address and a 404 and it cannot be noticed
//      by reading the happy path.
//   3. the four conditions `addressState` reports are each produced in a
//      real git repository and each asserted separately. A test that
//      only checks "reachable: false" would pass for a repository that
//      is broken in a different way than the one under test.
//   4. a pushed blob that is NOT the file on disk, because that is the
//      one failure of the four that is silent: the address answers 200
//      and serves the wrong record.
//   5. the cross-origin verdicts, which is the whole reason `--check`
//      exists, with the response injected rather than fetched. The suite
//      opens no socket.

import { describe, it, expect } from 'vitest'
import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import {
  addressState,
  formatRecordAddress,
  githubRemote,
  pagesAddress,
  parseGitHubRemote,
  parseRecordAddress,
  permanenceNote,
  recordAddressId,
  recordAddressPageUrl,
  recordAddressUrl,
  type RecordAddress,
} from './address'
import { runAddress, type ProbeResult } from './address.cli'
import { forget } from './consent'
import { parsePasteConversation } from './parse'
import { resolve } from './resolve'
import { saveRecord } from './store'

const AS = {
  GIT_AUTHOR_NAME: 'Human Owner', GIT_AUTHOR_EMAIL: 'human@example.com',
  GIT_COMMITTER_NAME: 'Human Owner', GIT_COMMITTER_EMAIL: 'human@example.com',
}

function sh(cwd: string, args: string[]): string {
  return execFileSync('git', args, { cwd, env: { ...process.env, ...AS }, encoding: 'utf8' })
}

/**
 * A project that is a git repository with one record on disk.
 *
 * The remote is added by URL and never contacted: `git remote add` writes
 * a config line and opens no socket, and the push state below is set by
 * writing the remote-tracking ref directly with `git update-ref`. That is
 * exactly what a `git fetch` leaves behind, so the checks under test read
 * the same thing they read in the real case, and the suite still reaches
 * no network.
 */
function projectRepo(opts: { gitignore?: string; remote?: string | null } = {}): string {
  const dir = mkdtempSync(join(tmpdir(), 'ursa-address-'))
  sh(dir, ['init', '-q', '-b', 'main'])
  sh(dir, ['config', 'user.email', 'human@example.com'])
  sh(dir, ['config', 'user.name', 'Human Owner'])
  if (opts.gitignore !== undefined) writeFileSync(join(dir, '.gitignore'), opts.gitignore)
  writeFileSync(join(dir, 'README.md'), '# a project\n')
  sh(dir, ['add', '-A'])
  sh(dir, ['commit', '-q', '-m', 'first'])
  const remote = opts.remote === undefined ? 'https://github.com/a-stranger/their-repo.git' : opts.remote
  if (remote) sh(dir, ['remote', 'add', 'origin', remote])
  return dir
}

const RECORD_ID = 'their-repo-2026-10-18-8dcb0c7'

function writeRecord(dir: string, id = RECORD_ID, body = '{"schemaVersion":"0.4.0"}\n'): string {
  mkdirSync(join(dir, '.ursa', 'records'), { recursive: true })
  const path = join(dir, '.ursa', 'records', `${id}.json`)
  writeFileSync(path, body)
  return path
}

/** Commit the record, then make the remote-tracking ref point at HEAD. */
function commitRecord(dir: string, force = true) {
  sh(dir, force ? ['add', '-f', '.ursa'] : ['add', '.ursa'])
  sh(dir, ['commit', '-q', '-m', 'publish one record'])
}

function markPushed(dir: string) {
  const head = sh(dir, ['rev-parse', 'HEAD']).trim()
  sh(dir, ['update-ref', 'refs/remotes/origin/main', head])
  sh(dir, ['branch', '--set-upstream-to=origin/main', 'main'])
}

describe('the address grammar', () => {
  const cases: [string, RecordAddress][] = [
    ['git/a-stranger/their-repo/main/r-2026-10-18-8dcb0c7',
      { scheme: 'git', owner: 'a-stranger', repo: 'their-repo', ref: 'main', recordId: 'r-2026-10-18-8dcb0c7' }],
    ['pages/a-stranger/their-repo/r-2026-10-18-8dcb0c7',
      { scheme: 'pages', owner: 'a-stranger', repo: 'their-repo', recordId: 'r-2026-10-18-8dcb0c7' }],
    ['url/https://example.com/records/r.json',
      { scheme: 'url', url: 'https://example.com/records/r.json' }],
  ]

  for (const [text, address] of cases) {
    it(`round-trips ${address.scheme}`, () => {
      expect(formatRecordAddress(address)).toBe(text)
      const parsed = parseRecordAddress(text)
      expect(parsed.ok).toBe(true)
      if (parsed.ok) expect(parsed.address).toEqual(address)
    })
  }

  it('takes the record id from the end, so a ref may contain slashes', () => {
    const parsed = parseRecordAddress('git/a-stranger/their-repo/engineer/2026-10-18-message/r-2026-10-18-8dcb0c7')
    expect(parsed.ok).toBe(true)
    if (!parsed.ok) return
    expect(parsed.address).toEqual({
      scheme: 'git',
      owner: 'a-stranger',
      repo: 'their-repo',
      ref: 'engineer/2026-10-18-message',
      recordId: 'r-2026-10-18-8dcb0c7',
    })
  })

  it('tolerates the leading slash a URL path arrives with', () => {
    const parsed = parseRecordAddress('/pages/a-stranger/their-repo/r-2026-10-18-8dcb0c7')
    expect(parsed.ok).toBe(true)
  })

  // Each refusal names the reason in words, because both callers show the
  // string to a person: the command prints it and a viewer route that
  // cannot parse its own path has nothing else to say.
  const refusals: [string, string, RegExp][] = [
    ['an empty string', '', /empty/],
    ['no scheme at all', 'r-2026-10-18-8dcb0c7', /names no scheme/],
    ['an unknown scheme', 'blob/a/b/c', /not an address scheme/],
    ['a path that walks upward', 'pages/a-stranger/their-repo/../../etc/passwd', /may not contain/],
    ['too few parts', 'git/a-stranger/their-repo', /incomplete/],
    ['too many parts for pages', 'pages/a-stranger/their-repo/deep/r-1', /takes 3/],
    ['a bad account name', 'pages/-nope-/their-repo/r-2026-10-18-8dcb0c7', /not a GitHub account name/],
    ['a record id that is not one', 'pages/a-stranger/their-repo/.hidden', /not a record id/],
    ['a URL that is not https', 'url/http://example.com/r.json', /must be served over https/],
    ['a javascript URL', 'url/javascript:alert(1)', /not a URL|https/],
    ['a URL carrying a credential', 'url/https://token:x@example.com/r.json', /username or password/],
  ]
  for (const [what, text, message] of refusals) {
    it(`refuses ${what}`, () => {
      const parsed = parseRecordAddress(text)
      expect(parsed.ok).toBe(false)
      if (!parsed.ok) expect(parsed.error).toMatch(message)
    })
  }
})

describe('what an address resolves to', () => {
  it('reads a committed record through raw, which is the path with no deployment in it', () => {
    expect(recordAddressUrl({
      scheme: 'git', owner: 'a-stranger', repo: 'their-repo', ref: 'main', recordId: RECORD_ID,
    })).toBe(`https://raw.githubusercontent.com/a-stranger/their-repo/main/.ursa/records/${RECORD_ID}.json`)
  })

  it('reads a published site under the repository name', () => {
    expect(recordAddressUrl({ scheme: 'pages', owner: 'A-Stranger', repo: 'their-repo', recordId: RECORD_ID }))
      .toBe(`https://a-stranger.github.io/their-repo/records/${RECORD_ID}.json`)
  })

  // GitHub's own exception: the repository named <owner>.github.io is the
  // owner's user site and is served at the host root, so the repository
  // name must NOT appear in the path.
  it('reads a user site at the host root, with no repository segment', () => {
    expect(recordAddressUrl({ scheme: 'pages', owner: 'a-stranger', repo: 'a-stranger.github.io', recordId: RECORD_ID }))
      .toBe(`https://a-stranger.github.io/records/${RECORD_ID}.json`)
  })

  it('leaves a url address exactly as given', () => {
    const url = 'https://example.com/records/r.json'
    expect(recordAddressUrl({ scheme: 'url', url })).toBe(url)
  })

  // raw.githubusercontent.com serves every file as text/plain, so the
  // self-contained HTML page beside a committed record arrives at a
  // browser as source. There is no page to offer, and saying null is the
  // honest answer rather than a URL that renders as text.
  it('offers a readable page on pages and none on git', () => {
    expect(recordAddressPageUrl({ scheme: 'pages', owner: 'a-stranger', repo: 'their-repo', recordId: RECORD_ID }))
      .toBe(`https://a-stranger.github.io/their-repo/records/${RECORD_ID}.html`)
    expect(recordAddressPageUrl({
      scheme: 'git', owner: 'a-stranger', repo: 'their-repo', ref: 'main', recordId: RECORD_ID,
    })).toBeNull()
  })

  it('names the record on both repository schemes and on neither for a bare url', () => {
    expect(recordAddressId({ scheme: 'pages', owner: 'a', repo: 'b', recordId: 'r-1' })).toBe('r-1')
    expect(recordAddressId({ scheme: 'url', url: 'https://example.com/r.json' })).toBeNull()
  })

  // The two schemes differ on the one property CLAUDE.md calls
  // load-bearing, and the difference is invisible at the moment of
  // choosing, so the warning is a value the caller can print.
  it('warns that a committed record is permanent, and does not warn about a published one', () => {
    expect(permanenceNote({ scheme: 'git', owner: 'a', repo: 'b', ref: 'main', recordId: 'r-1' }))
      .toMatch(/stays in that repository's history/)
    expect(permanenceNote({ scheme: 'pages', owner: 'a', repo: 'b', recordId: 'r-1' })).toBeNull()
  })

  it('refuses to build a pages address from something that is not owner/name', () => {
    expect(pagesAddress('their-repo', RECORD_ID)).toBeNull()
    expect(pagesAddress('a-stranger/their-repo', '../etc/passwd')).toBeNull()
  })
})

describe('reading owner/name out of a git remote', () => {
  const forms = [
    'https://github.com/a-stranger/their-repo.git',
    'git@github.com:a-stranger/their-repo.git',
    'ssh://git@github.com/a-stranger/their-repo',
    'https://github.com/a-stranger/their-repo',
  ]
  for (const url of forms) {
    it(`reads ${url}`, () => {
      expect(parseGitHubRemote(url)).toEqual({ owner: 'a-stranger', repo: 'their-repo' })
    })
  }
  it('returns null for a remote that is not GitHub', () => {
    expect(parseGitHubRemote('https://gitlab.com/a-stranger/their-repo.git')).toBeNull()
  })
  it('reads the remote out of a real repository', () => {
    expect(githubRemote(projectRepo())).toEqual({ name: 'origin', owner: 'a-stranger', repo: 'their-repo' })
  })
})

describe('whether the address is live yet', () => {
  it('names the missing commit when the record is only on disk', () => {
    const dir = projectRepo({ gitignore: '.ursa/\n' })
    writeRecord(dir)
    const state = addressState(dir, RECORD_ID)
    expect(state.reachable).toBe(false)
    expect(state.committed).toBe(false)
    expect(state.ignored).toBe(true)
    expect(state.url).toBe(
      `https://raw.githubusercontent.com/a-stranger/their-repo/main/.ursa/records/${RECORD_ID}.json`,
    )
    // Both facts are said, in the order a person hits them: git is
    // ignoring the path on this project's own default, and it is not in
    // HEAD. One without the other is a person running `git add` and
    // watching it do nothing.
    expect(state.blockers.join('\n')).toMatch(/git ignores .*\.ursa.*add -f/s)
    expect(state.blockers.join('\n')).toMatch(/is not in HEAD/)
  })

  it('names the missing push when the record is committed', () => {
    const dir = projectRepo({ gitignore: '.ursa/\n' })
    writeRecord(dir)
    commitRecord(dir)
    const state = addressState(dir, RECORD_ID)
    expect(state.committed).toBe(true)
    expect(state.pushed).toBe(false)
    expect(state.reachable).toBe(false)
    expect(state.blockers.join('\n')).toMatch(/git push/)
  })

  it('is reachable once the tracking ref has the record', () => {
    const dir = projectRepo({ gitignore: '.ursa/\n' })
    writeRecord(dir)
    commitRecord(dir)
    markPushed(dir)
    const state = addressState(dir, RECORD_ID)
    expect(state.blockers).toEqual([])
    expect(state.reachable).toBe(true)
    expect(state.current).toBe(true)
    expect(state.path).toBe(`.ursa/records/${RECORD_ID}.json`)
    expect(formatRecordAddress(state.address!)).toBe(`git/a-stranger/their-repo/main/${RECORD_ID}`)
  })

  // The silent failure, and the reason `current` is a field of its own:
  // the address answers 200 and serves a record that is not the one the
  // person just resolved.
  it('refuses to call a stale address reachable', () => {
    const dir = projectRepo({ gitignore: '.ursa/\n' })
    writeRecord(dir, RECORD_ID, '{"schemaVersion":"0.4.0","v":1}\n')
    commitRecord(dir)
    markPushed(dir)
    writeRecord(dir, RECORD_ID, '{"schemaVersion":"0.4.0","v":2}\n')
    const state = addressState(dir, RECORD_ID)
    expect(state.pushed).toBe(true)
    expect(state.current).toBe(false)
    expect(state.reachable).toBe(false)
    expect(state.blockers.join('\n')).toMatch(/older version/)
  })

  it('offers no address at all for a record the person erased', () => {
    const dir = projectRepo({ gitignore: '.ursa/\n' })
    writeRecord(dir)
    commitRecord(dir)
    markPushed(dir)
    forget(dir, RECORD_ID)
    const state = addressState(dir, RECORD_ID)
    expect(state.forgotten).toBe(true)
    expect(state.address).toBeNull()
    expect(state.url).toBeNull()
    expect(state.blockers.join('\n')).toMatch(/ursa forget/)
  })

  it('says there is no GitHub remote rather than inventing one', () => {
    const dir = projectRepo({ remote: null })
    writeRecord(dir)
    const state = addressState(dir, RECORD_ID)
    expect(state.remote).toBeNull()
    expect(state.address).toBeNull()
    expect(state.blockers.join('\n')).toMatch(/no GitHub remote/)
  })

  it('says a directory that is not a git work tree has no repository to read from', () => {
    const dir = mkdtempSync(join(tmpdir(), 'ursa-address-bare-'))
    writeRecord(dir)
    const state = addressState(dir, RECORD_ID)
    expect(state.blockers.join('\n')).toMatch(/not a git work tree/)
    expect(state.blockers.join('\n')).toMatch(/ursa publish/)
  })
})

/** A real record, resolved from the committed fixture, saved under `id`. */
function saveRealRecord(dir: string, id = RECORD_ID) {
  const fixture = join(__dirname, '..', 'fixtures', 'mini')
  const convs = ['01-claude', '02-chatgpt'].map((c) =>
    parsePasteConversation(readFileSync(join(fixture, 'conversations', `${c}.md`), 'utf8'), c),
  )
  const record = resolve({
    taskId: id,
    files: [{ path: 'final.md', text: readFileSync(join(fixture, 'final.md'), 'utf8') }],
    conversations: convs.map((c) => c.conversation),
    generations: convs.flatMap((c) => c.generations),
    finished: true,
  })
  mkdirSync(join(dir, '.ursa', 'records'), { recursive: true })
  saveRecord(dir, record, null, null)
}

describe('the command', () => {
  function capture(): { lines: string[]; restore: () => void } {
    const lines: string[] = []
    const log = console.log
    const err = console.error
    console.log = (...a: unknown[]) => { lines.push(a.join(' ')) }
    console.error = (...a: unknown[]) => { lines.push(a.join(' ')) }
    return { lines, restore: () => { console.log = log; console.error = err } }
  }

  const permissive = async (): Promise<ProbeResult> => ({ status: 200, allowOrigin: '*', error: null })
  const silent = async (): Promise<ProbeResult> => ({ status: 200, allowOrigin: null, error: null })

  it('exits 0 and prints the address when one is live', async () => {
    const dir = projectRepo({ gitignore: '.ursa/\n' })
    writeRecord(dir)
    commitRecord(dir)
    markPushed(dir)
    const cap = capture()
    let code: number
    try {
      code = await runAddress({ projectPath: dir, probe: permissive, check: true })
    } finally {
      cap.restore()
    }
    const out = cap.lines.join('\n')
    expect(code).toBe(0)
    expect(out).toContain(`git/a-stranger/their-repo/main/${RECORD_ID}`)
    expect(out).toMatch(/HTTP 200/)
    expect(out).toMatch(/a browser on any page can read this/)
    // The permanence of a committed record is stated where the person is
    // looking at its address, not only in a design document.
    expect(out).toMatch(/stays in that repository's history/)
  })

  // The failure the frontend seat warned about, which no amount of
  // pushing fixes and which is invisible from the data side.
  it('says plainly that a host sending no cross-origin header cannot be read by a viewer', async () => {
    const dir = projectRepo({ gitignore: '.ursa/\n' })
    writeRecord(dir)
    commitRecord(dir)
    markPushed(dir)
    const cap = capture()
    try {
      await runAddress({ projectPath: dir, probe: silent, check: true })
    } finally {
      cap.restore()
    }
    expect(cap.lines.join('\n')).toMatch(/no access-control-allow-origin header/)
  })

  // The disclosure, after the fact. A person who committed a record last
  // week made that disclosure whether or not anybody counted it for
  // them, and this is the same manifest `ursa publish` prints before it
  // writes, from the same function.
  it('counts what is already public at a live address, over a real record', async () => {
    const dir = projectRepo({ gitignore: '.ursa/\n' })
    saveRealRecord(dir)
    commitRecord(dir)
    markPushed(dir)
    const cap = capture()
    let code: number
    try {
      code = await runAddress({ projectPath: dir })
    } finally {
      cap.restore()
    }
    const out = cap.lines.join('\n')
    expect(code).toBe(0)
    expect(out).toMatch(/What is public at the addresses above/)
    expect(out).toMatch(/final\.md/)
  })

  // The store is a directory of files this command did not write, so a
  // file in it that is JSON and not a record must not stop the command
  // from telling a person about the rest.
  it('does not crash on a JSON file in the store that is not a record', async () => {
    const dir = projectRepo({ gitignore: '.ursa/\n' })
    writeRecord(dir, RECORD_ID, '{"schemaVersion":"0.4.0"}\n')
    commitRecord(dir)
    markPushed(dir)
    const cap = capture()
    let code: number
    try {
      code = await runAddress({ projectPath: dir })
    } finally {
      cap.restore()
    }
    expect(code).toBe(0)
    expect(cap.lines.join('\n')).not.toMatch(/What is public/)
  })

  it('exits 4 when there are records and nothing is readable yet', async () => {
    const dir = projectRepo({ gitignore: '.ursa/\n' })
    writeRecord(dir)
    const cap = capture()
    let code: number
    try {
      code = await runAddress({ projectPath: dir })
    } finally {
      cap.restore()
    }
    expect(code).toBe(4)
    expect(cap.lines.join('\n')).toMatch(/is not in HEAD/)
  })

  it('exits 0 with nothing to say when the project has no records', async () => {
    const dir = projectRepo()
    const cap = capture()
    let code: number
    try {
      code = await runAddress({ projectPath: dir })
    } finally {
      cap.restore()
    }
    expect(code).toBe(0)
    expect(cap.lines.join('\n')).toMatch(/no records in/)
  })

  it('prints the pages address a published site would serve, beside the git one', async () => {
    const dir = projectRepo({ gitignore: '.ursa/\n' })
    writeRecord(dir)
    const cap = capture()
    try {
      await runAddress({ projectPath: dir, pages: 'a-stranger/their-repo' })
    } finally {
      cap.restore()
    }
    const out = cap.lines.join('\n')
    expect(out).toContain(`pages/a-stranger/their-repo/${RECORD_ID}`)
    expect(out).toContain(`https://a-stranger.github.io/their-repo/records/${RECORD_ID}.json`)
  })
})
