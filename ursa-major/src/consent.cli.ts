// `ursa consent` and `ursa forget`: the commands behind "see, edit,
// revoke, and delete". Kept in their own module so `bin/ursa.ts` gains
// one dispatch branch rather than a second personality.
//
//   ursa consent show     <project>
//   ursa consent grant    <project> [--scope minor-aggregate]
//   ursa consent revoke   <project> [--scope minor-aggregate]
//   ursa consent disclose <project> [--out <file>]
//   ursa consent revoke-axiom <project> --axiom ax-003
//   ursa consent release-blocked <project> --index 1
//   ursa forget <project> --record <recordId>
//
// One decision worth stating because the opposite is the obvious build:
// `disclose` has no `--audit` flag. The audit always runs, and a single
// finding means the file is not written and the command exits 1. An
// opt-in audit is a check that gets skipped on the day it would have
// mattered, and the whole value of this boundary is that it holds when
// nobody is watching it.

import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { join, resolve as absPath } from 'node:path'
import type { OutcomeRecord } from './types'
import { ursaDir } from './store'
import {
  type ConsentRecord,
  type DisclosureScope,
  SCOPES,
  forget,
  grantScope,
  isGranted,
  loadConsent,
  revokeScope,
  tuningPathFor,
} from './consent'
import { auditBatch, projectForMinor } from './disclosure'
import { releaseBlocked, revokeAxiom } from './tuning/revoke'
import { allRevocationTwins, revocationTwins, type RevocationTwin } from './tuning/revocation'
import type { TuningRecord } from './tuning/types'

export interface CliIo {
  out: (line: string) => void
  err: (line: string) => void
}

const stdio: CliIo = { out: (l) => console.log(l), err: (l) => console.error(l) }

export function loadRecords(projectRoot: string): OutcomeRecord[] {
  const dir = join(ursaDir(projectRoot), 'records')
  if (!existsSync(dir)) return []
  return readdirSync(dir)
    .filter((n) => n.endsWith('.json'))
    .sort()
    .map((n) => JSON.parse(readFileSync(join(dir, n), 'utf8')) as OutcomeRecord)
}

function flag(argv: string[], name: string): string | undefined {
  const i = argv.indexOf(`--${name}`)
  return i >= 0 ? argv[i + 1] : undefined
}

function scopeFrom(argv: string[], io: CliIo): DisclosureScope | null {
  const raw = flag(argv, 'scope') ?? 'minor-aggregate'
  if (!SCOPES.includes(raw as DisclosureScope)) {
    io.err(`Unknown scope "${raw}". Scopes that exist: ${SCOPES.join(', ')}`)
    return null
  }
  return raw as DisclosureScope
}

/**
 * One line of a twin report, used by both `revoke-axiom` and `show` so
 * the same pair is described the same way in both places.
 *
 * The score is printed as a share of words rather than as 0.714, for the
 * same reason the blocked listing above does it: the number is only
 * there so she can tell a close pair from a borderline one, and a bare
 * decimal invites her to read a precision this score does not have.
 */
function printTwin(t: RevocationTwin, io: CliIo, indent = '      '): void {
  io.out(`${indent}${t.id}  sharing ${Math.round(t.score * 100)}% of its words: "${t.statement}"`)
  if (t.status === 'user-edited') {
    io.out(`${indent}    You wrote or released this one yourself, so no distillation pass put it there.`)
  }
}

