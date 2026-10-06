// ursa run <project> — the launch. One explicit invocation: walk the
// project's git history for generated→edited commit pairs, resolve
// each into an outcome record under <project>/.ursa/, print a summary
// that leads with what survived, and exit. No process before, none
// after.
//
//   npx tsx src/bin/ursa.ts run <projectPath> [--limit N] [--min-chars N]
//
// ursa bridge <project> — the overlay's local half (plan §16.2): tails
// the project's session log, reads the stated verdict, encrypts, and
// syncs ciphertext for the hosted page. Resident while open, exits on
// close, started by nothing but the owner.
//
//   URSA_PASSPHRASE=... npx tsx src/bin/ursa.ts bridge <projectPath> \
//     [--sync-url https://...] [--session <file>] [--interval ms] [--port 7817]
//
// ursa consent / ursa forget — the user's side of the boundary: see what
// has been derived, revoke one inference, grant or withhold the only
// scope that may cross the device boundary, emit the consented aggregate
// (audited, never on trust), and erase a record together with everything
// derived from it. See src/consent.ts and src/disclosure.ts.
//
//   npx tsx src/bin/ursa.ts consent show <projectPath>
//   npx tsx src/bin/ursa.ts forget <projectPath> --record <recordId>

import { parseArgs } from 'node:util'
import { resolve as absPath, extname } from 'node:path'
import { blobAt, findCommitPairsWithDiagnostics, type PairFinderDiagnostics } from '../pairfinder'
import { detectDeploy, type DeployDetection } from '../deploy'
import { gitDeletionAttributor } from '../deletion'
import { deriveSignals, UNDECLARED, type Declaration } from '../signals'
import { annotateDurability } from '../lifespan'
import { buildEpisodes, type Episode } from '../episodes'
import { resolve } from '../resolve'
import { saveEpisodes, saveRecord } from '../store'
import { checkRecord, formatViolations } from '../invariants'
import type { Artifact, OutcomeRecord, RawGeneration } from '../types'

const TEXT_EXTS = new Set([
  '.ts', '.tsx', '.js', '.jsx', '.py', '.css', '.scss', '.html',
  '.md', '.mdx', '.txt', '.tex', '.json', '.yml', '.yaml', '.toml', '.sql',
])
const SKIP_FILES = new Set(['package-lock.json', 'yarn.lock', 'pnpm-lock.yaml'])
const MAX_BLOB_CHARS = 300_000

/**
 * What kind of finished thing an episode is, as of its own final commit.
 *
 * Every `ursa run` episode is at minimum a `repo`: the finished work is source
 * under version control and the human's commit is the edit. It is `hosted`
 * when that same commit also names a URL the work is served from, because then
 * the thing the owner actually looked at before accepting was the deployed
 * page, not the diff. The lookup reads blobs at `ep.finalSha`, not the working
 * tree, so a record made today from a commit six months old carries the URL
 * that commit shipped with rather than today's.
 */
export function artifactFor(projectPath: string, ep: Episode): { artifact: Artifact; deploy: DeployDetection | null } {
  const deploy = detectDeploy((path) => blobAt(projectPath, ep.finalSha, path))
  if (!deploy) return { artifact: { kind: 'repo' }, deploy: null }
  return { artifact: { kind: 'hosted', renderRef: deploy.url }, deploy }
}

