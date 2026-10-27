// The cited baseline `tools/secret-scan.mjs` reads, as pure functions.
//
//   import { baselineFault, partitionHits, FAULT } from './secret-scan-baseline.mjs'
//
// WHY THIS EXISTS, and whose decision it implements. On 2026-10-27 the first
// non-zero `node tools/secret-scan.mjs --history` this repository has ever
// produced reported one hit: class `aws-access-key-id`, blob
// `ef90504da7db771e9ca7bfb008e09fa820ef70aa`, in a test fixture at
// `tools/secret-scan-verdict.test.mjs:72`, from commit `88bb0bf3`. The tree is
// clean; the blob is only in history. `docs/ideas.md` of the same day names
// three dispositions and says all three are the owner's. Two of them are now
// closed by fact rather than by preference:
//
//   ONE, squash the branch so the flagged commit never reaches `main`. Closed:
//   `git merge-base --is-ancestor 88bb0bf3 origin/main` is true. It entered
//   through the merge of pull request 573, so there is no longer a merge to
//   shape. The security seat established this independently over 268 remote
//   refs and 6412 blobs and withdrew its own support for this option.
//
//   THREE, rewrite history. It would now rewrite the DEFAULT branch rather
//   than a side branch, and it invalidates the merge-base checks several open
//   pull requests depend on. Both seats recommend against it, and this file
//   exists so that nobody has to.
//
// TWO is this file: one entry naming one blob, with the sentence that says why
// the value is not a credential, in the shape `dep-floor.allow.json` already
// uses for an accepted advisory. The reason to want it is not tidiness. A
// permanent known hit makes the next real hit a second line in a report that
// already says one, and it would turn the security seat's queued credential
// gate red on the day it lands, every day, for a value that is a vendor's
// published documentation example.
//
// THE UNIT OF ACCEPTANCE IS A BLOB, WHICH IS THE WHOLE SAFETY ARGUMENT.
// `dep-floor.allow.json` keys on a package and an advisory id, which is a
// class of future findings: the entry suppresses tomorrow's report about the
// same package. That shape is wrong here and would be dangerous. An entry
// keyed on a PATH mutes every future credential anyone ever commits to that
// path; an entry keyed on a CLASS mutes a whole vendor. A blob id is
// content-addressed, so an entry pins exactly one byte sequence. Change one
// character of that file and git writes a new object with a new id, which no
// entry matches, which is a hit. There is no edit to an accepted file that
// this baseline can hide.
//
// AND IT CANNOT TOUCH THE WORKING TREE AT ALL, by construction rather than by
// rule. `scanTree()` reports hits as `{where, class, line}` with no `blob`
// field, because a tracked file is read from disk and never hashed. Matching
// requires a blob id on both sides, so a tree hit matches no entry, so
// `node tools/secret-scan.mjs` over the working tree is unsuppressible. The
// baseline can only ever account for an object that is already immutable and
// already published. That asymmetry is deliberate: the tree is where a live
// credential actually arrives, and the tree is the one surface with no
// suppression mechanism.
//
// WHY THERE IS NO `expires`. `dep-floor.allow.json` expires its entries on
// purpose, so an accepted risk comes back and asks again, because upstream may
// publish a fix and the right answer can change. Nothing about a blob in git
// history can change. The object is immutable and permanently reachable, so an
// expiry date would fire on a day when no action is available, and the only
// available response would be to bump the date. An expiry that can only ever
// be rubber-stamped teaches a reader to rubber-stamp, which is worse than not
// having one. What replaces it is the staleness check below: an entry that
// stops accounting for anything is a fault, so the file cannot quietly fill up
// with entries that suppress nothing.
//
// WHY A FAULT IS RETURNED AND NOT THROWN, and why this is a separate file.
// `tools/secret-scan.mjs` builds its arguments, scans and exits at module
// scope, so importing it runs a scan and these branches were unreachable from
// a test. This is the same split as `tools/board/live-target.mjs` out of
// `tools/board/post.mjs`, `tools/board/sender.mjs` out of the same file, and
// `tools/ledger/block-kinds.mjs` out of `tools/ledger/check.mjs`. The class
// table lives in the scanner and is passed in rather than imported, for
// exactly that reason: importing it to read one constant would scan the
// repository as a side effect.
//
// NO VALUE EVER CROSSES THIS BOUNDARY. The scanner's rule is that the matching
// text is never printed, quoted or copied, not even truncated, not even in
// `--json`. No function here takes a credential value and no field of an entry
// holds one. An entry is a blob id, a class name, a line number, a path and
// prose. A baseline is a formatting-and-suppression surface, which is exactly
// where a value gets written down "just for reference".

