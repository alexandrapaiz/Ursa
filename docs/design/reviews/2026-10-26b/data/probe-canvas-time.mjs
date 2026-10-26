import { launch } from "../../../review-kit/lib/browser.mjs";
const b = await launch();
for (const path of ["/", "/this-page-does-not-exist"]) {
  const ctx = await b.newContext({ viewport: { width: 320, height: 844 }, deviceScaleFactor: 1 });
  const p = await ctx.newPage();
  await p.goto("http://127.0.0.1:4953" + path, { waitUntil: "networkidle" });
  const series = [];
  for (let i = 0; i < 10; i++) {
    series.push(await p.evaluate(() => {
      const c = document.querySelector("canvas.pointer-events-none.fixed");
      if (!c) return "no fixed canvas";
      const r = c.getBoundingClientRect();
      return `${getComputedStyle(c).transform}  left ${r.left.toFixed(2)} right ${r.right.toFixed(2)}`;
    }));
    await p.waitForTimeout(250);
  }
  console.log("###", path);
  series.forEach((s, i) => console.log(`  +${i * 250}ms  ${s}`));
  await ctx.close();
}
await b.close();
