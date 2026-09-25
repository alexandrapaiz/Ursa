// Sprint 2026-09-21 item 2: a record names what kind of finished thing it is
// about. `ursa run` is always at least a `repo`; it becomes `hosted` when the
// episode's own final commit names a URL the work is served from.

import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { detectDeploy } from './deploy'
import { findCommitPairs } from './pairfinder'
import { buildEpisodes } from './episodes'
import { artifactFor, renderRunSummary, resolveEpisode } from './bin/ursa'
import { resolve } from './resolve'
import { renderViewer } from './viewer'

function sh(cwd: string, args: string[]) {
  execFileSync('git', args, { cwd, encoding: 'utf8' })
}

/** A repo holding one generated→edited commit pair, plus any extra files. */
function fixtureRepo(extra: Record<string, string> = {}): string {
  const dir = mkdtempSync(join(tmpdir(), 'ursa-artifact-'))
  sh(dir, ['init', '-q', '-b', 'main'])
  sh(dir, ['config', 'user.email', 'human@example.com'])
  sh(dir, ['config', 'user.name', 'Human Owner'])
  const gen = [
    'export function hero() {',
    "  return '<h1>The trust layer between AI users and AI labs</h1>'",
    '}',
    "export const tagline = 'Your preferences, portable across every model you use.'",
  ].join('\n')
  writeFileSync(join(dir, 'site.js'), gen + '\n')
  sh(dir, ['add', '.'])
  sh(dir, ['commit', '-q', '-m', 'Generate hero\n\nCo-Authored-By: Claude <noreply@anthropic.com>'])
  const edited = gen.replace('portable across every model you use.', 'yours, on every model.')
  writeFileSync(join(dir, 'site.js'), edited + '\n')
  for (const [path, text] of Object.entries(extra)) {
    const abs = join(dir, path)
    mkdirSync(join(abs, '..'), { recursive: true })
    writeFileSync(abs, text)
  }
  sh(dir, ['add', '.'])
  sh(dir, ['commit', '-q', '-m', 'Tighten the tagline'])
  return dir
}

function onlyEpisode(repo: string) {
  const eps = buildEpisodes(findCommitPairs(repo), repo)
  expect(eps).toHaveLength(1)
  return eps[0]
}

describe('detectDeploy: which committed files name a deploy URL', () => {
  const from = (files: Record<string, string>) =>
    detectDeploy((path) => (path in files ? files[path] : null))

  it('reads a GitHub Pages CNAME as the deploy URL', () => {
    expect(from({ CNAME: 'ursa.example.com\n' }))
      .toEqual({ url: 'https://ursa.example.com', evidence: 'CNAME (GitHub Pages custom domain)' })
  })

  it('finds a CNAME nested under a publish directory', () => {
    expect(from({ 'public/CNAME': 'minor.example.org' })?.url).toBe('https://minor.example.org')
  })

  it("falls back to package.json's homepage field", () => {
    expect(from({ 'package.json': JSON.stringify({ name: 'site', homepage: 'https://ursa.example.com/minor/' }) }))
      .toEqual({ url: 'https://ursa.example.com/minor', evidence: 'package.json "homepage"' })
  })

  it("reads vercel.json's alias, string or array", () => {
    expect(from({ 'vercel.json': JSON.stringify({ alias: ['ursa.example.com', 'www.ursa.example.com'] }) })?.url)
      .toBe('https://ursa.example.com')
    expect(from({ 'vercel.json': JSON.stringify({ alias: 'ursa.example.com' }) })?.url)
      .toBe('https://ursa.example.com')
  })

  it('prefers CNAME over homepage when both exist', () => {
    const d = from({
      CNAME: 'canonical.example.com',
      'package.json': JSON.stringify({ homepage: 'https://stale.example.com' }),
    })
    expect(d?.url).toBe('https://canonical.example.com')
  })

  it('returns null when nothing names a URL', () => {
    expect(from({})).toBeNull()
    expect(from({ 'package.json': JSON.stringify({ name: 'lib', version: '1.0.0' }) })).toBeNull()
  })

  it('refuses a deploy pipeline that does not name a domain', () => {
    // A vercel.json with builds but no alias proves a pipeline exists and does
    // not say where to look. renderRef exists to be looked at, so this is repo.
    expect(from({ 'vercel.json': JSON.stringify({ builds: [{ src: 'index.html', use: '@vercel/static' }] }) })).toBeNull()
  })

  it('refuses local, relative and malformed values', () => {
    expect(from({ CNAME: 'localhost' })).toBeNull()
    expect(from({ CNAME: 'site.local' })).toBeNull()
    expect(from({ CNAME: '# just a comment' })).toBeNull()
    expect(from({ 'package.json': JSON.stringify({ homepage: './build' }) })).toBeNull()
    expect(from({ 'package.json': JSON.stringify({ homepage: 'http://127.0.0.1:3000' }) })).toBeNull()
    expect(from({ 'package.json': '{ not json' })).toBeNull()
  })
})

