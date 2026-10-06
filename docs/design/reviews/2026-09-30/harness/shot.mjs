// Screenshot harness for the 2026-09-30 visual review.
// Usage: node shot.mjs <before|after> [--only=name]
import { mkdirSync } from "node:fs";
import { execSync } from "node:child_process";
import { createRequire } from "node:module";

// playwright is a dev dependency of the site, not of docs/, so resolve it
// from there rather than from this file's directory.
const require = createRequire(new URL("../../../../../ursa-minor/package.json", import.meta.url));
const { chromium } = require("playwright");

const phase = process.argv[2] ?? "before";
const only = (process.argv.find((a) => a.startsWith("--only=")) ?? "").slice(7);
const BASE = process.env.BASE ?? "http://localhost:3117";
const OUT = new URL(`../${phase}/`, import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });

const VIEWPORTS = [
  { name: "iphone-390x844", width: 390, height: 844, dsf: 1 },
  { name: "ipad-820x1180", width: 820, height: 1180, dsf: 1 },
  { name: "desktop-1440x900", width: 1440, height: 900, dsf: 1 },
];

// Every shot is deterministic: animations are frozen so a diff between two
// runs is a layout change and never a different frame of the pixel sky.
const FREEZE = `*, *::before, *::after {
  animation-play-state: paused !important;
  animation-delay: -1s !important;
  transition: none !important;
}`;

async function shot(page, name, vp, opts = {}) {
  const file = `${OUT}${phase}__${name}__${vp.name}.png`;
  await page.screenshot({ path: file, fullPage: !!opts.fullPage });
  return file;
}

const browser = await chromium.launch();
const written = [];

for (const vp of VIEWPORTS) {
  const ctx = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    deviceScaleFactor: vp.dsf,
    hasTouch: vp.name.startsWith("iphone"),
    isMobile: vp.name.startsWith("iphone"),
  });
  const page = await ctx.newPage();

  const go = async (path) => {
    await page.goto(BASE + path, { waitUntil: "networkidle" });
    await page.addStyleTag({ content: FREEZE });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(250);
  };

  if (!only || only === "home") {
    await go("/");
    written.push(await shot(page, "home-hero", vp));
    written.push(await shot(page, "home-full", vp, { fullPage: true }));

    for (const [name, sel] of [
      ["home-northstars", "main section"],
      ["home-footer", "footer"],
    ]) {
      await page.locator(sel).scrollIntoViewIfNeeded();
      await page.waitForTimeout(150);
      written.push(await shot(page, name, vp));
    }

    // the seam the footer and the reading column share: one shot that holds
    // the last north star and the whole footer, which is where a container
    // mismatch between the two shows up
    await page.evaluate(() => {
      const f = document.querySelector("footer");
      window.scrollTo(0, f.offsetTop - 260);
    });
    await page.waitForTimeout(150);
    written.push(await shot(page, "home-seam", vp));
  }

  if (!only || only === "notfound") {
    await go("/this-route-does-not-exist");
    written.push(await shot(page, "notfound", vp));
    written.push(await shot(page, "notfound-full", vp, { fullPage: true }));
  }

  // interaction states, desktop only (hover does not exist on the others)
  if (vp.name === "desktop-1440x900" && !only) {
    await go("/");
    written.push(await shot(page, "cta-rest", vp));
    await page.locator("button.cta").hover();
    await page.waitForTimeout(300);
    written.push(await shot(page, "cta-hover", vp));

    await go("/this-route-does-not-exist");
    const link = page.locator("a.quiet-link").first();
    if (await link.count()) {
      await link.hover();
      await page.waitForTimeout(300);
      written.push(await shot(page, "quietlink-hover", vp));
      await page.keyboard.press("Tab");
      await page.waitForTimeout(200);
      written.push(await shot(page, "quietlink-focus", vp));
    }
  }

  // reduced motion, one viewport, to prove the cue and the cta stand still
  if (vp.name === "iphone-390x844" && !only) {
    const rm = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      reducedMotion: "reduce",
      hasTouch: true,
      isMobile: true,
    });
    const p2 = await rm.newPage();
    await p2.goto(BASE + "/", { waitUntil: "networkidle" });
    await p2.waitForTimeout(400);
    await p2.screenshot({ path: `${OUT}${phase}__reduced-motion__${vp.name}.png` });
    written.push(`${OUT}${phase}__reduced-motion__${vp.name}.png`);
    await rm.close();
  }

  await ctx.close();
}

await browser.close();

// 1x already; squeeze the files so the repo stays light
try {
  execSync(`command -v pngquant >/dev/null 2>&1 && pngquant --force --skip-if-larger --quality 60-90 --ext .png ${OUT}*.png || true`, { stdio: "ignore", shell: "/bin/bash" });
} catch {}

console.log(written.map((w) => w.split("/").pop()).join("\n"));
console.log(`\n${written.length} shots -> ${phase}/`);
