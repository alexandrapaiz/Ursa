#!/usr/bin/env node
// check-ids.mjs — does every identifier this repository allocates resolve to
// exactly one thing, and what is the next free one?
//
//   node tools/registers/check-ids.mjs                        # origin/main alone
//   node tools/registers/check-ids.mjs --base HEAD            # another single ref
//   node tools/registers/check-ids.mjs --heads                # and every open pull request head
//   node tools/registers/check-ids.mjs --next ADR --heads     # the allocator
//   node tools/registers/check-ids.mjs --json out.json        # the findings as data
//   node tools/registers/check-ids.mjs --no-fetch --heads     # use the refs already here
//
// Exit 0 every identifier is defined once and no burned one is reissued.
// Exit 1 a collision a seat can repair. Exit 2 either a collision only the
// owner can repair (`clean as far as a seat can take it`, the shape
// tools/ledger/check-closures.mjs established) or the gate's own ground is
// unusable: a manifest it cannot trust, a scope it cannot read, a shallow
// clone. The two exit-2 branches are distinguishable by `derivedFrom` in
// `--json`, never by the code alone.
//
// The namespaces, the registers that define them, and every burned identifier
// with its reason live in tools/registers/id-namespaces.json. The reasoning
// behind the gate is in tools/registers/id-verdict.mjs's header and the full
// specification is docs/design/register-id-allocation.md.
//
// WHAT A DEFINITION IS, and this is the whole of the gate's trust model. One
// anchored pattern per namespace, matched against the register file at a ref,
// in multiline mode. A heading is a definition. A mention in a paragraph is
// not, which is why the validator refuses an unanchored pattern rather than
// trusting the manifest's author to have anchored it.
//
// WHY A HEAD'S COPY OF A DEFINITION IS NOT A SECOND DEFINITION. Seventeen open
// branches carry `## PWC-EXO-2 — Four ADRs, two numbers`. That is one decision
// seen seventeen times, so the identity of a definition here is its own text
// and not the ref it was read from. Counting refs would report every healthy
// identifier in the repository as a collision, which is the failure mode that
// makes a gate get switched off. Two different texts under one identifier is
// the collision; so is the same text twice inside one ref, which is a
// copy-paste a text-identity check would otherwise hide.
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { renderVerdict } from '../gates/verdict-shape.mjs'
import { manifestFault, manifestUnusable, scopeUnreadable, verdict } from './id-verdict.mjs'

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..')
const MANIFEST_PATH = join(REPO_ROOT, 'tools/registers/id-namespaces.json')
const argv = process.argv.slice(2)

const flag = (name) => argv.includes(name)
const value = (name) => {
  const i = argv.indexOf(name)
  return i === -1 ? undefined : argv[i + 1]
}

if (flag('--help') || flag('-h')) {
  console.log(
    'usage: check-ids.mjs [--base <ref>] [--heads] [--no-fetch] [--next <NAMESPACE>] [--json <path>]',
  )
  process.exit(0)
}

const base = value('--base') ?? 'origin/main'
const wantHeads = flag('--heads')
const nextOf = value('--next')
const jsonOut = value('--json')

const git = (...a) =>
  execFileSync('git', ['-C', REPO_ROOT, ...a], { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 })

/** Print the verdict on the stream it declared, then exit with its code. */
function finish(v, findingLines = []) {
  const sink = v.stream === 'err' ? console.error : console.log
  for (const line of renderVerdict(v, findingLines)) sink(line)
  if (jsonOut !== undefined) {
    writeFileSync(jsonOut, `${JSON.stringify({ verdict: v, findings: findingLines }, null, 2)}\n`)
  }
  process.exit(v.exitCode)
}

// ---------------------------------------------------------------------------
// Ground, in the order a wrong answer would be cheapest to believe.
// ---------------------------------------------------------------------------

