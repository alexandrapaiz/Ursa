// Does the browser paint its own tap highlight over our designed press state,
// and do the benchmark sites suppress theirs?
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
const OUT = process.argv[2]; mkdirSync(OUT, { recursive: true });
const b = await chromium.launch({ args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"] });

// ours
const ctx = await b.newContext({ viewport:{width:390,height:844}, deviceScaleFactor:1, hasTouch:true, isMobile:true });
const p = await ctx.newPage();
await p.goto("http://localhost:3100/no-such-page",{waitUntil:"load"});
await p.evaluate(()=>document.fonts.ready);
await p.waitForTimeout(1200);
const ours = await p.evaluate(()=>{
  const out={};
  for (const [k,sel] of [["back-link","a.quiet-link"],["word-mark","a.mark-link"]]) {
    const el=document.querySelector(sel);
    out[k]=getComputedStyle(el).webkitTapHighlightColor;
  }
  return out;
});
console.log("ursa minor  :", JSON.stringify(ours));
const link = p.locator("a.quiet-link");
const box = await link.boundingBox();
const clip = { x: Math.max(0,box.x-14), y: Math.max(0,box.y-14), width: box.width+28, height: box.height+28 };
await p.screenshot({ path: `${OUT}/tap-rest.png`, clip });
// hold a touch down and shoot mid-press
await p.touchscreen.tap(box.x+box.width/2, box.y+box.height/2).catch(()=>{});
const cdp = await ctx.newCDPSession(p);
await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: box.x+box.width/2, y: box.y+box.height/2 }] });
await p.waitForTimeout(220);
await p.screenshot({ path: `${OUT}/tap-held.png`, clip });
await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
console.log("shot tap-rest.png and tap-held.png");
await ctx.close();

// the benchmark sites
for (const [name,url,sel] of [["linear","https://linear.app/","a,button"],["vercel","https://vercel.com/","a,button"],["cursor","https://cursor.com/","a,button"],["perplexity","https://www.perplexity.ai/","a,button"]]) {
  const c = await b.newContext({ viewport:{width:390,height:844}, deviceScaleFactor:1, hasTouch:true, isMobile:true });
  const pg = await c.newPage();
  try {
    await pg.goto(url,{waitUntil:"domcontentloaded",timeout:40000});
    await pg.waitForTimeout(3000);
    const v = await pg.evaluate((sel)=>{
      const seen={};
      for (const el of [...document.querySelectorAll(sel)].slice(0,40)) {
        const r=el.getBoundingClientRect(); if(r.width<20) continue;
        const c=getComputedStyle(el).webkitTapHighlightColor;
        seen[c]=(seen[c]||0)+1;
      }
      return seen;
    }, sel);
    console.log(name.padEnd(12), ":", JSON.stringify(v));
  } catch(e){ console.log(name.padEnd(12), ": unreachable"); }
  await c.close();
}
await b.close();
