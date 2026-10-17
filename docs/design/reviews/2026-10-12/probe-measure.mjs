// Line measure across the breakpoint band. The north-stars grid gives the key
// column a fixed 13rem from sm up, so the text column is whatever is left.
import { chromium } from "playwright";
const b = await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]});
console.log("width  textcol  longest line (px)  chars  lines/item");
for (const w of [600,640,700,768,820,900,1024,1180,1440,1920]) {
  const ctx = await b.newContext({viewport:{width:w,height:1000},deviceScaleFactor:1});
  const p = await ctx.newPage();
  await p.goto("http://localhost:3100",{waitUntil:"load"});
  await p.evaluate(()=>document.fonts.ready);
  const m = await p.evaluate(()=>{
    const li=document.querySelectorAll("main li")[1];
    const span=li.children[1];
    const r=span.getBoundingClientRect();
    const cs=getComputedStyle(span);
    const lh=parseFloat(cs.lineHeight);
    const lines=Math.round(r.height/lh);
    // widest rendered line, via Range rects
    const range=document.createRange(); range.selectNodeContents(span);
    const rects=[...range.getClientRects()];
    const widest=Math.max(...rects.map(x=>x.width));
    const txt=span.textContent;
    return {col:+r.width.toFixed(1), widest:+widest.toFixed(1), lines,
      chars:Math.round(txt.length/lines), fs:+parseFloat(cs.fontSize).toFixed(1)};
  });
  const flag = m.chars < 45 ? " <-- short measure" : m.chars > 80 ? " <-- long measure" : "";
  console.log(String(w).padEnd(7), String(m.col).padEnd(9), String(m.widest).padEnd(19), String(m.chars).padEnd(7), m.lines, flag);
  await ctx.close();
}
await b.close();
