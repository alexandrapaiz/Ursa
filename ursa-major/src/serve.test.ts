// The local store server, end to end, with nothing stubbed.
//
// Every test below builds a throwaway git repository, runs the REAL
// resolver over it (`main(['run', dir])`, the same entry point the
// command line runs), and then reads what it wrote back out through
// HTTP. Nothing is mocked and no fixture record is planted: if the
// resolver and the server disagreed about where the store is or what a
// record looks like, these tests would be the ones to notice.
//
// That is the whole claim the board item asks for, stated as a test:
// the resolver and a page share one real store.

import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { main } from './bin/ursa'
import { listRecordIds, saveEpisodes } from './store'
import { startStoreServer, storePayload, tuningUnits, type StoreServerHandle } from './serve'
import type { TuningRecord } from './tuning/types'

// Author identity through the environment, not `git config`: GIT_AUTHOR_NAME
// outranks a repository's user.name and every agent harness exports it, so a
// fixture relying on `git config` is authored by whoever runs the suite. The
// long version of this note is in m0.test.ts.
const AS = (name: string, email: string) => ({
  GIT_AUTHOR_NAME: name, GIT_AUTHOR_EMAIL: email,
  GIT_COMMITTER_NAME: name, GIT_COMMITTER_EMAIL: email,
})
const HUMAN = AS('Human Owner', 'human@example.com')

function sh(cwd: string, cmd: string, args: string[], env: Record<string, string> = HUMAN) {
  execFileSync(cmd, args, { cwd, env: { ...process.env, ...env }, encoding: 'utf8' })
}

/** Text over the 200-char floor `ursa run` applies, or no record is written. */
function generated(marker: string): string {
  return [
    'export function digest() {',
    '  const items = fetchItems()',
    "  const summary = items.map(formatItem).join('\\n')",
    `  return 'DIGEST — ${marker}, summarized for you.\\n' + summary`,
    '}',
    'function formatItem(i) { return `- ${i.title}: ${i.claim} — why it matters: ${i.why}` }',
  ].join('\n') + '\n'
}

/**
 * A project with one resolved record in `.ursa/`: an agent commit the
 * human then edited, which is the commit pair the resolver walks.
 */
async function projectWithOneRecord(): Promise<string> {
  const dir = mkdtempSync(join(tmpdir(), 'ursa-serve-'))
  sh(dir, 'git', ['init', '-q', '-b', 'main'])
  sh(dir, 'git', ['config', 'user.email', 'human@example.com'])
  sh(dir, 'git', ['config', 'user.name', 'Human Owner'])
  writeFileSync(join(dir, 'digest.js'), generated('the latest research'))
  sh(dir, 'git', ['add', '.'])
  sh(dir, 'git', ['commit', '-q', '-m', 'Generate digest module\n\nCo-Authored-By: Claude <noreply@anthropic.com>'])
  writeFileSync(join(dir, 'digest.js'), generated('the latest research').replace('why it matters', 'so what'))
  sh(dir, 'git', ['add', '.'])
  sh(dir, 'git', ['commit', '-q', '-m', 'Tighten digest prose'])
  await main(['run', dir])
  return dir
}

/** A second pair in the same project, so a second record appears. */
async function resolveAnotherRecord(dir: string): Promise<void> {
  writeFileSync(join(dir, 'brief.js'), generated('the weekly brief'))
  sh(dir, 'git', ['add', '.'])
  sh(dir, 'git', ['commit', '-q', '-m', 'Generate brief module\n\nCo-Authored-By: Claude <noreply@anthropic.com>'])
  writeFileSync(join(dir, 'brief.js'), generated('the weekly brief').replace('why it matters', 'the point'))
  sh(dir, 'git', ['add', '.'])
  sh(dir, 'git', ['commit', '-q', '-m', 'Tighten brief prose'])
  await main(['run', dir])
}

const projects: string[] = []
let handle: StoreServerHandle | null = null

async function serve(projectPath: string): Promise<StoreServerHandle> {
  // Port 0 asks the OS for a free one. A fixed port would make this file
  // unrunnable beside the bridge's tests, and worse, would pass or fail
  // depending on what else is listening on the machine.
  handle = await startStoreServer({ projectPath, port: 0, log: () => {} })
  return handle
}

afterEach(async () => {
  await handle?.stop()
  handle = null
  while (projects.length) rmSync(projects.pop()!, { recursive: true, force: true })
})

