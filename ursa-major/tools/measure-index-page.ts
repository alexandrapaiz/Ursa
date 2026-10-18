// Layout measurement for the published set page, at real viewport widths
// in a real browser engine.
//
// WHY THIS TOOL EXISTS. `renderIndexPage` in src/publish.ts is the
// fallback page a stranger lands on when they publish a site with
// `ursa publish` and open it with nothing else installed. Its tests in
// src/publish.test.ts use jsdom, which parses HTML and applies no
// layout at all: `scrollWidth` is 0 there for every element on every
// page, so the one failure mode a page like this actually has — it is
// wider than the phone it is being read on — is invisible to the whole
// existing test suite.
//
// That is not hypothetical. The frontend seat measured this page at a
// 390px viewport on 2026-10-18 and reported a document 521px wide, so
// the right-hand columns of the record table sat off screen with no
// way to reach them. This tool is how that number is produced, and how
// a fix is shown to hold rather than asserted to.
//
// It renders the page from a real published site, built from the repo's
// own fixture record, so what is measured is the page a publisher gets
// and not a hand-written sample of it.
//
// Usage, from the package root:
//   npx tsx tools/measure-index-page.ts
//   npx tsx tools/measure-index-page.ts --widths 390,768,1280 --records 3
//
// Exit status is 1 when any measured width overflows, so the same
// command works as a check.
//
// PLAYWRIGHT IS NOT A DEPENDENCY OF THIS PACKAGE, deliberately. It
// carries a browser download, and `npm test` must stay installable on a
// runner that will never measure a layout. So this tool imports it at
// run time and says what to install when it is absent:
//
//   npm i -D playwright && npx playwright install chromium
//
// or, when a browser is already on the machine, point Node at it:
//
//   PLAYWRIGHT_MODULE=/path/to/node_modules/playwright \
//     npx tsx tools/measure-index-page.ts
//
// (`NODE_PATH` does not work here: Node ignores it for ES modules, and
// this file is one.)

import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parsePasteConversation } from '../src/parse'
import { resolve } from '../src/resolve'
import { saveRecord } from '../src/store'
import { publish } from '../src/publish'
import type { OutcomeRecord } from '../src/types'

const FIXTURE = join(dirname(fileURLToPath(import.meta.url)), '..', 'fixtures', 'mini')

/** The same fixture record the publish tests use, under a chosen id. */
function fixtureRecord(taskId: string): OutcomeRecord {
  const finalText = readFileSync(join(FIXTURE, 'final.md'), 'utf8')
  const convs = ['01-claude', '02-chatgpt'].map((id) =>
    parsePasteConversation(readFileSync(join(FIXTURE, 'conversations', `${id}.md`), 'utf8'), id),
  )
  return resolve({
    taskId,
    files: [{ path: 'final.md', text: finalText }],
    conversations: convs.map((c) => c.conversation),
    generations: convs.flatMap((c) => c.generations),
    finished: true,
  })
}

function arg(name: string, fallback: string): string {
  const i = process.argv.indexOf(`--${name}`)
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1]! : fallback
}

const widths = arg('widths', '390,768,1280').split(',').map((w) => Number(w.trim()))
const recordCount = Number(arg('records', '3'))

// Record ids as long as the ones a real run produces: `episodeId` in
// src/episodes.ts builds `<directory-name>-<YYYY-MM-DD>-<sha7>`, and the
// length of that string is what pushed the table past the viewport.
const ids = Array.from({ length: recordCount }, (_, i) =>
  `ursa-engineer-sandbox-clone-2026-10-1${i}-a1b2c3${i}`,
)

const project = mkdtempSync(join(tmpdir(), 'ursa-measure-index-'))
for (const id of ids) saveRecord(project, fixtureRecord(id), null, null)
const out = join(project, 'site')
const result = publish({
  projectPath: project, outDir: out, acknowledged: true,
  repository: 'someone/their-repo', publishedAt: '2026-10-18T00:00:00.000Z',
})

const page = join(out, 'index.html')
console.log(`site: ${out}`)
console.log(`records: ${result.index.records.length}, index contract ${result.index.indexVersion}`)
console.log('')

// Imported here rather than at the top so that a machine without
// Playwright gets this sentence instead of a module-resolution stack.
let chromium: typeof import('playwright').chromium
try {
  const from = process.env.PLAYWRIGHT_MODULE || 'playwright'
  // `playwright` is CommonJS, so a dynamic import of it by path lands
  // the exports on `default` rather than as named exports. Both shapes
  // are accepted so the tool works either way it was resolved.
  const mod: any = await import(from)
  chromium = mod.chromium ?? mod.default?.chromium
  if (!chromium) throw new Error('resolved a module with no chromium export')
} catch {
  console.error('This tool needs Playwright, which this package does not depend on.')
  console.error('Install it for this measurement with:')
  console.error('  npm i -D playwright && npx playwright install chromium')
  console.error('or point this tool at an existing install with PLAYWRIGHT_MODULE=<path to the playwright package>.')
  process.exit(2)
}

// A browser binary that will not start is the same class of problem as
// an absent module and gets the same treatment: one sentence and exit
// 2, never a stack trace and never a silent zero. The sandbox this tool
// was written in hits exactly this — Playwright's chromium is present
// and its own shared libraries (libatk-1.0) are not — and a run that
// reported "no overflow" there would be a lie.
let browser
try {
  browser = await chromium.launch()
} catch (e) {
  console.error('Playwright resolved but its browser would not start, so nothing was measured.')
  console.error(String((e as Error).message).split('\n')[0])
  console.error('On a bare Linux image this is usually the browser system libraries:')
  console.error('  npx playwright install --with-deps chromium')
  process.exit(2)
}
let overflowed = false
const rows: string[] = []
for (const width of widths) {
  const ctx = await browser.newContext({ viewport: { width, height: 844 } })
  const p = await ctx.newPage()
  await p.goto(`file://${page}`)
  const m = await p.evaluate(() => {
    const el = document.documentElement
    const tallest = [...document.querySelectorAll('tbody tr, .record')]
      .map((r) => (r as HTMLElement).getBoundingClientRect().height)
      .reduce((a, b) => Math.max(a, b), 0)
    return { scrollWidth: el.scrollWidth, clientWidth: el.clientWidth, tallestRow: Math.round(tallest) }
  })
  const over = m.scrollWidth - m.clientWidth
  if (over > 0) overflowed = true
  rows.push(
    `${String(width).padStart(5)}px viewport  scrollWidth ${String(m.scrollWidth).padStart(5)}  ` +
    `clientWidth ${String(m.clientWidth).padStart(5)}  overflow ${String(over).padStart(4)}px  ` +
    `tallest record block ${m.tallestRow}px`,
  )
  await ctx.close()
}
await browser.close()

for (const r of rows) console.log(r)
console.log('')
console.log(overflowed
  ? 'OVERFLOW: at least one width is wider than its viewport, so a reader has columns off screen.'
  : 'No overflow at any measured width.')

const report = arg('out', '')
if (report) writeFileSync(report, rows.join('\n') + '\n')
process.exit(overflowed ? 1 : 0)
