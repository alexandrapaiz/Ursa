// CLI: resolve a finished work against its generation sources.
//
//   npx tsx src/cli.ts --id <task-id> \
//     --final <file-or-dir>... \
//     [--sessions <claude-code .jsonl>...] [--path-filter <substring>] \
//     [--conversations <dir of paste-format .md>] \
//     [--out <dir>] [--abandoned]

import { readFileSync, writeFileSync, readdirSync, statSync, mkdirSync } from 'node:fs'
import { join, resolve as absPath, relative, basename, extname } from 'node:path'
import { parseClaudeSession, parsePasteConversation, type ParsedConversation } from './parse'
import { resolve } from './resolve'
import { deriveSignals } from './signals'
import { renderViewer } from './viewer'

const FINAL_EXTS = new Set([
  '.ts', '.tsx', '.js', '.jsx', '.css', '.scss', '.html',
  '.md', '.mdx', '.txt', '.tex', '.json',
])
const SKIP_DIRS = new Set(['node_modules', '.next', '.git', '.vercel', 'dist', 'build', '.turbo'])
const SKIP_FILES = new Set(['package-lock.json', 'yarn.lock', 'pnpm-lock.yaml', 'tsconfig.tsbuildinfo'])
const MAX_FILE_BYTES = 500_000

interface Args {
  id: string
  out: string
  final: string[]
  sessions: string[]
  conversations?: string
  pathFilter?: string
  annotations?: string
  finished: boolean
}

function parseArgs(argv: string[]): Args {
  const args: Args = { id: 'task', out: '.', final: [], sessions: [], finished: true }
  let key: string | null = null
  for (const a of argv) {
    if (a.startsWith('--')) {
      key = a.slice(2)
      if (key === 'abandoned') { args.finished = false; key = null }
      continue
    }
    switch (key) {
      case 'id': args.id = a; key = null; break
      case 'out': args.out = a; key = null; break
      case 'path-filter': args.pathFilter = a; key = null; break
      case 'conversations': args.conversations = a; key = null; break
      case 'annotations': args.annotations = a; key = null; break
      case 'final': args.final.push(a); break
      case 'sessions': args.sessions.push(a); break
      default:
        throw new Error(`Unexpected argument: ${a}`)
    }
  }
  if (args.final.length === 0) throw new Error('At least one --final file or directory is required')
  if (args.sessions.length === 0 && !args.conversations) {
    throw new Error('Provide --sessions (Claude Code .jsonl) and/or --conversations (paste-format dir)')
  }
  return args
}

function collectFinalFiles(paths: string[]): Array<{ path: string; text: string }> {
  const out: Array<{ path: string; text: string }> = []
  const addFile = (abs: string, label: string) => {
    if (SKIP_FILES.has(basename(abs))) return
    if (!FINAL_EXTS.has(extname(abs).toLowerCase())) return
    if (statSync(abs).size > MAX_FILE_BYTES) {
      console.warn(`skipping ${label} (> ${MAX_FILE_BYTES / 1000}KB)`)
      return
    }
    out.push({ path: label, text: readFileSync(abs, 'utf8') })
  }
  const walk = (dir: string, root: string) => {
    for (const name of readdirSync(dir).sort()) {
      if (SKIP_DIRS.has(name) || name.startsWith('.')) continue
      const abs = join(dir, name)
      if (statSync(abs).isDirectory()) walk(abs, root)
      else addFile(abs, relative(root, abs))
    }
  }
  for (const p of paths) {
    const abs = absPath(p)
    if (statSync(abs).isDirectory()) walk(abs, abs)
    else addFile(abs, basename(abs))
  }
  return out
}

function main() {
  const args = parseArgs(process.argv.slice(2))
  const files = collectFinalFiles(args.final)
  if (files.length === 0) throw new Error('No final files matched')

  const parsed: ParsedConversation[] = []
  for (const s of args.sessions) {
    const id = basename(s, '.jsonl')
    parsed.push(parseClaudeSession(readFileSync(s, 'utf8'), id, { pathFilter: args.pathFilter }))
  }
  if (args.conversations) {
    for (const name of readdirSync(args.conversations).sort()) {
      if (!name.endsWith('.md')) continue
      const id = basename(name, '.md')
      parsed.push(parsePasteConversation(readFileSync(join(args.conversations, name), 'utf8'), id))
    }
  }

  const conversations = parsed.map((p) => p.conversation)
  const generations = parsed.flatMap((p) => p.generations)
  console.log(`final files: ${files.length} · conversations: ${conversations.length} · generations: ${generations.length}`)
  console.time('resolve')
  const record = resolve({ taskId: args.id, files, conversations, generations, finished: args.finished })
  console.timeEnd('resolve')

  // Hand annotations win when they are supplied; otherwise the detector runs.
  // No --declare flag here: the CLI offers the owner no declaration surface, so
  // episode.accepted stays null rather than being read off retention.
  record.signals = args.annotations
    ? JSON.parse(readFileSync(args.annotations, 'utf8'))
    : deriveSignals(record)
  const sig = record.signals!
  console.log(
    `signals: ${sig.correctionLoops.length} loops, ${sig.regressions.length} regressions, ` +
    `${sig.oneShotCorrections.length} one-shot corrections, ${sig.feedbackTranslations.length} translations (${sig.method})`,
  )

  mkdirSync(args.out, { recursive: true })
  const jsonPath = join(args.out, 'outcome_record.json')
  const htmlPath = join(args.out, 'outcome_record.html')
  writeFileSync(jsonPath, JSON.stringify(record, null, 2))
  writeFileSync(htmlPath, renderViewer(record))

  const s = record.stats
  const pct = (x: number) => (x * 100).toFixed(1) + '%'
  console.log('\n— outcome record —')
  console.log(`covered final chars: ${s.coveredChars.toLocaleString()}`)
  for (const [cls, st] of Object.entries(s.byClass)) {
    console.log(`  ${cls.padEnd(26)} ${pct(st.pct).padStart(7)}  (${st.chars.toLocaleString()} chars, ${st.spans} spans)`)
  }
  console.log(`  uncertain: ${s.uncertainSpans} spans · trivial: ${s.trivialSpans} spans`)
  console.log(`generated: ${s.generated.totalChars.toLocaleString()} chars → deleted ${pct(s.generated.deletedPct)}`)
  for (const c of s.perConversation) {
    console.log(`  ${c.title}: ${c.generations} gens, survival ${pct(c.survivalRate)}, turns-to-acceptance ${c.turnsToAcceptance ?? '—'}`)
  }
  console.log(`\nwrote ${jsonPath}\nwrote ${htmlPath}`)
}

main()
