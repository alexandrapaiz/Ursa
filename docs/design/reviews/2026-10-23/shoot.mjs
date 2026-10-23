import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'

const OUT = process.argv[2] || '/tmp/epito-ursa-frontend-ioCvWd/docs/design/reviews/2026-10-23/after'
mkdirSync(OUT, { recursive: true })
const BASE = 'http://127.0.0.1:4411'
const VP = [
  ['phone', 390, 844],
  ['tablet', 820, 1180],
  ['desktop', 1440, 900],
]

// Address typed into the set reader, and the slug it is filed under.
const SETS = [
  ['set-single', `${BASE}/../single/`, 'http://127.0.0.1:4333/single/'],
  ['set-04', null, `${BASE}/fixtures/site-04/`],
  ['set-03', null, `${BASE}/fixtures/site-03/`],
  ['set-stated-none', null, 'http://127.0.0.1:4333/stated-none/'],
  ['set-empty', null, 'http://127.0.0.1:4333/empty/'],
  ['set-unbounded', null, 'http://127.0.0.1:4333/unbounded/'],
]

const browser = await chromium.launch()
const notes = []

async function shoot(page, name) {
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: true, scale: 'css' })
  const m = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
    height: document.documentElement.scrollHeight,
  }))
  notes.push(`${name.padEnd(28)} scrollWidth ${String(m.scrollWidth).padStart(5)}  clientWidth ${String(m.clientWidth).padStart(5)}  overflow ${String(m.scrollWidth - m.clientWidth).padStart(4)}px  height ${String(m.height).padStart(5)}px`)
}

for (const [vname, w, h] of VP) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 })
  const page = await ctx.newPage()

  for (const [slug, path] of [['home', '/'], ['record-index', '/record'], ['record-example', '/record/mini-fixture'], ['record-at', '/record/at']]) {
    await page.goto(BASE + path, { waitUntil: 'networkidle' })
    await shoot(page, `${slug}-${vname}`)
  }

  for (const [slug, _unused, address] of SETS) {
    await page.goto(`${BASE}/record`, { waitUntil: 'networkidle' })
    await page.fill('input[type=url]', address)
    await page.click('button[type=submit]')
    // The set is drawn from the index alone; wait for the count line or the empty prose.
    await page.waitForFunction(() => {
      const t = document.body.innerText
      return /record(s)? ·/.test(t) || /lists no records/.test(t) || /answered \d\d\d/.test(t)
    }, null, { timeout: 15000 })
    await page.waitForTimeout(250)
    await shoot(page, `${slug}-${vname}`)
  }
  await ctx.close()
}

await browser.close()
console.log(notes.join('\n'))
