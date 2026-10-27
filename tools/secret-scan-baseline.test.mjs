// Every fault `tools/secret-scan-baseline.mjs` can return, driven rather than
// described, and the two properties of the partition that are the reason the
// file exists at all.
//
// NO CREDENTIAL-SHAPED STRING APPEARS IN THIS FILE, deliberately, and the
// reason is the incident this baseline was built for. On 2026-10-26 a test
// fixture in this directory was given a real-looking key id to prove a
// formatter never prints one, and the next commit replaced it, and the blob
// with the original in it is now permanently reachable from `main`. A suite
// for a suppression mechanism is the last place that should happen twice. It
// costs nothing to avoid here: the functions under test take hit OBJECTS,
// `{class, where, line, blob}`, and never text, so there is no scanning to do
// and no value to supply. Blob ids below are repeated hex digits, which are
// valid object ids in shape and name no object in any repository.
//
// WHY THE FAULTS ARE DRIVEN ONE AT A TIME. `baselineFault` returns on the
// first problem it finds, so a case that breaks two fields at once proves only
// that it found one of them. Each case below is otherwise-valid with exactly
// one thing wrong, which is what makes the returned code evidence about that
// condition.
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { FAULT, baselineFault, partitionHits } from './secret-scan-baseline.mjs'

const CLASSES = ['aws-access-key-id', 'openai-key', 'private-key-block']
const BLOB = 'a'.repeat(40)
const OTHER_BLOB = 'b'.repeat(40)

/** A valid entry, with one field overridden or deleted per case. */
function entry(over = {}) {
  const base = {
    blob: BLOB,
    class: 'aws-access-key-id',
    line: 72,
    where: 'tools/x.test.mjs',
    why_not_a_credential: 'the vendor publishes this literal as its documentation example',
    rotation_required: false,
    cites: 'docs/ideas.md 2026-10-27, and the security audit of the same day',
    accepted_on: '2026-10-27',
  }
  const merged = { ...base, ...over }
  for (const [k, v] of Object.entries(over)) if (v === undefined) delete merged[k]
  return merged
}

const file = (...entries) => JSON.stringify({ accepted: entries })
const load = (text) => baselineFault(text, CLASSES)
const hit = (over = {}) => ({ class: 'aws-access-key-id', where: 'tools/x.test.mjs', line: 72, blob: BLOB, ...over })

describe('baselineFault, the file as a whole', () => {
  it('treats an absent file as an empty baseline and not as a fault', () => {
    // A repository with nothing to accept carries no file, and that has to be
    // the quiet case or every clean repository fails this gate.
    const loaded = load(null)
    assert.equal(loaded.fault, null)
    assert.deepEqual(loaded.entries, [])
  })

  it('refuses a file that is not JSON', () => {
    assert.equal(load('{ accepted: [ }').fault.code, FAULT.UNPARSEABLE)
  })

  it('refuses a document with no accepted array', () => {
    // The dangerous shape: `{}` parses, reads as zero entries, and is
    // indistinguishable from a baseline someone meant to fill in.
    assert.equal(load('{}').fault.code, FAULT.SHAPE_WRONG)
    assert.equal(load('[]').fault.code, FAULT.SHAPE_WRONG)
    assert.equal(load('null').fault.code, FAULT.SHAPE_WRONG)
    assert.equal(load(file('not an object')).fault.code, FAULT.SHAPE_WRONG)
  })

  it('accepts a well-formed file and hands back its entries', () => {
    const loaded = load(file(entry()))
    assert.equal(loaded.fault, null)
    assert.equal(loaded.entries.length, 1)
  })

  it('ignores the _note key, which is the file documenting itself', () => {
    const text = JSON.stringify({ _note: 'why this file exists', accepted: [entry()] })
    assert.equal(load(text).fault, null)
  })
})