export function resolveEpisode(projectPath: string, ep: Episode): OutcomeRecord | null {
  const files: Array<{ path: string; text: string }> = []
  const generations: RawGeneration[] = []
  let turn = 0
  for (const path of ep.touchedFiles) {
    if (!TEXT_EXTS.has(extname(path)) || SKIP_FILES.has(path.split('/').pop() ?? '')) continue
    const genText = blobAt(projectPath, ep.generatedSha, path)
    const finText = blobAt(projectPath, ep.finalSha, path)
    if (genText === null || finText === null) continue
    if (genText.length > MAX_BLOB_CHARS || finText.length > MAX_BLOB_CHARS) continue
    turn++
    files.push({ path, text: finText })
    generations.push({
      conversationId: `git-${ep.generatedSha.slice(0, 7)}`,
      model: ep.agentMarker,
      turnIndex: turn,
      kind: 'write',
      filePath: path,
      timestamp: ep.openedAt,
      text: genText,
    })
  }
  if (files.length === 0 || generations.length === 0) return null
  return resolve({
    taskId: ep.id,
    files,
    // A merge walked past on the way to ep.finalSha can have destroyed
    // generated text that no human ever chose to drop. Without this the
    // record would call that a discard and name ep.finalSha's author.
    // `unreadableMerges` carries the boundaries this clone cannot test at
    // all, so those deletions come back `unknown` instead of as a discard.
    attributeDeletion: gitDeletionAttributor(projectPath, ep.interveningMerges ?? [], {
      unreadableMerges: ep.unreadableMerges,
    }),
    conversations: [{
      id: `git-${ep.generatedSha.slice(0, 7)}`,
      title: ep.subject,
      adapter: 'git',
      model: ep.agentMarker,
      date: ep.openedAt,
      turns: turn,
      userTurns: 0,
    }],
    generations,
    finished: true,
    generatedAt: ep.closedAt,
    artifact: artifactFor(projectPath, ep).artifact,
  })
}