describe('the local store server', () => {
  it('serves the record the resolver wrote, byte for byte', async () => {
    const project = await projectWithOneRecord()
    projects.push(project)
    const ids = listRecordIds(project)
    expect(ids.length).toBe(1)

    const server = await serve(project)
    const res = await fetch(`${server.url}/records/${ids[0]}`)
    expect(res.status).toBe(200)

    // The strongest form of "one real store": what came over HTTP parses
    // to exactly the object on disk. A server reading a different
    // directory, or re-deriving anything, fails here.
    const onDisk = JSON.parse(readFileSync(join(project, '.ursa', 'records', `${ids[0]}.json`), 'utf8'))
    expect(await res.json()).toEqual(onDisk)
  })

  it('indexes the store, and sees a record the resolver writes while it is up', async () => {
    const project = await projectWithOneRecord()
    projects.push(project)
    const server = await serve(project)

    const first = await fetch(`${server.url}/records`).then((r) => r.json())
    expect(first.ids.length).toBe(1)

    // The case that makes a cache wrong rather than merely stale: the
    // user runs the resolver again with the page open. Nothing is
    // restarted and nothing is invalidated, because nothing was cached.
    await resolveAnotherRecord(project)
    const second = await fetch(`${server.url}/records`).then((r) => r.json())
    expect(second.ids.length).toBe(2)
    expect(second.ids).toEqual(listRecordIds(project))
  })

  it('answers the first paint in one fetch, with the figures a survival bar needs', async () => {
    const project = await projectWithOneRecord()
    projects.push(project)
    const server = await serve(project)

    const payload = await fetch(`${server.url}/store`).then((r) => r.json())
    expect(payload.storeExists).toBe(true)
    expect(payload.recordCount).toBe(1)
    expect(payload.records.length).toBe(1)

    const row = payload.records[0]
    const record = JSON.parse(readFileSync(join(project, '.ursa', 'records', `${row.id}.json`), 'utf8'))
    expect(row.finalChars).toBe(record.stats.finalChars)
    expect(row.coveredChars).toBe(record.stats.coveredChars)
    expect(row.charsByClass.survived_verbatim).toBe(record.stats.byClass.survived_verbatim.chars)
    expect(row.charsByClass.survived_mutated).toBe(record.stats.byClass.survived_mutated.chars)
    expect(row.charsByClass.no_generation_provenance)
      .toBe(record.stats.byClass.no_generation_provenance.chars)
    expect(row.humanDeletedChars).toBe(record.stats.generated.humanDeletedChars)
    // The three classes have to account for every covered character, or a
    // bar drawn from them under-reports the work without saying so.
    const summed = row.charsByClass.survived_verbatim
      + row.charsByClass.survived_mutated
      + row.charsByClass.no_generation_provenance
    expect(summed).toBe(row.coveredChars)

    // Undeclared, and said as null rather than false: nothing in this
    // fixture declared on the work, and acceptance is never inferred.
    expect(row.accepted).toBeNull()
  })

  it('never puts the project path in a response, only its name', async () => {
    const project = await projectWithOneRecord()
    projects.push(project)
    const server = await serve(project)

    // The bridge's allowlist lets a deployed page read these routes, so a
    // response is a thing that can reach a hosted origin. The absolute
    // project path is the user's home directory and must not be in one.
    for (const route of ['/', '/health', '/store', '/records', '/tuning']) {
      const text = await fetch(`${server.url}${route}`).then((r) => r.text())
      expect(text).not.toContain(project)
      expect(JSON.parse(text).store ?? '.ursa').toBe('.ursa')
    }
  })

  it('reports an un-resolved project as an empty store rather than an error', async () => {
    const empty = mkdtempSync(join(tmpdir(), 'ursa-serve-empty-'))
    projects.push(empty)
    const server = await serve(empty)

    const health = await fetch(`${server.url}/health`).then((r) => r.json())
    expect(health.ok).toBe(true)
    expect(health.storeExists).toBe(false)
    expect(health.recordCount).toBe(0)

    const payload = await fetch(`${server.url}/store`).then((r) => r.json())
    expect(payload.storeExists).toBe(false)
    expect(payload.records).toEqual([])
    expect(payload.tuning).toEqual([])
  })

  it('serves revoked axioms as tombstones and marks tensions', async () => {
    const project = await projectWithOneRecord()
    projects.push(project)
    const tuning: TuningRecord = {
      schemaVersion: '0.1.0',
      owner: 'local',
      updatedAt: '2026-10-18T00:00:00.000Z',
      sources: [],
      axioms: [
        {
          id: 'ax-kept', statement: 'Prefer plain sentences over clever ones', domain: 'copy',
          polarity: 'prefer', basis: 'stated', evidenceCount: 3, evidence: [],
          contradicts: ['ax-tense'], firstSeen: '2026-10-01T00:00:00.000Z',
          lastSeen: '2026-10-17T00:00:00.000Z', status: 'active',
        },
        {
          id: 'ax-tense', statement: 'Prefer dense phrasing', domain: 'copy',
          polarity: 'prefer', basis: 'tacit', evidenceCount: 2, evidence: [],
          contradicts: ['ax-kept'], firstSeen: '2026-10-02T00:00:00.000Z',
          lastSeen: '2026-10-16T00:00:00.000Z', status: 'active',
        },
        {
          id: 'ax-gone', statement: 'Avoid footnotes', domain: 'layout',
          polarity: 'avoid', basis: 'stated', evidenceCount: 1, evidence: [],
          contradicts: [], firstSeen: '2026-10-03T00:00:00.000Z',
          lastSeen: '2026-10-05T00:00:00.000Z', status: 'revoked',
        },
      ],
    }
    writeFileSync(join(project, '.ursa', 'tuning.json'), JSON.stringify(tuning, null, 2))
    const server = await serve(project)

    const served = await fetch(`${server.url}/tuning`).then((r) => r.json())
    // Strongest evidence first, and the revocation is present as a
    // tombstone: a surface that offers revocation has to be able to show
    // the user that theirs held.
    expect(served.units.map((u: { id: string }) => u.id)).toEqual(['ax-kept', 'ax-tense', 'ax-gone'])
    expect(served.units[2].status).toBe('revoked')
    // A contradiction is surfaced, never averaged.
    expect(served.units[0].tension).toBe(true)
    expect(served.units[0].contradicts).toEqual(['ax-tense'])
    expect(served.units[2].tension).toBe(false)
  })

  it('reports a record the tuning layer has already distilled', async () => {
    const project = await projectWithOneRecord()
    projects.push(project)
    const id = listRecordIds(project)[0]
    saveEpisodes(project, [{
      id, projectPath: project, status: 'closed',
      openedAt: '2026-10-18T00:00:00.000Z', closedAt: '2026-10-18T01:00:00.000Z',
      closureHeuristic: 'git-commit-pair', touchedFiles: ['digest.js'],
      generatedSha: 'aaaaaaa', finalSha: 'bbbbbbb', agentMarker: 'Claude',
      subject: 'Tighten digest prose', distilled: true,
      // No merge sat between the two shas. An empty array is "none" and
      // not "unknown"; the absent-means-unknown case is `unreadableMerges`
      // (src/episodes.ts), which this episode does not set because every
      // boundary merge here was readable, there being none.
      interveningMerges: [],
    }])
    const server = await serve(project)

    const payload = await fetch(`${server.url}/store`).then((r) => r.json())
    expect(payload.records[0].distilled).toBe(true)
  })

  it('refuses a record id that tries to walk out of .ursa/records', async () => {
    const project = await projectWithOneRecord()
    projects.push(project)
    const server = await serve(project)

    const res = await fetch(`${server.url}/records/${encodeURIComponent('../../../../etc/passwd')}`)
    expect(res.status).toBe(404)
    // And the refusal says which id it refused, without echoing a path
    // that was read, because nothing was read.
    expect((await res.json()).error).toContain('no record')
  })

  it('answers a loopback page with CORS and a stranger without it', async () => {
    const project = await projectWithOneRecord()
    projects.push(project)
    const server = await serve(project)

    const local = await fetch(`${server.url}/records`, { headers: { origin: 'http://localhost:3000' } })
    expect(local.headers.get('access-control-allow-origin')).toBe('http://localhost:3000')

    const stranger = await fetch(`${server.url}/records`, { headers: { origin: 'https://example.com' } })
    expect(stranger.headers.get('access-control-allow-origin')).toBeNull()

    // An opaque origin arrives as the literal string "null" and is a
    // stranger like any other.
    const opaque = await fetch(`${server.url}/records`, { headers: { origin: 'null' } })
    expect(opaque.headers.get('access-control-allow-origin')).toBeNull()
  })

  it('names its routes at the root, so the contract is discoverable', async () => {
    const project = await projectWithOneRecord()
    projects.push(project)
    const server = await serve(project)

    const doc = await fetch(`${server.url}/`).then((r) => r.json())
    expect(doc.server).toBe('ursa-store')
    expect(doc.routes).toEqual(['/health', '/store', '/records', '/records/<id>', '/tuning'])

    const missing = await fetch(`${server.url}/nothing-here`)
    expect(missing.status).toBe(404)
  })

  it('refuses to write: the store server only ever reads', async () => {
    const project = await projectWithOneRecord()
    projects.push(project)
    const server = await serve(project)
    const before = listRecordIds(project)

    for (const method of ['POST', 'PUT', 'DELETE']) {
      const res = await fetch(`${server.url}/records`, { method })
      expect(res.status).toBe(404)
    }
    expect(listRecordIds(project)).toEqual(before)
  })
})

describe('the store payload read directly, without a socket', () => {
  it('is the same answer the server serves', async () => {
    const project = await projectWithOneRecord()
    projects.push(project)
    const server = await serve(project)

    const direct = storePayload(project)
    const served = await fetch(`${server.url}/store`).then((r) => r.json())
    // `readAt` is the one field that must differ, since each read stamps
    // its own moment; everything else is the same store seen twice.
    expect({ ...served, readAt: '' }).toEqual({ ...direct, readAt: '' })
  })

  it('reads no tuning store as an empty list, not as a failure', async () => {
    const project = await projectWithOneRecord()
    projects.push(project)
    expect(tuningUnits(project)).toEqual([])
  })
})
