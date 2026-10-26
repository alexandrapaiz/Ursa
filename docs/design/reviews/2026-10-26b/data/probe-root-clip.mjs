/* Does the root element clip? scroller() in measure-narrow.mjs walks
   parents and stops before documentElement, so an `html { overflow-x:
   hidden }` is the one scroll container it cannot see. Asked of our own
   pages and of the one benchmark site where it mattered. */
import { launch } from "../../../review-kit/lib/browser.mjs";
const b = await launch();
for (const [name, url] of [["ursa-minor home", "http://127.0.0.1:4953/"], ["ursa-minor record", "http://127.0.0.1:4953/record/mini-fixture"], ["stripe", "https://stripe.com/"]]) {
  const ctx = await b.newContext({ viewport: { width: 320, height: 844 }, deviceScaleFactor: 1 });
  const p = await ctx.newPage();
  try {
    await p.goto(url, { waitUntil: "networkidle", timeout: 45000 });
    console.log(name, JSON.stringify(await p.evaluate(() => {
      const h = getComputedStyle(document.documentElement), b = getComputedStyle(document.body);
      return { htmlOverflowX: h.overflowX, bodyOverflowX: b.overflowX };
    })));
  } catch (e) { console.log(name, "FAILED", String(e.message).split("\n")[0]); }
  await ctx.close();
}
await b.close();