function describe(consent: ConsentRecord, projectRoot: string, io: CliIo): void {
  io.out(`Consent for ${projectRoot}`)
  io.out('')
  for (const scope of SCOPES) {
    const s = consent.scopes[scope]
    const when = s.changedAt ? ` since ${s.changedAt}` : ' (never changed from the default)'
    io.out(`  ${scope}: ${s.state}${when}`)
    for (const h of s.history.slice(-5)) {
      io.out(`      ${h.at}  ${h.from} to ${h.to}  via ${h.by}`)
    }
  }
  io.out('')
  const records = loadRecords(projectRoot)
  io.out(`  ${records.length} record${records.length === 1 ? '' : 's'} on disk, all of them local.`)
  const tPath = tuningPathFor(projectRoot)
  if (existsSync(tPath)) {
    const tuning = JSON.parse(readFileSync(tPath, 'utf8')) as TuningRecord
    const active = tuning.axioms.filter((a) => a.status !== 'revoked')
    io.out(`  ${tuning.axioms.length} inferences, ${active.length} active and ${tuning.axioms.length - active.length} revoked.`)
    for (const a of active) {
      io.out(`      ${a.id}  ${a.polarity}: ${a.statement}  (${a.domain}, x${a.evidenceCount})`)
    }
    // Revocations that only half took effect. This is the surface that
    // reaches records which already exist, and it is the reason the twin
    // report is not only wired into `revoke-axiom`: a report that fires
    // at the moment of revocation helps revocations made from today on,
    // while every tuning record on disk right now was written by the old
    // create path that produced these pairs. She should not have to
    // revoke something a second time to find out the first one was
    // incomplete.
    const pairs = allRevocationTwins(tuning)
    if (pairs.length > 0) {
      io.out('')
      io.out(pairs.length === 1
        ? '  One thing you revoked is still being said by an inference you hold:'
        : `  ${pairs.length} things you revoked are still being said by inferences you hold:`)
      for (const p of pairs) {
        io.out(`      ${p.revoked.id}, which you revoked: "${p.revoked.statement}"`)
        for (const t of p.twins) printTwin(t, io, '          still active: ')
      }
      io.out(`  This happens because an inference written before the store checked for it could be the same rule twice under two ids, and withdrawing one id leaves the other one working. Withdraw the rest with \`ursa consent revoke-axiom ${projectRoot} --axiom <id>\`, or leave them. Nothing above was changed for you.`)
    }

    // The gate's own output, printed here and nowhere else. A block that
    // the user cannot read is a silent deletion of something a model
    // thought it had learned about her, which is the same class of thing
    // this command exists to prevent.
    const blocked = tuning.blockedByRevocation ?? []
    if (blocked.length > 0) {
      io.out('')
      io.out(`  ${blocked.length} statement${blocked.length === 1 ? '' : 's'} held back, because a later distillation restated something you revoked:`)
      for (const [i, b] of blocked.entries()) {
        io.out(`      ${i + 1}.  ${b.polarity}: ${b.statement}`)
        io.out(`          restates ${b.blockedBy}, sharing ${Math.round(b.score * 100)}% of its words, produced ${b.occurrences} time${b.occurrences === 1 ? '' : 's'}, last on ${b.lastBlocked}`)
      }
      io.out('  Nothing in that list reaches any model. If one of them is genuinely a new rule rather than the old one reworded, `ursa consent release-blocked <project> --index <n>` makes it an inference you own.')
    }
  } else {
    io.out('  No inferences yet. Nothing has been derived about you.')
  }
  if (consent.forgotten.length > 0) {
    io.out('')
    io.out(`  ${consent.forgotten.length} record${consent.forgotten.length === 1 ? '' : 's'} erased, and they stay erased:`)
    for (const t of consent.forgotten) {
      io.out(`      ${t.recordId}  at ${t.forgottenAt}  ${t.removed.axiomsDeleted.length} inferences deleted, ${t.removed.evidenceStripped} evidence entries stripped`)
    }
  }
  io.out('')
  io.out(isGranted(consent, 'minor-aggregate')
    ? 'Aggregate survival numbers may leave this machine. Your work, your prompts and your corrections may not, and `ursa consent disclose` proves it before it writes anything.'
    : 'Nothing may leave this machine. Run `ursa consent grant` to allow aggregate survival numbers to, and nothing else ever.')
}

