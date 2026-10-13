import { chromium } from "playwright";
import { appendFileSync } from "node:fs";
const log = (s) => { appendFileSync("/tmp/focus.txt", s + "\n"); console.log(s); };
const b = await chromium.launch();
const read = (pg) => pg.evaluate(() => {
  const el = document.activeElement;
  if (!el || el === document.body) return null;
  const cs = getComputedStyle(el);
  return { tag: el.tagName, text: (el.textContent||"").trim().slice(0,22),
    outline: `${cs.outlineWidth} ${cs.outlineStyle} ${cs.outlineColor}`, offset: cs.outlineOffset,
    shadow: cs.boxShadow.slice(0,70) };
});
const SITES = JSON.parse(process.argv[2]);
for (const [name,url] of SITES) {
  const ctx = await b.newContext({viewport:{width:1440,height:900},deviceScaleFactor:1});
  const p = await ctx.newPage();
  try {
    await p.goto(url,{waitUntil:"domcontentloaded",timeout:30000});
    await p.waitForTimeout(url.startsWith("http://localhost")?1000:3000);
    log(`== ${name} ==`);
    for (let i=0;i<3;i++){
      await p.keyboard.press("Tab");
      await p.waitForTimeout(200);
      const r = await read(p);
      if (r) log(`  stop ${i+1}: ${r.tag} ${JSON.stringify(r.text)} | outline ${r.outline} offset ${r.offset}` + (r.shadow&&r.shadow!=="none"?` | shadow ${r.shadow}`:""));
      else log(`  stop ${i+1}: nothing focused`);
    }
  } catch(e){ log(`== ${name} ==\n  unreachable: ${String(e).split("\n")[0].slice(0,80)}`); }
  await ctx.close();
}
await b.close();
log("done");
