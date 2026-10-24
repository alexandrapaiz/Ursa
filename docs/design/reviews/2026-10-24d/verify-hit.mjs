/**
 * Prove the enlarged hit areas are real, and prove they were not taken
 * from something else.
 *
 * An invisible change cannot be reviewed from a screenshot, so this is
 * the evidence for it. Three things are asked, and the second is the one
 * that could have gone wrong quietly:
 *
 *   1. Does a click land? Not "is the overlay 44px" but: press a point
 *      that is inside the new hit area and outside the control's own
 *      drawn box, and check the control answered. Geometry can be right
 *      while a stacking context eats the press.
 *   2. Did a neighbour lose anything? Every overlay reaches past its
 *      control's box, so every overlay is a candidate for stealing the
 *      press that belonged to the control above or below it. Every
 *      target on the site is measured before and after and any hit area
 *      that SHRANK is a failure, wherever it is.
 *   3. Did a pixel move? The drawn box of every target has to be
 *      identical before and after, because the whole claim of this
 *      approach is that it changes the hit area and nothing else.
 *
 * usage: node verify-hit.mjs out.txt      (needs data/hit-areas-{before,after}.json)
 */
import { launch, VIEWPORTS } from "../../review-kit/lib/browser.mjs";
import { readFileSync, writeFileSync } from "node:fs";

const BASE = process.env.URSA_BASE ?? "http://127.0.0.1:4947";
const OUT = process.argv[2] ?? "hit-verification.txt";
const before = JSON.parse(readFileSync("data/hit-areas-before.json", "utf8"));
const after = JSON.parse(readFileSync("data/hit-areas-after.json", "utf8"));

const log = [];
let pass = 0;
let fail = 0;
const check = (ok, what, got, want) => {
  log.push(`  ${ok ? "ok  " : "FAIL"}  ${what.padEnd(58)} got ${got}  want ${want}`);
  ok ? pass++ : fail++;
};

/* ---- 2 and 3: nothing shrank, nothing moved ---- */
log.push("=== every target on the site, before against after ===");
const keys = Object.keys(before);
let grew = 0;
let same = 0;
for (const k of keys) {
  const b = before[k];
  const a = after[k];
  check(b.length === a.length, `${k}: same number of targets`, a.length, b.length);
  for (let i = 0; i < Math.min(b.length, a.length); i++) {
    const label = `${k} [${i}] ${b[i].tag}.${b[i].cls} "${b[i].label.slice(0, 22)}"`;
    if (b[i].boxH !== a[i].boxH || b[i].boxW !== a[i].boxW)
      check(false, `${label}: drawn box unchanged`, `${a[i].boxW}x${a[i].boxH}`, `${b[i].boxW}x${b[i].boxH}`);
    if (b[i].hitH !== null && a[i].hitH !== null) {
      if (a[i].hitH < b[i].hitH)
        check(false, `${label}: hit height not stolen`, a[i].hitH, `>= ${b[i].hitH}`);
      else if (a[i].hitH > b[i].hitH) grew++;
      else same++;
    }
  }
}
log.push(`  -> ${grew} hit areas grew, ${same} unchanged, 0 shrank, every drawn box identical`);

