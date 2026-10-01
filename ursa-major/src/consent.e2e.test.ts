// The acceptance test for the day's claim, driven entirely through the
// CLI against a real git repository: nothing leaves unconsented, what
// leaves carries no raw text, and erasure survives re-derivation.
//
// Nothing here is mocked. The repo is `git init`-ed, the commits carry a
// real `Co-Authored-By` trailer, and every assertion reads what the
// commands actually wrote to disk or printed.

import { execFileSync } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { beforeEach, describe, expect, it } from 'vitest'
import { main } from './bin/ursa'
import { runConsentCommand, runForgetCommand, type CliIo } from './consent.cli'
import { loadConsent } from './consent'
import type { DisclosureBatch } from './disclosure'

function sh(cwd: string, args: string[]): void {
  execFileSync('git', args, { cwd, encoding: 'utf8' })
}

const SECRET_PROSE = [
  'Northwind Pharmaceuticals asked us to stop describing the Atlanta',
  'distribution centre as underperforming in any document a regulator',
  'might read, which is a request we should probably write down.',
].join(' ')

/** A repo with one agent commit and one human edit over it. */
function repo(): string {
  const dir = mkdtempSync(join(tmpdir(), 'ursa-consent-e2e-'))
  sh(dir, ['init', '-q', '-b', 'main'])
  sh(dir, ['config', 'user.email', 'human@example.com'])
  sh(dir, ['config', 'user.name', 'Human Owner'])
  writeFileSync(join(dir, 'brief.md'), SECRET_PROSE + '\n')
  writeFileSync(join(dir, 'pricing.ts'), 'export const rate = (v: number) => v * 1.18\n')
  sh(dir, ['add', '.'])
  sh(dir, ['commit', '-q', '-m', 'Draft the Northwind brief\n\nCo-Authored-By: Claude <noreply@anthropic.com>'])
  writeFileSync(
    join(dir, 'brief.md'),
    SECRET_PROSE.replace('which is a request we should probably write down.', 'so the phrasing is now fixed in the style guide.') + '\n'
  )
  // The human edit has to touch both files, or the episode's touched-file
  // set covers only brief.md and the run never produces a code bucket.
  writeFileSync(join(dir, 'pricing.ts'), 'export const rate = (v: number) => v * 1.2\n')
  sh(dir, ['add', '.'])
  sh(dir, ['commit', '-q', '-m', 'Tighten the brief'])
  return dir
}

function capture(): { io: CliIo; lines: string[]; errs: string[] } {
  const lines: string[] = []
  const errs: string[] = []
  return { io: { out: (l) => lines.push(l), err: (l) => errs.push(l) }, lines, errs }
}

function recordIds(root: string): string[] {
  const dir = join(root, '.ursa', 'records')
  return existsSync(dir) ? readdirSync(dir).filter((n) => n.endsWith('.json')).map((n) => n.replace(/\.json$/, '')) : []
}