export function renderRunSummary(
  records: OutcomeRecord[],
  episodes: Episode[],
  diagnostics?: PairFinderDiagnostics,
): string {
  const lines: string[] = []
  let verbatim = 0, mutated = 0, written = 0, traced = 0, claimed = 0
  let humanDeleted = 0, mergeDeleted = 0, unknownDeleted = 0
  for (const r of records) {
    verbatim += r.stats.byClass.survived_verbatim.chars
    mutated += r.stats.byClass.survived_mutated.chars
    // Three different generation-side totals, because the summary used to
    // print one of them against a final-side total and produce arithmetic
    // that cannot be true: on 2026-10-04 it claimed 239,976 chars survived
    // verbatim out of 239,841 generated. `written` is every character the
    // generations wrote and is the only one a final-side count may be set
    // beside. `traced` counts only characters inside segments, which is
    // what carries a fate and therefore the only denominator a deletion
    // rate may use. `claimed` is the generated text that reached the
    // finished work, counted once per generated character rather than once
    // per place it appears. See src/invariants.ts.
    written += r.stats.generated.charsWritten
    traced += r.stats.generated.totalChars
    claimed += r.stats.generated.verbatimClaimedChars
    humanDeleted += r.stats.generated.humanDeletedChars
    mergeDeleted += r.stats.generated.mergeDeletedChars
    unknownDeleted += r.stats.generated.unknownDeletedChars
  }
  lines.push(`${episodes.length} work unit${episodes.length === 1 ? '' : 's'} found, ${records.length} resolved into record${records.length === 1 ? '' : 's'}.`)
  lines.push(`${verbatim.toLocaleString()} chars survived your editing verbatim, ${mutated.toLocaleString()} survived edited.`)
  lines.push(`That's the part worth noticing: not what got written, what got kept.`)
  if (written > 0) {
    lines.push(`${written.toLocaleString()} chars were generated to get there, and ${claimed.toLocaleString()} of them reached the finished work unedited.`)
  }
  if (traced > 0 && humanDeleted > 0) {
    const pct = Math.round((humanDeleted / traced) * 100)
    lines.push(`You discarded ${humanDeleted.toLocaleString()} chars of draft on the way, ${pct}% of the ${traced.toLocaleString()} whose fate this run could trace.`)
  }
  if (mergeDeleted > 0) {
    lines.push(`A further ${mergeDeleted.toLocaleString()} chars were destroyed by merges rather than by you, so they are not counted against you.`)
  }
  // Said out loud rather than folded into the discard figure. The run can
  // see the text is gone and cannot see what took it, and the user is owed
  // that distinction before anyone reads the number as their own judgement.
  if (unknownDeleted > 0) {
    lines.push(`${unknownDeleted.toLocaleString()} more chars are gone with no readable cause, because a merge on the way could not be read from this clone. They are not counted against you either. Run git fetch and ursa run again to settle them.`)
  }
  const edited = records.filter((r) => r.stats.byClass.survived_mutated.chars > 0).length
  if (edited > 0) lines.push(`${edited} record${edited === 1 ? '' : 's'} ${edited === 1 ? 'carries' : 'carry'} your corrections — the whys live there.`)
  // Say where the work is live. If the owner judged it by looking at a page
  // rather than by reading a diff, the page is the thing that was accepted.
  const hosted = [...new Set(
    records.filter((r) => r.artifact.kind === 'hosted' && r.artifact.renderRef)
      .map((r) => r.artifact.renderRef!),
  )]
  for (const url of hosted) {
    lines.push(`This work is also live at ${url}, so the records carry where to go and look at it.`)
  }

  // An empty run used to print "0 work units found" and stop, which reads as
  // "this project has no correction work in it". Often it means the opposite,
  // so say what was looked at and what the walk decided.
  if (diagnostics) {
    const suppressed = diagnostics.authorFallbackSuppressed
    if (suppressed) {
      const names = suppressed.authors.map((a) => `"${a}"`).join(', ')
      lines.push('')
      lines.push(`Every commit in this history is authored ${names}.`)
      lines.push(
        'That name matches the agent-identity pattern, so on its own it cannot tell a generated commit from one of yours, and it was set aside for this run. Only the Co-Authored-By trailer classified commits.',
      )
      lines.push(
        'If your own commits really do carry that name, set a different one for them, or pass a narrower author pattern, and run again.',
      )
    }
    if (episodes.length === 0) {
      const looked = diagnostics.generatedByTrailer + diagnostics.generatedByAuthorName
      lines.push('')
      lines.push(
        `Scanned ${diagnostics.commitsScanned} commit${diagnostics.commitsScanned === 1 ? '' : 's'}. ${looked} looked generated (${diagnostics.generatedByTrailer} by trailer, ${diagnostics.generatedByAuthorName} by author name), and none of those was followed by an edit of the same file without an agent marker.`,
      )
    }

    // What the walk REFUSED to claim, said out loud whether or not the run
    // found anything. Before the bounds existed this run reported 239,976
    // chars survived on this repository's own history and 60,616 after,
    // because five of six pairs were crediting one generation with a file
    // five others had written. A number that drops by three quarters
    // without explanation is not more trustworthy than the wrong one, so
    // the reason ships next to it.
    const { abandoned, bounds } = diagnostics
    const dropped =
      abandoned.distance + abandoned.age + abandoned.interposedGeneration + abandoned.notDescendant
    if (dropped > 0) {
      const why: string[] = []
      if (abandoned.interposedGeneration > 0) {
        why.push(
          `${abandoned.interposedGeneration} had the same file rewritten by a later generation before you touched it, so your edit corrected that one and not this`,
        )
      }
      if (abandoned.distance > 0) {
        why.push(
          `${abandoned.distance} found no edit within ${bounds.maxPairDistance} commits`,
        )
      }
      if (abandoned.age > 0) {
        why.push(`${abandoned.age} found none within ${bounds.maxPairAgeHours} hours`)
      }
      if (abandoned.notDescendant > 0) {
        why.push(
          `${abandoned.notDescendant} were only edited on a branch that never contained them`,
        )
      }
      lines.push('')
      lines.push(
        `${dropped} generation${dropped === 1 ? '' : 's'} were left out rather than guessed at: ${why.join('; ')}.`,
      )
      lines.push(
        'Those are claims this run could not stand behind, so it did not make them. Raise --max-pair-distance, --max-pair-age-hours or --max-interposed-generations to see them anyway.',
      )
    }
    if (diagnostics.mergeGenerationsRefused > 0) {
      lines.push('')
      lines.push(
        `${diagnostics.mergeGenerationsRefused} merge commit${diagnostics.mergeGenerationsRefused === 1 ? '' : 's'} carried an agent marker and were not counted as generations. A merge restates work other commits did; it wrote nothing of its own.`,
      )
    }
  }

  const tested = records.reduce((n, r) => n + (r.durability?.testedSpans ?? 0), 0)
  if (tested > 0) {
    let durable = 0, decayed = 0
    for (const r of records) {
      durable += r.durability?.durableChars ?? 0
      decayed += r.durability?.decayedChars ?? 0
    }
    const pct = Math.round((decayed / (durable + decayed || 1)) * 100)
    lines.push(`Of what you kept at the time, ${pct}% was gone by the latest commit.`)
    lines.push(`Surviving your first edit is not the same as surviving the work.`)
  }
  return lines.join('\n')
}

