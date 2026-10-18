// `ursa address` — the command that answers one question: what do I send
// someone so they can read this record?
//
// Separated from src/bin/ursa.ts the way src/publish.cli.ts and
// src/consent.cli.ts are, so the dispatcher stays a dispatcher.
//
//   ursa address .                      every record, its address, and what is missing
//   ursa address . --record <id>        just that one
//   ursa address . --pages owner/name   the address a published site would serve
//   ursa address . --check              ask the host whether a browser can read it
//
// WHY THIS IS A COMMAND AND NOT A PARAGRAPH IN THE README. The README
// can say "commit the record and it is at raw.githubusercontent.com",
// and that sentence is true only after four conditions hold at once: the
// repository has a GitHub remote, the record is in HEAD, HEAD is pushed,
// and the pushed blob is the one on disk. A person who misses any of
// them gets a 404 and no way to tell which of the four it was. Every one
// of the four is readable from the project with git and no network, so
// the command reads them and names the one that is missing.
//
// WHY `--check` IS OPT-IN AND IS ONE HEAD REQUEST. The whole feature's
// correctness turns on a response header, and the frontend seat's note
// on 2026-10-18 is the reason: its viewer fetches a record from the
// person's own browser and refuses to proxy it, so an address without a
// permissive `Access-Control-Allow-Origin` is a download rather than a
// reading. That header cannot be derived from anything on disk. So it is
// asked for, by the person, explicitly, with a method that transfers no
// body, and only for an address they already hold.

import { formatManifest, isRecordShaped, manifestFor } from './publish'
import {
  addressState,
  formatRecordAddress,
  pagesAddress,
  permanenceNote,
  recordAddressPageUrl,
  recordAddressUrl,
  type AddressState,
  type RecordAddress,
} from './address'
import { isForgotten, loadConsent } from './consent'
import { listRecordIds, loadRecord } from './store'

export interface AddressCommandOptions {
  projectPath: string
  /** one record, or every record in the store when absent */
  recordId?: string | null
  /** `owner/name`: also print the address a published Pages site would serve */
  pages?: string | null
  /** ask each address's host for its status and cross-origin header */
  check?: boolean
  /** overridable for tests; defaults to a real HEAD request */
  probe?: (url: string) => Promise<ProbeResult>
}

export interface ProbeResult {
  status: number | null
  /** the `access-control-allow-origin` header as sent, or null when absent */
  allowOrigin: string | null
  /** the transport-level failure, when there was one */
  error: string | null
}

/**
 * Exit codes, because a script may gate on them:
 *   0  at least one record has an address a stranger can read
 *   2  the invocation was wrong
 *   4  there are records and none of them is readable yet; every reason
 *      why is printed above
 *
 * 4 rather than 1: nothing failed. The repository is part way through
 * something and the command is saying which part.
 */
export async function runAddress(opts: AddressCommandOptions): Promise<number> {
  const ids = opts.recordId ? [opts.recordId] : listRecordIds(opts.projectPath)
  if (ids.length === 0) {
    console.error(
      `no records in ${opts.projectPath}/.ursa/records/. Resolve some first with ` +
      `"ursa run ${opts.projectPath}".`,
    )
    return 0
  }

  const probe = opts.probe ?? headProbe
  const states: AddressState[] = []
  for (const id of ids) {
    const state = addressState(opts.projectPath, id)
    states.push(state)
    await report(state, opts, probe)
  }

  // The disclosure, said once at the end over whatever is actually
  // readable. `ursa publish` prints the same manifest from the same
  // function before it writes a byte, and this command prints it after
  // the fact for the records that are already public, because a person
  // who committed a record last week has made that disclosure whether or
  // not anybody counted it for them.
  const live = states.filter((s) => s.reachable)
  if (live.length > 0) {
    const consent = loadConsent(opts.projectPath)
    const records = live
      .map((s) => s.recordId)
      .filter((id) => !isForgotten(consent, id))
      .map((id) => {
        try {
          return loadRecord(opts.projectPath, id)
        } catch {
          return null
        }
      })
      // The same guard `loadPublishable` applies, and for the same
      // reason: a file in the store that is valid JSON and not a record
      // must not stop this command, which exists to tell a person where
      // their other records are.
      .filter((r): r is NonNullable<typeof r> => r !== null && isRecordShaped(r))
    if (records.length > 0) {
      console.log('')
      console.log('What is public at the addresses above:')
      console.log('')
      console.log(formatManifest(manifestFor(records)))
    }
  }

  return live.length > 0 ? 0 : 4
}