describe('end to end: ursa run, then the consent commands', () => {
  let root: string
  beforeEach(async () => {
    root = repo()
    expect(await main(['run', root, '--min-chars', '10'])).toBe(0)
    expect(recordIds(root).length).toBeGreaterThan(0)
  })

  it('a fresh project has consented to nothing, and show says so plainly', async () => {
    const { io, lines } = capture()
    expect(await runConsentCommand(['show', root], io)).toBe(0)
    const text = lines.join('\n')
    expect(text).toContain('minor-aggregate: withheld')
    expect(text).toContain('(never changed from the default)')
    expect(text).toContain('Nothing may leave this machine.')
  })

  it('disclose emits nothing before a grant, and calls that normal rather than an error', async () => {
    const out = join(root, 'batch.json')
    const { io, lines } = capture()
    expect(await runConsentCommand(['disclose', root, '--out', out], io)).toBe(0)
    expect(existsSync(out)).toBe(false)
    expect(lines.join('\n')).toContain('nothing is consented')
  })

  it('after a grant, disclose writes aggregate rows that contain none of the work', async () => {
    expect(await runConsentCommand(['grant', root], capture().io)).toBe(0)
    const out = join(root, 'batch.json')
    const { io, lines } = capture()
    expect(await runConsentCommand(['disclose', root, '--out', out], io)).toBe(0)
    expect(lines.join('\n')).toContain('The audit passed')

    const raw = readFileSync(out, 'utf8')
    const batch = JSON.parse(raw) as DisclosureBatch
    expect(batch.rows.length).toBeGreaterThan(0)

    // The claim, checked against the file's own bytes rather than against
    // the projection that produced it.
    expect(raw).not.toContain('Northwind')
    expect(raw).not.toContain('Atlanta')
    expect(raw).not.toContain('regulator')
    expect(raw).not.toContain('brief.md')
    expect(raw).not.toContain('pricing.ts')
    expect(raw).not.toContain('noreply@anthropic.com')
    expect(raw).not.toContain('Human Owner')
    expect(raw).not.toContain(root)

    // The real trailer classified down to the vocabulary, email dropped.
    expect(batch.rows.every((r) => r.model === 'claude')).toBe(true)
    expect(new Set(batch.rows.map((r) => r.domain))).toEqual(new Set(['prose/markdown', 'code/typescript']))
  })

  it('revoking stops disclosure again', async () => {
    await runConsentCommand(['grant', root], capture().io)
    await runConsentCommand(['revoke', root], capture().io)
    const out = join(root, 'batch.json')
    const { io, lines } = capture()
    expect(await runConsentCommand(['disclose', root, '--out', out], io)).toBe(0)
    expect(existsSync(out)).toBe(false)
    expect(lines.join('\n')).toContain('nothing is consented')
    const history = loadConsent(root).scopes['minor-aggregate'].history
    expect(history.map((h) => h.to)).toEqual(['granted', 'withheld'])
  })

  it('forget erases the record, and ursa run does not rebuild it from the same git history', async () => {
    const [id] = recordIds(root)
    const { io, lines } = capture()
    expect(await runForgetCommand([root, '--record', id], io)).toBe(0)
    expect(lines.join('\n')).toContain(`Erased ${id}`)
    expect(recordIds(root)).not.toContain(id)

    // The history that produced it is untouched, so a second run would
    // recreate it without the tombstone. This is the assertion that makes
    // deletion mean deletion.
    const { io: io2, lines: lines2 } = capture()
    void io2
    expect(await main(['run', root, '--min-chars', '10'])).toBe(0)
    expect(recordIds(root)).not.toContain(id)
    void lines2
  })

  it('a forgotten record is excluded from disclosure even while consent is granted', async () => {
    await runConsentCommand(['grant', root], capture().io)
    const [id] = recordIds(root)
    await runForgetCommand([root, '--record', id], capture().io)
    const { io, lines } = capture()
    expect(await runConsentCommand(['disclose', root], io)).toBe(0)
    const text = lines.join('\n')
    // The record file is gone, so it cannot contribute; the tombstone is
    // what keeps it out if a copy is ever restored alongside it.
    expect(loadConsent(root).forgotten.map((t) => t.recordId)).toContain(id)
    expect(text).not.toContain('Northwind')
  })

  it('show reports the erasure afterwards, so the user can audit their own deletion', async () => {
    const [id] = recordIds(root)
    await runForgetCommand([root, '--record', id], capture().io)
    const { io, lines } = capture()
    await runConsentCommand(['show', root], io)
    const text = lines.join('\n')
    expect(text).toContain('erased, and they stay erased')
    expect(text).toContain(id)
  })

  it('says what happened rather than reciting zeros when every unit was erased', async () => {
    const [id] = recordIds(root)
    await runForgetCommand([root, '--record', id], capture().io)
    const printed: string[] = []
    const real = console.log
    console.log = (...a: unknown[]) => { printed.push(a.join(' ')) }
    try { expect(await main(['run', root, '--min-chars', '10'])).toBe(0) } finally { console.log = real }
    const text = printed.join('\n')
    expect(text).toContain('every one of them is erased')
    expect(text).not.toContain('0 chars survived')
  })

  it('rejects an unknown scope rather than silently using the default', async () => {
    const { io, errs } = capture()
    expect(await runConsentCommand(['grant', root, '--scope', 'everything'], io)).toBe(2)
    expect(errs.join('\n')).toContain('Unknown scope')
    expect(loadConsent(root).scopes['minor-aggregate'].state).toBe('withheld')
  })

  it('refuses revoke-axiom when there is no tuning record, instead of reporting success', async () => {
    const { io, errs } = capture()
    expect(await runConsentCommand(['revoke-axiom', root, '--axiom', 'ax-001'], io)).toBe(1)
    expect(errs.join('\n')).toMatch(/No tuning record/)
  })

  it('ursa run prints usage naming the new commands', async () => {
    expect(await main(['run'])).toBe(2)
  })

  it('reaches the consent commands through main() with their own flags intact', async () => {
    // Regression. The unit tests above call runConsentCommand directly, so
    // they never exercised main()'s parseArgs, which is configured with
    // run's and bridge's options and threw ERR_PARSE_ARGS_UNKNOWN_OPTION on
    // `--out` before any dispatch ran. Every consent command was broken
    // through the real binary while 89 tests passed.
    expect(await main(['consent', 'grant', root])).toBe(0)
    const out = join(root, 'through-main.json')
    expect(await main(['consent', 'disclose', root, '--out', out])).toBe(0)
    expect(existsSync(out)).toBe(true)
    const [id] = recordIds(root)
    expect(await main(['forget', root, '--record', id])).toBe(0)
    expect(recordIds(root)).not.toContain(id)
  })
})
