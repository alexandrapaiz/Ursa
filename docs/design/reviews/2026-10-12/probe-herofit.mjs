// What is the largest hero type that keeps the whole sentence above the fold
// in short landscape? Sweeps font-size at each landscape size, with the 46vw
// measure held, and reports lines and the bottom of the copy.
import { chromium } from "playwright";
const BASE = "http://localhost:3100";
const SIZES = [[667,375],[740,360],[844,390],[896,414],[932,430],[1024,600]];
const b = await chromium.launch({ args: ["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"] });
for (const [w,h] of SIZES) {
  const ctx = await b.newContext({ viewport:{width:w,height:h}, deviceScaleFactor:1 });
  const p = await ctx.newPage();
  await p.goto(BASE,{waitUntil:"load"});
  await p.evaluate(()=>document.fonts.ready);
  const row = [];
  for (const fs of [16,18,20,22,24,26,28,30,32,34]) {
    const m = await p.evaluate((fs)=>{
      const el=document.querySelector("p");
      el.style.fontSize=fs+"px";
      const r=el.getBoundingClientRect();
      const lh=parseFloat(getComputedStyle(el).lineHeight);
      const cta=document.querySelector("button").getBoundingClientRect();
      return {lines:Math.round(r.height/lh), bottom:+r.bottom.toFixed(0), cta:+cta.bottom.toFixed(0), top:+r.top.toFixed(0)};
    }, fs);
    row.push(`${fs}:${m.lines}L b${m.bottom}${m.bottom<=h-12?"*":""}${m.cta<=h?"+":""}`);
  }
  console.log(`${w}x${h}`.padEnd(10), row.join("  "));
  await ctx.close();
}
await b.close();
console.log("\n* = whole sentence above the fold   + = CTA above the fold too");
