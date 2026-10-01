import { chromium } from "playwright";
const SITES = [
  { name: "Linear",    url: "https://linear.app",   sel: "a[href*='signup'], a[href*='start'], header a" },
  { name: "Vercel",    url: "https://vercel.com",   sel: "a[href*='signup'], a[href*='new'], header a" },
  { name: "Anthropic", url: "https://claude.com",   sel: "a[href*='login'], a[href*='download'], header a" },
];
const b = await chromium.launch();
for (const s of SITES) {
  const ctx = await b.newContext({ viewport:{width:1440,height:900}, deviceScaleFactor:1 });
  const p = await ctx.newPage();
  try {
    await p.goto(s.url, { waitUntil: "domcontentloaded", timeout: 45000 });
    await p.waitForTimeout(4000);
    const out = await p.evaluate(() => {
      const res = { transitions: {}, focus: [], motionQuery: 0, scrollBehavior: getComputedStyle(document.documentElement).scrollBehavior };
      // every distinct transition declared on an interactive element
      const els = [...document.querySelectorAll("a, button")].slice(0, 260);
      for (const e of els) {
        const cs = getComputedStyle(e);
        if (cs.transitionDuration === "0s" || !cs.transitionProperty) continue;
        const key = `${cs.transitionProperty} | ${cs.transitionDuration} | ${cs.transitionTimingFunction}`;
        res.transitions[key] = (res.transitions[key] || 0) + 1;
      }
      // focus-visible: is there a declared outline anywhere in the sheets?
      for (const sheet of document.styleSheets) {
        let rules; try { rules = sheet.cssRules; } catch { continue; }
        for (const r of rules || []) {
          if (r.selectorText && /focus-visible/.test(r.selectorText) && /outline|box-shadow|ring/.test(r.cssText)) {
            res.focus.push(r.cssText.slice(0, 150));
          }
        }
      }
      res.focus = res.focus.slice(0, 6);
      return res;
    });
    const top = Object.entries(out.transitions).sort((a,b)=>b[1]-a[1]).slice(0, 6);
    console.log(`\n===== ${s.name} (${s.url}) =====`);
    console.log("scroll-behavior:", out.scrollBehavior);
    for (const [k,n] of top) console.log(`  x${String(n).padStart(3)}  ${k}`);
    console.log("  focus-visible rules:");
    for (const f of out.focus) console.log("    " + f);
  } catch (e) {
    console.log(`\n===== ${s.name} FAILED: ${e.message.slice(0,120)}`);
  }
  await ctx.close();
}
await b.close();
