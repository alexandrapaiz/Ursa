import { launch } from '/tmp/epito-ursa-frontend-Zrt2JV/docs/design/review-kit/lib/browser.mjs'
const url = 'file:///tmp/epito-ursa-frontend-Zrt2JV/.fe-run-1109c/fixture/legend.html'
const out = process.argv[2]
const b = await launch({ channel: 'chromium' })
for (const [name, w] of [['phone', 390], ['desktop', 1440]]) {
  const p = await b.newPage({ viewport: { width: w, height: 500 }, deviceScaleFactor: 1 })
  await p.goto(url, { waitUntil: 'networkidle' })
  for (const id of ['before', 'after']) {
    await p.locator('#' + id).screenshot({ path: `${out}/legend-${id}-${name}.png` })
  }
  await p.close()
}
await b.close()
console.log('shot')
