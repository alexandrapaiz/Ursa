import { chromium } from 'playwright';
const SITES = [
  { name: 'linear', url: 'https://linear.app' },
  { name: 'vercel', url: 'https://vercel.com' },
  { name: 'elicit', url: 'https://elicit.com' },
];
const browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
for (const site of SITES) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 },
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36' });
  const page = await ctx.newPage();
  console.log(`\n===== ${site.name} =====`);
  try {
    await page.goto(site.url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: `/tmp/shots/bench__${site.name}.png`, timeout: 15000 }).catch(e => console.log('  (screenshot skipped)'));

    const craft = await Promise.race([
      page.evaluate(() => {
        const counts = {};
        const els = [...document.querySelectorAll('a,button')].slice(0, 120);
        for (const el of els) {
          const cs = getComputedStyle(el);
          const d = cs.transitionDuration, e = cs.transitionTimingFunction;
          if (!d || d === '0s') continue;
          const k = `${d.split(',')[0].trim()} | ${e.split(',')[0].trim()}`;
          counts[k] = (counts[k] || 0) + 1;
        }
        // hover delta on one prominent control
        const cand = els.find(e => { const r = e.getBoundingClientRect(); return r.width > 90 && r.height > 30 && r.top > 0 && r.top < 700; });
        let hover = null;
        if (cand) {
          const cs = getComputedStyle(cand);
          hover = { text: (cand.innerText||'').slice(0,26), transition: cs.transition.slice(0,140),
                    transform: cs.transform, bg: cs.backgroundColor, radius: cs.borderRadius };
        }
        return { counts, hover };
      }),
      new Promise(r => setTimeout(() => r({ timedOut: true }), 20000)),
    ]);
    if (craft.timedOut) { console.log('  probe timed out'); }
    else {
      const rows = Object.entries(craft.counts).sort((a,b)=>b[1]-a[1]).slice(0,8);
      console.log('  duration | easing  (frequency across links & buttons)');
      for (const [k,n] of rows) console.log(`    x${String(n).padEnd(3)} ${k}`);
      console.log('  prominent control:', JSON.stringify(craft.hover, null, 1));
    }
  } catch (e) { console.log('  FAILED:', e.message.split('\n')[0]); }
  await ctx.close().catch(()=>{});
}
await browser.close();
