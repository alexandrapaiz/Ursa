// `ursa publish` — the command line around src/publish.ts.
//
// Separated from src/bin/ursa.ts the way src/consent.cli.ts is: the
// dispatcher stays a dispatcher, and the two-step shape of this command
// (show the disclosure, then write only if it was acknowledged) is a
// policy worth reading in one place.
//
// The two steps are one invocation each, on purpose, rather than an
// interactive prompt:
//
//   ursa publish .              # prints the disclosure, writes nothing, exits 3
//   ursa publish . --out site --yes
//
// An interactive confirm would be unavailable where this command most
// needs to run, which is a GitHub runner with no terminal attached, and
// a prompt that falls back to "assume yes when there is no tty" is the
// exact shape of consent this project refuses elsewhere. Two invocations
// work identically on a laptop and in a workflow, and the acknowledgement
// is a visible token in the consumer's own workflow file where a reviewer
// of that file can see it.

import { DisclosureNotAcknowledged, formatManifest, loadPublishable, manifestFor, publish } from './publish'

export interface PublishCommandOptions {
  projectPath: string
  outDir: string | undefined
  repository: string | null
  acknowledged: boolean
}

/**
 * Exit codes, because a caller in a workflow gates on them:
 *   0  the site was written
 *   2  the invocation was wrong (no `--out` when writing was asked for)
 *   3  the disclosure was shown and not acknowledged, so nothing was written
 *
 * 3 rather than 1: this is not a failure. It is the command's first step
 * doing exactly its job, and a workflow that treats it as an error would
 * report a red run for a correct dry run.
 */
export function runPublish(opts: PublishCommandOptions): number {
  const { records, skipped } = loadPublishable(opts.projectPath)
  const manifest = manifestFor(records)

  const why: Record<typeof skipped[number]['reason'], string> = {
    'unsafe-id': 'this record id cannot be part of a URL, so no address exists for it',
    unreadable: 'the record file could not be read as JSON',
    forgotten: 'you erased this record with `ursa forget`, so it is not published',
  }
  for (const s of skipped) console.error(`skipped ${s.id}: ${why[s.reason]}`)

  if (records.length === 0) {
    console.error(
      `no records in ${opts.projectPath}/.ursa/records/. Resolve some first with ` +
      `"ursa run ${opts.projectPath}" or by merging a pull request with the Action installed.`,
    )
    // Not an error: a project with no records is a project nobody has run
    // the resolver on yet, and the publish step of a workflow installed
    // before the first qualifying merge must not fail the run.
    return 0
  }

  console.log(formatManifest(manifest))

  if (!opts.acknowledged) {
    console.log('')
    console.log('Nothing was written. To publish exactly what is listed above, run again with --yes.')
    return 3
  }
  if (!opts.outDir) {
    console.error('ursa publish needs --out <dir> to write the site into')
    return 2
  }

  try {
    const result = publish({
      projectPath: opts.projectPath,
      outDir: opts.outDir,
      acknowledged: true,
      repository: opts.repository,
    })
    for (const w of result.warnings) console.error(`warning: ${w}`)
    console.log('')
    console.log(`wrote ${result.written.length} files to ${opts.outDir}`)
    console.log(`  ${result.index.records.length} record pages, one index page, one index.json`)
    console.log('')
    console.log('This directory is a complete static site. Serve it anywhere; it fetches nothing.')
    return 0
  } catch (err) {
    // Unreachable while `acknowledged: true` is passed above, and caught
    // anyway so that a future caller which forgets the flag gets the
    // disclosure printed rather than a stack trace.
    if (err instanceof DisclosureNotAcknowledged) {
      console.error(formatManifest(err.manifest))
      return 3
    }
    throw err
  }
}
