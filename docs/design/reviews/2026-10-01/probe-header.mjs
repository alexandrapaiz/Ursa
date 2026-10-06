import { chromium } from "playwright";
const b = await chromium.launch({ args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"] });
for (const w of [320, 360, 375, 390, 414]) {
  const ctx = await b.newContext({ viewport:{width:w,height:844}, deviceScaleFactor:1 });
  const p = await ctx.newPage();
  await p.goto("http://localhost:3100/", {waitUntil:"load"});
  await p.evaluate(()=>document.fonts.ready);
  const m = await p.evaluate(() => {
    const h = document.querySelector("header");
    const [mark, tag] = h.children;
    const a = mark.getBoundingClientRect(), c = tag.getBoundingClientRect();
    return {
      mark: [Math.round(a.left), Math.round(a.right), Math.round(a.height)],
      tag: [Math.round(c.left), Math.round(c.right), Math.round(c.height)],
      gap: Math.round(c.left - a.right),
      overflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    };
  });
  console.log(String(w).padEnd(5), JSON.stringify(m));
  await ctx.close();
}
await b.close();
