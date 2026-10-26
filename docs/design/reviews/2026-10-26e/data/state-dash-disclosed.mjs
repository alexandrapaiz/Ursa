/**
 * The dashboard with a record's "forget this" disclosure open
 * (`--state` for the review kit).
 *
 * This surface has never been photographed or probed in this state. The
 * kit only grew `--state` on 2026-10-26, and every measurement of this
 * page before that — L14's sixty controls, the tap-target sweep, the
 * narrow sweep — ran with every disclosure shut, so the paragraph and
 * the command block that appear when one opens have never been in any
 * frame. The panel had exactly this blind spot and it cost six reviews.
 *
 * It opens the first one only. Opening all nine would photograph a page
 * nobody will ever see, and the question here is what one disclosure
 * does to the row it is in.
 */
export default async function openFirstDisclosure(page) {
  const btn = page.locator('.dash-row .dash-action', { hasText: 'forget this' }).first()
  await btn.click()
  await page.waitForSelector('.dash-cmd', { timeout: 30000 })
}
