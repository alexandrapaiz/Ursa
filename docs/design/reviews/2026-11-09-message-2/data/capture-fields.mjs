import { spawn } from 'node:child_process';
import { readdirSync, readFileSync } from 'node:fs';
const cache = process.argv[2], cwd = process.argv[3];
const child = spawn('npm', ['i', '--no-save', 'playwright', '--cache', cache], { cwd, stdio: 'ignore' });
let captured = null, retitled = null;
const t0 = Date.now();
const iv = setInterval(() => {
  try {
    const f = readFileSync(`/proc/${child.pid}/cmdline`, 'utf8').split('\0');
    while (f.length && f[f.length-1]==='') f.pop();
    if (!captured) captured = { t: Date.now()-t0, f: [...f] };
    if (!retitled && f[0] && f[0].startsWith('npm')) retitled = { t: Date.now()-t0, f: [...f] };
  } catch {}
}, 5);
child.on('exit', (c) => {
  clearInterval(iv);
  console.log('pid', child.pid, 'exit', c);
  console.log('PRE-RETITLE  at', captured?.t, 'ms, fields:', JSON.stringify(captured?.f, null, 1));
  console.log('POST-RETITLE at', retitled?.t, 'ms, fields:', JSON.stringify(retitled?.f, null, 1));
});
