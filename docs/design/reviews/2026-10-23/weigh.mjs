import { chromium } from 'playwright'
const browser = await chromium.launch()
const rows = []
for (const [label, url] of [
  ['published site, no pairing stamp (as 0.3 published)', 'http://127.0.0.1:4344/a/'],
  ['published site, pairing stamped (0.4)',               'http://127.0.0.1:4344/b/'],
  ['viewer /record (ursa-minor, the set reader)',          'http://127.0.0.1:4455/record'],
]) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } })
  const page = await ctx.newPage()
  const seen = []
  page.on('response', async (r) => {
    try {
      const s = await r.request().sizes()
      seen.push({ url: r.url(), transfer: s.responseBodySize + s.responseHeadersSize, body: s.responseBodySize })
    } catch {}
  })
  await page.goto(url, { waitUntil: 'networkidle' })
  await page.waitForTimeout(400)
  const total = seen.reduce((a, s) => a + s.body, 0)
  rows.push({ label, docs: seen.length, bodyBytes: total, detail: seen.map(s => `${s.body}  ${s.url.replace(/^https?:\/\/127\.0\.0\.1:\d+/, '')}`) })
  await ctx.close()
}
await browser.close()
for (const r of rows) {
  console.log(`\n${r.label}`)
  console.log(`  ${r.docs} requests, ${r.bodyBytes} bytes of body over the wire (${(r.bodyBytes/1024).toFixed(1)} KiB)`)
  for (const d of r.detail) console.log(`    ${d}`)
}
