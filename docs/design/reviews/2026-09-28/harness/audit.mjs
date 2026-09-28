import { chromium } from 'playwright';
const browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader'] });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
await page.goto('http://127.0.0.1:4311/', { waitUntil: 'networkidle' });
await page.waitForTimeout(2000);

const res = await page.evaluate(() => {
  const lum = (r,g,b) => { const f=v=>{v/=255;return v<=0.03928?v/12.92:Math.pow((v+0.055)/1.055,2.4)}; return 0.2126*f(r)+0.7152*f(g)+0.0722*f(b); };
  const ratio=(a,b)=>{const L1=lum(...a),L2=lum(...b);return ((Math.max(L1,L2)+0.05)/(Math.min(L1,L2)+0.05)).toFixed(2)};
  const parse = s => s.match(/[\d.]+/g).map(Number);
  const over = (fg, bg) => { // composite fg (with alpha) over bg
    const [r,g,b,a=1] = fg; const [br,bg2,bb] = bg;
    return [r*a+br*(1-a), g*a+bg2*(1-a), b*a+bb*(1-a)];
  };
  const SKY = [5,8,17]; // approximate rendered sky near hero
  const out = [];
  const targets = [
    ['header brand', 'header div:nth-child(1)'],
    ['header tag (--dim)', 'header div:nth-child(2)'],
    ['hero paragraph', 'div.max-w-4xl p'],
    ['CTA label (disabled)', 'button'],
    ['eyebrow NORTH STARS (--dim)', 'main section > div'],
    ['star key (--polar)', 'main li span:first-child'],
    ['star body', 'main li span:last-child'],
    ['footer credit (--dim)', 'footer span'],
  ];
  for (const [name, sel] of targets) {
    const el = document.querySelector(sel);
    if (!el) { out.push({ name, missing: true }); continue; }
    const cs = getComputedStyle(el);
    const fg = parse(cs.color);
    const op = parseFloat(cs.opacity);
    const eff = over([fg[0],fg[1],fg[2], (fg[3]??1)*op], SKY);
    out.push({
      name,
      color: cs.color,
      opacity: op,
      fontSize: cs.fontSize,
      weight: cs.fontWeight,
      effective: eff.map(v=>Math.round(v)),
      contrastVsSky: ratio(eff, SKY),
    });
  }
  // focus visibility on the only control
  const btn = document.querySelector('button');
  const bs = getComputedStyle(btn);
  out.push({ name:'CTA box', border: bs.borderColor, w: btn.getBoundingClientRect().width, h: btn.getBoundingClientRect().height, disabled: btn.disabled, tabbable: btn.tabIndex });
  // typographic check: does the hero end a line with a lone "A"?
  return out;
});
console.log(JSON.stringify(res, null, 1));

// line-break inspection of the hero at each width
for (const w of [390, 820, 1440]) {
  await page.setViewportSize({ width: w, height: 900 });
  await page.waitForTimeout(400);
  const lines = await page.evaluate(() => {
    const p = document.querySelector('div.max-w-4xl p');
    const range = document.createRange();
    const text = p.innerText;
    // use client rects of a range over each text node to find visual lines
    range.selectNodeContents(p);
    const rects = [...range.getClientRects()].map(r => ({ top: Math.round(r.top), left: Math.round(r.left), w: Math.round(r.width) }));
    // group by top
    const byTop = {};
    for (const r of rects) { byTop[r.top] = (byTop[r.top]||0) + r.w; }
    return { text, lineTops: Object.keys(byTop).length, widths: byTop };
  });
  console.log(`\n--- hero line boxes @${w}px ---`);
  console.log(JSON.stringify(lines.widths));
}
await browser.close();