let manifest
try {
  manifest = existsSync(MANIFEST_PATH) ? JSON.parse(readFileSync(MANIFEST_PATH, 'utf8')) : undefined
} catch (error) {
  manifest = error
}
const bad = manifestFault(manifest)
if (bad !== null) finish(manifestUnusable(bad))

// `--next` without `--heads` is refused rather than defaulted. An allocator
// that reads one branch is the instrument that produced the PWC-7 collision
// this repository already paid for, so answering would be the defect.
if (nextOf !== undefined && !wantHeads) {
  finish(
    scopeUnreadable({
      code: 'NEXT_WITHOUT_HEADS',
      detail:
        'an allocator that reads one branch is how PWC-7 came to mean two changes at once; re-run as ' +
        `\`node tools/registers/check-ids.mjs --next ${nextOf} --heads\``,
    }),
  )
}

if (existsSync(join(REPO_ROOT, '.git/shallow'))) {
  finish(
    scopeUnreadable({
      code: 'CLONE_SHALLOW',
      detail: '.git/shallow is present, so a ref read here answers from a truncated graph; run `bash tools/ensure-full-clone.sh`',
    }),
  )
}

/** @type {{ref: string, label: string}[]} */
const refs = []
try {
  git('rev-parse', '--verify', '--quiet', `${base}^{commit}`)
  refs.push({ ref: base, label: base })
} catch {
  finish(
    scopeUnreadable({
      code: 'BASE_ABSENT',
      detail: `${base} does not resolve to a commit in this clone; run \`bash tools/ensure-full-clone.sh\``,
    }),
  )
}

if (wantHeads) {
  if (!flag('--no-fetch')) {
    try {
      git('fetch', '--quiet', 'origin', '+refs/pull/*/head:refs/prs/*')
    } catch (error) {
      finish(
        scopeUnreadable({
          code: 'HEADS_UNFETCHABLE',
          detail: `git fetch of refs/pull/*/head failed: ${String(error.message).split('\n')[0]}`,
        }),
      )
    }
  }
  let open
  try {
    open = JSON.parse(
      execFileSync('gh', ['pr', 'list', '--state', 'open', '--limit', '300', '--json', 'number'], {
        encoding: 'utf8',
      }),
    )
  } catch (error) {
    finish(
      scopeUnreadable({
        code: 'OPEN_SET_UNKNOWN',
        detail: `gh pr list failed, so the set of open heads is unknown and silence would read as clean: ${String(error.message).split('\n')[0]}`,
      }),
    )
  }
  const missing = []
  for (const { number } of open) {
    const ref = `refs/prs/${number}`
    try {
      git('rev-parse', '--verify', '--quiet', `${ref}^{commit}`)
      refs.push({ ref, label: `#${number}` })
    } catch {
      missing.push(number)
    }
  }
  if (missing.length > 0) {
    // An unmeasurable head is not an absent finding. Reporting clean over a
    // scope that silently lost a branch is the same mistake as reporting clean
    // over a shallow clone.
    finish(
      scopeUnreadable({
        code: 'HEAD_UNREADABLE',
        detail: `${missing.length} open pull request head(s) have no ref in this clone (${missing.slice(0, 5).join(', ')}${missing.length > 5 ? ', ...' : ''})`,
      }),
    )
  }
}

// ---------------------------------------------------------------------------
// The scan.
// ---------------------------------------------------------------------------

/** @type {Map<string, {ns: object, occurrences: {ref: string, label: string, line: number, text: string}[]}>} */
const defined = new Map()
let registersRead = 0

