#!/usr/bin/env node
// Every tracked source file that compares, sorts or slices a timestamp as
// text, from `tools/instant.mjs`'s lint.
//
//   node tools/instant-sweep.mjs                 # the findings and the counts
//   node tools/instant-sweep.mjs --json
//   node tools/instant-sweep.mjs --code TEXTUAL_ORDER   # one defect class
//   node tools/instant-sweep.mjs --max 0         # exit 1 above the bound
//
// Exit 0 printed. Exit 1 only under --max, and only above the bound. Exit 2
// this directory is not a git checkout, so the file list cannot be built and
// nothing was measured — which is a different answer from a clean sweep and
// must not read like one.
//
// WHY A SWEEP AND NOT A GATE. `TEXTUAL_ORDER` is a defect wherever it
// appears: ordering two timestamps by spelling is wrong, and the four
// instances this tool found on 2026-11-02 are now repaired. `TEXTUAL_DAY` is
// not. Rendering `generatedAt.slice(0, 10)` into a record viewer's "resolved"
// column shows the committer's local day, which is arguably the day the
// person would say they did the work; the five remaining instances are all
// display and changing them would change `Episode.id`, which is a record
// identifier already written to disk in this repository's trial artifacts. So
// this prints, with a denominator, and the bound is opt-in.
//
// WHAT THE DENOMINATORS ARE FOR. A sweep that says "4 findings" has told you
// nothing about coverage. The ExO seat's note of 2026-11-02 05:26Z put it in
// one line: print the open count beside every ratio as its denominator. Here
// that is files scanned, files skipped and why, so a sweep that silently
// stopped reading half the tree cannot be mistaken for a clean one.
import { readFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { textualTimestampComparisons } from './instant.mjs'

// Generated and vendored trees. Each one is named with the reason, because a
// skip list is the one place a sweep can lie about its own coverage.
const SKIP = [
  { test: (f) => f.includes('node_modules/'), why: 'installed dependency, not this repository\'s source' },
  { test: (f) => /(^|\/)dist\//.test(f), why: 'build output; the source it came from is scanned' },
  { test: (f) => f.includes('/.next/'), why: 'Next.js build output' },
  { test: (f) => f.includes('/overlay/.vercel/'), why: 'deploy artefact' }
]

export function partition (files) {
  const scanned = []
  const skipped = []
  for (const f of files) {
    const rule = SKIP.find((r) => r.test(f))
    if (rule) skipped.push({ file: f, why: rule.why })
    else scanned.push(f)
  }
  return { scanned, skipped }
}

function trackedSources () {
  const out = execFileSync('git', ['ls-files', '-z', '*.mjs', '*.js', '*.cjs', '*.ts', '*.tsx'], { encoding: 'utf8' })
  return out.split('\0').filter(Boolean)
}

function main (argv) {
  const json = argv.includes('--json')
  const codeIdx = argv.indexOf('--code')
  const onlyCode = codeIdx === -1 ? null : argv[codeIdx + 1]
  const maxIdx = argv.indexOf('--max')
  const max = maxIdx === -1 ? null : Number(argv[maxIdx + 1])

  let files
  try {
    files = trackedSources()
  } catch {
    console.error('not a git checkout, so the file list could not be built and nothing was measured')
    return 2
  }

  const { scanned, skipped } = partition(files)
  const findings = []
  let unreadable = 0
  for (const file of scanned) {
    let source
    try {
      source = readFileSync(file, 'utf8')
    } catch {
      unreadable += 1
      continue
    }
    for (const f of textualTimestampComparisons(source)) {
      if (onlyCode && f.code !== onlyCode) continue
      findings.push({ file, ...f })
    }
  }

  const byCode = {}
  for (const f of findings) byCode[f.code] = (byCode[f.code] ?? 0) + 1
  const filesWith = new Set(findings.map((f) => f.file)).size

  if (json) {
    console.log(JSON.stringify({
      measuredAt: new Date().toISOString(),
      scanned: scanned.length,
      skipped: skipped.length,
      unreadable,
      filesWith,
      byCode,
      findings
    }, null, 2))
  } else {
    for (const f of findings) console.log(`${f.file}:${f.line}  ${f.code}  ${f.text.slice(0, 110)}`)
    console.log('')
    console.log(`read at ${new Date().toISOString()}`)
    console.log(`${findings.length} findings in ${filesWith} of ${scanned.length} tracked source files scanned`)
    console.log(`${skipped.length} files skipped (${[...new Set(skipped.map((s) => s.why))].join('; ')})${unreadable ? `; ${unreadable} unreadable` : ''}`)
    const codes = Object.entries(byCode).sort((a, b) => b[1] - a[1])
    console.log(codes.length ? codes.map(([c, n]) => `${c} ${n}`).join(', ') : 'no findings')
  }

  if (max !== null && findings.length > max) {
    console.error(`\n${findings.length} findings over the --max ${max} bound`)
    return 1
  }
  return 0
}

if (import.meta.url === `file://${process.argv[1]}`) {
  process.exit(main(process.argv.slice(2)))
}