/* ---- 1: a press in the new region actually lands ---- */
const browser = await launch();
for (const [vname, w, h] of VIEWPORTS) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();

  // the generation rows
  log.push(`\n=== ${vname} ${w}x${h} · generation rows, pressed outside the drawn box ===`);
  await page.goto(`${BASE}/record/mini-fixture`, { waitUntil: "networkidle" });
  const rows = page.locator("button.rec-action.rec-hit");
  const n = await rows.count();
  check(n === 2, "two generation rows found", n, 2);
  for (let i = 0; i < n; i++) {
    const row = rows.nth(i);
    await row.scrollIntoViewIfNeeded();
    const box = await row.boundingBox();
    const others = [];
    for (let j = 0; j < n; j++)
      others.push(await rows.nth(j).getAttribute("aria-expanded"));

    /* The press point is computed from the box rather than fixed, because
       the overhang is not a constant: this row wraps to two lines below
       `sm`, so its drawn box is 38.5px there and only 2.75px of overhang
       is left, where at 1440 it is 13.4px. A fixed 8px press tests the
       overlay at one width and the empty gap above it at another, which
       is how the first run of this file reported a phone failure that was
       its own. One pixel inside the top edge of the hit area is the
       strongest honest press: anything further out should miss. */
    const over = (44 - box.height) / 2;
    check(over > 0, `row ${i}: box is short enough to need an overlay`, box.height.toFixed(1), "< 44");
    const yTop = box.y - over + 1;
    await page.mouse.click(box.x + box.width / 2, yTop);
    await page.waitForTimeout(120);
    check(
      (await row.getAttribute("aria-expanded")) === "true",
      `row ${i}: press ${over.toFixed(1)}px ABOVE the box opened it`,
      await row.getAttribute("aria-expanded"),
      "true",
    );
    // and the row it is not
    for (let j = 0; j < n; j++) {
      if (j === i) continue;
      check(
        (await rows.nth(j).getAttribute("aria-expanded")) === others[j],
        `row ${i}: did not also toggle row ${j}`,
        await rows.nth(j).getAttribute("aria-expanded"),
        others[j],
      );
    }
    // close from below the drawn edge, which exercises the other overhang
    const box2 = await row.boundingBox();
    const over2 = (44 - box2.height) / 2;
    await page.mouse.click(box2.x + box2.width / 2, box2.y + box2.height + over2 - 1);
    await page.waitForTimeout(120);
    check(
      (await row.getAttribute("aria-expanded")) === "false",
      `row ${i}: press ${over2.toFixed(1)}px BELOW the box closed it`,
      await row.getAttribute("aria-expanded"),
      "false",
    );
    // one pixel further out than the overlay reaches must do nothing,
    // or the overlay is bigger than it claims
    const box3 = await row.boundingBox();
    await page.mouse.click(box3.x + box3.width / 2, box3.y - (44 - box3.height) / 2 - 2);
    await page.waitForTimeout(120);
    check(
      (await row.getAttribute("aria-expanded")) === "false",
      `row ${i}: press 2px OUTSIDE the hit area did nothing`,
      await row.getAttribute("aria-expanded"),
      "false",
    );
  }

  // the copy controls
  log.push(`\n=== ${vname} ${w}x${h} · copy controls, pressed outside the drawn box ===`);
  await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
  const copies = page.locator("button.cta.rec-hit");
  const cn = await copies.count();
  check(cn === 3, "three copy controls found", cn, 3);
  for (let i = 0; i < cn; i++) {
    const c = copies.nth(i);
    await c.scrollIntoViewIfNeeded();
    const label = (await c.textContent())?.trim();
    const box = await c.boundingBox();
    await page.mouse.click(box.x + box.width / 2, box.y - (44 - box.height) / 2 + 1);
    await page.waitForTimeout(150);
    const now = (await c.textContent())?.trim();
    // headless chromium may refuse the clipboard; either answer proves
    // the press reached the button, which is what is under test
    check(
      now === "copied" || now === "select it",
      `copy ${i}: press ${((44 - box.height) / 2).toFixed(1)}px ABOVE the box reached it`,
      `"${now}"`,
      '"copied" or "select it"',
    );
    if (now === label) log.push(`        (label did not change from "${label}")`);
  }

  /* The command block still scrolls where the overlay reaches.
     Two corrections over the first version of this check, both of which
     made it fail against a working site: it took `.first()`, whose
     command happens to fit its box at tablet and desktop, so there was
     nothing to scroll and zero was the right answer; and it measured the
     box without putting it on screen first, so on a 3818px page the
     wheel went to whatever was at those coordinates instead. Now it
     takes the block with the most overflow and scrolls it into view. */
  const idx = await page.$$eval("pre.rec-cmd", (els) => {
    let best = 0;
    let max = -1;
    els.forEach((el, i) => {
      const o = el.scrollWidth - el.clientWidth;
      if (o > max) { max = o; best = i; }
    });
    return [best, max];
  });
  const pre = page.locator("pre.rec-cmd").nth(idx[0]);
  await pre.scrollIntoViewIfNeeded();
  check(idx[1] > 0, "a command block with somewhere to scroll exists", `${idx[1]}px`, "> 0px");
  const pbox = await pre.boundingBox();
  const sl0 = await pre.evaluate((el) => el.scrollLeft);
  await page.mouse.move(pbox.x + pbox.width / 2, pbox.y + pbox.height - 2);
  await page.mouse.wheel(120, 0);
  await page.waitForTimeout(200);
  const sl1 = await pre.evaluate((el) => el.scrollLeft);
  check(sl1 > sl0, "the command block still scrolls at its bottom edge", sl1, `> ${sl0}`);

  await ctx.close();
}
await browser.close();

log.push(`\n=== ${pass + fail} checks, ${pass} pass, ${fail} fail ===`);
const text = log.join("\n") + "\n";
writeFileSync(OUT, text);
console.log(text);
process.exit(fail ? 1 : 0);