/** One fault code per repair. A reader of any of these knows what to edit. */
export const FAULT = {
  /** The file is present and is not JSON. */
  UNPARSEABLE: 'BASELINE_UNPARSEABLE',
  /** Parsed, but not an object carrying an `accepted` array. */
  SHAPE_WRONG: 'BASELINE_SHAPE_WRONG',
  /** An entry is missing a required field, or its type is wrong. */
  FIELD_INVALID: 'BASELINE_FIELD_INVALID',
  /** An entry carries a field this format does not define, which is how a
   *  misspelled key becomes a silently ignored one. */
  FIELD_UNKNOWN: 'BASELINE_FIELD_UNKNOWN',
  /** An entry accepts a class the scanner cannot produce, so it can never
   *  match and was written against a different pattern table. */
  CLASS_UNKNOWN: 'BASELINE_CLASS_UNKNOWN',
  /** An entry says rotation is required. A live credential is not a thing to
   *  accept, and the baseline refuses to be the place that records one. */
  ROTATION_REQUIRED: 'BASELINE_ROTATION_REQUIRED',
  /** Two entries accept the same blob and class, so which prose is the record
   *  of the decision is unanswerable. */
  DUPLICATE_ENTRY: 'BASELINE_DUPLICATE_ENTRY',
  /** An entry matched a hit but describes it wrongly, so its prose is about
   *  something other than what it suppresses. */
  ENTRY_MISDESCRIBED: 'BASELINE_ENTRY_MISDESCRIBED',
  /** A full history scan found nothing for this entry to account for. */
  ENTRY_STALE: 'BASELINE_ENTRY_STALE',
}

/** Every field an entry may carry, each with the job it does. A field with no
 *  job is a field nobody maintains, so the set is closed and
 *  `FAULT.FIELD_UNKNOWN` refuses anything outside it. */
const FIELDS = {
  /** The unit of acceptance: one full 40-hex object id. See the header. */
  blob: 'string',
  /** The credential class, which must be one the scanner's table can emit. */
  class: 'string',
  /** The line within the blob, asserted against the scan on every run. */
  line: 'number',
  /** Documentation only, NEVER asserted. A blob can be reachable at many
   *  paths and the scanner reports the first one `git rev-list --objects`
   *  happens to name, which is a function of ref order rather than of the
   *  object. Asserting it would make the gate flap when a ref is added. */
  where: 'string',
  /** The sentence. Why this value, specifically, is not a credential. */
  why_not_a_credential: 'string',
  /** Must be false. An entry that admits otherwise is refused outright. */
  rotation_required: 'boolean',
  /** Where the reasoning lives in full, so the one line here is auditable
   *  against a document rather than being the whole record. */
  cites: 'string',
  /** ISO date, so the age of an acceptance is readable without git. */
  accepted_on: 'string',
}

const REQUIRED = Object.keys(FIELDS)
const HEX40 = /^[0-9a-f]{40}$/
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

const fault = (code, message, detail) => ({ code, message, detail })

/**
 * Everything that can be decided about the baseline file before a scan runs:
 * its syntax, its shape, and every field of every entry. Decided here so a
 * malformed baseline is an exit 2 rather than a suppression set of unknown
 * size, which is the one outcome worse than no baseline at all.
 *
 * @param {string | null} text the file's contents, or null if it is absent.
 *   Absent is not a fault: a repository with nothing to accept carries no file.
 * @param {string[]} knownClasses the scanner's class names, passed in rather
 *   than imported. See the header.
 * @returns {{fault: null, entries: object[]} | {fault: object, entries: []}}
 */
