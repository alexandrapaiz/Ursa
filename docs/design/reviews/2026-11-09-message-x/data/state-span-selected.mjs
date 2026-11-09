// Drive the record viewer into its SELECTED state: one highlighted passage
// chosen, so the inspector renders a span rather than its invitation.
//
// Why a module rather than a URL: the selection lives in React state in
// record-view.tsx and nothing puts it in the address, so the only way to
// photograph this surface is to click it.
//
// The span picked is the first `survived_mutated` one, because that class is
// the only one whose inspector draws every field it can draw, including the
// diff against the generation. A `survived_verbatim` span has no diff and
// would photograph a shorter panel than the tallest case.
//
// Asserts rather than hopes: a click that lands on nothing leaves the page in
// the unselected state, which photographs as a perfectly reasonable page.
export default async (page) => {
  const target = page.locator('span.sp-survived_mutated[role="button"]').first()
  await target.waitFor({ state: 'visible', timeout: 15000 })
  await target.click()
  await page.waitForSelector('span.sp-selected', { timeout: 15000 })
  // The panel is what we came for, so gate on its heading and not on the span.
  await page.waitForFunction(() => {
    const a = document.querySelector('aside')
    return a && !a.textContent.includes('Choose any highlighted passage')
  }, { timeout: 15000 })
}
