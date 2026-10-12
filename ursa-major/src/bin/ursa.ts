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
// ursa ci <project> — the same resolve, fired by a merged pull request on
// a GitHub runner instead of typed by a person (plan §8). Reads the merge
// window out of $GITHUB_EVENT_PATH, writes records under <project>/.ursa/,
// and posts the five-field run comment. Needs no install: the Action runs
// the bundled dist/ursa.cjs with the runner's own node.
//
//   ursa ci <projectPath> --repo owner/name --event "$GITHUB_EVENT_PATH" \
//     [--run-url URL] [--min-chars N] [--no-post]
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
import { blobAt, findCommitPairsWithDiagnostics, listCommits, type CommitInfo, type PairFinderDiagnostics } from '../pairfinder'
import { detectDeploy, type DeployDetection } from '../deploy'
import { gitDeletionAttributor } from '../deletion'
import { gitDescentCorroborator } from '../corroborate'
import { IMPORT_TRAILER, vendoredPaths } from '../vendored'
import { deriveSignals, UNDECLARED, type Declaration } from '../signals'
import { annotateDurability } from '../lifespan'
import { buildEpisodes, type Episode } from '../episodes'

import { saveEpisodes, saveRecord } from '../store'
import { formatResolverIdentity } from '../resolver-identity'
import { clearsSizeFloor, erasedEpisodeIds, gateRecords } from '../launch'
import type { Artifact, Exclusion, OutcomeRecord, RawGeneration } from '../types'