export function baselineFault(text, knownClasses) {
  if (text === null || text === undefined) return { fault: null, entries: [] }

  let doc
  try {
    doc = JSON.parse(text)
  } catch (err) {
    return {
      fault: fault(
        FAULT.UNPARSEABLE,
        'the baseline file is not valid JSON, so the set of accepted hits is unknown',
        err.message
      ),
      entries: [],
    }
  }

  if (doc === null || typeof doc !== 'object' || Array.isArray(doc) || !Array.isArray(doc.accepted)) {
    return {
      fault: fault(
        FAULT.SHAPE_WRONG,
        'the baseline file must be an object with an `accepted` array',
        'an absent or non-array `accepted` reads as zero entries, which is indistinguishable from an empty baseline'
      ),
      entries: [],
    }
  }

  const seen = new Set()
  for (const [i, entry] of doc.accepted.entries()) {
    const at = `accepted[${i}]`
    if (entry === null || typeof entry !== 'object' || Array.isArray(entry)) {
      return {
        fault: fault(FAULT.SHAPE_WRONG, `${at} is not an object`, 'every entry is one accepted blob'),
        entries: [],
      }
    }

    for (const key of Object.keys(entry)) {
      if (!(key in FIELDS)) {
        return {
          fault: fault(
            FAULT.FIELD_UNKNOWN,
            `${at} carries the field \`${key}\`, which this format does not define`,
            `a misspelled key is otherwise ignored in silence; the defined fields are ${REQUIRED.join(', ')}`
          ),
          entries: [],
        }
      }
    }

    for (const key of REQUIRED) {
      if (!(key in entry)) {
        return {
          fault: fault(
            FAULT.FIELD_INVALID,
            `${at} is missing the required field \`${key}\``,
            'every field is required, so an acceptance cannot be recorded without its reason'
          ),
          entries: [],
        }
      }
      if (typeof entry[key] !== FIELDS[key]) {
        return {
          fault: fault(
            FAULT.FIELD_INVALID,
            `${at}.${key} must be a ${FIELDS[key]}`,
            `it is a ${Array.isArray(entry[key]) ? 'array' : typeof entry[key]}`
          ),
          entries: [],
        }
      }
      if (FIELDS[key] === 'string' && entry[key].trim() === '') {
        return {
          fault: fault(
            FAULT.FIELD_INVALID,
            `${at}.${key} is empty`,
            'an empty reason is not a reason, and an empty identifier matches nothing'
          ),
          entries: [],
        }
      }
    }

    if (!HEX40.test(entry.blob)) {
      return {
        fault: fault(
          FAULT.FIELD_INVALID,
          `${at}.blob must be a full 40-character lowercase object id`,
          'a prefix would make the unit of acceptance a set of objects rather than one object'
        ),
        entries: [],
      }
    }
    if (!ISO_DATE.test(entry.accepted_on)) {
      return {
        fault: fault(FAULT.FIELD_INVALID, `${at}.accepted_on must be an ISO date, YYYY-MM-DD`, entry.accepted_on),
        entries: [],
      }
    }
    if (!Number.isInteger(entry.line) || entry.line < 1) {
      return {
        fault: fault(FAULT.FIELD_INVALID, `${at}.line must be a positive integer`, String(entry.line)),
        entries: [],
      }
    }
    if (!knownClasses.includes(entry.class)) {
      return {
        fault: fault(
          FAULT.CLASS_UNKNOWN,
          `${at}.class is \`${entry.class}\`, which is not a class this scanner can report`,
          'the entry can therefore never match; it was written against a different pattern table'
        ),
        entries: [],
      }
    }
    if (entry.rotation_required !== false) {
      return {
        fault: fault(
          FAULT.ROTATION_REQUIRED,
          `${at} says rotation is required, and a credential that needs rotating is not a hit to accept`,
          "rotation is the owner's action; remove the entry and report the hit"
        ),
        entries: [],
      }
    }

    const key = `${entry.blob} ${entry.class}`
    if (seen.has(key)) {
      return {
        fault: fault(
          FAULT.DUPLICATE_ENTRY,
          `${at} accepts a blob and class an earlier entry already accepts`,
          'two justifications for one object leave no answer to which one is the record of the decision'
        ),
        entries: [],
      }
    }
    seen.add(key)
  }

  return { fault: null, entries: doc.accepted }
}

/**
 * Split a scan's hits into the ones a baseline entry accounts for and the ones
 * it does not, and decide whether the baseline itself is in good standing.
 *
 * @param {object[]} hits the scan's hits, each `{class, where, line, blob?}`.
 * @param {object[]} entries validated entries from `baselineFault`.
 * @param {{full: boolean}} scope `full` is true only for a complete history
 *   scan, meaning `--history` with no `--since`. It is the only scope that
 *   walks every blob in every ref, so it is the only one in which "no hit
 *   matched this entry" means the entry is stale rather than out of scope.
 * @returns {{unaccounted: object[], accepted: object[], fault: object | null}}
 */
export function partitionHits(hits, entries, scope = { full: false }) {
  const unaccounted = []
  const accepted = []
  const used = new Set()

  for (const hit of hits) {
    // No blob, no match: a working-tree hit is never suppressible. See header.
    const entry = hit.blob ? entries.find((e) => e.blob === hit.blob && e.class === hit.class) : undefined
    if (!entry) {
      unaccounted.push(hit)
      continue
    }
    if (entry.line !== hit.line) {
      return {
        unaccounted: hits,
        accepted: [],
        fault: fault(
          FAULT.ENTRY_MISDESCRIBED,
          `a baseline entry accepts ${entry.class} in ${entry.where} at line ${entry.line}, but the scan matched that blob at line ${hit.line}`,
          'the entry suppresses something other than what its reason describes, so neither can be trusted'
        ),
      }
    }
    used.add(`${entry.blob} ${entry.class}`)
    accepted.push({ entry, hit })
  }

  if (scope.full) {
    const stale = entries.find((e) => !used.has(`${e.blob} ${e.class}`))
    if (stale) {
      return {
        unaccounted: hits,
        accepted: [],
        fault: fault(
          FAULT.ENTRY_STALE,
          `a baseline entry accepts ${stale.class} in ${stale.where}, and a full history scan found nothing for it to account for`,
          'either the object is no longer reachable, or it no longer matches that class; both want the entry deleted rather than kept'
        ),
      }
    }
  }

  return { unaccounted, accepted, fault: null }
}
