// Two questions this run needed answered, measured on the rendered page.
//   1. Does a header word-mark announce itself as a link on hover, and how?
//      Ours (the 404's) does not: it is a tab stop with a focus ring and no
//      hover state at all. The first pass only read the <a> itself, which
//      misses sites that style a child, so this one walks the subtree too.
//   2. Does a primary control answer a press distinctly from a hover? Ours
//      does on .cta, which ships disabled, and not at all on .quiet-link,
//      which is the only control on the site that works.
import { chromium } from "playwright";

const SITES = [
  { name: "Linear", url: "https://linear.app", cta: "a[href*='signup'], a[href*='start']" },
  { name: "Vercel", url: "https://vercel.com", cta: "a[href*='signup'], a[href*='new']" },
  { name: "claude.com", url: "https://claude.com", cta: "a[href*='login'], a[href*='download']" },
  { name: "Elicit", url: "https://elicit.com", cta: "a[href*='signup'], a[href*='login']" },
];

const PROPS = ["color", "opacity", "backgroundColor", "borderColor", "textDecorationLine", "textDecorationThickness", "textUnderlineOffset", "transform", "boxShadow", "filter"];

const snap = (loc) =>
  loc.evaluate((el, props) => {
    const out = [];
    for (const n of [el, ...el.querySelectorAll("*")].slice(0, 6)) {
      const cs = getComputedStyle(n);
      const o = { tag: n.tagName.toLowerCase() };
      for (const k of props) o[k] = cs[k];
      o.tr = `${cs.transitionProperty} ${cs.transitionDuration} ${cs.transitionTimingFunction}`;
      out.push(o);
    }
    return out;
  }, PROPS);

const diff = (a, b, label) => {
  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    for (const k of PROPS) {
      if (a[i][k] !== b[i][k]) console.log(`    ${label} <${a[i].tag}> ${k}: ${a[i][k]}  ->  ${b[i][k]}   [${a[i].tr}]`);
    }
  }
};

const b = await chromium.launch();
for (const s of SITES) {
  const ctx = await b.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36",
  });
  const p = await ctx.newPage();
  console.log(`\n===== ${s.name} =====`);
  try {
    await p.goto(s.url, { waitUntil: "domcontentloaded", timeout: 60000 });
    await p.waitForTimeout(5000);
    for (const [what, sel] of [["word-mark", "header a, nav a"], ["primary CTA", s.cta]]) {
      const loc = p.locator(sel).first();
      if (!(await loc.count())) { console.log(`  ${what}: not found`); continue; }
      const rest = await snap(loc);
      await loc.hover({ timeout: 5000 });
      await p.waitForTimeout(700);
      const hov = await snap(loc);
      await p.mouse.down();
      await p.waitForTimeout(260);
      const act = await snap(loc);
      await p.mouse.up();
      console.log(`  ${what}:`);
      const before = process.stdout.writableLength;
      diff(rest, hov, "hover ");
      diff(hov, act, "press ");
      void before;
    }
  } catch (e) {
    console.log(`  FAILED: ${e.message.slice(0, 120)}`);
  }
  await ctx.close();
}
await b.close();
