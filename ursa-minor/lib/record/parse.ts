import type { OutcomeRecord } from './types'

/**
 * Read an unknown blob as an outcome record, or say why it is not one.
 *
 * A stranger loading their own `.ursa/records/<id>.json` will sometimes
 * load the wrong file: the tuning store next to it, a session log, a
 * truncated download. The viewer's job in that moment is to name the
 * file it got, not to throw a stack into a console the person is not
 * looking at. Every failure below returns a sentence a person can act
 * on.
 *
 * This validates the fields the page dereferences and nothing else. It
 * is not a schema validator and must not become one: the schema's
 * authority is `ursa-major`, and a second validator here would start
 * rejecting records the resolver considers valid.
 */
export type ParseResult =
  | { ok: true; record: OutcomeRecord }
  | { ok: false; error: string }

export function parseRecord(input: unknown): ParseResult {
  if (typeof input === 'string') {
    try {
      input = JSON.parse(input)
    } catch {
      return { ok: false, error: 'That is not JSON. An outcome record is a .json file.' }
    }
  }
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return { ok: false, error: 'An outcome record is a JSON object, and this is not one.' }
  }
  const r = input as Record<string, unknown>

  const task = r.task as Record<string, unknown> | undefined
  if (!task || typeof task.id !== 'string') {
    if (Array.isArray(r.units) || typeof r.tuning === 'object') {
      return {
        ok: false,
        error:
          'This looks like a tuning store rather than an outcome record. The record is the file under .ursa/records/.',
      }
    }
    return {
      ok: false,
      error: 'No task.id. An outcome record names the task it resolved.',
    }
  }
  if (!Array.isArray(r.files)) {
    return { ok: false, error: 'No files array. The record carries the finished work it classified.' }
  }
  if (!Array.isArray(r.generations)) {
    return { ok: false, error: 'No generations array. Without it there is no provenance to read.' }
  }
  if (!Array.isArray(r.conversations)) {
    return { ok: false, error: 'No conversations array.' }
  }
  const stats = r.stats as Record<string, unknown> | undefined
  if (!stats || typeof stats.byClass !== 'object' || stats.byClass === null) {
    return { ok: false, error: 'No stats.byClass. The summary of what survived is missing.' }
  }
  for (const [i, f] of (r.files as unknown[]).entries()) {
    const file = f as Record<string, unknown>
    if (typeof file?.text !== 'string' || !Array.isArray(file?.spans)) {
      return {
        ok: false,
        error: `files[${i}] has no text or no spans, so its provenance cannot be laid over it.`,
      }
    }
  }
  return { ok: true, record: input as unknown as OutcomeRecord }
}