export async function runConsentCommand(argv: string[], io: CliIo = stdio): Promise<number> {
  const [sub, project, ...rest] = argv
  if (!sub || !project) {
    io.err('Usage: ursa consent show|grant|revoke|disclose|revoke-axiom|release-blocked <project> [options]')
    return 2
  }
  const projectRoot = absPath(project)

  if (sub === 'show') {
    describe(loadConsent(projectRoot), projectRoot, io)
    return 0
  }

  if (sub === 'grant' || sub === 'revoke') {
    const scope = scopeFrom(rest, io)
    if (!scope) return 2
    const by = `ursa consent ${sub} --scope ${scope}`
    const consent = sub === 'grant' ? grantScope(projectRoot, scope, by) : revokeScope(projectRoot, scope, by)
    io.out(`${scope} is now ${consent.scopes[scope].state}.`)
    io.out(sub === 'grant'
      ? 'From here, `ursa consent disclose` can emit aggregate survival numbers. It still refuses to write a file that carries any of your text.'
      : 'Nothing may leave this machine. Anything already sent is outside this file\'s reach, so revoking here is a stop, not an undo. Deletion of what was sent is a request to the aggregation layer.')
    return 0
  }

  if (sub === 'revoke-axiom') {
    const axiom = flag(rest, 'axiom')
    if (!axiom) { io.err('revoke-axiom needs --axiom <id>, for example --axiom ax-003'); return 2 }
    const tPath = tuningPathFor(projectRoot)
    try {
      const tuning = revokeAxiom(tPath, axiom)
      const target = tuning.axioms.find((a) => a.id === axiom)!
      io.out(`Revoked ${axiom}: "${target.statement}"`)
      io.out('It is kept as a tombstone so a later distillation cannot bring it back, and every export and every overlay from here on leaves it out.')
      // The sentence above was the whole message until 2026-10-24, and it
      // was a claim about effect prevention made by a command that can
      // only prevent effects inside this directory. Ursa's research seat
      // mapped the three delivery channels onto the revocation contract
      // in arXiv:2610.15991, which requires a receipt from every gateway
      // holding the delegated authority before a revocation counts as
      // enforced (finding 54,
      // docs/research/briefs/2026-10-24-message-14.md). The local store
      // reaches that bar. The paste channel cannot: its gateway is a text
      // field inside another vendor's product, so it can neither emit a
      // receipt nor be enumerated, and that is permanent rather than
      // unbuilt. It is also exactly why the channel works at all, since
      // it asks the vendor for nothing.
      //
      // So the honest thing is not a clause on the sentence above. It is a
      // second sentence that says what this command cannot reach and what
      // the user has to do herself, printed here because this is the one
      // moment she believes the revocation is finished and the one moment
      // she cannot check. See §10.6 of docs/design/consent-and-erasure.md
      // for why it is a permanent property of the system rather than a
      // deferred item.
      io.out('A block you already pasted into another product is outside what this can reach. That copy is a text field in somebody else\'s settings, this command cannot find it or change it, and it keeps working until you replace it yourself. Run `ursa tuning export` again and paste the new block over the old one everywhere you put it.')
      // The twin report. A revocation she believes happened and which
      // only half happened is the worst outcome this command has, and
      // before today nothing told her: the gate in `tuning/revocation.ts`
      // runs inside a distillation pass, so it cannot see a duplicate
      // that was already an axiom when she clicked.
      const twins = revocationTwins(tuning, axiom)
      if (twins.length > 0) {
        io.out('')
        io.out(twins.length === 1
          ? 'One inference you still hold says nearly the same thing, and revoking this one did not touch it:'
          : `${twins.length} inferences you still hold say nearly the same thing, and revoking this one did not touch them:`)
        for (const t of twins) printTwin(t, io)
        io.out('')
        io.out(`Those are still active, so they still reach every model. Withdraw one too with \`ursa consent revoke-axiom ${project} --axiom ${twins[0].id}\`, or leave it where it is. Nothing in that list was changed for you, because which of them you actually meant is yours to say and not ours to guess.`)
      }
      return 0
    } catch (e) {
      io.err((e as Error).message)
      return 1
    }
  }

  if (sub === 'release-blocked') {
    const raw = flag(rest, 'index')
    const index = Number(raw)
    if (!raw || !Number.isInteger(index) || index < 1) {
      io.err('release-blocked needs --index <n>, the number `ursa consent show` prints beside the statement, for example --index 1')
      return 2
    }
    try {
      const { released } = releaseBlocked(tuningPathFor(projectRoot), index)
      io.out(`Released "${released.statement}" as ${released.id}.`)
      io.out('It is yours now rather than the distillation\'s, so no later pass can reword it, and the revocation it resembled is still in force.')
      return 0
    } catch (e) {
      io.err((e as Error).message)
      return 1
    }
  }

  if (sub === 'disclose') {
    const consent = loadConsent(projectRoot)
    const records = loadRecords(projectRoot)
    const { batch, withheld } = projectForMinor(records, consent)
    for (const w of withheld) io.out(`withheld: ${w.kind} — ${w.detail}`)
    if (!batch) {
      io.out('Nothing disclosed, because nothing is consented. This is the default state and it is not an error.')
      return 0
    }
    const findings = auditBatch(batch, records)
    if (findings.length > 0) {
      io.err(`The audit found ${findings.length} problem${findings.length === 1 ? '' : 's'} in the payload, so nothing was written.`)
      for (const f of findings.slice(0, 20)) io.err(`  ${f.kind} at ${f.path}: ${f.detail}`)
      return 1
    }
    const out = flag(rest, 'out')
    const json = JSON.stringify(batch, null, 2) + '\n'
    if (out) {
      writeFileSync(out, json)
      io.out(`${batch.rows.length} aggregate row${batch.rows.length === 1 ? '' : 's'} written to ${out}. The audit passed: no key, no string and no fragment of your text is in that file.`)
    } else {
      io.out(json)
    }
    return 0
  }

  io.err(`Unknown subcommand "${sub}". Try show, grant, revoke, disclose, revoke-axiom or release-blocked.`)
  return 2
}