describe('baselineFault, one entry at a time', () => {
  for (const field of [
    'blob',
    'class',
    'line',
    'where',
    'why_not_a_credential',
    'rotation_required',
    'cites',
    'accepted_on',
  ]) {
    it(`refuses an entry with no ${field}`, () => {
      const fault = load(file(entry({ [field]: undefined }))).fault
      assert.equal(fault.code, FAULT.FIELD_INVALID)
      assert.match(fault.message, new RegExp(`\`${field}\``))
    })
  }

  it('refuses a field of the wrong type, and names the type it got', () => {
    assert.equal(load(file(entry({ line: '72' }))).fault.code, FAULT.FIELD_INVALID)
    assert.equal(load(file(entry({ rotation_required: 'false' }))).fault.code, FAULT.FIELD_INVALID)
    assert.match(load(file(entry({ cites: ['a'] }))).fault.detail, /array/)
  })

  it('refuses an empty reason, because an empty reason is not a reason', () => {
    assert.equal(load(file(entry({ why_not_a_credential: '   ' }))).fault.code, FAULT.FIELD_INVALID)
  })

  it('refuses a blob id that is not a full 40-character lowercase object id', () => {
    // A prefix would make the unit of acceptance a SET of objects. This is the
    // single most load-bearing validation in the file.
    for (const bad of ['ef90504da7db', BLOB.toUpperCase(), `${BLOB}0`, BLOB.slice(1), 'z'.repeat(40)]) {
      const fault = load(file(entry({ blob: bad }))).fault
      assert.equal(fault.code, FAULT.FIELD_INVALID, `expected a fault for ${bad}`)
      assert.match(fault.message, /40-character lowercase object id/)
    }
  })

  it('refuses a line number that is not a positive integer', () => {
    for (const bad of [0, -1, 1.5]) {
      assert.equal(load(file(entry({ line: bad }))).fault.code, FAULT.FIELD_INVALID)
    }
  })

  it('refuses a date that is not an ISO date', () => {
    assert.equal(load(file(entry({ accepted_on: '27 October 2026' }))).fault.code, FAULT.FIELD_INVALID)
  })

  it('refuses a class the scanner cannot report', () => {
    // An entry naming a class this table does not have can never match, so it
    // was written against a different pattern set and suppresses nothing.
    const fault = load(file(entry({ class: 'stripe-live-key' }))).fault
    assert.equal(fault.code, FAULT.CLASS_UNKNOWN)
    assert.match(fault.message, /stripe-live-key/)
  })

  it('refuses a field this format does not define, rather than ignoring it', () => {
    // `blobs` instead of `blob` would otherwise pass validation with the real
    // `blob` present and silently carry a key nobody reads.
    const fault = load(file(entry({ expires: '2027-01-01' }))).fault
    assert.equal(fault.code, FAULT.FIELD_UNKNOWN)
    assert.match(fault.message, /`expires`/)
  })

  it('refuses an entry that admits rotation is required', () => {
    // The one case where accepting is the wrong answer regardless of prose.
    const fault = load(file(entry({ rotation_required: true }))).fault
    assert.equal(fault.code, FAULT.ROTATION_REQUIRED)
  })

  it('refuses two entries accepting the same blob and class', () => {
    const fault = load(file(entry(), entry({ cites: 'a second write-up of the same object' }))).fault
    assert.equal(fault.code, FAULT.DUPLICATE_ENTRY)
  })

  it('allows two entries for the same blob under different classes', () => {
    // One object can legitimately match two patterns, and each match wants its
    // own sentence, so the key is the pair and not the blob.
    assert.equal(load(file(entry(), entry({ class: 'openai-key' }))).fault, null)
  })
})

describe('partitionHits', () => {
  const entries = load(file(entry())).entries

  it('moves a hit an entry accounts for out of the unaccounted set', () => {
    const split = partitionHits([hit()], entries, { full: true })
    assert.equal(split.fault, null)
    assert.deepEqual(split.unaccounted, [])
    assert.equal(split.accepted.length, 1)
    assert.equal(split.accepted[0].entry.blob, BLOB)
  })

  it('leaves a hit in a different blob of the same file unaccounted', () => {
    // The property the whole design exists for: an entry accepts one byte
    // sequence, so editing an accepted file produces a new object that is a
    // hit. Same path, same class, same line, different blob.
    const split = partitionHits([hit({ blob: OTHER_BLOB })], entries, { full: false })
    assert.equal(split.unaccounted.length, 1)
    assert.equal(split.accepted.length, 0)
  })

  it('leaves a different class in the same blob unaccounted', () => {
    const split = partitionHits([hit({ class: 'openai-key' })], entries, { full: false })
    assert.equal(split.unaccounted.length, 1)
  })

  it('never accounts for a working-tree hit, which carries no blob', () => {
    // `scanTree()` reports `{where, class, line}` with no blob, so the tree is
    // unsuppressible by construction rather than by rule. If this test ever
    // fails, the baseline has grown the ability to mute a live credential
    // sitting in a file on disk.
    const treeHit = { class: 'aws-access-key-id', where: 'tools/x.test.mjs', line: 72 }
    const split = partitionHits([treeHit], entries, { full: false })
    assert.deepEqual(split.unaccounted, [treeHit])
    assert.equal(split.accepted.length, 0)
  })

  it('keeps an unaccounted hit alongside an accepted one', () => {
    const extra = hit({ blob: OTHER_BLOB, where: 'tools/y.test.mjs', line: 9 })
    const split = partitionHits([hit(), extra], entries, { full: true })
    assert.equal(split.accepted.length, 1)
    assert.deepEqual(split.unaccounted, [extra])
  })

  it('refuses when an entry matches a blob at a line it does not describe', () => {
    // The entry's prose is then about something other than what it mutes.
    const split = partitionHits([hit({ line: 80 })], entries, { full: true })
    assert.equal(split.fault.code, FAULT.ENTRY_MISDESCRIBED)
    // And nothing is suppressed on the way out.
    assert.equal(split.accepted.length, 0)
    assert.equal(split.unaccounted.length, 1)
  })

  it('refuses a stale entry in a full history scan', () => {
    const split = partitionHits([], entries, { full: true })
    assert.equal(split.fault.code, FAULT.ENTRY_STALE)
    assert.match(split.fault.detail, /no longer reachable|no longer matches/)
  })

  it('does not call an entry stale outside a full history scan', () => {
    // A tree scan and a --since scan both deliberately exclude the blob an
    // entry names, so "nothing matched" is out of scope and not staleness.
    // Judging it there would turn every ordinary `node tools/secret-scan.mjs`
    // into an exit 2.
    const split = partitionHits([], entries, { full: false })
    assert.equal(split.fault, null)
    assert.deepEqual(split.unaccounted, [])
  })

  it('is a no-op with no entries', () => {
    const split = partitionHits([hit()], [], { full: true })
    assert.equal(split.fault, null)
    assert.equal(split.unaccounted.length, 1)
  })
})
