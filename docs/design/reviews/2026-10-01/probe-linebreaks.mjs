import { chromium } from "playwright";
const b = await chromium.launch({ args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"] });
const probe = async (path, w, h, label) => {
  const ctx = await b.newContext({ viewport:{width:w,height:h}, deviceScaleFactor:1 });
  const p = await ctx.newPage();
  await p.goto("http://localhost:3100"+path, {waitUntil:"load"});
  await p.evaluate(()=>document.fonts.ready);
  const r = await p.evaluate(() => {
    const el = document.querySelector("p.text-balance") || document.querySelector("p");
    const read = () => {
      const range = document.createRange(); const out = [];
      const walk = (n) => { if (n.nodeType===3) { for (let i=0;i<n.length;i++){ range.setStart(n,i); range.setEnd(n,i+1);
        const rect = range.getBoundingClientRect(); out.push({c:n.data[i], t:Math.round(rect.top), l:rect.left, r:rect.right}); } }
        else for (const c of n.childNodes) walk(c); };
      walk(el);
      const lines = {}; for (const g of out) { (lines[g.t] ||= []).push(g); }
      return Object.entries(lines).map(([t,gs]) => ({
        top:+t, text: gs.map(g=>g.c).join(""),
        width: Math.round(Math.max(...gs.map(g=>g.r)) - Math.min(...gs.map(g=>g.l))),
      })).sort((a,b)=>a.top-b.top);
    };
    const now = read();
    const cs = getComputedStyle(el);
    el.style.textWrap = "pretty";
    const pretty = read();
    el.style.textWrap = "wrap";
    const plain = read();
    el.style.textWrap = "";
    return { wrap: cs.textWrap, fontSize: cs.fontSize, boxWidth: Math.round(el.getBoundingClientRect().width), now, pretty, plain };
  });
  console.log(`\n--- ${label} (${w}px) textWrap=${r.wrap} size=${r.fontSize} box=${r.boxWidth}`);
  for (const [k, v] of Object.entries({balance:r.now, pretty:r.pretty, plain:r.plain})) {
    console.log(`  ${k.padEnd(8)} ` + v.map(l=>`${l.width}`).join("/") + "   " + v.map(l=>`«${l.text.trim()}»`).join(" "));
  }
  await ctx.close();
};
await probe("/no-such-page", 390, 844, "404 headline");
await probe("/no-such-page", 820, 1180, "404 headline");
await probe("/", 1440, 900, "hero copy");
await probe("/", 390, 844, "hero copy");
await b.close();
