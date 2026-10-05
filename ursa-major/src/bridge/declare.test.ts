// Overlay S0's unmet clause: "tails the session log, reads the verdict,
// writes records with it" (plan §16.7). These tests run against real
// records produced by `ursa run` over a real git repo, so what they
// assert is what lands on the owner's disk, not a hand-built literal.

import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { main } from '../bin/ursa'
import { listRecordIds, loadRecord } from '../store'
import { NO_VERDICT, type Verdict } from '../verdict'
import { applyVerdict, declarationFromVerdict, VERDICT_NOTE_PREFIX } from './declare'

const SATISFIED: Verdict = {
  accepted: true,
  step: 730,
  quote: 'yesss finallyyy!! lol',
  basis: 'read-from-chat',
  confidence: 'stated',
}

const UNSATISFIED: Verdict = {
  accepted: false,
  step: 41,
  quote: 'i was dissatisfied with that product',
  basis: 'read-from-chat',
  confidence: 'stated',
}

function sh(cwd: string, cmd: string, args: string[]) {
  execFileSync(cmd, args, { cwd, env: process.env, encoding: 'utf8' })
}

/** A project with one generated→edited commit pair, the M0 shape. */
async function projectWithRecords(): Promise<string> {
  const dir = mkdtempSync(join(tmpdir(), 'ursa-declare-'))
  sh(dir, 'git', ['init', '-q', '-b', 'main'])
  sh(dir, 'git', ['config', 'user.email', 'human@example.com'])
  sh(dir, 'git', ['config', 'user.name', 'Human Owner'])
  const gen = [
    'export function digest() {',
    '  const items = fetchItems()',
    "  const summary = items.map(formatItem).join('\\n')",
    "  return 'DIGEST — the latest research, summarized for you.\\n' + summary",
    '}',
    'function formatItem(i) { return `- ${i.title}: ${i.claim} — why it matters: ${i.why}` }',
  ].join('\n')
  writeFileSync(join(dir, 'digest.js'), gen + '\n')
  sh(dir, 'git', ['add', '.'])
  sh(dir, 'git', ['commit', '-q', '-m', 'Generate digest module\n\nCo-Authored-By: Claude <noreply@anthropic.com>'])
  writeFileSync(join(dir, 'digest.js'), gen.replace('why it matters', 'so what') + '\n')
  sh(dir, 'git', ['add', '.'])
  sh(dir, 'git', ['commit', '-q', '-m', 'Tighten digest prose'])
  await main(['run', dir])
  return dir
}

describe('declarationFromVerdict', () => {
  it('maps a null reading to undeclared — silence is never acceptance', () => {
    const d = declarationFromVerdict(NO_VERDICT)
    expect(d.accepted).toBeNull()
    expect(d.basis).toContain('retention is NOT acceptance')
  })

  it('carries the step and the verbatim quote into the basis, so the label is auditable', () => {
    const d = declarationFromVerdict(SATISFIED)
    expect(d.accepted).toBe(true)
    expect(d.basis).toContain('step 730')
    expect(d.basis).toContain('yesss finallyyy!! lol')
  })

  it('an unsatisfied reading says survived text is not endorsed text', () => {
    const d = declarationFromVerdict(UNSATISFIED)
    expect(d.accepted).toBe(false)
    expect(d.basis).toContain('not endorsed')
  })
})

describe('applyVerdict over a real project', () => {
  it('writes the chat-read verdict into every record as its declaration', async () => {
    const project = await projectWithRecords()
    const ids = listRecordIds(project)
    expect(ids.length).toBeGreaterThan(0)
    // before: `ursa run` with no --declare leaves every record undeclared
    expect(loadRecord(project, ids[0])!.signals!.episode.accepted).toBeNull()

    const applied = applyVerdict(project, SATISFIED)
    expect(applied.changed).toEqual(ids)

    const episode = loadRecord(project, ids[0])!.signals!.episode
    expect(episode.accepted).toBe(true)
    expect(episode.acceptanceStatedInChat).toBe(true)
    expect(episode.acceptanceBasis).toContain('yesss finallyyy!! lol')
  })

  it('is idempotent: a second call rewrites nothing and piles up no notes', async () => {
    const project = await projectWithRecords()
    const first = applyVerdict(project, SATISFIED)
    expect(first.changed.length).toBeGreaterThan(0)

    const second = applyVerdict(project, SATISFIED)
    expect(second.changed).toEqual([])
    expect(second.declared).toEqual(first.declared)

    const notes = loadRecord(project, first.declared[0])!.signals!.notes ?? []
    expect(notes.filter((n) => n.startsWith(VERDICT_NOTE_PREFIX))).toHaveLength(1)
  })

  it('a session with no stated verdict writes nothing at all', async () => {
    const project = await projectWithRecords()
    const id = listRecordIds(project)[0]
    const before = readFileSync(join(project, '.ursa', 'records', `${id}.json`), 'utf8')

    const applied = applyVerdict(project, NO_VERDICT)
    expect(applied.changed).toEqual([])
    expect(applied.declared).toEqual([])
    expect(readFileSync(join(project, '.ursa', 'records', `${id}.json`), 'utf8')).toBe(before)
  })

  it('a later silent session does not retract a verdict already on disk', async () => {
    const project = await projectWithRecords()
    applyVerdict(project, SATISFIED)
    applyVerdict(project, NO_VERDICT)
    expect(loadRecord(project, listRecordIds(project)[0])!.signals!.episode.accepted).toBe(true)
  })

  it('keeps existing annotations and rewrites only the episode block', async () => {
    const project = await projectWithRecords()
    const id = listRecordIds(project)[0]
    const record = loadRecord(project, id)!
    record.signals = {
      ...record.signals!,
      method: 'manual-annotation',
      correctionLoops: [{
        id: 'loop-A',
        theme: 'stop writing marketing copy',
        targetFiles: ['digest.js'],
        openedStep: 4,
        promptSteps: [4, 9, 17],
        recurrences: 2,
        regressionSteps: [],
        closedStep: 21,
        resolution: 'accepted',
        resolvingSteps: [21],
        discoveredSpec: 'the digest states the claim, never sells it',
      }],
      notes: ['hand-annotated during the n=1 trial'],
    }
    writeFileSync(join(project, '.ursa', 'records', `${id}.json`), JSON.stringify(record, null, 2) + '\n')

    applyVerdict(project, UNSATISFIED)

    const after = loadRecord(project, id)!.signals!
    expect(after.method).toBe('manual-annotation')
    expect(after.correctionLoops).toHaveLength(1)
    expect(after.correctionLoops[0].promptSteps).toEqual([4, 9, 17])
    expect(after.notes).toContain('hand-annotated during the n=1 trial')
    expect(after.episode.accepted).toBe(false)
  })
})
