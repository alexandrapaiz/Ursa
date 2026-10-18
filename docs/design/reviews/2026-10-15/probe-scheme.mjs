// Does the document tell the browser it is dark? The page is a #020308 night
// sky; everything the UA paints for itself (scrollbar, form UI, the mobile
// address bar) follows color-scheme and theme-color, not our CSS.
import { chromium } from "playwright";
const BASE = "http://localhost:3100";
const browser = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, colorScheme: "light" });
const page = await ctx.newPage();
for (const route of ["/", "/no-such-page"]) {
  await page.goto(BASE + route, { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);
  const r = await page.evaluate(() => {
    const cs = getComputedStyle(document.documentElement);
    const metas = [...document.querySelectorAll("meta")].map((m) => `${m.name || m.getAttribute("property") || m.httpEquiv}="${m.content}"`);
    return {
      colorScheme: cs.colorScheme,
      bodyScheme: getComputedStyle(document.body).colorScheme,
      scrollbarWidth: innerWidth - document.documentElement.clientWidth,
      scrollable: document.documentElement.scrollHeight > innerHeight,
      prefersDark: matchMedia("(prefers-color-scheme: dark)").matches,
      metas,
    };
  });
  console.log(`\n${route}`);
  console.log("  html color-scheme :", r.colorScheme, " body:", r.bodyScheme);
  console.log("  page scrolls      :", r.scrollable, " classic scrollbar width:", r.scrollbarWidth);
  console.log("  UA prefers dark   :", r.prefersDark);
  console.log("  meta tags         :", r.metas.join("\n                      "));
}
await browser.close();
