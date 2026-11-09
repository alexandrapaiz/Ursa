/**
 * Declare the scrolling command boxes to the instrument WITHOUT changing the
 * site, so that "is the ring on these any good" can be answered separately
 * from "does our markup declare them". Used for this run's before-numbers.
 *
 * It adds tabindex="0" to every `pre.rec-cmd` that actually overflows, which
 * is exactly the set Chromium already puts in the tab ring. So the tab order
 * is the one the page already has; the only difference is that the kit's
 * ENUMERATE can now see it and will photograph it.
 */
export default async function declarePre(page) {
  await page.evaluate(() => {
    for (const el of document.querySelectorAll('pre.rec-cmd')) {
      if (el.scrollWidth - el.clientWidth > 1) el.setAttribute('tabindex', '0')
    }
  })
}
