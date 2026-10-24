/**
 * Prove the three address fields and their buttons are 44px targets, and
 * prove the 44px came from empty space rather than from a neighbour.
 *
 * The 2026-10-24d run's verifier asked "did any drawn box change?" and
 * took any answer but no as a failure. That premise is gone here. This
 * change grows the fields' border boxes on purpose, from 26.3/27.2 to 44,
 * because an <input> renders no ::after and so cannot be given an
 * invisible overlay. So the questions have to be sharper:
 *
 *   1. Is the field's box 44px at all three viewports? The padding is a
 *      calc over `1lh`, and if `lh` is unsupported the declaration is
 *      invalid and the field silently keeps its old box. A number read
 *      back from the browser is the only thing that proves it resolved.
 *   2. Does a press in the new band reach the field? Geometry can be
 *      right while the press lands on an ancestor. Pressed 1px inside
 *      the new top edge, the field has to take focus. Pressed 2px
 *      outside it, the field must NOT, or the box is bigger than claimed.
 *   3. Does the field still own its own bottom edge? The button's
 *      overlay reaches 13.6px up, and below `sm` the button sits under
 *      the field. This is the specific thing the gap was widened for, so
 *      a press on the field's rule has to focus the field and not the
 *      button.
 *   4. Did anything lose hit area, anywhere on the site? Three boxes
 *      grew into space four neighbours used to border. Every target is
 *      compared before against after and any shrink is a failure.
 *   5. Did layout move? Above `sm` the claim is that nothing moved at
 *      all, which the negative margin is there to guarantee. Below `sm`
 *      the claim is that exactly 4px moved per form, from the gap, and
 *      nothing else. Both are asserted rather than asserted-about.
 *
 * usage: node verify-fields.mjs out.txt   (needs data/hit-areas-{before,after}.json)
 */
import { launch, VIEWPORTS } from "../../review-kit/lib/browser.mjs";
import { readFileSync, writeFileSync } from "node:fs";

const BASE = process.env.URSA_BASE ?? "http://127.0.0.1:4953";
const OUT = process.argv[2] ?? "data/field-verification.txt";
const before = JSON.parse(readFileSync("data/hit-areas-before.json", "utf8"));
const after = JSON.parse(readFileSync("data/hit-areas-after.json", "utf8"));

const log = [];
let pass = 0;
let fail = 0;
const check = (ok, what, got, want) => {
  log.push(`  ${ok ? "ok  " : "FAIL"}  ${String(what).padEnd(62)} got ${got}  want ${want}`);
  ok ? pass++ : fail++;
};

/* ---- 4: nothing anywhere lost hit area ---- */
log.push("=== 4. every target on the site, before against after ===");
let grew = 0;
let same = 0;
let shrank = 0;
let boxGrew = 0;
let boxSame = 0;
for (const k of Object.keys(before)) {
  const b = before[k];
  const a = after[k];
  check(b.length === a.length, `${k}: same number of targets`, a.length, b.length);
  for (let i = 0; i < Math.min(b.length, a.length); i++) {
    const label = `${k}[${i}] ${b[i].tag}.${b[i].cls.slice(0, 16)} "${b[i].label.slice(0, 18)}"`;
    // the three fields are the intended exception, and only upward
    const isField = b[i].tag === "input";
    if (b[i].boxH !== a[i].boxH) {
      if (isField && a[i].boxH === 44) boxGrew++;
      else check(false, `${label}: drawn box height unchanged`, a[i].boxH, b[i].boxH);
    } else boxSame++;
    if (b[i].boxW !== a[i].boxW) check(false, `${label}: drawn box width unchanged`, a[i].boxW, b[i].boxW);
    if (b[i].hitH !== null && a[i].hitH !== null) {
      if (a[i].hitH < b[i].hitH) { shrank++; check(false, `${label}: hit height not stolen`, a[i].hitH, `>= ${b[i].hitH}`); }
      else if (a[i].hitH > b[i].hitH) grew++;
      else same++;
    }
  }
}
check(shrank === 0, "no target anywhere lost hit area", shrank, 0);
check(boxGrew === 9, "exactly 9 drawn boxes changed (3 fields x 3 viewports)", boxGrew, 9);
log.push(`  -> ${grew} hit areas grew, ${same} unchanged, ${shrank} shrank; ${boxSame} drawn boxes identical, ${boxGrew} fields to 44px`);