for (const ns of manifest.namespaces) {
  // Compiled once per namespace and applied per line rather than per file.
  // A global regex over the whole file would be fewer calls and would make
  // the line number a second scan; matching line by line makes the position
  // a loop index, and the position is what a reader needs to go fix it.
  const pattern = new RegExp(ns.define)
  for (const { ref, label } of refs) {
    let text
    try {
      text = git('show', `${ref}:${ns.register}`)
    } catch {
      // A ref that does not carry the register is not a finding. Branches are
      // built off older roots here and a register file that postdates a root
      // is absent for a reason that has nothing to do with identifiers.
      continue
    }
    registersRead += 1
    const lines = text.split('\n')
    for (const [index, line] of lines.entries()) {
      const match = pattern.exec(line)
      if (match === null) continue
      const id = match[1]
      if (!defined.has(id)) defined.set(id, { ns, occurrences: [] })
      defined.get(id).occurrences.push({ ref, label, line: index + 1, text: line.trim() })
    }
  }
}

// ---------------------------------------------------------------------------
// The allocator.
// ---------------------------------------------------------------------------

if (nextOf !== undefined) {
  const ns = manifest.namespaces.find((n) => n.name === nextOf)
  if (ns === undefined) {
    finish(
      scopeUnreadable({
        code: 'NAMESPACE_UNKNOWN',
        detail: `${nextOf} is not a namespace in tools/registers/id-namespaces.json; it declares ${manifest.namespaces.map((n) => n.name).join(', ')}`,
      }),
    )
  }
  const numbers = []
  for (const [id, entry] of defined) {
    if (entry.ns.name !== ns.name) continue
    numbers.push(Number(id.slice(ns.name.length + 1)))
  }
  for (const b of ns.burned ?? []) numbers.push(Number(b.id.slice(ns.name.length + 1)))
  // Highest plus one, never the lowest gap. A gap in this repository is a
  // burned identifier, and filling one makes an old citation resolve silently
  // to a new decision, which is strictly worse than a citation that dangles.
  const highest = numbers.length === 0 ? 0 : Math.max(...numbers)
  const n = highest + 1
  const padded = String(n).padStart(ns.pad, '0')
  console.log(`${ns.name}-${padded}`)
  console.log(
    `  computed from ${numbers.length} identifier(s) defined or burned across ${refs.length} ref(s): highest is ${highest}, so the next free one is ${n}.`,
  )
  console.log(`  register: ${ns.register}`)
  process.exit(0)
}

// ---------------------------------------------------------------------------
// The findings.
// ---------------------------------------------------------------------------

const findings = []
const lines = []

const burnedOf = (ns) => new Set((ns.burned ?? []).map((b) => b.id))
const reasonOf = (ns, id) => (ns.burned ?? []).find((b) => b.id === id)?.why ?? ''

for (const [id, { ns, occurrences }] of [...defined].sort((a, b) => a[0].localeCompare(b[0]))) {
  const texts = new Set(occurrences.map((o) => o.text))
  const perRef = new Map()
  for (const o of occurrences) perRef.set(o.ref, (perRef.get(o.ref) ?? 0) + 1)
  const worstRef = Math.max(...perRef.values())

  if (texts.size > 1 || worstRef > 1) {
    const where = [...texts]
      .map((t) => {
        const first = occurrences.find((o) => o.text === t)
        return `${ns.register}:${first.line} (${first.label}) ${t}`
      })
      .join('\n      ')
    findings.push({ held: ns.repair, rule: 'DOUBLE_DEFINITION', id, message: where })
    lines.push(
      `  ${id}: ${texts.size} distinct definition(s), ${occurrences.length} occurrence(s). ` +
        `Repair held by the ${ns.repair}.\n      ${where}`,
    )
  }

  if (burnedOf(ns).has(id)) {
    findings.push({ held: ns.repair, rule: 'BURNED_REISSUED', id, message: reasonOf(ns, id) })
    lines.push(
      `  ${id}: reissued although it is burned. Burned because: ${reasonOf(ns, id)} ` +
        `Defined at ${ns.register}:${occurrences[0].line} (${occurrences[0].label}).`,
    )
  }
}

finish(
  verdict(findings, {
    ids: defined.size,
    namespaces: manifest.namespaces.length,
    refs: refs.length,
    scope: wantHeads ? `${base} and every open pull request head` : base,
  }),
  lines,
)
