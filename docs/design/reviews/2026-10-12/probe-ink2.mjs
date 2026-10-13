// Optical centring in pixels, with the starfield hidden so the only lit
// pixels inside the control are the label itself. Measures both states on the
// same render: the correction applied, and the class removed again.
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
const OUT=process.argv[2]; if(OUT) mkdirSync(OUT,{recursive:true});
const b = await chromium.launch({args:["--font-render-hinting=none"]});
const measure = async (p, sel) => {
  const box = await p.locator(sel).boundingBox();
  const clip = { x: Math.round(box.x), y: Math.round(box.y), width: Math.round(box.width), height: Math.round(box.height) };
  const buf = await p.screenshot({ clip });
  return { ...await p.evaluate(async ({b64})=>{
    const img=new Image(); img.src="data:image/png;base64,"+b64; await img.decode();
    const c=document.createElement("canvas"); c.width=img.width; c.height=img.height;
    const g=c.getContext("2d"); g.drawImage(img,0,0);
    const d=g.getImageData(0,0,c.width,c.height).data;
    const inset=9; // 3 CSS px at 3x: clears the 1px border and its antialiasing
    let min=1e9,max=-1;
    for(let y=inset;y<c.height-inset;y++)for(let x=inset;x<c.width-inset;x++){
      const i=(y*c.width+x)*4;
      const lum=d[i]*0.2126+d[i+1]*0.7152+d[i+2]*0.0722;
      if(lum>40){ if(x<min)min=x; if(x>max)max=x; }
    }
    return {w:c.width,min,max};
  }, { b64: buf.toString("base64") }), buf };
};
for (const [route,sel,label,file] of [["/", "button", "GET POLARIS (home)","cta"],["/no-such-page","a.quiet-link","BACK TO URSA MINOR (404)","backlink"]]) {
  const ctx = await b.newContext({viewport:{width:1440,height:900},deviceScaleFactor:3});
  const p = await ctx.newPage();
  await p.goto("http://localhost:3100"+route,{waitUntil:"load"});
  await p.evaluate(()=>document.fonts.ready);
  await p.waitForTimeout(800);
  await p.evaluate(()=>document.querySelectorAll("canvas").forEach(c=>c.style.display="none"));
  await p.waitForTimeout(200);
  const after = await measure(p, sel);

  const { writeFileSync } = await import("node:fs");
  if (OUT) writeFileSync(`${OUT}/after__${file}-centring.png`, after.buf);
  await p.evaluate((sel)=>document.querySelector(sel).classList.remove("tracked-label"), sel);
  await p.waitForTimeout(150);
  const before = await measure(p, sel);
  if (OUT) writeFileSync(`${OUT}/before__${file}-centring.png`, before.buf);
  const g = (m) => [ (m.min/3).toFixed(2), ((m.w-1-m.max)/3).toFixed(2) ];
  const [bl,br]=g(before), [al,ar]=g(after);
  console.log(`${label}\n   before: left ${bl}  right ${br}  skew ${(br-bl).toFixed(2)}px\n   after : left ${al}  right ${ar}  skew ${(ar-al).toFixed(2)}px`);
  await ctx.close();
}
await b.close();
