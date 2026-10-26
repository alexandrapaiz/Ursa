/**
 * The panel after a key is derived (`--state` for the review kit).
 *
 * The passphrase field is the only control the overlay shows on arrival,
 * so every measurement of this surface before 2026-10-26 measured one
 * control out of four. Deriving a key swaps the whole view: header,
 * tuning list, verdict line and the run button. No bridge is running
 * here and none needs to be, because the verdict line falls back to the
 * error string and the run button is drawn either way. What this state
 * cannot reach is `misread?`, which needs a verdict carrying a quote,
 * and the review says so rather than counting it as measured.
 *
 * The passphrase is a literal in this file on purpose: it derives a key
 * for a blob that does not exist, on a page that holds it in memory and
 * never sends it, so it is a test input and not a secret.
 */
export default async function enterUnlocked(page) {
  await page.fill('input[type=password]', 'review-kit-not-a-secret')
  await page.press('input[type=password]', 'Enter')
  // 600,000 PBKDF2 iterations in the page, then one fetch that fails.
  // Gate on the button rather than on a number of milliseconds (L15).
  await page.waitForSelector('footer button', { timeout: 60000 })
}
