import { chromium } from 'playwright';
const OUT = '/tmp/shots';
const browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader'] });

// --- R1: the portrait scroll cue, phone + tablet ---
for (const vp of [{n:'iphone-390x844',w:390,h:844},{n:'ipad-820x1180',w:820,h:1180},{n:'desktop-1440x900',w:1440,h:900}]) {
  const ctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h } });
  const page = await ctx.newPage();
  await page.goto('http://127.0.0.1:4311/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);
  const cue = await page.evaluate(() => {
    const el = document.querySelector('.scroll-cue');
    if (!el) return { present: false };
    const r = el.getBoundingClientRect();
    const host = el.parentElement;
    return { present: true, visible: getComputedStyle(host).display !== 'none',
             x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height),
             opacity: getComputedStyle(host).opacity, inFold: r.y < window.innerHeight && r.bottom > 0 };
  });
  console.log(`cue @ ${vp.n}:`, JSON.stringify(cue));
  await page.screenshot({ path: `${OUT}/after__scrollcue__${vp.n}.png` });
  // and after scrolling, it should fade out
  await page.evaluate(() => window.scrollTo(0, window.innerHeight * 0.4));
  await page.waitForTimeout(900);
  const faded = await page.evaluate(() => { const el = document.querySelector('.scroll-cue')?.parentElement; return el ? getComputedStyle(el).opacity : null; });
  console.log(`   after scroll, opacity = ${faded}`);
  await ctx.close();
}

// --- R2: CTA states. The button ships disabled, so the harness removes the
// attribute to show the state these styles produce once Polaris is available.
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, hasTouch: false });
const page = await ctx.newPage();
await page.goto('http://127.0.0.1:4311/', { waitUntil: 'networkidle' });
await page.waitForTimeout(2500);
const btn = page.locator('button.cta');

const snap = async (label) => {
  const box = await btn.boundingBox();
  await page.screenshot({ path: `${OUT}/after__cta-${label}__desktop-1440x900.png`,
    clip: { x: box.x - 30, y: box.y - 26, width: box.width + 60, height: box.height + 52 } });
  const cs = await btn.evaluate(el => { const c = getComputedStyle(el);
    return { border: c.borderColor, bg: c.backgroundColor, transform: c.transform, outline: c.outline, transition: c.transitionDuration }; });
  console.log(`CTA ${label}:`, JSON.stringify(cs));
};

console.log('\n--- disabled (as shipped today) ---');
await snap('01-disabled');

await btn.evaluate(el => { el.disabled = false; el.removeAttribute('aria-disabled'); });
await page.waitForTimeout(300);
console.log('--- enabled in the harness ---');
await snap('02-enabled-rest');

await btn.hover();
await page.waitForTimeout(400);
await snap('03-enabled-hover');

await page.mouse.down();
await page.waitForTimeout(160);
await snap('04-enabled-press');
await page.mouse.up();

await page.mouse.move(10, 10);
await page.waitForTimeout(400);
await btn.evaluate(el => el.focus());
await page.keyboard.press('Tab');
await page.keyboard.down('Shift'); await page.keyboard.press('Tab'); await page.keyboard.up('Shift');
await page.waitForTimeout(400);
await snap('05-enabled-focus-visible');
await ctx.close();

// --- touch: hover must not stick ---
const tctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
const tpage = await tctx.newPage();
await tpage.goto('http://127.0.0.1:4311/', { waitUntil: 'networkidle' });
await tpage.waitForTimeout(2000);
const touchHover = await tpage.evaluate(() => matchMedia('(hover: hover)').matches);
console.log('\ntouch context reports (hover: hover) =', touchHover, '→ hover rule', touchHover ? 'APPLIES' : 'does not apply');
await tctx.close();

// --- reduced motion: no transform, cue pixel static ---
const rctx = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
const rpage = await rctx.newPage();
await rpage.goto('http://127.0.0.1:4311/', { waitUntil: 'networkidle' });
await rpage.waitForTimeout(2000);
const rm = await rpage.evaluate(() => {
  const px = document.querySelector('.scroll-cue-pixel');
  const cta = document.querySelector('.cta');
  return { cuePixelAnimation: px ? getComputedStyle(px).animationName : null,
           ctaTransition: cta ? getComputedStyle(cta).transitionProperty : null };
});
console.log('reduced motion:', JSON.stringify(rm));
await rpage.screenshot({ path: `${OUT}/after__reduced-motion__iphone-390x844.png` });
await rctx.close();
await browser.close();
