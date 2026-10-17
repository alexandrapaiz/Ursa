// Vertical room around the word-mark link on the 404, so a bigger hit area
// cannot reach the tag line (which wraps under the mark at narrow widths) or
// spill out of the header.
import { chromium } from "playwright";
const b = await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]});
for (const [w,h] of [[320,700],[360,700],[390,844],[414,700],[820,1180],[1440,900]]) {
  const ctx = await b.newContext({viewport:{width:w,height:h},deviceScaleFactor:1});
  const p = await ctx.newPage();
  await p.goto("http://localhost:3100/no-such-page",{waitUntil:"load"});
  await p.evaluate(()=>document.fonts.ready);
  const m = await p.evaluate(()=>{
    const hd=document.querySelector("header").getBoundingClientRect();
    const a=document.querySelector("header a").getBoundingClientRect();
    const tag=document.querySelector("header > span").getBoundingClientRect();
    const stacked = tag.top >= a.bottom - 1;
    return {hdTop:+hd.top.toFixed(1), hdBottom:+hd.bottom.toFixed(1),
      aTop:+a.top.toFixed(1), aBottom:+a.bottom.toFixed(1), aH:+a.height.toFixed(1), aW:+a.width.toFixed(1),
      above:+(a.top-hd.top).toFixed(1), below:+(hd.bottom-a.bottom).toFixed(1),
      toTag: stacked ? +(tag.top-a.bottom).toFixed(1) : null};
  });
  console.log(`${w}x${h}`.padEnd(10), `link ${m.aW}x${m.aH}`.padEnd(18),
    `room above ${m.above}`.padEnd(18), `room below ${m.below}`.padEnd(18),
    m.toTag===null ? "tag beside" : `tag ${m.toTag}px below`);
  await ctx.close();
}
await b.close();
