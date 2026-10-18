// `ursa publish`: the path from a project's `.ursa/` to a directory a web
// server can serve. Four things are worth a test here and the rest is
// plumbing the type checker already holds:
//
//   1. the disclosure gate actually gates. A publish without
//      acknowledgement writes NOTHING, verified by reading the directory
//      rather than by trusting the return value.
//   2. the manifest counts the three raw-text classes the record carries,
//      against a record whose character counts are known by construction.
//   3. every address in `index.json` resolves to a file that was written,
//      which is the published equivalent of the no-broken-pointer audit
//      the viewer already has.
//   4. the index page is self-contained: it fetches nothing.

import { describe, it, expect } from 'vitest'
import { existsSync, mkdtempSync, readFileSync, readdirSync, writeFileSync, mkdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { JSDOM } from 'jsdom'
import { parsePasteConversation } from './parse'
import { resolve } from './resolve'
import { saveRecord } from './store'
import {
  DisclosureNotAcknowledged,
  PUBLISHED_INDEX_VERSION,
  formatManifest,
  manifestFor,
  publish,
  recordHref,
  renderIndexPage,
} from './publish'
import type { OutcomeRecord } from './types'

const FIXTURE = join(__dirname, '..', 'fixtures', 'mini')

function fixtureRecord(taskId = 'fixture-mini'): OutcomeRecord {
  const finalText = readFileSync(join(FIXTURE, 'final.md'), 'utf8')
  const convs = ['01-claude', '02-chatgpt'].map((id) =>
    parsePasteConversation(readFileSync(join(FIXTURE, 'conversations', `${id}.md`), 'utf8'), id),
  )
  return resolve({
    taskId,
    files: [{ path: 'final.md', text: finalText }],
    conversations: convs.map((c) => c.conversation),
    generations: convs.flatMap((c) => c.generations),
    finished: true,
  })
}

/** A project directory with the given records already saved into `.ursa/`. */
function projectWith(records: OutcomeRecord[]): string {
  const dir = mkdtempSync(join(tmpdir(), 'ursa-publish-'))
  for (const r of records) saveRecord(dir, r, null, null)
  return dir
}

const outDirIn = (project: string) => join(project, 'site')

describe('the disclosure gate', () => {
  it('refuses to publish without acknowledgement, and writes no file at all', () => {
    const project = projectWith([fixtureRecord()])
    const out = outDirIn(project)

    expect(() => publish({ projectPath: project, outDir: out, acknowledged: false }))
      .toThrow(DisclosureNotAcknowledged)

    // The gate is only real if it precedes every write. A refusal that
    // had already created the directory would mean the ordering inside
    // publish() was wrong even though the exception was right.
    expect(existsSync(out)).toBe(false)
  })

  it('carries the manifest on the refusal, so a caller can print what it declined', () => {
    const project = projectWith([fixtureRecord()])
    try {
      publish({ projectPath: project, outDir: outDirIn(project), acknowledged: false })
      expect.unreachable('publish should have thrown')
    } catch (err) {
      expect(err).toBeInstanceOf(DisclosureNotAcknowledged)
      const m = (err as DisclosureNotAcknowledged).manifest
      expect(m.records).toBe(1)
      expect(m.filePaths).toEqual(['final.md'])
      expect(m.promptChars).toBeGreaterThan(0)
    }
  })

  it('counts the three raw-text classes the record carries, each against the record itself', () => {
    const record = fixtureRecord()
    const m = manifestFor([record])

    expect(m.finalChars).toBe(record.files.reduce((n, f) => n + f.text.length, 0))
    expect(m.generationChars).toBe(record.generations.reduce((n, g) => n + g.text.length, 0))
    expect(m.generations).toBe(record.generations.length)
    expect(m.conversations).toBe(record.conversations.length)
    expect(m.promptChars).toBe(
      record.conversations.reduce((n, c) => n + (c.prompts ?? []).reduce((k, p) => k + p.text.length, 0), 0),
    )
    // The fixture is the public one and it does have prompts, so a zero
    // here would mean the manifest was counting nothing and passing.
    expect(m.prompts).toBeGreaterThan(0)
    expect(m.generationChars).toBeGreaterThan(0)
  })

  it('names the user own messages in the printed disclosure, not just a total', () => {
    const text = formatManifest(manifestFor([fixtureRecord()]))
    expect(text).toContain('your own')
    expect(text).toContain('messages to the model')
    expect(text).toContain('final.md')
    expect(text).toContain('never been public before')
  })

  it('counts a path once when two records share it', () => {
    const m = manifestFor([fixtureRecord('one'), fixtureRecord('two')])
    expect(m.records).toBe(2)
    expect(m.filePaths).toEqual(['final.md'])
    expect(m.finalFiles).toBe(1)
  })
})

describe('the published site', () => {
  it('writes two files per record plus the index, and every address in the index resolves', () => {
    const project = projectWith([fixtureRecord('alpha'), fixtureRecord('beta')])
    const out = outDirIn(project)
    const result = publish({
      projectPath: project, outDir: out, acknowledged: true,
      repository: 'someone/their-repo', publishedAt: '2026-10-18T00:00:00.000Z',
    })

    expect(result.index.records.map((r) => r.id)).toEqual(['alpha', 'beta'])
    expect(result.index.indexVersion).toBe(PUBLISHED_INDEX_VERSION)
    expect(result.index.repository).toBe('someone/their-repo')
    expect(result.skipped).toEqual([])

    // The no-broken-pointer property, stated over addresses instead of
    // over record indices: every href the index hands a browser is a file
    // this run actually wrote.
    for (const summary of result.index.records) {
      for (const href of [summary.html, summary.json]) {
        expect(existsSync(join(out, href)), `${href} should exist`).toBe(true)
      }
      expect(summary.html).toBe(recordHref(summary.id, 'html'))
    }
    expect(existsSync(join(out, 'index.html'))).toBe(true)
    expect(existsSync(join(out, 'index.json'))).toBe(true)
    // Without this, Jekyll silently drops any record id beginning with an
    // underscore from the deployed site.
    expect(existsSync(join(out, '.nojekyll'))).toBe(true)
  })

  it('writes an index.json that parses and matches the result it returned', () => {
    const project = projectWith([fixtureRecord('alpha')])
    const out = outDirIn(project)
    const result = publish({ projectPath: project, outDir: out, acknowledged: true })
    const onDisk = JSON.parse(readFileSync(join(out, 'index.json'), 'utf8'))
    expect(onDisk).toEqual(JSON.parse(JSON.stringify(result.index)))
  })

  it('republishes the whole set rather than appending to it', () => {
    const project = projectWith([fixtureRecord('alpha')])
    const out = outDirIn(project)
    publish({ projectPath: project, outDir: out, acknowledged: true })
    saveRecord(project, fixtureRecord('beta'), null, null)
    const second = publish({ projectPath: project, outDir: out, acknowledged: true })
    expect(second.index.records.map((r) => r.id)).toEqual(['alpha', 'beta'])
    expect(readdirSync(join(out, 'records')).sort())
      .toEqual(['alpha.html', 'alpha.json', 'beta.html', 'beta.json'])
  })

  it('skips a record id that cannot be part of a URL, and says so instead of dropping it', () => {
    const project = projectWith([fixtureRecord('alpha')])
    // A filename no `task.id` from the resolver produces, written straight
    // into the store the way a stray copy or an older build could. The
    // point is that the result names it, because an id silently absent
    // from a published set is indistinguishable from a record that was
    // never resolved.
    mkdirSync(join(project, '.ursa', 'records'), { recursive: true })
    writeFileSync(join(project, '.ursa', 'records', '-leading-dash.json'), '{}')
    const result = publish({ projectPath: project, outDir: outDirIn(project), acknowledged: true })
    expect(result.skipped).toEqual([{ id: '-leading-dash', reason: 'unsafe-id' }])
    expect(result.index.records.map((r) => r.id)).toEqual(['alpha'])
  })

  it('publishes an empty project as an empty set rather than as zeroes', () => {
    const project = mkdtempSync(join(tmpdir(), 'ursa-publish-empty-'))
    const out = outDirIn(project)
    const result = publish({ projectPath: project, outDir: out, acknowledged: true })
    expect(result.index.records).toEqual([])
    const html = readFileSync(join(out, 'index.html'), 'utf8')
    expect(html).toContain('no records in it')
    // An empty set must not render a table of nothing that reads as 0%.
    expect(html).not.toContain('<tbody>')
  })
})

describe('the index page', () => {
  const project = projectWith([fixtureRecord('alpha')])
  const result = publish({
    projectPath: project, outDir: outDirIn(project), acknowledged: true,
    repository: 'someone/their-repo', publishedAt: '2026-10-18T09:30:00.000Z',
  })
  const html = renderIndexPage(result.index)

  it('fetches nothing: no external stylesheet, script, font or image', () => {
    const dom = new JSDOM(html)
    const doc = dom.window.document
    expect(doc.querySelectorAll('script').length).toBe(0)
    expect(doc.querySelectorAll('link[rel="stylesheet"]').length).toBe(0)
    expect(doc.querySelectorAll('img').length).toBe(0)
    for (const a of doc.querySelectorAll('a')) {
      const href = a.getAttribute('href') ?? ''
      expect(href.startsWith('http://') || href.startsWith('//'), `${href} must be site-relative`).toBe(false)
      expect(href.startsWith('https://'), `${href} must be site-relative`).toBe(false)
    }
  })

  it('links each record to its own page and to its raw JSON', () => {
    const doc = new JSDOM(html).window.document
    const hrefs = [...doc.querySelectorAll('tbody a')].map((a) => a.getAttribute('href'))
    expect(hrefs).toContain('records/alpha.html')
    expect(hrefs).toContain('records/alpha.json')
  })

  it('defines every column it shows, so no heading stands as a bare phrase', () => {
    const doc = new JSDOM(html).window.document
    const headings = [...doc.querySelectorAll('thead th')].map((th) => th.textContent?.trim())
    expect(headings).toContain('Kept unchanged')
    expect(headings).toContain('No model behind it')
    const defined = [...doc.querySelectorAll('.legend dt')].map((dt) => dt.textContent?.trim())
    for (const h of ['Kept unchanged', 'Kept, edited', 'No model behind it']) {
      expect(defined, `${h} needs a definition on the page`).toContain(h)
    }
  })

  it('says on the page what the page makes public', () => {
    const doc = new JSDOM(html).window.document
    const disclosure = doc.querySelector('.disclosure')?.textContent ?? ''
    expect(disclosure).toContain('raw text, not a summary')
    expect(disclosure).toContain('own messages to the model')
  })

  it('states that the three percentages do not sum to 100%, since they do not', () => {
    const doc = new JSDOM(html).window.document
    const legend = [...doc.querySelectorAll('.legend')].map((e) => e.textContent).join(' ')
    expect(legend).toContain('do not sum')
  })

  it('escapes a repository name rather than splicing it into the title', () => {
    const hostile = renderIndexPage({
      ...result.index,
      repository: 'someone/<script>alert(1)</script>',
    })
    expect(hostile).not.toContain('<script>')
    expect(hostile).toContain('&lt;script&gt;')
  })
})