export async function main(argv: string[]): Promise<number> {
  // Dispatched BEFORE parseArgs, deliberately. `parseArgs` is configured
  // with `run`'s and `bridge`'s options and throws
  // ERR_PARSE_ARGS_UNKNOWN_OPTION on anything else, so a consent flag like
  // `--out` never reached a dispatch placed after it. The consent commands
  // parse their own flags and take the raw argv.
  if (argv[0] === 'consent') {
    const { runConsentCommand } = await import('../consent.cli')
    return runConsentCommand(argv.slice(1))
  }
  if (argv[0] === 'forget') {
    const { runForgetCommand } = await import('../consent.cli')
    return runForgetCommand(argv.slice(1))
  }
  const { positionals, values } = parseArgs({
    args: argv,
    allowPositionals: true,
    options: {
      limit: { type: 'string' },
      'min-chars': { type: 'string' },
      'max-pair-distance': { type: 'string' },
      'max-pair-age-hours': { type: 'string' },
      'max-interposed-generations': { type: 'string' },
      declare: { type: 'string' },
      'sync-url': { type: 'string' },
      session: { type: 'string' },
      interval: { type: 'string' },
      port: { type: 'string' },
    },
  })
  const [cmd, project] = positionals
  if ((cmd !== 'run' && cmd !== 'bridge') || !project) {
    console.error('Usage: ursa run <projectPath> [--limit N] [--min-chars N]')
    console.error('         pairing bounds: [--max-pair-distance N] [--max-pair-age-hours N] [--max-interposed-generations N]')
    console.error('       ursa bridge <projectPath> [--sync-url URL] [--session FILE] [--interval MS] [--port N]')
    console.error('       ursa consent show|grant|revoke|disclose|revoke-axiom <projectPath> [options]')
    console.error('       ursa forget <projectPath> --record <recordId>')
    return 2
  }
  if (cmd === 'bridge') {
    const passphrase = process.env.URSA_PASSPHRASE ?? (await promptHidden('passphrase (held in memory only): '))
    if (!passphrase) { console.error('a passphrase is required; it derives the key and the blob id'); return 2 }
    const { startBridge } = await import('../bridge/index')
    const handle = await startBridge({
      projectPath: absPath(project),
      passphrase,
      syncUrl: (values['sync-url'] ?? 'https://ursa-overlay.vercel.app').replace(/\/$/, ''),
      session: values.session,
      intervalMs: values.interval ? Number(values.interval) : undefined,
      port: values.port ? Number(values.port) : undefined,
      allowOrigins: ['https://ursa-overlay.vercel.app'],
    })
    await new Promise<void>((resolve) => {
      process.on('SIGINT', () => { void handle.stop().then(resolve) })
      process.on('SIGTERM', () => { void handle.stop().then(resolve) })
    })
    return 0
  }
  const projectPath = absPath(project)
  const minChars = Number(values['min-chars'] ?? 200)
  const limit = values.limit ? Number(values.limit) : Infinity

  let declaration: Declaration = UNDECLARED
  if (values.declare === 'satisfied') {
    declaration = { accepted: true, basis: 'owner-declared satisfied at launch (--declare satisfied)' }
  } else if (values.declare === 'unsatisfied') {
    declaration = { accepted: false, basis: 'owner-declared unsatisfied at launch (--declare unsatisfied): survived text is not endorsed, it is not-yet-fixed' }
  }

  // `Infinity` is reachable on purpose: `--max-pair-distance Infinity`
  // restores the unbounded walk for someone who wants to see what the
  // bounds removed, which is how the measurement in
  // docs/design/pairing-window.md §8 was taken.
  const bound = (
    flag: 'max-pair-distance' | 'max-pair-age-hours' | 'max-interposed-generations',
  ): number | undefined => {
    const raw = values[flag]
    if (raw === undefined) return undefined
    const n = Number(raw)
    if (!Number.isFinite(n) && raw !== 'Infinity') return undefined
    return n
  }
  const { pairs, diagnostics } = findCommitPairsWithDiagnostics(projectPath, {
    maxPairDistance: bound('max-pair-distance'),
    maxPairAgeHours: bound('max-pair-age-hours'),
    maxInterposedGenerations: bound('max-interposed-generations'),
  })
  const episodes = buildEpisodes(pairs, projectPath).slice(0, limit)
  // Erasure has to survive re-derivation. Every episode here was rebuilt
  // from git history, so without this filter `ursa forget` would delete a
  // record the next run recreates, which is not deletion.
  // Imported here rather than at the top of the file, following this
  // module's existing pattern for `startBridge`. It also keeps the import
  // block untouched, which is where this change would otherwise collide
  // with every other open PR that edits `../types`.
  const { isForgotten, loadConsent } = await import('../consent')
  const consent = loadConsent(projectPath)
  let suppressed = 0
  const records: OutcomeRecord[] = []
  for (const ep of episodes) {
    if (isForgotten(consent, ep.id)) { suppressed++; continue }
    const record = resolveEpisode(projectPath, ep)
    if (!record || record.stats.generated.totalChars < minChars) continue
    // The time dimension: the span classes above are a verdict taken at
    // ep.finalSha. This walks the commits after it and records what the
    // real work did to each span. Git-only, so it lives here and not in
    // resolve(), which also serves pasted conversations with no history.
    annotateDurability(projectPath, record, ep.finalSha, ep.closedAt)
    record.signals = deriveSignals(record, declaration)
    saveRecord(projectPath, record)
    records.push(record)
  }
  saveEpisodes(projectPath, episodes)
  // Reciting zeros at someone whose only work unit they erased reads as a
  // failed run. Say what actually happened instead.
  if (records.length === 0 && suppressed > 0) {
    console.log(`${episodes.length} work unit${episodes.length === 1 ? '' : 's'} found, and ${suppressed === episodes.length ? 'every one of them is' : `${suppressed} of them are`} erased. Nothing was rebuilt.`)
  } else {
    console.log(renderRunSummary(records, episodes, diagnostics))
    if (suppressed > 0) {
      console.log(`\n${suppressed} work unit${suppressed === 1 ? '' : 's'} you erased stayed erased.`)
    }
  }
  console.log(`\nRecords: ${projectPath}/.ursa/records/`)

  // The gate runs on every run, after the records are on disk, and its
  // failure is the exit code. Records are saved first on purpose: a record
  // whose arithmetic is impossible is still the evidence of the defect, so
  // nothing is withheld from the user. What changes is that the run stops
  // reporting success. This is deliberately not behind a flag — the defect
  // it exists for (src/invariants.ts) survived six records, four open pull
  // requests and 344 passing tests, and an opt-in check would have been
  // off for all of them.
  const violations = records.flatMap((r) => checkRecord(r))
  if (violations.length > 0) {
    console.error(`\n${violations.length} record invariant${violations.length === 1 ? '' : 's'} violated. The records are written and are still the evidence, but the numbers above cannot all be true at once, so this run is not reporting success.`)
    console.error(formatViolations(violations))
    return 1
  }
  return 0
}

/** Read a line from the tty without echoing it. */
function promptHidden(question: string): Promise<string> {
  return new Promise((resolve) => {
    process.stdout.write(question)
    const stdin = process.stdin
    if (!stdin.isTTY) {
      let buf = ''
      stdin.setEncoding('utf8')
      stdin.on('data', (d: string) => { buf += d })
      stdin.on('end', () => resolve(buf.trim()))
      return
    }
    stdin.setRawMode(true)
    stdin.resume()
    let value = ''
    const onData = (ch: Buffer) => {
      const c = ch.toString('utf8')
      if (c === '\n' || c === '\r' || c === '\u0004') {
        stdin.setRawMode(false)
        stdin.pause()
        stdin.off('data', onData)
        process.stdout.write('\n')
        resolve(value)
      } else if (c === '\u0003') {
        process.stdout.write('\n')
        process.exit(130)
      } else if (c === '\u007f') {
        value = value.slice(0, -1)
      } else {
        value += c
      }
    }
    stdin.on('data', onData)
  })
}

const invokedDirectly = process.argv[1]?.endsWith('ursa.ts')
if (invokedDirectly) {
  main(process.argv.slice(2)).then((code) => process.exit(code))
}
