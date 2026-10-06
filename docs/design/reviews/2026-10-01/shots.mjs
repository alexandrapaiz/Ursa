// Screenshot harness for the 2026-10-01 frontend review.
//   node shots.mjs <outDir> <prefix>
// Runs real WebGL through SwiftShader so the starfield shader and the
// constellation canvas render rather than falling back. Viewport captures
// at scroll positions, never fullPage: the sky is position:fixed and
// fullPage flattens everything below the first viewport height.
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const OUT = process.argv[2];
const PRE = process.argv[3] ?? "";
const BASE = "http://localhost:3100";

const VIEWPORTS = [
  { name: "iphone-390x844", width: 390, height: 844 },
  { name: "ipad-820x1180", width: 820, height: 1180 },
  { name: "desktop-1440x900", width: 1440, height: 900 },
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

// a padded clip around an element, clamped to the viewport
const fit = (b, vp) => {
  const x = Math.max(0, b.x - 30);
  const y = Math.max(0, b.y - 30);
  return {
    x,
    y,
    width: Math.min(b.width + 60, vp.width - x),
    height: Math.min(b.height + 60, vp.height - y),
  };
};

const errors = [];

for (const vp of VIEWPORTS) {
  for (const reduced of [false, true]) {
    if (reduced && vp.name !== "desktop-1440x900" && vp.name !== "iphone-390x844") continue;
    const ctx = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 1,
      reducedMotion: reduced ? "reduce" : "no-preference",
      hasTouch: vp.name !== "desktop-1440x900",
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
    // let the shader settle and the font load
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(1600);

    await shot(page, `home-hero${suffix}__${vp.name}`);

    if (!reduced) {
      // north stars in view
      await page.evaluate(() => {
        const s = document.querySelector("main section");
        window.scrollTo({ top: s.offsetTop - 40, behavior: "instant" });
      });
      await page.waitForTimeout(900);
      await shot(page, `home-northstars__${vp.name}`);

      // foot of the page
      await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: "instant" }));
      await page.waitForTimeout(900);
      await shot(page, `home-footer__${vp.name}`);

      // the hero/reading-column seam: where the sky meets the first rule
      await page.evaluate(() => {
        const s = document.querySelector("main section");
        window.scrollTo({ top: s.offsetTop - 260, behavior: "instant" });
      });
      await page.waitForTimeout(900);
      await shot(page, `home-seam__${vp.name}`);
    }

    // the CTA: rest, hover, focus, pressed
    if (!reduced) {
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
      await page.waitForTimeout(600);
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
        await page.keyboard.press("Tab");
        await page.waitForTimeout(400);
        await shot(page, `cta-focus__${vp.name}`, { clip });
      }
    }

    // 404
    await page.goto(`${BASE}/no-such-page`, { waitUntil: "load" });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(1400);
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
        await page.waitForTimeout(400);
        await shot(page, `notfound-link-hover__${vp.name}`, { clip });
      }
    }

    await ctx.close();
  }
}

await browser.close();
console.log("\nconsole errors:", errors.length ? errors : "none");
