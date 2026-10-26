import { launch } from "../../../review-kit/lib/browser.mjs";
const b = await launch();
for (const w of [320, 390, 1440]) {
  const ctx = await b.newContext({ viewport: { width: w, height: 844 }, deviceScaleFactor: 1 });
  const p = await ctx.newPage();
  await p.goto("http://127.0.0.1:4953/", { waitUntil: "networkidle" });
  const out = await p.evaluate(() => [...document.querySelectorAll("canvas")].map((c) => {
    const r = c.getBoundingClientRect(), s = getComputedStyle(c);
    const pr = c.parentElement.getBoundingClientRect(), ps = getComputedStyle(c.parentElement);
    return {
      cls: c.getAttribute("class").slice(0, 60),
      rect: [+r.left.toFixed(1), +r.width.toFixed(1), +r.right.toFixed(1)],
      pos: s.position, transform: s.transform, wCss: s.width, left: s.left, mx: [s.marginLeft, s.marginRight],
      attr: [c.width, c.height],
      parent: { tag: c.parentElement.tagName.toLowerCase(), cls: (c.parentElement.getAttribute("class")||"").slice(0,50), rect: [+pr.left.toFixed(1), +pr.width.toFixed(1)], pos: ps.position, ox: ps.overflowX },
      docClientW: document.documentElement.clientWidth,
      innerW: window.innerWidth,
    };
  }));
  console.log("### viewport", w);
  console.log(JSON.stringify(out, null, 1));
  await ctx.close();
}
await b.close();
