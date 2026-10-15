// Screenshot harness for the 2026-10-08 frontend review.
//   node shots.mjs <outDir> <prefix>
// Carried forward from the 2026-10-01 run and extended: adds the scroll cue
// state, the header lockup, landscape phone, and a 1920 width.
// Real WebGL through SwiftShader, so the starfield shader and the
// constellation canvas render rather than falling back. Viewport captures at
// scroll positions, never fullPage: the sky is position:fixed and fullPage
// flattens everything below the first viewport height.
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const OUT = process.argv[2];
const PRE = process.argv[3] ?? "";
const BASE = "http://localhost:3100";

const VIEWPORTS = [
  { name: "iphone-390x844", width: 390, height: 844 },
  { name: "ipad-820x1180", width: 820, height: 1180 },
  { name: "desktop-1440x900", width: 1440, height: 900 },
  { name: "iphone-landscape-844x390", width: 844, height: 390, extra: true },
  { name: "desktop-1920x1080", width: 1920, height: 1080, extra: true },
];

mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({
  args: [
    "--use-gl=angle",
    "--use-angle=swiftshader",
    "--enable-unsafe-swiftshader",
    "--font-render-hinting=none",
  ],
});

const shot = async (page, name, opts = {}) => {
  await page.screenshot({ path: `${OUT}/${PRE}${name}.png`, ...opts });
  console.log("  shot", `${PRE}${name}`);
};

const fit = (b, vp, pad = 30) => {
  const x = Math.max(0, b.x - pad);
  const y = Math.max(0, b.y - pad);
  return {
    x,
    y,
    width: Math.min(b.width + pad * 2, vp.width - x),
    height: Math.min(b.height + pad * 2, vp.height - y),
  };
};

const errors = [];

for (const vp of VIEWPORTS) {
  for (const reduced of [false, true]) {
    if (reduced && vp.extra) continue;
    const ctx = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 1,
      reducedMotion: reduced ? "reduce" : "no-preference",
      hasTouch: vp.name.startsWith("iphone") || vp.name.startsWith("ipad"),
      isMobile: false,
    });
    const page = await ctx.newPage();
    page.on("console", (m) => {
      if (m.type() === "error") errors.push(`${vp.name}${reduced ? " reduced" : ""}: ${m.text()}`);
    });
    page.on("pageerror", (e) => errors.push(`${vp.name}: ${e.message}`));

    const suffix = reduced ? `-reduced` : "";
    console.log(`\n${vp.name}${suffix}`);
    await page.goto(BASE, { waitUntil: "load" });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(1800);

    await shot(page, `home-hero${suffix}__${vp.name}`);

    // the header lockup on its own
    const header = page.locator("header").first();
    const hb = await header.boundingBox();
    if (hb) await shot(page, `home-header${suffix}__${vp.name}`, { clip: fit(hb, vp, 8) });

    if (!reduced) {
      await page.evaluate(() => {
        const s = document.querySelector("main section");
        window.scrollTo({ top: s.offsetTop - 40, behavior: "instant" });
      });
      await page.waitForTimeout(900);
      await shot(page, `home-northstars__${vp.name}`);

      await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: "instant" }));
      await page.waitForTimeout(900);
      await shot(page, `home-footer__${vp.name}`);

      await page.evaluate(() => {
        const s = document.querySelector("main section");
        window.scrollTo({ top: s.offsetTop - 260, behavior: "instant" });
      });
      await page.waitForTimeout(900);
      await shot(page, `home-seam__${vp.name}`);
    }

    if (!reduced) {
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
      await page.waitForTimeout(700);
      const cta = page.locator("button", { hasText: "Get Polaris" });
      await cta.scrollIntoViewIfNeeded();
      await page.waitForTimeout(700);
      const box = await cta.boundingBox();
      if (box) {
        const clip = fit(box, vp);
        await shot(page, `cta-rest__${vp.name}`, { clip });
        await cta.hover().catch(() => {});
        await page.waitForTimeout(400);
        await shot(page, `cta-hover__${vp.name}`, { clip });
      }
    }

    await page.goto(`${BASE}/no-such-page`, { waitUntil: "load" });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(1600);
    await shot(page, `notfound${suffix}__${vp.name}`);

    if (!reduced) {
      const link = page.locator("a", { hasText: "Back to Ursa Minor" });
      await link.scrollIntoViewIfNeeded();
      await page.waitForTimeout(700);
      const lb = await link.boundingBox();
      if (lb) {
        const clip = fit(lb, vp);
        await shot(page, `notfound-link-rest__${vp.name}`, { clip });
        await link.hover().catch(() => {});
        await page.waitForTimeout(500);
        await shot(page, `notfound-link-hover__${vp.name}`, { clip });
        await page.mouse.move(2, 2);
        await page.waitForTimeout(600);
        // first tab stop on the 404 is the word-mark link
        await page.keyboard.press("Tab");
        await page.waitForTimeout(400);
        const wm = await page.locator("header a").first().boundingBox();
        if (wm) await shot(page, `notfound-wordmark-focus__${vp.name}`, { clip: fit(wm, vp) });
      }
    }

    await ctx.close();
  }
}

// narrow-width probes, home and 404
for (const w of [320, 360, 375, 414]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: 700 }, deviceScaleFactor: 1, hasTouch: true });
  const page = await ctx.newPage();
  console.log(`\nnarrow-${w}`);
  await page.goto(BASE, { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(1500);
  const hb = await page.locator("header").first().boundingBox();
  if (hb) await shot(page, `home-header__narrow-${w}x700`, { clip: fit(hb, { width: w, height: 700 }, 8) });
  await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: "instant" }));
  await page.waitForTimeout(700);
  await shot(page, `home-footer__narrow-${w}x700`);
  await page.goto(`${BASE}/no-such-page`, { waitUntil: "load" });
  await page.waitForTimeout(1200);
  await shot(page, `notfound__narrow-${w}x700`);
  await ctx.close();
}

await browser.close();
console.log("\nconsole errors:", errors.length ? errors : "none");
