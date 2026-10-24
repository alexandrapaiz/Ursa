/**
 * The three address forms, measured box by box.
 *
 * Proposal 1 of the 2026-10-24d review says the inputs want a 44px box "by
 * padding", and padding is the only route open here: an <input> is a
 * replaced element, so it renders no ::after, so the .rec-hit overlay the
 * last run established cannot reach it. The height has to be real.
 *
 * Real height moves layout, which is why this file exists. For each form it
 * reports the input, the submit button, the box above the form and the box
 * below it, so the question "where does 16px of new padding come from" is
 * answered with distances rather than guessed at.
 *
 * usage: node probe-forms.mjs out.txt
 */
import { launch, VIEWPORTS } from "../../review-kit/lib/browser.mjs";
import { writeFileSync } from "node:fs";

const BASE = process.env.URSA_BASE ?? "http://127.0.0.1:4953";
const OUT = process.argv[2] ?? "forms.txt";

const PAGES = [["set", "/record"], ["address", "/record/at"]];

const browser = await launch();
const out = [];
for (const [vname, w, h] of VIEWPORTS) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  for (const [pname, path] of PAGES) {
    await page.goto(BASE + path, { waitUntil: "networkidle" });
    await page.waitForTimeout(300);
    const forms = await page.evaluate(() => {
      const r3 = (n) => Math.round(n * 10) / 10;
      const box = (el) => { const r = el.getBoundingClientRect(); return { t: r3(r.top), b: r3(r.bottom), w: r3(r.width), h: r3(r.height) }; };
      const pad = (el) => { const s = getComputedStyle(el); return { pt: s.paddingTop, pb: s.paddingBottom, bb: s.borderBottomWidth, fs: s.fontSize, lh: s.lineHeight, bs: s.boxSizing }; };
      return [...document.querySelectorAll("form")].map((f, i) => {
        const input = f.querySelector("input");
        const btn = f.querySelector("button");
        const parent = f.parentElement;
        const sibs = [...parent.children];
        const myIdx = sibs.indexOf(f);
        const prev = sibs[myIdx - 1] ?? null;
        const next = sibs[myIdx + 1] ?? null;
        const ps = getComputedStyle(parent);
        return {
          i,
          formBox: box(f),
          formStyle: { mt: getComputedStyle(f).marginTop, rowGap: getComputedStyle(f).rowGap, colGap: getComputedStyle(f).columnGap, dir: getComputedStyle(f).flexDirection, align: getComputedStyle(f).alignItems },
          parent: { tag: parent.tagName.toLowerCase(), dir: ps.flexDirection, align: ps.alignItems, rowGap: ps.rowGap, colGap: ps.columnGap, mt: ps.marginTop, box: box(parent) },
          prev: prev ? { tag: prev.tagName.toLowerCase(), cls: String(prev.className).slice(0, 40), box: box(prev) } : null,
          next: next ? { tag: next.tagName.toLowerCase(), cls: String(next.className).slice(0, 40), box: box(next) } : null,
          input: input ? { box: box(input), ...pad(input) } : null,
          btn: btn ? { label: btn.textContent.trim(), box: box(btn), ...pad(btn) } : null,
        };
      });
    });
    for (const f of forms) {
      out.push(`\n=== ${vname} ${w}x${h} · ${pname} ${path} · form[${f.i}] ===`);
      out.push(`  form      top ${f.formBox.t} bottom ${f.formBox.b} h ${f.formBox.h}  mt ${f.formStyle.mt} dir ${f.formStyle.dir} align ${f.formStyle.align} gap-y ${f.formStyle.rowGap} gap-x ${f.formStyle.colGap}`);
      out.push(`  parent    ${f.parent.tag} dir ${f.parent.dir} align ${f.parent.align} gap-y ${f.parent.rowGap} gap-x ${f.parent.colGap} mt ${f.parent.mt} h ${f.parent.box.h}`);
      if (f.prev) out.push(`  above     ${f.prev.tag}.${f.prev.cls} bottom ${f.prev.box.b}  -> gap to form ${Math.round((f.formBox.t - f.prev.box.b) * 10) / 10}px`);
      if (f.next) out.push(`  below     ${f.next.tag}.${f.next.cls} top ${f.next.box.t}  -> gap from form ${Math.round((f.next.box.t - f.formBox.b) * 10) / 10}px`);
      if (f.input) out.push(`  input     ${f.input.box.w}x${f.input.box.h} top ${f.input.box.t} bottom ${f.input.box.b}  pt ${f.input.pt} pb ${f.input.pb} border-b ${f.input.bb} font ${f.input.fs}/${f.input.lh} ${f.input.bs}  NEEDS +${Math.round((44 - f.input.box.h) * 10) / 10}`);
      if (f.btn) out.push(`  button    "${f.btn.label}" ${f.btn.box.w}x${f.btn.box.h} top ${f.btn.box.t} bottom ${f.btn.box.b}  pt ${f.btn.pt} pb ${f.btn.pb} font ${f.btn.fs}/${f.btn.lh}  NEEDS +${Math.round((44 - f.btn.box.h) * 10) / 10}`);
      if (f.input && f.btn) {
        const g = f.btn.box.t - f.input.box.b;
        out.push(`  input->button vertical distance ${Math.round(g * 10) / 10}px  (a 44px overlay on the button reaches ${Math.round(((44 - f.btn.box.h) / 2) * 10) / 10}px above its box)`);
      }
    }
  }
  await ctx.close();
}
await browser.close();
const text = out.join("\n") + "\n";
writeFileSync(OUT, text);
console.log(text);
