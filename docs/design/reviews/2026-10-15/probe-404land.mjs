// The 404 at short-landscape sizes, which the header rule also reaches even
// though the 404 never had the problem the rule fixes. Check nothing it owns
// landed worse.
import { chromium } from "playwright";
const BASE = "http://localhost:3100";
const browser = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const SIZES = [[667, 375], [720, 360], [740, 360], [844, 390], [896, 414], [932, 430]];
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
const page = await ctx.newPage();
console.log("size       hdrEnd  h1End  linkEnd  footRule  firstCredit  docH  vh");
for (const [w, h] of SIZES) {
  await page.setViewportSize({ width: w, height: h });
  await page.goto(BASE + "/no-such-page", { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(250);
  const r = await page.evaluate(() => {
    const g = (s) => document.querySelector(s).getBoundingClientRect();
    const foot = document.querySelector("footer div div");
    const credit = foot.querySelector("span");
    return {
      hdr: Math.round(g("header").bottom),
      h1: Math.round(g("h1").bottom),
      link: Math.round(g("main a").bottom),
      rule: Math.round(foot.getBoundingClientRect().top),
      credit: Math.round(credit.getBoundingClientRect().bottom),
      docH: document.documentElement.scrollHeight,
    };
  });
  const flag = r.link > h ? "  LINK BELOW FOLD" : "";
  console.log(`${w}x${h}`.padEnd(10), String(r.hdr).padStart(5), String(r.h1).padStart(7), String(r.link).padStart(8), String(r.rule).padStart(9), String(r.credit).padStart(12), String(r.docH).padStart(6), String(h).padStart(4), flag);
}
await browser.close();
