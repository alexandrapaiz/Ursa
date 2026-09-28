import { chromium } from 'playwright';

const VIEWPORTS = [
  { name: 'iphone-390x844',  width: 390,  height: 844,  dsf: 1 },
  { name: 'ipad-820x1180',   width: 820,  height: 1180, dsf: 1 },
  { name: 'desktop-1440x900',width: 1440, height: 900,  dsf: 1 },
];

const stage = process.argv[2] || 'before';
const outDir = process.argv[3] || '/tmp/shots';
const base = 'http://127.0.0.1:4311';

const browser = await chromium.launch({
  args: ['--enable-unsafe-swiftshader', '--use-gl=angle', '--use-angle=swiftshader', '--ignore-gpu-blocklist'],
});

for (const vp of VIEWPORTS) {
  const ctx = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    deviceScaleFactor: vp.dsf,
  });
  const page = await ctx.newPage();
  const errs = [];
  page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  page.on('pageerror', e => errs.push('pageerror: ' + e.message));

  await page.goto(base, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2500); // let the sky/constellation settle

  const webgl = await page.evaluate(() => {
    const c = document.createElement('canvas');
    return !!c.getContext('webgl');
  });

  // 1. hero (above the fold)
  await page.screenshot({ path: `${outDir}/${stage}__home-hero__${vp.name}.png` });

  // 2. full page
  await page.screenshot({ path: `${outDir}/${stage}__home-full__${vp.name}.png`, fullPage: true });

  // 3. scrolled to the north stars section
  await page.evaluate(() => document.querySelector('main section')?.scrollIntoView({ block: 'start', behavior: 'instant' }));
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `${outDir}/${stage}__home-northstars__${vp.name}.png` });

  // 4. bottom / footer
  await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'instant' }));
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `${outDir}/${stage}__home-footer__${vp.name}.png` });

  // 5. hover state on the CTA (desktop only)
  if (vp.width >= 1024) {
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await page.waitForTimeout(600);
    const btn = page.locator('button', { hasText: 'Get Polaris' });
    await btn.hover({ force: true }).catch(() => {});
    await page.waitForTimeout(700);
    await page.screenshot({ path: `${outDir}/${stage}__home-cta-hover__${vp.name}.png` });
  }

  // measurements
  const metrics = await page.evaluate(() => {
    const out = {};
    out.docScrollW = document.documentElement.scrollWidth;
    out.winW = window.innerWidth;
    out.overflowX = document.documentElement.scrollWidth > window.innerWidth;
    const btn = [...document.querySelectorAll('button')].find(b => b.textContent.includes('Get Polaris'));
    if (btn) { const r = btn.getBoundingClientRect(); out.cta = { w: +r.width.toFixed(1), h: +r.height.toFixed(1), top: +r.top.toFixed(1) }; }
    const hero = document.querySelector('p');
    if (hero) { const r = hero.getBoundingClientRect(); out.hero = { w: +r.width.toFixed(1), h: +r.height.toFixed(1), top: +r.top.toFixed(1), fs: getComputedStyle(hero).fontSize }; }
    // any element wider than the viewport
    out.wide = [...document.querySelectorAll('body *')].filter(el => el.getBoundingClientRect().right > window.innerWidth + 1)
      .map(el => el.tagName + '.' + (el.className?.toString?.().slice(0, 40) || '')).slice(0, 6);
    const keys = [...document.querySelectorAll('main li > span:first-child')].map(s => {
      const r = s.getBoundingClientRect();
      return { t: s.textContent, w: +r.width.toFixed(1), h: +r.height.toFixed(1), sw: s.scrollWidth };
    });
    out.starKeys = keys;
    return out;
  });
  console.log(`\n### ${vp.name}  webgl=${webgl}`);
  console.log(JSON.stringify(metrics, null, 1));
  if (errs.length) console.log('CONSOLE ERRORS:', errs.slice(0, 5));
  await ctx.close();
}
await browser.close();
