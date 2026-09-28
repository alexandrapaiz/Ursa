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
    const out = await Promise.race([
      page.evaluate(() => {
        const splitTop = (s) => { // split a CSS list on top-level commas
          const parts = []; let depth = 0, cur = '';
          for (const ch of s) {
            if (ch === '(') depth++; if (ch === ')') depth--;
            if (ch === ',' && depth === 0) { parts.push(cur.trim()); cur = ''; } else cur += ch;
          }
          if (cur.trim()) parts.push(cur.trim());
          return parts;
        };
        const pairs = {};
        for (const el of [...document.querySelectorAll('a,button,[class*=Button],[class*=button]')].slice(0, 200)) {
          const cs = getComputedStyle(el);
          if (!cs.transitionDuration || cs.transitionDuration === '0s') continue;
          const ds = splitTop(cs.transitionDuration), es = splitTop(cs.transitionTimingFunction), ps = splitTop(cs.transitionProperty);
          for (let i = 0; i < ds.length; i++) {
            const k = `${ps[i % ps.length] || '?'}  ${ds[i]}  ${es[i % es.length]}`;
            pairs[k] = (pairs[k] || 0) + 1;
          }
        }
        return Object.entries(pairs).sort((a,b)=>b[1]-a[1]).slice(0, 12);
      }),
      new Promise(r => setTimeout(() => r(null), 20000)),
    ]);
    if (!out) console.log('  probe timed out');
    else for (const [k,n] of out) console.log(`   x${String(n).padEnd(3)} ${k}`);
  } catch (e) { console.log('  FAILED:', e.message.split('\n')[0]); }
  await ctx.close().catch(()=>{});
}
await browser.close();
