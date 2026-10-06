import { chromium } from 'playwright';
const browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
const page = await ctx.newPage();
await page.goto('http://127.0.0.1:4311/', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(1200);
const out = await page.evaluate(() => {
  const footer = document.querySelector('footer > div');
  const avail = footer.clientWidth - 64;
  const cs = getComputedStyle(footer);
  const probe = document.createElement('span');
  probe.style.cssText = `position:absolute;visibility:hidden;white-space:nowrap;font:${cs.font};`;
  document.body.appendChild(probe);
  const strings = [
    'Computer & Artificial Intelligence Engineer',
    'Alexandra Paiz Delgado',
    'Fatima Michel Giron',
  ];
  const rows = [];
  for (const tracking of ['0.1em','0.08em','0.07em','0.06em','0.05em','0.04em']) {
    probe.style.letterSpacing = tracking;
    const w = strings.map(s => { probe.textContent = s; return Math.round(probe.getBoundingClientRect().width); });
    rows.push({ tracking, avail, widths: w, longestFits: w[0] <= avail });
  }
  probe.remove();
  // also: what do the rendered credit lines look like right now?
  const lines = [...footer.querySelectorAll('span')].map(s => s.textContent.slice(0,45) + ' => ' + Math.round(s.getBoundingClientRect().height));
  return { rows, lines, fontShorthand: cs.font };
});
console.log(JSON.stringify(out, null, 1));
await browser.close();
