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
import { createHash } from 'node:crypto'
import { existsSync, mkdtempSync, readFileSync, readdirSync, writeFileSync, mkdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { JSDOM } from 'jsdom'
import { parsePasteConversation } from './parse'
import { resolve } from './resolve'
import { saveRecord } from './store'
import { forget } from './consent'
import type { DisclosureManifest } from './publish'
import {
  DisclosureNotAcknowledged,
  PUBLISHED_INDEX_VERSION,
  formatManifest,
  loadPublishable,
  manifestFor,
  noveltyOfDisclosure,
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
  })

  it('tells a session-path record that its text was never public, and a git-path record that it was', () => {
    const session = manifestFor([fixtureRecord()])
    expect(session.adapters).toEqual(['paste'])
    expect(noveltyOfDisclosure(session).join(' ')).toContain('never in the repository')

    // The claim that was wrong until the first end-to-end run: a git-path
    // generation is a blob at a commit, so a public repository published
    // it already. Asserted here against a hand-built manifest so the test
    // does not need a git fixture to hold the sentence honest.
    const text = noveltyOfDisclosure({ ...session, adapters: ['git'] }).join(' ')
    expect(text).toContain('already published that text')
    expect(text).not.toContain('never in the repository')
  })

  it('states both claims when the project holds records from both paths', () => {
    const both = { ...manifestFor([fixtureRecord()]), adapters: ['git', 'paste'] as DisclosureManifest['adapters'] }
    const text = noveltyOfDisclosure(both).join(' ')
    expect(text).toContain('already published that text')
    expect(text).toContain('never in the repository')
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

  // The frontend seat's viewer stopped inlining records into the set page
  // on 2026-10-18 and now fetches one record on demand, which is what
  // these two fields are for: they are how a page that fetched a record
  // over the network earns the right to say the bytes it is rendering are
  // the bytes the index was built from. A digest that is merely present
  // and does not match the file is worse than an absent one, so every
  // test here reads the file back off disk rather than trusting the
  // returned index.
  it('states each record\'s byte count and sha256, both measured against the file on disk', () => {
    const project = projectWith([fixtureRecord('alpha'), fixtureRecord('beta')])
    const out = outDirIn(project)
    const result = publish({ projectPath: project, outDir: out, acknowledged: true })

    expect(result.index.records).toHaveLength(2)
    for (const summary of result.index.records) {
      const onDisk = readFileSync(join(out, summary.json))
      expect(summary.bytes, `${summary.id} byte count`).toBe(onDisk.byteLength)
      expect(summary.sha256, `${summary.id} digest`)
        .toBe(createHash('sha256').update(onDisk).digest('hex'))
      expect(summary.sha256).toMatch(/^[0-9a-f]{64}$/)
      expect(summary.bytes).toBeGreaterThan(0)
    }
  })

  it('digests the bytes it wrote, not a second serialization of the record', () => {
    // The property this protects: `summarize` is handed the buffer that
    // `write` receives. If it ever recomputed `JSON.stringify` instead,
    // this test would still pass against today's serializer and would
    // start failing the day key order, indentation or the trailing
    // newline moved, which is exactly the silent drift the published
    // digest exists to make impossible. So the assertion is stated over
    // the file, and the file is read as bytes rather than as a string.
    const project = projectWith([fixtureRecord('alpha')])
    const out = outDirIn(project)
    const result = publish({ projectPath: project, outDir: out, acknowledged: true })
    const summary = result.index.records[0]!
    const bytes = readFileSync(join(out, 'records', 'alpha.json'))

    expect(bytes.byteLength).toBe(summary.bytes)
    expect(createHash('sha256').update(bytes).digest('hex')).toBe(summary.sha256)
    // And the digest is of the whole file including its final newline,
    // since that is what a fetch returns.
    expect(bytes.subarray(-1).toString('utf8')).toBe('\n')
  })

  it('gives two different records two different digests, and the same record the same one', () => {
    const project = projectWith([fixtureRecord('alpha'), fixtureRecord('beta')])
    const out = outDirIn(project)
    const first = publish({
      projectPath: project, outDir: out, acknowledged: true,
      publishedAt: '2026-10-18T00:00:00.000Z',
    })
    const [a, b] = first.index.records
    // Two records differing only in their id: the digest has to move,
    // because the id is in the bytes.
    expect(a!.sha256).not.toBe(b!.sha256)

    // Republishing the same unchanged records at a different build time
    // must not move a record's digest. `publishedAt` lives in the index
    // and not in a record, and this is the test that keeps it there: a
    // digest that changed on every rebuild would make a viewer's "this
    // is not the record the index names" warning fire on every deploy.
    const second = publish({
      projectPath: project, outDir: out, acknowledged: true,
      publishedAt: '2026-10-19T00:00:00.000Z',
    })
    expect(second.index.records.map((r) => [r.sha256, r.bytes]))
      .toEqual(first.index.records.map((r) => [r.sha256, r.bytes]))
  })

  it('moves a record\'s digest when the record itself changes', () => {
    const project = projectWith([fixtureRecord('alpha')])
    const out = outDirIn(project)
    const before = publish({ projectPath: project, outDir: out, acknowledged: true })

    // The case the digest is actually for: the record at the address was
    // replaced. Saved through the store rather than written by hand, so
    // what changes is a record and not a file that happens to sit there.
    const edited = fixtureRecord('alpha')
    edited.task.finished = false
    saveRecord(project, edited, null, null)
    const after = publish({ projectPath: project, outDir: out, acknowledged: true })

    expect(after.index.records[0]!.sha256).not.toBe(before.index.records[0]!.sha256)
    expect(after.index.records[0]!.sha256)
      .toBe(createHash('sha256').update(readFileSync(join(out, 'records', 'alpha.json'))).digest('hex'))
  })

  it('announces the two fields with a minor version bump, since a pinned viewer reads the number', () => {
    // The frontend viewer pins the major and accepts any minor at or
    // above what it was written against, and says "this index predates
    // digests" below that. That sentence is only correct if the contract
    // version moved when the fields arrived, so the number is asserted
    // here rather than left as a constant nobody reads.
    const [major, minor] = PUBLISHED_INDEX_VERSION.split('.').map(Number)
    expect(major).toBe(0)
    expect(minor).toBeGreaterThanOrEqual(3)
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
    // The page carries the same path-aware claim the command line prints,
    // rather than a stronger one that fits in a banner.
    expect(disclosure).toContain('never in the repository')
  })

  it('states that the three percentages do not sum to 100%, since they do not', () => {
    const doc = new JSDOM(html).window.document
    const legend = [...doc.querySelectorAll('.legend')].map((e) => e.textContent).join(' ')
    expect(legend).toContain('do not sum')
  })

  // THE LIMIT OF THESE TWO TESTS, stated because it decides what they are
  // worth. jsdom parses this page and lays out none of it: `scrollWidth`
  // is 0 for every element here, so the actual defect the frontend seat
  // measured on 2026-10-18 — a 521px document inside a 390px viewport —
  // cannot be reproduced in this file at all. What is testable here is
  // the structure the narrow layout needs in order to work, and that is
  // what these assert. The width itself is measured in a real browser
  // engine by tools/measure-index-page.ts.
  it('gives every cell its own column name as real text, so a block layout stays labelled', () => {
    const doc = new JSDOM(html).window.document
    const headings = [...doc.querySelectorAll('thead th')].map((th) => th.textContent?.trim())
    const row = doc.querySelector('tbody tr')!
    const labels = [...row.querySelectorAll('td')].map((td) => td.querySelector('.label')?.textContent?.trim())

    // One label per cell, no cell left to be read by position alone.
    expect(labels.filter(Boolean)).toHaveLength(row.querySelectorAll('td').length)
    // And the labels are the header's own words, so the wide page and
    // the narrow page name the same column the same way.
    for (const label of labels) {
      expect(headings.some((h) => h === label), `"${label}" should be a column heading too`).toBe(true)
    }
    // The label is text in the document rather than CSS generated
    // content, because `content: attr(...)` is not dependably read aloud
    // and a column name that exists only in a stylesheet can be lost.
    expect(html).not.toContain('attr(data-label)')
  })

  it('stops being a seven-column table on a narrow viewport, since seven columns do not fit one', () => {
    // Asserted against the stylesheet because this page has no other
    // place to carry it: the page is self-contained by design, so the
    // rule either is in this string or does not exist. Without it the
    // table keeps a minimum width equal to its seven columns and a phone
    // reader loses the three provenance columns off the right edge.
    const style = html.slice(html.indexOf('<style>'), html.indexOf('</style>'))
    expect(style).toMatch(/@media \(max-width: \d{3}px\)/)
    const narrow = style.slice(style.indexOf('@media'))
    expect(narrow).toMatch(/table[^{]*\{[^}]*display: block/)
    expect(narrow).toMatch(/thead \{ display: none/)
    // The labels are hidden on a wide viewport and shown here; both
    // halves matter, since showing them always would duplicate the
    // header on every row.
    expect(style).toMatch(/\.label \{ display: none/)
    expect(narrow).toMatch(/\.label \{ display: block/)
    // A record id has no spaces in it and is the one string on this page
    // that can set the layout's minimum width on its own.
    expect(style).toMatch(/td\.id, td\.id a \{ overflow-wrap: anywhere/)
  })

  it('says in the footer what the published digests prove and what they do not', () => {
    const doc = new JSDOM(html).window.document
    const footer = doc.querySelector('footer')!.textContent!.replace(/\s+/g, ' ')
    expect(footer).toContain('SHA-256')
    expect(footer).toContain('truncated download')
    // The limit is on the page, not only in the code comments: the index
    // and the records are written by the same run, so the digest says
    // nothing about the publisher's honesty and the page must not imply
    // that it does.
    expect(footer).toContain('does not show that whoever published this site is honest')
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

describe('the record id becoming a public URL', () => {
  it('warns when the id carries a directory name that is not this repository', () => {
    const project = projectWith([fixtureRecord('northwind-pricing-2026-10-18-8dcb0c7')])
    const result = publish({
      projectPath: project, outDir: outDirIn(project), acknowledged: true,
      repository: 'someone/their-repo',
    })
    expect(result.warnings).toHaveLength(1)
    expect(result.warnings[0]).toContain('northwind-pricing')
    expect(result.warnings[0]).toContain('name of the directory')
  })

  it('stays quiet on a runner, where the directory is the repository', () => {
    const project = projectWith([fixtureRecord('their-repo-2026-10-18-8dcb0c7')])
    const result = publish({
      projectPath: project, outDir: outDirIn(project), acknowledged: true,
      repository: 'someone/their-repo',
    })
    expect(result.warnings).toEqual([])
  })

  it('stays quiet when no repository was stated, since there is nothing to compare against', () => {
    const project = projectWith([fixtureRecord('anything-2026-10-18-8dcb0c7')])
    const result = publish({ projectPath: project, outDir: outDirIn(project), acknowledged: true })
    expect(result.warnings).toEqual([])
  })

  it('does not warn about an id that is not in the resolver shape at all', () => {
    const project = projectWith([fixtureRecord('fixture-mini')])
    const result = publish({
      projectPath: project, outDir: outDirIn(project), acknowledged: true,
      repository: 'someone/their-repo',
    })
    expect(result.warnings).toEqual([])
  })
})

describe('an erased record', () => {
  it('is not published even when its file is still on disk, and the refusal is named', () => {
    const project = projectWith([fixtureRecord('kept'), fixtureRecord('erased')])
    // `ursa forget` deletes the file as well as writing the tombstone, so
    // this is the disagreeing case the check exists for: a .ursa/ restored
    // from a backup, a runner cache that outlived the erasure, a record
    // copied between clones. The file is left in place deliberately.
    forget(project, 'erased')
    writeFileSync(
      join(project, '.ursa', 'records', 'erased.json'),
      JSON.stringify(fixtureRecord('erased'), null, 2),
    )

    const result = publish({ projectPath: project, outDir: outDirIn(project), acknowledged: true })
    expect(result.skipped).toEqual([{ id: 'erased', reason: 'forgotten' }])
    expect(result.index.records.map((r) => r.id)).toEqual(['kept'])
    expect(existsSync(join(outDirIn(project), 'records', 'erased.html'))).toBe(false)
    expect(existsSync(join(outDirIn(project), 'records', 'erased.json'))).toBe(false)
  })

  it('is absent from the disclosure manifest too, so its characters are never counted', () => {
    const both = projectWith([fixtureRecord('kept'), fixtureRecord('erased')])
    const before = manifestFor(loadPublishable(both).records)
    forget(both, 'erased')
    writeFileSync(
      join(both, '.ursa', 'records', 'erased.json'),
      JSON.stringify(fixtureRecord('erased'), null, 2),
    )
    const after = manifestFor(loadPublishable(both).records)
    expect(before.records).toBe(2)
    expect(after.records).toBe(1)
    expect(after.recordIds).toEqual(['kept'])
    expect(after.finalChars).toBeLessThan(before.finalChars)
  })
})
