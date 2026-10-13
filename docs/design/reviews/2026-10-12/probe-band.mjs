// The north-stars text column across the breakpoint band, as it is and as it
// would be if the two-column grid waited for md (768) instead of sm (640).
import { chromium } from "playwright";
const b = await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]});
const read = (p) => p.evaluate(()=>{
  const li=document.querySelectorAll("main li")[1]; const span=li.children[1];
  const r=span.getBoundingClientRect(); const cs=getComputedStyle(span);
  const lines=Math.round(r.height/parseFloat(cs.lineHeight));
  const range=document.createRange(); range.selectNodeContents(span);
  const widest=Math.max(...[...range.getClientRects()].map(x=>x.width));
  return {col:+r.width.toFixed(0), lines, chars:Math.round(span.textContent.length/lines), widest:+widest.toFixed(0)};
});
console.log("width   as-is (col/chars/lines)      with md gate");
for (const w of [600,639,640,660,700,740,767,768,820,900,1023,1024,1440]) {
  const ctx = await b.newContext({viewport:{width:w,height:1000},deviceScaleFactor:1});
  const p = await ctx.newPage();
  await p.goto("http://localhost:3100",{waitUntil:"load"});
  await p.evaluate(()=>document.fonts.ready);
  const a = await read(p);
  await p.evaluate(()=>{
    // single column until 768 instead of 640
    const st=document.createElement("style");
    st.textContent="@media (max-width:767.9px){main li{grid-template-columns:1fr!important;row-gap:.5rem!important}}";
    document.head.appendChild(st);
  });
  await p.waitForTimeout(120);
  const c = await read(p);
  const f=(m)=>`${m.col}px / ${m.chars} chars / ${m.lines}L`;
  console.log(String(w).padEnd(7), f(a).padEnd(29), f(c));
  await ctx.close();
}
await b.close();
