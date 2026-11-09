// A record open at its address, with the FIRST GENERATION EXPANDED.
//
// Two states the previous run carded in one drive, because the expanded
// generation only exists inside an opened record and `/record/at` is the
// arrival that had never been driven at all. The panel it opens draws the
// generation's own text, which is the longest monospace run on the site.
//
// Asserts the toggle actually toggled: `aria-expanded` is on the button, so
// the drive reads the state the component publishes rather than guessing
// from a height.
import { openedAtAddress } from './at-error-states.mjs'

export default async (page) => {
  await openedAtAddress(page)
  const toggle = page.locator('button[aria-expanded]').first()
  await toggle.waitFor({ state: 'visible', timeout: 15000 })
  await toggle.click()
  await page.waitForFunction(
    () => document.querySelector('button[aria-expanded]')?.getAttribute('aria-expanded') === 'true',
    { timeout: 15000 },
  )
  // The panel paints after the attribute flips, so settle on the geometry.
  await page.waitForTimeout(400)
}
