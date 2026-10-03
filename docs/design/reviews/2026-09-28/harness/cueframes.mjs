import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader'] });
const c = await b.newContext({ viewport: { width: 390, height: 844 } });
const p = await c.newPage();
await p.goto('http://127.0.0.1:4311/', { waitUntil: 'networkidle' });
await p.waitForTimeout(2000);
const clip = { x: 8, y: 740, width: 120, height: 96 };
for (let i = 0; i < 6; i++) {
  await p.screenshot({ path: `/tmp/shots/cueframe-${i}.png`, clip });
  await p.waitForTimeout(430);
}
await b.close();
