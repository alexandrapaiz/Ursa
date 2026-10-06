import { chromium } from 'playwright';
import { PNG } from 'pngjs';
import fs from 'fs';

const lum = (r,g,b) => { const f=v=>{v/=255;return v<=0.03928?v/12.92:Math.pow((v+0.055)/1.055,2.4)}; return 0.2126*f(r)+0.7152*f(g)+0.0722*f(b); };
const ratio=(a,b)=>{const L1=lum(...a),L2=lum(...b);return (Math.max(L1,L2)+0.05)/(Math.min(L1,L2)+0.05)};

const browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader'] });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
await page.goto('http://127.0.0.1:4311/', { waitUntil: 'networkidle' });
await page.waitForTimeout(2000);

// hide all text so we can sample the pure background behind each region
const boxes = await page.evaluate(() => {
  const g = (sel) => { const e = document.querySelector(sel); if(!e) return null; const r = e.getBoundingClientRect(); return {x:Math.round(r.x),y:Math.round(r.y),w:Math.round(r.width),h:Math.round(r.height)}; };
  return { headerTag: g('header div:nth-child(2)') };
});
await page.evaluate(() => { document.querySelectorAll('header,main,footer,div.max-w-4xl').forEach(e=>e.style.visibility='hidden'); });
await page.waitForTimeout(600);
await page.screenshot({ path: '/tmp/bg-top.png' });

// scrolled: footer + eyebrow region background
await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
await page.waitForTimeout(1500);
await page.screenshot({ path: '/tmp/bg-bottom.png' });

const sample = (file, x, y, w, h) => {
  const png = PNG.sync.read(fs.readFileSync(file));
  let r=0,g=0,b=0,n=0;
  for (let yy=y; yy<y+h; yy++) for (let xx=x; xx<x+w; xx++) {
    if (xx<0||yy<0||xx>=png.width||yy>=png.height) continue;
    const i=(png.width*yy+xx)<<2; r+=png.data[i]; g+=png.data[i+1]; b+=png.data[i+2]; n++;
  }
  return [r/n, g/n, b/n];
};

const topBg = sample('/tmp/bg-top.png', 1150, 55, 220, 25);   // behind "for frontier labs"
const botBg = sample('/tmp/bg-bottom.png', 417, 740, 600, 130); // behind footer credits

const DIM = [93,106,133];
console.log('background behind header tag :', topBg.map(v=>Math.round(v)), '→ contrast', ratio(DIM, topBg).toFixed(2));
console.log('background behind footer     :', botBg.map(v=>Math.round(v)), '→ contrast', ratio(DIM, botBg).toFixed(2));

// solve for the lightest-touch replacement that clears 4.5:1 on the WORST background
const worst = ratio(DIM, topBg) < ratio(DIM, botBg) ? topBg : botBg;
console.log('\nworst background:', worst.map(v=>Math.round(v)));
// walk the #5d6a85 hue upward in lightness
const base = [93,106,133];
for (let k = 1.0; k <= 2.2; k += 0.02) {
  const c = base.map(v => Math.min(255, Math.round(v*k)));
  const r = ratio(c, worst);
  if (r >= 4.5) {
    const hex = '#'+c.map(v=>v.toString(16).padStart(2,'0')).join('');
    console.log(`first value clearing AA: ${hex}  rgb(${c})  contrast ${r.toFixed(2)} (k=${k.toFixed(2)})`);
    // and give a little headroom
    for (let k2 = k; k2 <= 2.2; k2 += 0.02) {
      const c2 = base.map(v => Math.min(255, Math.round(v*k2)));
      const r2 = ratio(c2, worst);
      if (r2 >= 4.8) { console.log(`with headroom (4.8:1):   #${c2.map(v=>v.toString(16).padStart(2,'0')).join('')}  rgb(${c2})  contrast ${r2.toFixed(2)}`); break; }
    }
    break;
  }
}
await browser.close();
