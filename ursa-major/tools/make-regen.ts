// The command line around `tools/regen.ts`. Run it after any edit under
// `ursa-major/src/`, and run it again until it prints `clean`.
//
//   npm run regen          # rebuild the bundle, then index it once it is committed
//   npm run regen:check    # verify both generated artifacts, write nothing
//
// The naming follows the one pair already here: `tools/bundle-digest-
// index.ts` holds the logic and `tools/make-bundle-digest-index.ts` is
// its command line. The reasoning for why this is two passes rather than
// one command is at the top of `tools/regen.ts`.
//
// Ledger: "The shipped bundle is rebuilt by hand, so a correct fix can
// ship with the product missing it" (docs/ideas.md, 2026-10-24 hook run).

import { execFileSync, spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { BUNDLE_PATH, historyUnavailable, repoRoot } from './bundle-digest-index'
import { regenCheckVerdict, regenStep } from './regen'

const root = repoRoot()
if (root === null) {
  console.error('not inside a git work tree, so neither generated artifact can be judged')
  process.exit(2)
}

const check = process.argv.slice(2).includes('--check')
/** cwd for both child commands: the package, which is where their relative paths resolve */
const pkg = join(root, 'ursa-major')

/** Run one of the two existing scripts and hand its output straight through. */
function run(label: string, command: string, args: string[]): number {
  console.log(`\n$ ${command} ${args.join(' ')}   # ${label}`)
  const r = spawnSync(command, args, { cwd: pkg, stdio: 'inherit' })
  // A signal death has no exit code. Reported as 1 rather than as 0,
  // because an unknown outcome is not a pass.
  return r.status ?? 1
}

const sha256 = (bytes: Buffer | string) => createHash('sha256').update(bytes).digest('hex')

/** The bundle as HEAD holds it, which is what a consumer pinned to this commit downloads. */
function headBundleSha256(): string | null {
  try {
    const blob = execFileSync('git', ['-C', root as string, 'show', `HEAD:${BUNDLE_PATH}`], {
      maxBuffer: 64 * 1024 * 1024,
    })
    return sha256(blob)
  } catch {
    return null
  }
}

if (check) {
  // Both checks run even when the first fails, because a reader fixing
  // one artifact wants to know about the other in the same pass.
  const bundle = run('is the committed bundle the one this source builds?', 'node', ['build/bundle.mjs', '--check'])
  const index = run('does the digest index match committed history?', 'npx', ['tsx', 'tools/make-bundle-digest-index.ts', '--check'])

  // `historyBlocked` is read here and not inferred from `index`, because
  // the child exits 0 both when the index matches history and when it
  // could not look. Those are different claims and this pass used to make
  // the stronger one for both. See `regenCheckVerdict`.
  const verdict = regenCheckVerdict({ bundle, index, historyBlocked: historyUnavailable(root) })
  if (verdict.exit === 0) console.log(`\n${verdict.message}`)
  else console.error(`\n${verdict.message}`)
  process.exit(verdict.exit)
}

const built = run('rebuild the product the Action actually executes', 'node', ['build/bundle.mjs'])
if (built !== 0) {
  console.error('\nthe bundle did not build, so nothing downstream of it was touched')
  process.exit(built)
}

const rebuiltSha256 = sha256(readFileSync(join(root, BUNDLE_PATH)))
const headSha256 = headBundleSha256()
const historyBlocked = historyUnavailable(root)

// The index is only rebuilt once the bundle in the tree is the bundle in
// HEAD, because `buildIndex` reads committed history and an index written
// before that commit exists drifts the moment it lands.
let indexDrifted: string[] = []
if (headSha256 === rebuiltSha256 && historyBlocked === null) {
  const before = read(join(root, 'docs/provenance/bundle-digests.json')) + read(join(root, 'docs/provenance/bundle-digests.md'))
  const wrote = run('index the committed bundle so its digest is lookupable', 'npx', ['tsx', 'tools/make-bundle-digest-index.ts'])
  if (wrote !== 0) {
    console.error('\nthe digest index did not build; the bundle above is committed-correct regardless')
    process.exit(wrote)
  }
  const after = read(join(root, 'docs/provenance/bundle-digests.json')) + read(join(root, 'docs/provenance/bundle-digests.md'))
  if (before !== after) indexDrifted = ['docs/provenance/bundle-digests.json', 'docs/provenance/bundle-digests.md']
}

const step = regenStep({ rebuiltSha256, headSha256, historyBlocked, indexDrifted })
console.log(`\n${step.message}`)
process.exit(0)

function read(path: string): string {
  try { return readFileSync(path, 'utf8') } catch { return '' }
}