describe('artifact.kind on the record', () => {
  it("defaults to chat on the resolver's conversation path", () => {
    const record = resolve({
      taskId: 't', finished: true,
      files: [{ path: 'a.md', text: 'The frontier, read for you.' }],
      conversations: [{ id: 'c1', title: 'c', adapter: 'paste', turns: 1, userTurns: 1 }],
      generations: [{ conversationId: 'c1', model: 'm', turnIndex: 1, kind: 'assistant_text', text: 'The frontier, read for you.' }],
    })
    expect(record.artifact).toEqual({ kind: 'chat' })
  })

  it('ursa run fills repo on a plain repository, with no renderRef', () => {
    const repo = fixtureRepo()
    const record = resolveEpisode(repo, onlyEpisode(repo))!
    expect(record.artifact.kind).toBe('repo')
    expect(record.artifact.renderRef).toBeUndefined()
  })

  it('ursa run fills hosted with the deploy URL when the commit names one', () => {
    const repo = fixtureRepo({ CNAME: 'minor.example.com\n' })
    const record = resolveEpisode(repo, onlyEpisode(repo))!
    expect(record.artifact).toEqual({ kind: 'hosted', renderRef: 'https://minor.example.com' })
  })

  it('reads the URL as of the episode commit, not the working tree', () => {
    // The commit pair ships no CNAME; one lands afterwards. The record covers
    // the earlier commit, so it stays `repo`: that is what shipped back then.
    const repo = fixtureRepo()
    const ep = onlyEpisode(repo)
    writeFileSync(join(repo, 'CNAME'), 'added-later.example.com\n')
    sh(repo, ['add', '.'])
    sh(repo, ['commit', '-q', '-m', 'Point the domain at the site'])
    expect(artifactFor(repo, ep).artifact.kind).toBe('repo')
  })

  it('names the live URL in the run summary once, however many records carry it', () => {
    const repo = fixtureRepo({ CNAME: 'minor.example.com\n' })
    const ep = onlyEpisode(repo)
    const record = resolveEpisode(repo, ep)!
    const summary = renderRunSummary([record, record], [ep, ep])
    expect(summary.match(/https:\/\/minor\.example\.com/g)).toHaveLength(1)
  })

  it('the viewer states the kind in words and links a hosted renderRef', () => {
    const repo = fixtureRepo({ CNAME: 'minor.example.com\n' })
    const html = renderViewer(resolveEpisode(repo, onlyEpisode(repo))!)
    expect(html).toContain('hosted: the finished work is served at a URL')
    // No bare nouns in the viewer's labels: every kind is spelled out.
    expect(html).toContain('repository: the finished work is versioned source')
    expect(html).toContain('rendered at ')
    expect(html).toContain("a.rel = 'noreferrer noopener'")
  })

  it('writes artifact into the saved record JSON', () => {
    const repo = fixtureRepo({ CNAME: 'minor.example.com\n' })
    const ep = onlyEpisode(repo)
    const record = resolveEpisode(repo, ep)!
    const parsed = JSON.parse(JSON.stringify(record))
    expect(parsed.artifact).toEqual({ kind: 'hosted', renderRef: 'https://minor.example.com' })
    expect(readFileSync(join(repo, 'site.js'), 'utf8')).toContain('yours, on every model.')
  })
})
