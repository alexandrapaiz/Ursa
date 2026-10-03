import { chromium } from "playwright";
const B = "http://localhost:3100";
const b = await chromium.launch({ args: ["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"] });
for (const [w,h] of [[390,844],[820,1180],[1024,900],[1440,900]]) {
  const ctx = await b.newContext({ viewport:{width:w,height:h}, deviceScaleFactor:1 });
  const p = await ctx.newPage();
  for (const path of ["/", "/no-such-page"]) {
    await p.goto(B+path, {waitUntil:"load"});
    await p.evaluate(()=>document.fonts.ready);
    const m = await p.evaluate(() => {
      const left = (sel) => { const e=document.querySelector(sel); if(!e) return null; return +e.getBoundingClientRect().left.toFixed(1); };
      const credit = document.querySelector("footer span");
      const header = document.querySelector("header");
      const hero = document.querySelector("header + *, main section");
      return {
        header: header ? +header.getBoundingClientRect().left + parseFloat(getComputedStyle(header).paddingLeft) : null,
        copy: left("p"),
        section: (()=>{const s=document.querySelector("main section, .not-found-body"); if(!s) return null; const e=document.querySelector("main"); return e? +(e.getBoundingClientRect().left + parseFloat(getComputedStyle(e).paddingLeft)).toFixed(1):null;})(),
        link: left("footer ~ *") ,
        credits: credit ? +credit.getBoundingClientRect().left.toFixed(1) : null,
        creditLines: [...document.querySelectorAll("footer span")].slice(0,3).map(s=>s.textContent.trim().slice(0,28)+"|"+Math.round(s.getBoundingClientRect().height)),
        footerRule: (()=>{const f=document.querySelector("footer>div"); return f? +f.getBoundingClientRect().left.toFixed(1):null;})(),
      };
    });
    console.log(`${w}x${h} ${path}`.padEnd(26), JSON.stringify(m));
  }
  await ctx.close();
}
await b.close();