async function report(
  state: AddressState,
  opts: AddressCommandOptions,
  probe: (url: string) => Promise<ProbeResult>,
): Promise<void> {
  console.log(`record ${state.recordId}`)
  if (state.address && state.url) {
    console.log(`  address   ${formatRecordAddress(state.address)}`)
    console.log(`  json      ${state.url}`)
    console.log(`  readable  ${state.reachable ? 'yes, as far as this clone can see' : 'not yet'}`)
    if (state.reachable) {
      const note = permanenceNote(state.address)
      if (note) console.log(`  permanent ${note}`)
    }
  }
  for (const blocker of state.blockers) console.log(`  missing   ${blocker}`)

  if (opts.pages) {
    const pages = pagesAddress(opts.pages, state.recordId)
    if (!pages) {
      console.error(`  --pages ${opts.pages} is not an owner/name repository`)
    } else {
      console.log(`  address   ${formatRecordAddress(pages)}   (if you publish with \`ursa publish\`)`)
      console.log(`  json      ${recordAddressUrl(pages)}`)
      console.log(`  page      ${recordAddressPageUrl(pages)}`)
    }
  }

  if (opts.check) {
    const targets: RecordAddress[] = []
    if (state.address) targets.push(state.address)
    const pages = opts.pages ? pagesAddress(opts.pages, state.recordId) : null
    if (pages) targets.push(pages)
    for (const target of targets) await checkOne(target, probe)
  }
  console.log('')
}

async function checkOne(
  address: RecordAddress,
  probe: (url: string) => Promise<ProbeResult>,
): Promise<void> {
  const url = recordAddressUrl(address)
  const result = await probe(url)
  if (result.error) {
    console.log(`  checked   ${url}`)
    console.log(`            that host could not be reached: ${result.error}`)
    return
  }
  console.log(`  checked   ${url}`)
  console.log(`            HTTP ${result.status}`)
  // The two facts are reported separately because they fail separately
  // and a person can act on each. A 404 with a permissive header is "you
  // have not pushed it yet"; a 200 without one is "a browser will refuse
  // to read this, and no amount of pushing changes that".
  if (result.allowOrigin === '*') {
    console.log('            access-control-allow-origin: * — a browser on any page can read this')
  } else if (result.allowOrigin) {
    console.log(
      `            access-control-allow-origin: ${result.allowOrigin} — only a page on that ` +
      'origin can read this; a viewer anywhere else will be refused by the browser',
    )
  } else if (address.scheme === 'pages' && result.status === 404) {
    // The fifth case, and the one this command got wrong until
    // 2026-10-18. The other four were measured on hosts that exist:
    // raw.githubusercontent.com and a deployed Pages site both answer
    // with `access-control-allow-origin: *` on a 200 and on a 404, which
    // is what lets a viewer tell a missing record from an unreadable
    // host. But the header follows the HOST and not the path, so an
    // account with no Pages site at all is answered by the platform's own
    // not-found page, which sends no header — and a browser then reports
    // a cross-origin refusal rather than a 404.
    //
    // That is the ordinary FIRST failure on this address form, because
    // the publisher has usually not turned Pages on yet, and the
    // frontend seat's viewer now names this cause before blaming the
    // reader's network. Measured here against
    // alexandrapaiz.github.io/Ursa on 2026-10-18, when this repository
    // had no Pages site: HTTP 404, no header.
    //
    // Reported as a cause with a fix rather than as a symptom, because
    // "a browser will not let a page read this" is true and sends the
    // reader looking in the wrong place.
    console.log(
      '            no access-control-allow-origin header, and a 404 — which together mean ' +
      `https://${address.owner.toLowerCase()}.github.io is not serving a Pages site for ` +
      `${address.repo} at all`,
    )
    console.log(
      '            A deployed site answers a missing record with the header present, so a ' +
      'viewer could tell you the record is missing. This answer is the platform\'s own ' +
      'not-found page, and a browser reports it as a refusal rather than as a status.',
    )
    console.log(
      `            Turn publishing on once: gh api -X POST repos/${address.owner}/${address.repo}` +
      '/pages -f \'build_type=workflow\'   (or Settings → Pages → Source → "GitHub Actions"), ' +
      'then publish.',
    )
  } else {
    console.log(
      '            no access-control-allow-origin header — a browser will not let a page read ' +
      'this address, so a reader can download the file but a viewer cannot fetch it',
    )
  }
}

/**
 * One HEAD request. HEAD rather than GET because the question is about
 * the headers and a record is routinely megabytes, and `redirect:
 * 'follow'` because a Pages site with a custom domain answers with one.
 */
async function headProbe(url: string): Promise<ProbeResult> {
  try {
    const res = await fetch(url, { method: 'HEAD', redirect: 'follow' })
    return {
      status: res.status,
      allowOrigin: res.headers.get('access-control-allow-origin'),
      error: null,
    }
  } catch (err) {
    return { status: null, allowOrigin: null, error: err instanceof Error ? err.message : String(err) }
  }
}
