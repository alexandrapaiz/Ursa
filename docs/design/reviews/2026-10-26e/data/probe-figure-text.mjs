/**
 * The exact string the figures line renders, before and after.
 *
 * A fix that only groups words must not change the characters between
 * them. Splitting one JSX text node into five `<span>`s is exactly the
 * kind of change that silently adds or drops a space, and a frame diff
 * reports "something moved" without saying which.
 */
import { launch } from '../../../review-kit/lib/browser.mjs'
import { writeFileSync } from 'node:fs'

const PORTS = process.argv.slice(2).filter((a) => !a.startsWith('--'))
const OUT = (() => { const i = process.argv.indexOf('--out'); return i === -1 ? null : process.argv[i + 1] })()
const browser = await launch()
const lines = []
for (const port of PORTS) {
  const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage()
  await page.goto(`http://127.0.0.1:${port}/dashboard?port=7831`, { waitUntil: 'networkidle' })
  await page.waitForSelector('.dash-bar', { timeout: 60000 })
  const t = await page.$$eval('.dash-row .dash-meta', (es) => es.slice(0, 2).map((e) => JSON.stringify(e.textContent)))
  lines.push(`  :${port}`)
  for (const s of t) lines.push(`    ${s}`)
  await page.context().close()
}
await browser.close()
const text = lines.join('\n')
console.log(text)
if (OUT) writeFileSync(OUT, text + '\n')