export async function runForgetCommand(argv: string[], io: CliIo = stdio): Promise<number> {
  const [project, ...rest] = argv
  const recordId = flag(rest, 'record')
  if (!project || !recordId) {
    io.err('Usage: ursa forget <project> --record <recordId>')
    return 2
  }
  const projectRoot = absPath(project)
  const t = forget(projectRoot, recordId)
  if (!t.removed.recordFile && t.removed.axiomsDeleted.length === 0 && t.removed.evidenceStripped === 0) {
    io.out(`No record ${recordId} was on disk and nothing was derived from it. It is tombstoned anyway, so re-running \`ursa run\` will not create it.`)
    return 0
  }
  io.out(`Erased ${recordId}.`)
  if (t.removed.recordFile) io.out('  The record file is gone.')
  if (t.removed.axiomsDeleted.length > 0) {
    io.out(`  ${t.removed.axiomsDeleted.length} inference${t.removed.axiomsDeleted.length === 1 ? '' : 's'} deleted outright, because this record was the only evidence for them: ${t.removed.axiomsDeleted.join(', ')}`)
  }
  if (t.removed.evidenceStripped > 0) {
    io.out(`  ${t.removed.evidenceStripped} evidence entr${t.removed.evidenceStripped === 1 ? 'y' : 'ies'} stripped from inferences that still rest on other records.`)
  }
  if ((t.removed.blockedDropped ?? 0) > 0) {
    io.out(`  ${t.removed.blockedDropped} held-back statement${t.removed.blockedDropped === 1 ? '' : 's'} dropped, because this record was the only evidence behind ${t.removed.blockedDropped === 1 ? 'it' : 'them'} too.`)
  }
  if (t.removed.sourcesRemoved > 0) io.out('  It is no longer listed as a source of your tuning.')
  io.out('  Its id is tombstoned, so `ursa run` will not rebuild it from the git history it came from.')
  return 0
}