// The resolve-one-episode step lives in src/resolve-episode.ts, which the
// CI launch imports too. Re-exported here because eight test files and
// src/adapters/cli.ts have imported these three from this module since
// before the CI launch existed, and moving the definition is not a reason
// to make every caller move with it.
export { artifactFor, resolvablePaths, resolveEpisode } from '../resolve-episode'
import { artifactFor, resolvablePaths, resolveEpisode } from '../resolve-episode'

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

  // Files the run declined to read as the person's work, said out loud.
  // Before this, `docs/standards/pm.md` was resolved span by span on
  // every run over this repository's own history, and it produced seven
  // demoted mutations and nine spans the length floor could not judge,
  // for a file that arrived complete from the holding company in one
  // commit. Silence here would mean a record that simply omits a file the
  // episode touched, which is the kind of gap a buyer is right to
  // distrust. Deduplicated by path across episodes, because the same
  // vendored file is commonly touched by several.
  const vendored = [...new Map(
    episodes.flatMap((e) => e.vendoredPaths ?? []).map((v) => [v.path, v]),
  ).values()]
  if (vendored.length > 0) {
    const one = vendored[0]
    lines.push('')
    lines.push(
      `${vendored.length} file${vendored.length === 1 ? '' : 's'} came in whole from elsewhere and ${vendored.length === 1 ? 'was' : 'were'} not read as your work, starting with ${one.path}.`,
    )
    // Three branches, not two. A `declared` import was never compared
    // byte for byte against anything, because its source is in another
    // repository, so the two sentences below would both be false claims
    // about how the run knows. Saying "byte-identical" about a
    // declaration is the same defect as the record flattening
    // `declared_import` into `imported_whole`.
    lines.push(
      one.relation === 'declared'
        ? `Commit ${one.sha} ("${one.subject}") declares it an import in its own ${IMPORT_TRAILER} trailer, so it was brought in from another repository rather than written here.`
        : one.relation === 'sibling'
          ? `It is byte-identical to its copy in commit ${one.sha} ("${one.subject}"), which is on a branch this work never contained, so it was brought in rather than written here.`
          : `It is byte-identical to the version already in commit ${one.sha} ("${one.subject}"), so this work left the file exactly as it found it.`,
    )
    lines.push(
      `A file that arrives complete from another commit carries no correction of yours, so its spans were left unclassified rather than classified wrongly.`,
    )
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
      // The three classifiers are named separately and they have to sum
      // to the total, or the line is arithmetic that cannot be true. The
      // declared count was missing from this sum when --agent-identity
      // shipped, which on this repository printed "327 looked generated"
      // for a run that had classified 454.
      const d = diagnostics
      const looked = d.generatedByTrailer + d.generatedByAuthorName + d.generatedByDeclaredIdentity
      const how = [`${d.generatedByTrailer} by trailer`, `${d.generatedByAuthorName} by author name`]
      if (d.generatedByDeclaredIdentity > 0) {
        how.push(`${d.generatedByDeclaredIdentity} by an identity you declared`)
      }
      lines.push('')
      lines.push(
        `Scanned ${d.commitsScanned} commit${d.commitsScanned === 1 ? '' : 's'}. ${looked} looked generated (${how.join(', ')}), and none of those was followed by an edit of the same file without an agent marker.`,
      )
      // The case this repository is in, and it is not an empty result.
      // Every commit on the default branch is an agent's, so there is no
      // human edit for a pair to close on, and the person's corrections
      // are somewhere else entirely: in the pull requests they reviewed.
      if (looked > 0) {
        lines.push(
          'If every commit here is an agent\'s, that is an answer rather than a failure: your corrections are not on this branch. They are in the pull requests you reviewed, which is what the pull-request path reads.',
        )
      }
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

    // Who the run decided was the person, named rather than assumed.
    //
    // Every span class in every record above rests on this one bit, and
    // the run reaches it by absence: a commit is yours when it matches no
    // agent pattern. So an identity the pattern happens not to know is
    // promoted to a human being silently. On this repository's own
    // history on 2026-10-11 that was all four surviving records: the
    // agent seats commit as `ursa-pm`, `ursa-exo` and `ursa-engineer`,
    // which no shippable default pattern matches. The person reading
    // this knows those names in one glance; the library cannot know them
    // at all. Printing them is the cheapest honest thing available.
    if (diagnostics.editorIdentities.length > 0) {
      const who = diagnostics.editorIdentities
        .map((e) => `${e.name}${e.email ? ` <${e.email}>` : ''} (${e.pairs} pair${e.pairs === 1 ? '' : 's'})`)
        .join(', ')
      lines.push('')
      lines.push(`The edits above were credited to ${who}.`)
      lines.push(
        'That is whoever authored each commit this run read as yours, and it is read from the commit rather than verified. If any of those is an agent rather than you, pass --agent-identity <name-or-email-substring> and run again: its commits become generations, and the records that rested on them are not written.',
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
      // Repeatable. Each value is a substring matched case-insensitively
      // against a commit's author name AND its author email, so an agent
      // seat whose name no shippable pattern could match
      // (`ursa-pm`, `ursa-exo`) can be declared by the only party who
      // knows it: the person whose repository it is.
      'agent-identity': { type: 'string', multiple: true },
      declare: { type: 'string' },
      'sync-url': { type: 'string' },
      session: { type: 'string' },
      interval: { type: 'string' },
      port: { type: 'string' },
      repo: { type: 'string' },
      event: { type: 'string' },
      'run-url': { type: 'string' },
      'no-post': { type: 'boolean' },
    },
  })
  const [cmd, project] = positionals
  if ((cmd !== 'run' && cmd !== 'bridge' && cmd !== 'ci') || !project) {
    console.error('Usage: ursa run <projectPath> [--limit N] [--min-chars N]')
    console.error('         pairing bounds: [--max-pair-distance N] [--max-pair-age-hours N] [--max-interposed-generations N]')
    console.error('         who is an agent: [--agent-identity <name-or-email-substring>] (repeatable)')
    console.error('       ursa bridge <projectPath> [--sync-url URL] [--session FILE] [--interval MS] [--port N]')
    console.error('       ursa consent show|grant|revoke|disclose|revoke-axiom <projectPath> [options]')
    console.error('       ursa forget <projectPath> --record <recordId>')
    console.error('       ursa ci <projectPath> --repo owner/name --event <eventPath> [--run-url URL] [--min-chars N] [--agent-identity <name-or-email-substring>] [--no-post]')
    return 2
  }
  if (cmd === 'ci') {
    const repo = values.repo ?? process.env.GITHUB_REPOSITORY
    const eventPath = values.event ?? process.env.GITHUB_EVENT_PATH
    const token = process.env.GITHUB_TOKEN ?? process.env.INPUT_GITHUB_TOKEN ?? ''
    if (!repo) { console.error('ursa ci needs --repo owner/name or GITHUB_REPOSITORY'); return 2 }
    if (!eventPath) { console.error('ursa ci needs --event <path> or GITHUB_EVENT_PATH'); return 2 }
    if (!token && values['no-post'] !== true) {
      console.error('ursa ci needs GITHUB_TOKEN to post the run comment; pass --no-post to print it instead')
      return 2
    }
    const { runCi } = await import('../ci/run')
    const result = await runCi({
      projectPath: absPath(project),
      eventPath,
      repo,
      token,
      apiBaseUrl: process.env.GITHUB_API_URL,
      runUrl: values['run-url'] ?? null,
      minChars: values['min-chars'] ? Number(values['min-chars']) : undefined,
      // The same flag the local launch above reads. Both launches must
      // answer "who was the person" from the same declaration or the
      // one-resolver-two-launches claim is false for any repository
      // whose agents git cannot recognise by name (src/launch.ts).
      agentIdentities: values['agent-identity'],
      post: values['no-post'] !== true,
    })
    return result.exitCode
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
    agentIdentities: values['agent-identity'],
  })
  // One graph read for the whole run. Every episode's corroborator needs
  // the same parent/child edges to tell a rival commit from a descendant
  // of its own generation, and so does the import check below.
  const commits = listCommits(projectPath)
  // Annotated before resolving, not during it, so the exclusion reaches
  // `saveEpisodes` and `renderRunSummary` even for an episode that
  // resolves to nothing. An episode whose every resolvable path was
  // imported produces no record at all, and that is precisely the case
  // where a silent run would be most misread.
  const episodes = buildEpisodes(pairs, projectPath).slice(0, limit).map((ep) => ({
    ...ep,
    vendoredPaths: vendoredPaths(projectPath, ep, resolvablePaths(ep), commits),
  }))
  // Erasure has to survive re-derivation. Every episode here was rebuilt
  // from git history, so without this filter `ursa forget` would delete a
  // record the next run recreates, which is not deletion. The lookup moved
  // to `src/launch.ts` on 2026-10-10 because the CI launch skipped it
  // entirely and so resurrected what this one refuses to.
  const erased = erasedEpisodeIds(projectPath, episodes.map((ep) => ep.id))
  let suppressed = 0
  const records: OutcomeRecord[] = []
  for (const ep of episodes) {
    if (erased.has(ep.id)) { suppressed++; continue }
    const record = resolveEpisode(projectPath, ep, commits)
    // `--min-chars` filters out an episode too small to carry signal, and
    // it is measured on the generation side, which a refusal-only record
    // has none of. Without the second clause the record this run writes to
    // explain an import would be dropped by a threshold aimed at something
    // else, and the absence would be back.
    if (!record) continue
    if (!clearsSizeFloor(record, minChars)) continue
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
  // Which build of the resolver made the claims above. Printed on the
  // local launch too, not only in the CI comment, because the figures a
  // user is reading here moved by a factor of eight between two commits
  // of this resolver on 2026-10-12 (docs/ideas.md) and the terminal gave
  // no sign that anything underneath them had changed. Suppressed when
  // nothing was written, since there is then no claim to attribute.
  if (records.length > 0) {
    console.log(`Resolved by: ${formatResolverIdentity(records[0].task.resolvedBy ?? null)}`)
  }

  // The gate runs on every run, after the records are on disk, and its
  // failure is the exit code. Records are saved first on purpose: a record
  // whose arithmetic is impossible is still the evidence of the defect, so
  // nothing is withheld from the user. What changes is that the run stops
  // reporting success. This is deliberately not behind a flag — the defect
  // it exists for (src/invariants.ts) survived six records, four open pull
  // requests and 344 passing tests, and an opt-in check would have been
  // off for all of them.
  const gate = gateRecords(records)
  if (gate.violations.length > 0) {
    console.error(`\n${gate.report}`)
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
