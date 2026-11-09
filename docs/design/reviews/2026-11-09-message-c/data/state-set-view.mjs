// The set view, which is a state and not a URL.
//
//   node shoot.mjs --base ... --pages set=/record --state <this file> --until .rec-row
//
// `/record` draws an address form until a reader pastes the address of a
// published site, so every sweep this seat has run photographed the form
// and nothing has ever photographed the rows. The fixture is the one this
// repository already ships and `verify-hover.mjs` already drives.
export default async function drive(page) {
  const base = new URL(page.url()).origin
  await page.fill('input[aria-label="the address of a published site"]', `${base}/fixtures/site-04/`)
  await page.click('button:has-text("read the site")')
  await page.waitForSelector('.rec-row', { timeout: 20000 })
}
