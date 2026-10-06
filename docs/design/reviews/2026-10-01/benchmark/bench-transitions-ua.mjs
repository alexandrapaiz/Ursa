import { chromium } from "playwright";
const SITES = [
  { name: "Linear", url: "https://linear.app" },
  { name: "Elicit", url: "https://elicit.com" },
];
const b = await chromium.launch();
for (const s of SITES) {
  const ctx = await b.newContext({
    viewport:{width:1440,height:900}, deviceScaleFactor:1,
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36",
  });
  const p = await ctx.newPage();
  try {
    await p.goto(s.url, { waitUntil: "load", timeout: 60000 });
    await p.waitForTimeout(6000);
    const out = await p.evaluate(() => {
      const t = {};
      for (const e of [...document.querySelectorAll("a, button")].slice(0,260)) {
        const cs = getComputedStyle(e);
        if (cs.transitionDuration === "0s") continue;
        const k = `${cs.transitionProperty} | ${cs.transitionDuration} | ${cs.transitionTimingFunction}`;
        t[k] = (t[k]||0)+1;
      }
      const focus = [];
      for (const sheet of document.styleSheets) {
        let rules; try { rules = sheet.cssRules; } catch { continue; }
        for (const r of rules||[]) if (r.selectorText && /focus-visible/.test(r.selectorText) && /outline|box-shadow/.test(r.cssText)) focus.push(r.cssText.slice(0,130));
      }
      return { t, focus: focus.slice(0,4), n: document.querySelectorAll("a,button").length };
    });
    console.log(`\n===== ${s.name} ===== (${out.n} controls)`);
    for (const [k,n] of Object.entries(out.t).sort((a,b)=>b[1]-a[1]).slice(0,6)) console.log(`  x${String(n).padStart(3)}  ${k}`);
    for (const f of out.focus) console.log("    focus: " + f);
  } catch (e) { console.log(`\n===== ${s.name} FAILED: ${e.message.slice(0,100)}`); }
  await ctx.close();
}
await b.close();
