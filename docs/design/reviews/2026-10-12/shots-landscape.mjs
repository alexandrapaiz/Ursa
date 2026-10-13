import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
const OUT=process.argv[2], PRE=process.argv[3]??"";
mkdirSync(OUT,{recursive:true});
const b = await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader","--font-render-hinting=none"]});
for (const [w,h,name] of [[667,375,"landscape-667x375"],[740,360,"landscape-740x360"],[844,390,"landscape-844x390"],[896,414,"landscape-896x414"],[932,430,"landscape-932x430"],[1024,600,"landscape-1024x600"]]) {
  const ctx = await b.newContext({viewport:{width:w,height:h},deviceScaleFactor:1});
  const p = await ctx.newPage();
  await p.goto("http://localhost:3100",{waitUntil:"load"});
  await p.evaluate(()=>document.fonts.ready);
  await p.waitForTimeout(1500);
  await p.screenshot({path:`${OUT}/${PRE}home-hero__${name}.png`});
  console.log("shot",name);
  await ctx.close();
}
await b.close();
