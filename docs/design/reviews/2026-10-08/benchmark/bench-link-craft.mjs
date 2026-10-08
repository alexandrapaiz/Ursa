// What four best-in-class AI product sites do to a *link* on hover and press,
// as opposed to a button. Our 404's word-mark is a link with a focus ring and
// no hover state at all, so this run went looking for what the field does.
//   node bench-link-craft.mjs
// Reads computed styles at rest and under :hover / :active, so these are the
// values the browser actually resolves rather than what the stylesheet says.
import { chromium } from "playwright";

const SITES = [
  { name: "Linear", url: "https://linear.app" },
  { name: "Vercel", url: "https://vercel.com" },
  { name: "claude.com", url: "https://claude.com" },
  { name: "Elicit", url: "https://elicit.com" },
];

const PROPS = ["color", "opacity", "backgroundColor", "borderBottomColor", "borderBottomWidth", "textDecorationLine", "textDecorationColor", "transform", "filter"];

const b = await chromium.launch();
for (const s of SITES) {
  const ctx = await b.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36",
  });
  const p = await ctx.newPage();
  console.log(`\n===== ${s.name} =====`);
  try {
    await p.goto(s.url, { waitUntil: "domcontentloaded", timeout: 60000 });
    await p.waitForTimeout(5000);

    // the word-mark: first link inside the header/nav
    const marks = p.locator("header a, nav a").first();
    const n = await p.locator("header a, nav a").count();
    console.log(`  ${n} header/nav links`);

    const read = async (loc) =>
      loc.evaluate((el, props) => {
        const cs = getComputedStyle(el);
        const o = {};
        for (const k of props) o[k] = cs[k];
        o.transition = `${cs.transitionProperty} ${cs.transitionDuration} ${cs.transitionTimingFunction}`;
        return o;
      }, PROPS);

    const rest = await read(marks);
    await marks.hover({ timeout: 5000 });
    await p.waitForTimeout(600);
    const hov = await read(marks);
    await p.mouse.down();
    await p.waitForTimeout(220);
    const act = await read(marks);
    await p.mouse.up();

    console.log(`  word-mark transition: ${rest.transition}`);
    for (const k of PROPS) {
      const marks2 = [rest[k], hov[k], act[k]];
      if (new Set(marks2).size > 1) console.log(`    ${k.padEnd(20)} rest ${rest[k]}  ->  hover ${hov[k]}  ->  press ${act[k]}`);
    }
    if (PROPS.every((k) => rest[k] === hov[k])) console.log("    (no computed change on hover)");

    // how many links in the page declare a transition at all
    const stats = await p.evaluate(() => {
      const as = [...document.querySelectorAll("a")].slice(0, 400);
      let withT = 0;
      const kinds = {};
      for (const a of as) {
        const cs = getComputedStyle(a);
        if (cs.transitionDuration !== "0s") {
          withT++;
          const k = `${cs.transitionProperty} | ${cs.transitionDuration} | ${cs.transitionTimingFunction}`;
          kinds[k] = (kinds[k] || 0) + 1;
        }
      }
      return { total: as.length, withT, top: Object.entries(kinds).sort((a, b) => b[1] - a[1]).slice(0, 3) };
    });
    console.log(`  ${stats.withT}/${stats.total} <a> declare a transition`);
    for (const [k, c] of stats.top) console.log(`    x${String(c).padStart(3)}  ${k}`);
  } catch (e) {
    console.log(`  FAILED: ${e.message.slice(0, 140)}`);
  }
  await ctx.close();
}
await b.close();
