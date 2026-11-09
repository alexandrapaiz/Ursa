// Does check-installs.sh's detection see an npm install in the window that
// matters, which is the beginning?
//
// The shipped test is an ANCHOR at the start of argv[0]: `is_npm` takes the
// first space-separated word of field 0 of /proc/<pid>/cmdline and accepts
// `npm` or `npm-cli.js`. That is correct for a RETITLED npm, because npm sets
// process.title to its whole invocation. The question this probe answers is
// what /proc holds BEFORE that write, and for how long.
//
// Method: launch one real install, poll /proc every 40ms, and at each poll
// record every pid whose cmdline mentions npm under ANY test, together with
// what the shipped anchor would have said about it. One install, never two,
// which is the first guard of the two the exo seat handed back.
import { spawn } from 'node:child_process';
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';

const [, , cwd, cache, outPath] = process.argv;
if (!cwd || !cache || !outPath) {
  console.error('usage: probe-argv0.mjs <install-cwd> <cache> <out.txt>');
  process.exit(2);
}

const fields = (pid) => {
  try {
    const raw = readFileSync(`/proc/${pid}/cmdline`, 'utf8');
    const f = raw.split('\0');
    if (f.length && f[f.length - 1] === '') f.pop();
    return f;
  } catch { return null; }
};

// The shipped predicate, transcribed from check-installs.sh so the probe
// measures what ships rather than a paraphrase of it.
const shippedIsNpm = (argv0) => {
  const w = (argv0 ?? '').split(' ')[0];
  const base = w.slice(w.lastIndexOf('/') + 1);
  return base === 'npm' || base === 'npm-cli.js';
};
// Any test at all, so a miss by the shipped one is distinguishable from the
// process not being there yet.
const mentionsNpm = (f) => f.join(' ').includes('npm');

const t0 = process.hrtime.bigint();
const ms = () => Number((process.hrtime.bigint() - t0) / 1000000n);

const child = spawn('npm', ['i', '--no-save', 'playwright', '--cache', cache], {
  cwd, stdio: ['ignore', 'pipe', 'pipe'],
});
const rows = [];
let installLines = '';
child.stdout.on('data', (d) => { installLines += d; });
child.stderr.on('data', (d) => { installLines += d; });

let done = false;
child.on('exit', (code) => { done = true; child.exitCode_ = code; });

const seenFirst = new Map(); // pid -> {firstSeen, firstDetected, argv0First}
const poll = () => {
  const t = ms();
  for (const name of readdirSync('/proc')) {
    if (!/^\d+$/.test(name)) continue;
    const f = fields(name);
    if (!f || f.length === 0) continue;
    if (!mentionsNpm(f)) continue;
    // Exclude this probe and its own shell ancestors by pid identity.
    if (Number(name) === process.pid) continue;
    const argv0 = f[0];
    const det = shippedIsNpm(argv0);
    if (!seenFirst.has(name)) {
      seenFirst.set(name, { firstSeen: t, firstDetected: det ? t : null, argv0First: argv0, nFirst: f.length });
      rows.push({ t, pid: name, argv0, n: f.length, det, event: 'first-seen' });
    } else {
      const s = seenFirst.get(name);
      if (det && s.firstDetected === null) {
        s.firstDetected = t;
        rows.push({ t, pid: name, argv0, n: f.length, det, event: 'first-detected' });
      }
      if (argv0 !== s.argv0Last && s.argv0Last !== undefined) {
        rows.push({ t, pid: name, argv0, n: f.length, det, event: 'argv0-changed' });
      }
    }
    seenFirst.get(name).argv0Last = argv0;
  }
};

const timer = setInterval(() => {
  poll();
  if (done) {
    clearInterval(timer);
    const out = [];
    out.push(`install: npm i --no-save playwright --cache ${cache}`);
    out.push(`cwd: ${cwd}`);
    out.push(`exit: ${child.exitCode_}  wall_ms: ${ms()}  polls_every_ms: 40`);
    out.push('');
    out.push('pids whose /proc cmdline mentioned npm at any poll, and what the');
    out.push('shipped anchor on argv[0] said about each:');
    out.push('');
    for (const [pid, s] of seenFirst) {
      out.push(`pid=${pid}`);
      out.push(`  first seen at      ${s.firstSeen} ms, argv[0]=${JSON.stringify(s.argv0First)} fields=${s.nFirst}`);
      out.push(`  argv[0] at the end ${JSON.stringify(s.argv0Last)}`);
      out.push(`  shipped anchor first said yes at ${s.firstDetected === null ? 'NEVER' : s.firstDetected + ' ms'}`);
      out.push(`  blind window       ${s.firstDetected === null ? 'the whole install' : (s.firstDetected - s.firstSeen) + ' ms'}`);
    }
    out.push('');
    out.push('transitions:');
    for (const r of rows) out.push(`  ${String(r.t).padStart(6)} ms  ${r.event.padEnd(15)} pid=${r.pid} detected=${r.det} fields=${r.n} argv[0]=${JSON.stringify(r.argv0)}`);
    out.push('');
    out.push('npm said:');
    out.push(installLines.trim().split('\n').map((l) => '  ' + l).join('\n'));
    writeFileSync(outPath, out.join('\n') + '\n');
    console.log(out.join('\n'));
  }
}, 40);