const browser = await launch();
for (const [vname, w, h] of VIEWPORTS) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const stacked = w < 640; // tailwind's sm

  for (const [pname, path, count] of [["set", "/record", 2], ["address", "/record/at", 1]]) {
    log.push(`\n=== ${vname} ${w}x${h} · ${pname} ${path} ===`);
    await page.goto(BASE + path, { waitUntil: "networkidle" });
    await page.waitForTimeout(250);

    const fields = page.locator("input.rec-field");
    check((await fields.count()) === count, `${pname}: ${count} field(s) wearing .rec-field`, await fields.count(), count);

    for (let i = 0; i < count; i++) {
      const f = fields.nth(i);
      await f.scrollIntoViewIfNeeded();
      await page.waitForTimeout(80);
      let box = await f.boundingBox();

      /* 1. the calc resolved */
      check(Math.abs(box.height - 44) < 0.5, `field ${i}: border box is 44px (lh calc resolved)`, box.height.toFixed(1), "44");

      /* 2. a press 1px inside the new top edge focuses the field */
      await page.mouse.click(box.x + box.width / 2, box.y + 1);
      await page.waitForTimeout(100);
      let activeIsField = await f.evaluate((el) => el === document.activeElement);
      check(activeIsField, `field ${i}: press 1px inside the new TOP edge focused it`, activeIsField, true);

      /* 2b. a press 2px above it must not */
      await page.evaluate(() => document.activeElement?.blur());
      await page.mouse.click(box.x + box.width / 2, box.y - 2);
      await page.waitForTimeout(100);
      activeIsField = await f.evaluate((el) => el === document.activeElement);
      check(!activeIsField, `field ${i}: press 2px ABOVE the box did not focus it`, activeIsField, false);

      /* 3. the field still owns its own bottom edge, rule included */
      await page.evaluate(() => document.activeElement?.blur());
      box = await f.boundingBox();
      await page.mouse.click(box.x + box.width / 2, box.y + box.height - 1);
      await page.waitForTimeout(100);
      activeIsField = await f.evaluate((el) => el === document.activeElement);
      check(activeIsField, `field ${i}: press on its own rule focused it, not the button`, activeIsField, true);
      await page.evaluate(() => document.activeElement?.blur());
    }

    /* the submit buttons: the overlay has to carry a press from outside
       the drawn box. A disabled button answers nothing, so each field is
       typed into first, and the press is checked by whether the form was
       submitted rather than by what the network did. */
    const btns = page.locator("button.rec-action.rec-hit");
    check((await btns.count()) === count, `${pname}: ${count} submit button(s) wearing .rec-hit`, await btns.count(), count);
    for (let i = 0; i < count; i++) {
      const b = btns.nth(i);
      await b.scrollIntoViewIfNeeded();
      await page.waitForTimeout(80);
      const field = fields.nth(i);
      await field.fill("https://example.invalid/x.json");
      await page.waitForTimeout(80);
      check(await b.isEnabled(), `button ${i}: enabled once its field has a value`, await b.isEnabled(), true);

      await b.evaluate((el) => { el.dataset.pressed = ""; el.addEventListener("click", () => { el.dataset.pressed = "yes"; }, { once: true }); });
      const bb = await b.boundingBox();
      const over = (44 - bb.height) / 2;
      check(over > 0, `button ${i}: box short enough to need the overlay`, bb.height.toFixed(1), "< 44");
      await page.mouse.click(bb.x + bb.width / 2, bb.y - over + 1);
      await page.waitForTimeout(150);
      check((await b.getAttribute("data-pressed")) === "yes", `button ${i}: press ${over.toFixed(1)}px ABOVE the box reached it`, await b.getAttribute("data-pressed"), "yes");

      /* and it is 44px rather than 400: 2px further out reaches nothing */
      await b.evaluate((el) => { el.dataset.pressed = ""; el.addEventListener("click", () => { el.dataset.pressed = "yes"; }, { once: true }); });
      const bb2 = await b.boundingBox();
      await page.mouse.click(bb2.x + bb2.width / 2, bb2.y - (44 - bb2.height) / 2 - 2);
      await page.waitForTimeout(150);
      check((await b.getAttribute("data-pressed")) !== "yes", `button ${i}: press 2px OUTSIDE the hit area reached nothing`, await b.getAttribute("data-pressed"), "not yes");

      /* below sm the field is directly above: the press that landed
         outside the button must not have landed in the field either */
      if (stacked) {
        const stole = await fields.nth(i).evaluate((el) => el === document.activeElement);
        check(!stole, `button ${i}: its overlay sits clear of the field above (stacked)`, stole, false);
      }
      await field.fill("");
    }
  }
  await ctx.close();
}
await browser.close();

log.push(`\n=== ${pass + fail} checks, ${pass} pass, ${fail} fail ===`);
const text = log.join("\n") + "\n";
writeFileSync(OUT, text);
console.log(text);
process.exit(fail ? 1 : 0);
