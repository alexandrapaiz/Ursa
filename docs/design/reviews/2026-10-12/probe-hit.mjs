// Does the enlarged hit area actually take taps, and did anything move?
import { chromium } from "playwright";
const b = await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]});
for (const [w,h] of [[320,700],[390,844],[820,1180],[1440,900]]) {
  const ctx = await b.newContext({viewport:{width:w,height:h},deviceScaleFactor:1,hasTouch:true});
  const p = await ctx.newPage();
  await p.goto("http://localhost:3100/no-such-page",{waitUntil:"load"});
  await p.evaluate(()=>document.fonts.ready);
  const m = await p.evaluate(()=>{
    const a=document.querySelector("header a");
    const r=a.getBoundingClientRect();
    const hit=[];
    // walk up and down the mark's centre line until elementFromPoint stops
    // resolving to the link
    const cx=r.x+r.width/2;
    let top=r.y, bottom=r.bottom;
    const inside=(y)=>{ const e=document.elementFromPoint(cx,y); return e===a||a.contains(e); };
    // half-pixel steps, and the edge is taken as the midpoint between the last
    // point inside and the first point outside
    for(let y=r.y;y>r.y-40;y-=0.5){ if(inside(y)) top=y-0.25; else break; }
    for(let y=r.bottom;y<r.bottom+40;y+=0.5){ if(inside(y)) bottom=y+0.25; else break; }
    const tag=document.querySelector("header > span").getBoundingClientRect();
    return {box:`${r.width.toFixed(1)}x${r.height.toFixed(1)}`, boxTop:+r.y.toFixed(1),
      hit:+(bottom-top).toFixed(1), hitTop:top, hitBottom:bottom,
      tagTop:+tag.top.toFixed(1), coversTag: bottom> tag.top && tag.top>=r.bottom};
  });
  console.log(`${w}x${h}`.padEnd(10), `box ${m.box} top ${m.boxTop}`.padEnd(30),
    `hit height ${m.hit}`.padEnd(18), m.hit>=44?"meets 44px":"UNDER 44",
    m.coversTag?"  <-- covers the tag":"");
  await ctx.close();
}
await b.close();
