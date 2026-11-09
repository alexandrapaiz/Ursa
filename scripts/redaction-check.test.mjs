#!/usr/bin/env node
// node --test scripts/redaction-check.test.mjs
//
// Every violating string in this suite is BUILT AT RUNTIME, never written
// as a literal. A test file containing a literal full session id or a
// literal home path with a username in it would be caught by the very
// gate it is testing, and the suite would fail the build it is defending.
// That is not a style choice, it is the one constraint this file has.
//
// Hermetic: each case is a temporary directory. Nothing reads or writes
// the repository tree, and the only thing taken from the repository is the
// gate's own rules, which is the point of the script under test.
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { argumentFault } from './redaction-args.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const SCRIPT = join(HERE, 'redaction-check.mjs');
const REAL_WORKFLOW = resolve(HERE, '..', '.github', 'workflows', 'redaction-gate.yml');

const hex = (n) => Array.from({ length: n }, (_, i) => '0123456789abcdef'[(i * 7 + 3) % 16]).join('');
// Assembled from parts so that no full-UUID-shaped literal exists in this file.
const fakeSessionId = [hex(8), hex(4), hex(4), hex(4), hex(12)].join('-');
// Likewise: '/home/' + a name + '/' never appears as one literal.
const fakeHomePath = ['', 'home', 'somebody', 'notes.md'].join('/');

function runCheck(root, extra = []) {
  try {
    const stdout = execFileSync('node', [SCRIPT, `--root=${root}`, ...extra], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    return { code: 0, stdout, stderr: '' };
  } catch (err) {
    return { code: err.status, stdout: err.stdout ?? '', stderr: err.stderr ?? '' };
  }
}

function sandbox(files) {
  const dir = mkdtempSync(join(tmpdir(), 'redaction-check-'));
  for (const [name, body] of Object.entries(files)) {
    const path = join(dir, name);
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, body);
  }
  return dir;
}

describe('redaction-check', () => {
  test('passes a clean tree, and says how many patterns it read', () => {
    const dir = sandbox({ 'notes.md': 'Nothing private here.\n' });
    try {
      const { code, stdout } = runCheck(dir);
      assert.equal(code, 0);
      assert.match(stdout, /clean \(3 patterns, read from the workflow\)/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test('catches a full session id and names the file and line', () => {
    const dir = sandbox({ 'audit.md': `line one\nid: ${fakeSessionId}\n` });
    try {
      const { code, stderr } = runCheck(dir);
      assert.equal(code, 1);
      assert.match(stderr, /session or conversation UUID/);
      assert.match(stderr, /audit\.md:2/);
      // The whole reason this script prints file:line instead of the
      // matched line: a CI log that reprints the value has published it.
      assert.ok(!stderr.includes(fakeSessionId), 'must not reprint the value it caught');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test('catches an absolute home path carrying a username', () => {
    const dir = sandbox({ 'doc.md': `see ${fakeHomePath}\n` });
    try {
      const { code, stderr } = runCheck(dir);
      assert.equal(code, 1);
      assert.match(stderr, /Absolute home path/);
      assert.match(stderr, /doc\.md:1/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test("honours the gate's own allowance for the runner's own home", () => {
    const dir = sandbox({ 'doc.md': `log at ${['', 'home', 'runner', 'work'].join('/')}/x\n` });
    try {
      const { code } = runCheck(dir);
      assert.equal(code, 0);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test('reports every pattern that fires, not just the first', () => {
    const dir = sandbox({
      'a.md': `id: ${fakeSessionId}\n`,
      'b.md': `path: ${fakeHomePath}\n`,
    });
    try {
      const { code, stdout } = runCheck(dir, ['--json']);
      assert.equal(code, 1);
      const out = JSON.parse(stdout);
      assert.equal(out.clean, false);
      assert.equal(out.findings.length, 2);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  // The failure mode this script must never have: the gate changes shape,
  // the patterns stop being found, and a checker that scans nothing
  // reports clean. Exit 2 is "I could not do my job", not "you are clean".
  test('refuses, with exit 2, a workflow it cannot find rules in', () => {
    const dir = sandbox({
      'audit.md': `id: ${fakeSessionId}\n`,
      'fake/gate.yml': 'name: redaction-gate\njobs:\n  scan:\n    steps: []\n',
    });
    try {
      const { code, stderr } = runCheck(dir, [`--workflow=${join(dir, 'fake/gate.yml')}`]);
      assert.equal(code, 2);
      assert.match(stderr, /found no `scan/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test('refuses, with exit 2, a workflow that is not there', () => {
    const dir = sandbox({ 'notes.md': 'clean\n' });
    try {
      const { code, stderr } = runCheck(dir, [`--workflow=${join(dir, 'nope.yml')}`]);
      assert.equal(code, 2);
      assert.match(stderr, /the file is missing/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  // The gitignore filter, in all three of its cases. Without these the
  // filter could quietly start dropping everything and every run would
  // report a clean tree, which is the one failure mode that looks exactly
  // like success.
  describe('hits in gitignored paths', () => {
    // A sandbox that is a real git repository, because the filter asks git
    // and a directory that is not a repository has no ignore rules at all.
    function gitSandbox(files) {
      const dir = sandbox(files);
      execFileSync('git', ['init', '-q'], { cwd: dir });
      return dir;
    }

    test('are not counted, and the drop is reported rather than silent', () => {
      const dir = gitSandbox({
        '.gitignore': 'build/\n',
        'build/bundle.js': `id: ${fakeSessionId}\n`,
      });
      try {
        const { code, stdout } = runCheck(dir);
        assert.equal(code, 0, 'a hit only in an ignored path is not a failure');
        assert.match(stdout, /1 hit in gitignored paths not counted/);
      } finally {
        rmSync(dir, { recursive: true, force: true });
      }
    });

    test('do not hide a hit in a file that is tracked or merely untracked', () => {
      const dir = gitSandbox({
        '.gitignore': 'build/\n',
        'build/bundle.js': `id: ${fakeSessionId}\n`,
        'notes.md': `id: ${fakeSessionId}\n`,
      });
      try {
        const { code, stderr } = runCheck(dir);
        assert.equal(code, 1, 'the untracked, unignored file still fails');
        assert.match(stderr, /notes\.md:1/);
        assert.ok(!stderr.includes('build/bundle.js'), 'the ignored one is not reprinted');
      } finally {
        rmSync(dir, { recursive: true, force: true });
      }
    });

    test('are reported in the json output too', () => {
      const dir = gitSandbox({ '.gitignore': 'build/\n', 'build/b.js': `id: ${fakeSessionId}\n` });
      try {
        const { code, stdout } = runCheck(dir, ['--json']);
        assert.equal(code, 0);
        assert.equal(JSON.parse(stdout).ignoredHits, 1);
      } finally {
        rmSync(dir, { recursive: true, force: true });
      }
    });

    test('a tree that is not a git repository is still scanned in full', () => {
      const dir = sandbox({ 'notes.md': `id: ${fakeSessionId}\n` });
      try {
        const { code, stderr } = runCheck(dir);
        assert.equal(code, 1, 'no git means no filter, never a silent pass');
        assert.match(stderr, /notes\.md:1/);
      } finally {
        rmSync(dir, { recursive: true, force: true });
      }
    });
  });

  // The binary surface, PWC-13. The gate passes `-I` today, which means
  // "treat a binary file as if it held no match", so the three patterns
  // have only ever been applied to text. These two cases pin BOTH sides of
  // that: what the script does while the flag is there, and what it does
  // the day HQ removes it. The second one failed before 2026-10-26 run 13,
  // because the flags were the one field the script hardcoded instead of
  // reading, and a drifted checker reports clean on a tree the gate fails.
  describe('a violation inside a binary file', () => {
    // A one pixel PNG with the violating strings in an uncompressed tEXt
    // chunk. Built here rather than committed, for the same reason every
    // other fixture in this suite is: a committed one would fail the gate.
    function pngCarrying(text) {
      const crcTable = Array.from({ length: 256 }, (_, n) => {
        let c = n;
        for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
        return c >>> 0;
      });
      const crc32 = (buf) => {
        let c = 0xffffffff;
        for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8);
        return (c ^ 0xffffffff) >>> 0;
      };
      const chunk = (type, data) => {
        const len = Buffer.alloc(4);
        len.writeUInt32BE(data.length);
        const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
        const crc = Buffer.alloc(4);
        crc.writeUInt32BE(crc32(body));
        return Buffer.concat([len, body, crc]);
      };
      const ihdr = Buffer.alloc(13);
      ihdr.writeUInt32BE(1, 0);
      ihdr.writeUInt32BE(1, 4);
      ihdr[8] = 8;
      ihdr[9] = 2;
      return Buffer.concat([
        Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
        chunk('IHDR', ihdr),
        chunk('tEXt', Buffer.concat([Buffer.from('Comment\0', 'ascii'), Buffer.from(text)])),
        chunk('IDAT', Buffer.from([0x78, 0x01, 0x01, 0x04, 0x00, 0xfb, 0xff, 0x00, 0xff, 0xff, 0xff, 0x04, 0xfd, 0x01, 0xfe])),
        chunk('IEND', Buffer.alloc(0)),
      ]);
    }

    // The gate's own text with `-I` taken out: the change PWC-13 asks HQ
    // for. Derived from the real workflow so that no pattern is copied
    // into this file and the case cannot pass against a stale fake.
    function gateWithoutI(dir) {
      const yml = readFileSync(REAL_WORKFLOW, 'utf8').replace(
        /grep -rInE "\$pattern"/,
        'grep -rnE "$pattern"'
      );
      assert.ok(yml.includes('grep -rnE'), 'the real gate no longer matches the -I replacement');
      const path = join(dir, 'gate-without-I.yml');
      writeFileSync(path, yml);
      return path;
    }

    function sandboxWithPng() {
      const dir = sandbox({ 'notes.md': 'clean text\n' });
      writeFileSync(join(dir, 'capture.png'), pngCarrying(`${fakeHomePath} ${fakeSessionId}`));
      return dir;
    }

    test('is skipped while the gate still passes -I, which is the gate today', () => {
      const dir = sandboxWithPng();
      try {
        const { code, stdout } = runCheck(dir);
        assert.equal(code, 0, 'the script must match the gate, not improve on it');
        assert.match(stdout, /clean \(3 patterns/);
      } finally {
        rmSync(dir, { recursive: true, force: true });
      }
    });

    test('is caught, by path alone, once the gate stops passing -I', () => {
      const dir = sandboxWithPng();
      try {
        const { code, stderr } = runCheck(dir, [`--workflow=${gateWithoutI(dir)}`]);
        assert.equal(code, 1, 'the flags must come from the gate, or this is the drift');
        assert.match(stderr, /capture\.png:-/, 'a binary hit has a path and no line number');
        assert.match(stderr, /Absolute home path/);
        assert.match(stderr, /session or conversation UUID/);
        // The notice grep writes carries no matched text, and nothing here
        // may add any: this is an image whose content is the private thing.
        assert.ok(!stderr.includes(fakeSessionId), 'must not reprint the value it caught');
        assert.ok(!stderr.includes(fakeHomePath), 'must not reprint the value it caught');
      } finally {
        rmSync(dir, { recursive: true, force: true });
      }
    });
  });

  // ---------------------------------------------------------- history
  //
  // The mode exists because the gate reads the working tree, so a value a
  // seat truncates in the next commit stays readable at the commit before
  // it. Every case below therefore has a CLEAN tip and a dirty ancestor,
  // which is the exact shape tree mode is blind to.

  function gitRepo(commits) {
    const dir = mkdtempSync(join(tmpdir(), 'redaction-hist-'));
    const git = (...args) =>
      execFileSync('git', ['-C', dir, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    git('init', '-q', '-b', 'main');
    git('config', 'user.email', 'suite@example.invalid');
    git('config', 'user.name', 'suite');
    for (const files of commits) {
      for (const [name, body] of Object.entries(files)) {
        const path = join(dir, name);
        mkdirSync(dirname(path), { recursive: true });
        writeFileSync(path, body);
      }
      git('add', '-A');
      git('commit', '-q', '-m', 'step');
    }
    return dir;
  }

  test('history finds a value the tip no longer carries, and tree mode does not', () => {
    const dir = gitRepo([
      { 'audit.md': `evidence\nid: ${fakeSessionId}\n` },
      { 'audit.md': `evidence\nid: ${fakeSessionId.slice(0, 8)}\n` },
    ]);
    try {
      const tree = runCheck(dir);
      assert.equal(tree.code, 0, 'the tip is clean, so tree mode must pass');

      const hist = runCheck(dir, ['--history']);
      assert.equal(hist.code, 1);
      assert.match(hist.stderr, /session or conversation UUID/);
      assert.match(hist.stderr, /audit\.md:2 \(blob [0-9a-f]{8}\)/);
      // The same rule tree mode has, and the reason the mode is safe to
      // run in CI at all: naming where it is must not republish it.
      assert.ok(!hist.stderr.includes(fakeSessionId), 'must not reprint the value it caught');
      assert.match(hist.stderr, /tip-tree fix does not reach them/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test('history passes a repository that was never dirty, and counts the blobs', () => {
    const dir = gitRepo([{ 'a.md': 'clean\n' }, { 'b.md': 'also clean\n' }]);
    try {
      const { code, stdout } = runCheck(dir, ['--history']);
      assert.equal(code, 0);
      assert.match(stdout, /Redaction history clean: \d+ blob\(s\) reachable from HEAD/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test('history honours the gate exclusions, so a path the gate skips is skipped here', () => {
    const dir = gitRepo([
      { 'node_modules/dep/readme.md': `id: ${fakeSessionId}\n`, 'ok.md': 'fine\n' },
      { 'ok.md': 'fine, still\n' },
    ]);
    try {
      const { code, stdout } = runCheck(dir, ['--history']);
      assert.equal(code, 0, 'node_modules is one of the gate’s own --exclude-dir values');
      assert.match(stdout, /history clean/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test('history takes a ref, so a branch can be swept without checking it out', () => {
    const dir = gitRepo([{ 'a.md': 'clean\n' }]);
    try {
      const git = (...args) =>
        execFileSync('git', ['-C', dir, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
      git('checkout', '-q', '-b', 'side');
      writeFileSync(join(dir, 'leak.md'), `id: ${fakeSessionId}\n`);
      git('add', '-A');
      git('commit', '-q', '-m', 'side');
      git('checkout', '-q', 'main');

      assert.equal(runCheck(dir, ['--history=main']).code, 0, 'main never saw it');
      const side = runCheck(dir, ['--history=side']);
      assert.equal(side.code, 1, 'the branch did');
      assert.match(side.stderr, /leak\.md:1/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  // --history=all, added 2026-11-02 for F50. Until then the mode walked one
  // named ref, and on this repository that read 13 hits while 92 were
  // reachable from some ref. The four tests below are the whole argument for
  // the flag: a value on an undeleted branch is reachable in a public
  // repository, one ref's ancestry cannot see it, every ref can, and the
  // refspec fault that does not matter for a named ref is exactly what
  // shrinks --all.
  test('--history=all sees a branch that no named ref in the sweep reaches', () => {
    const dir = gitRepo([{ 'a.md': 'clean\n' }]);
    try {
      const git = (...args) =>
        execFileSync('git', ['-C', dir, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
      git('checkout', '-q', '-b', 'abandoned');
      writeFileSync(join(dir, 'leak.md'), `id: ${fakeSessionId}\n`);
      git('add', '-A');
      git('commit', '-q', '-m', 'the branch nobody deleted');
      git('checkout', '-q', 'main');

      assert.equal(runCheck(dir, ['--history']).code, 0, 'HEAD never saw it, which is the old answer');
      const all = runCheck(dir, ['--history=all']);
      assert.equal(all.code, 1, 'every ref did, which is the new one');
      assert.match(all.stderr, /leak\.md:1/);
      assert.ok(!all.stderr.includes(fakeSessionId), 'must not reprint the value it caught');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test('--history=all names its scope, so a log says which question was asked', () => {
    const dir = gitRepo([{ 'a.md': 'clean\n' }, { 'b.md': 'also clean\n' }]);
    try {
      const { code, stdout } = runCheck(dir, ['--history=all']);
      assert.equal(code, 0);
      assert.match(stdout, /reachable from any ref in this clone/);
      assert.doesNotMatch(stdout, /reachable from HEAD/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  // The batch boundary, added 2026-11-02 after `--history=all` on a complete
  // clone of this repository threw `RangeError: Invalid string length` out of
  // `Array.join` and died at exit 1, which on this tool means a dirty tree. A
  // byte budget fixed it, and the one thing a byte budget can get wrong is the
  // mapping from a line number back to the blob it came from: `grep -n`
  // numbers each batch's stream from 1, so a frame list that does not reset
  // with the stream attributes a hit to whatever line sat at that index in an
  // earlier batch. Both tests below drive a one byte budget, which flushes
  // after every blob, so every hit crosses a boundary.
  test('a hit keeps its own file and line across a batch boundary', () => {
    const dir = gitRepo([
      { 'first.md': 'one\ntwo\nthree\nfour\nfive\n' },
      { 'second.md': 'a\nb\nc\n' },
      { 'third.md': `x\ny\nid: ${fakeSessionId}\n` },
    ]);
    try {
      const batched = runCheck(dir, ['--history', '--stream-budget=1']);
      assert.equal(batched.code, 1);
      assert.match(batched.stderr, /third\.md:3/, 'the third line of the third file, not an index into an earlier batch');
      assert.ok(!batched.stderr.includes(fakeSessionId));
      // And the unbatched scan of the same repository agrees, which is what
      // says the budget changed the batching and nothing else.
      const whole = runCheck(dir, ['--history']);
      assert.equal(whole.code, 1);
      assert.equal(batched.stderr, whole.stderr);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test('a clean repository is still clean when every blob is its own batch', () => {
    const dir = gitRepo([{ 'a.md': 'clean\n' }, { 'b.md': 'also clean\n' }, { 'c.md': 'and c\n' }]);
    try {
      const { code, stdout } = runCheck(dir, ['--history=all', '--stream-budget=1']);
      assert.equal(code, 0);
      assert.match(stdout, /Redaction history clean/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test('a one-ref sweep says so, because its answer is the smaller one', () => {
    const dir = gitRepo([{ 'a.md': `id: ${fakeSessionId}\n` }, { 'a.md': 'clean now\n' }]);
    try {
      const { code, stderr } = runCheck(dir, ['--history']);
      assert.equal(code, 1);
      assert.match(stderr, /This walked one ref\. Run --history=all/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test('--history=all says a closed pull request keeps the ref alive, which deleting the branch does not', () => {
    const dir = gitRepo([{ 'a.md': `id: ${fakeSessionId}\n` }, { 'a.md': 'clean now\n' }]);
    try {
      const { code, stderr } = runCheck(dir, ['--history=all']);
      assert.equal(code, 1);
      assert.match(stderr, /refs\/pull\/<n>\/head/);
      assert.doesNotMatch(stderr, /Run --history=all/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  // The asymmetry is the point and it is deliberate, so it is pinned in both
  // directions. A narrow refspec cannot shrink the ancestry of a ref the
  // caller named, and it is exactly what shrinks --all, so the named-ref
  // sweep must NOT refuse on it and the all-refs sweep must.
  test('--history=all refuses a single-branch clone; a named ref does not', () => {
    const origin = gitRepo([{ 'a.md': 'clean\n' }]);
    const narrow = mkdtempSync(join(tmpdir(), 'redaction-narrow-'));
    try {
      const ogit = (...args) =>
        execFileSync('git', ['-C', origin, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
      ogit('checkout', '-q', '-b', 'side');
      writeFileSync(join(origin, 'leak.md'), `id: ${fakeSessionId}\n`);
      ogit('add', '-A');
      ogit('commit', '-q', '-m', 'side');
      ogit('checkout', '-q', 'main');

      execFileSync('git', ['clone', '-q', '--single-branch', '--branch', 'main', `file://${origin}`, narrow], {
        stdio: ['ignore', 'pipe', 'pipe'],
      });
      // Full depth, so the shallow refusal cannot be what fires here.
      assert.equal(
        execFileSync('git', ['-C', narrow, 'rev-parse', '--is-shallow-repository'], { encoding: 'utf8' }).trim(),
        'false',
      );

      const all = runCheck(narrow, ['--history=all']);
      assert.equal(all.code, 2, 'exit 2 is "this checker could not do its job"');
      assert.match(all.stderr, /fetch refspec covers one branch/);
      assert.match(all.stderr, /ensure-full-clone/);

      const named = runCheck(narrow, ['--history=main']);
      assert.equal(named.code, 0, 'a named ref is complete in a narrow clone, so it is not refused');
    } finally {
      rmSync(origin, { recursive: true, force: true });
      rmSync(narrow, { recursive: true, force: true });
    }
  });

  // A truncated graph that reports clean is the worst answer this mode can
  // give, because it is indistinguishable from the good one. Same refusal
  // tools/secret-scan.mjs makes, for the same reason.
  test('history refuses a shallow clone instead of reporting clean', () => {
    const origin = gitRepo([
      { 'audit.md': `id: ${fakeSessionId}\n` },
      { 'audit.md': `id: ${fakeSessionId.slice(0, 8)}\n` },
      { 'audit.md': 'clean now\n' },
    ]);
    const shallow = mkdtempSync(join(tmpdir(), 'redaction-shallow-'));
    try {
      execFileSync('git', ['clone', '-q', '--depth=1', `file://${origin}`, shallow], {
        stdio: ['ignore', 'pipe', 'pipe'],
      });
      const { code, stderr } = runCheck(shallow, ['--history']);
      assert.equal(code, 2, 'exit 2 is "this checker could not do its job"');
      assert.match(stderr, /shallow/);
      assert.match(stderr, /ensure-full-clone/);
    } finally {
      rmSync(origin, { recursive: true, force: true });
      rmSync(shallow, { recursive: true, force: true });
    }
  });

  // This mode concatenates all of history into one stream, which is its
  // own invention and nothing else in the repository has to live with it.
  // An earlier draft prefixed each line with a sentinel and an id, and
  // this case is what caught it: a gate looking for a digit matched the
  // prefix on every line and reported findings in a repository that has
  // none. grep's own `-n` runs after the match, so it cannot.
  test('its own line framing cannot manufacture a finding', () => {
    const dir = gitRepo([{ 'a.md': 'aaa\nbbb\n' }, { 'a.md': 'ccc\n' }]);
    const gate = mkdtempSync(join(tmpdir(), 'redaction-gate-'));
    try {
      // A gate that looks for a digit. No committed line here has one.
      const yml = [
        '          scan "digits" \\',
        "               '[0-9]'",
        '          hits=$(grep -rInE "$pattern" . \\',
        '            --exclude-dir=.git \\',
        "            | grep -vE 'nothing-here' || true)",
        '',
      ].join('\n');
      const file = join(gate, 'fake-gate.yml');
      writeFileSync(file, yml);
      const { code, stdout } = runCheck(dir, ['--history', `--workflow=${file}`]);
      assert.equal(code, 0, 'nothing in this repository has a digit in it');
      assert.match(stdout, /history clean/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
      rmSync(gate, { recursive: true, force: true });
    }
  });

  // The same stream, asked the opposite question: a line that really does
  // match must still be found once the framing is gone.
  test('finds every matching line in one concatenated stream, with the right line numbers', () => {
    const dir = gitRepo([
      { 'a.md': `one\nid: ${fakeSessionId}\nthree\n` },
      { 'b.md': `x\ny\nid: ${fakeSessionId}\n`, 'a.md': 'cleaned\n' },
    ]);
    try {
      const { code, stderr } = runCheck(dir, ['--history']);
      assert.equal(code, 1);
      assert.match(stderr, /a\.md:2 \(blob [0-9a-f]{8}\)/);
      assert.match(stderr, /b\.md:3 \(blob [0-9a-f]{8}\)/);
      assert.ok(!stderr.includes(fakeSessionId));
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  // Guards the claim in the script's header: the rules are the workflow's.
  test('reads its three patterns out of the real gate, not out of itself', () => {
    const yml = execFileSync('cat', [REAL_WORKFLOW], { encoding: 'utf8' });
    const pairs = [...yml.matchAll(/scan\s+"([^"]+)"\s*\\\s*\n\s*'([^']+)'/g)];
    assert.equal(pairs.length, 3, 'the gate should still declare three scans');
    const self = execFileSync('cat', [SCRIPT], { encoding: 'utf8' });
    for (const [, , pattern] of pairs) {
      assert.ok(!self.includes(pattern), `pattern is duplicated into the script: ${pattern}`);
    }
  });

  // Same claim, for the field that broke it. The flag cluster is a rule of
  // the gate exactly as the patterns are, and `-I` is the whole of whether
  // an image is scanned, so a copy of it living here is a silent drift
  // rather than a visible one.
  test('reads the gate flags out of the real gate, not out of itself', () => {
    const yml = readFileSync(REAL_WORKFLOW, 'utf8');
    const flags = yml.match(/\bgrep\s+(-[A-Za-z]+)\s+"\$pattern"/);
    assert.ok(flags, 'the gate should still declare its grep flags in one cluster');
    const self = readFileSync(SCRIPT, 'utf8');
    assert.ok(
      !self.includes(`'${flags[1]}'`),
      `the gate's flag cluster ${flags[1]} is duplicated into the script`
    );
  });

  // An argument this script cannot honour is exit 2 and never a narrower
  // scan. The case that motivates every assertion below is a typo in
  // `--history`: it used to fall through the mode test in `run()`, run a
  // WORKING-TREE scan, and print the clean line to a caller who asked about
  // history. `tools/secret-scan.mjs` closed its half of this on 2026-11-02
  // and its comment named this file; this is the other half.
  describe('arguments it cannot honour', () => {
    test('a typo in --history is exit 2, not a tree scan reported as clean', () => {
      const dir = mkdtempSync(join(tmpdir(), 'redaction-args-'));
      try {
        const { code, stdout, stderr } = runCheck(dir, ['--histroy=all']);
        assert.equal(code, 2, 'must refuse rather than answer a different question');
        assert.ok(!stdout.includes('clean'), 'must not print the clean line');
        assert.match(stderr, /--histroy=all/, 'must name the argument it rejected');
      } finally {
        rmSync(dir, { recursive: true, force: true });
      }
    });

    // The pure function, so the whole class is covered without 2 spawns each.
    test('argumentFault classifies the flag surface', () => {
      assert.equal(argumentFault([]), null);
      assert.equal(argumentFault(['--history']), null);
      assert.equal(argumentFault(['--history=all', '--json']), null);
      assert.equal(argumentFault(['--root=/tmp/x', '--workflow=/tmp/y']), null);
      assert.equal(argumentFault(['--stream-budget=1']), null);

      for (const args of [['--histroy=all'], ['--history', '-v'], ['extra'], ['--since=3']]) {
        assert.notEqual(argumentFault(args), null, `should reject ${args.join(' ')}`);
      }
    });

    // A budget that cannot trip is the crash commit 8381f533 fixed, back
    // again and silent: `bytes >= NaN` is always false, so the batch never
    // flushes and `scanHistory` rebuilds the one string that threw RangeError.
    test('a --stream-budget that cannot trip is refused, not defaulted', () => {
      for (const value of ['abc', '0', '-1', '']) {
        const fault = argumentFault([`--stream-budget=${value}`]);
        assert.notEqual(fault, null, `--stream-budget=${value} should be a fault`);
        assert.equal(fault.bad.length, 1);
      }
      // And a usable one is not swept up with them.
      assert.equal(argumentFault(['--stream-budget=1']), null);
      assert.equal(argumentFault(['--stream-budget=67108864']), null);
    });

    // The asymmetry that produced this fix, asserted so it cannot come back
    // on either side. Both tools are run in one sweep and spell history
    // differently, so each must refuse the other's spelling out loud.
    test('both tools in the sweep refuse an argument they do not know', () => {
      const scan = resolve(HERE, '..', 'tools', 'secret-scan.mjs');
      for (const script of [SCRIPT, scan]) {
        let code = 0;
        try {
          execFileSync('node', [script, '--histroy=all'], {
            encoding: 'utf8',
            stdio: ['ignore', 'pipe', 'pipe'],
          });
        } catch (err) {
          code = err.status;
        }
        assert.equal(code, 2, `${script} must refuse an argument it does not know`);
      }
    });
  });

  // ------------------------------------------------------------------
  // THE PROPOSED CLASS C NARROWING (docs/security/redaction-gate-uuid-narrowing.md)
  //
  // The gate's Class C pattern matches session identity by shape, and the
  // article-id path segment of a cited public URL has the same shape. The
  // market seat paid for that twice, a week apart: on 2026-11-02 (a0087473)
  // it deleted three source URLs and replaced them with prose saying the URL
  // was omitted because the gate rejects it, and on 2026-11-09 (9512b85b) it
  // percent-encoded one hyphen inside the slug in three files so the shape
  // would stop matching while the link still resolved. Neither touched the
  // gate, so the next seat citing the next UUID-slug host pays again.
  //
  // The remedy has to be an ALLOWANCE and not a narrower Class C pattern,
  // because deciding this needs to look LEFT of the match, at whether a URL
  // precedes it, and POSIX extended regular expressions, which is what
  // `grep -E` gives the gate, have no lookbehind.
  //
  // These cases run the real script against the real gate's rules with the
  // proposal applied in memory, so they are a review of the proposal rather
  // than a review of a copy of it. The proposal's own regular expression is
  // BUILT FROM the gate's Class C pattern read out of the workflow, so there
  // is no second copy of that pattern here either.
  describe('the proposed Class C narrowing for cited public URLs', () => {
    const SOURCE_HOST = 'finance.biggo.com';

    function gateRules(yml) {
      const scans = [...yml.matchAll(/scan\s+"([^"]+)"\s*\\\s*\n\s*'([^']+)'/g)].map(
        ([, label, pattern]) => ({ label, pattern })
      );
      const allowance = yml.match(/grep\s+-vE\s+'([^']+)'/);
      assert.ok(allowance, 'the gate should still declare one shared allowance');
      const classC = scans.find((s) => /UUID/i.test(s.label));
      assert.ok(classC, 'the gate should still declare a Class C scan naming UUID');
      return { scans, classC, allowance: allowance[1] };
    }

    // One allowlisted host, one URL path, then the gate's OWN Class C
    // pattern. Allowlist and not denylist because the two failure
    // directions are not symmetric: a missing allowlist entry costs one
    // seat one red gate and a one-line addition, and a missing denylist
    // entry publishes a private conversation identifier.
    function proposedAllowance(yml) {
      const { classC } = gateRules(yml);
      const host = SOURCE_HOST.replace(/\./g, '\\.');
      return `https?://${host}/[A-Za-z0-9._~%/+-]*${classC.pattern}`;
    }

    function withProposal(yml) {
      const { allowance } = gateRules(yml);
      const addition = proposedAllowance(yml);
      if (allowance.includes(addition)) return yml; // already applied, idempotent
      return yml.replace(`grep -vE '${allowance}'`, `grep -vE '${allowance}|${addition}'`);
    }

    // Written to a temp file rather than to the repository, because the
    // gate under test is the repository's and this one is a candidate.
    function gateFile(yml) {
      const dir = mkdtempSync(join(tmpdir(), 'redaction-proposal-'));
      const file = join(dir, 'redaction-gate.yml');
      writeFileSync(file, yml);
      return file;
    }

    const REAL = () => readFileSync(REAL_WORKFLOW, 'utf8');

    // The same assembled value in four positions. Same value on purpose:
    // it is the position and not the value that the proposal reads, and a
    // test using a different value in each position could not show that.
    const citedUrl = `https://${SOURCE_HOST}/news/${fakeSessionId}`;
    const conversationUrl = `https://claude.ai/chat/${fakeSessionId}`;
    const otherHostUrl = `https://example.invalid/news/${fakeSessionId}`;

    test('reproduces the defect: today\'s gate rejects a cited public URL', () => {
      const dir = sandbox({ 'docs/market/landscape.md': `Source: [BigGo](${citedUrl}).\n` });
      try {
        const { code, stderr } = runCheck(dir);
        assert.equal(code, 1, 'this is the false positive the market seat worked around twice');
        assert.match(stderr, /landscape\.md:1/);
      } finally {
        rmSync(dir, { recursive: true, force: true });
      }
    });

    test('with the proposal applied, the same cited URL passes', () => {
      const dir = sandbox({ 'docs/market/landscape.md': `Source: [BigGo](${citedUrl}).\n` });
      const gate = gateFile(withProposal(REAL()));
      try {
        const { code, stdout } = runCheck(dir, [`--workflow=${gate}`]);
        assert.equal(code, 0, 'a public article id in a cited URL is not session identity');
        assert.match(stdout, /clean \(3 patterns, read from the workflow\)/);
      } finally {
        rmSync(dir, { recursive: true, force: true });
        rmSync(dirname(gate), { recursive: true, force: true });
      }
    });

    test('the proposal still rejects the very same value when it is bare', () => {
      const dir = sandbox({ 'docs/runs/note.md': `Posted one note (id ${fakeSessionId}).\n` });
      const gate = gateFile(withProposal(REAL()));
      try {
        const { code, stderr } = runCheck(dir, [`--workflow=${gate}`]);
        assert.equal(code, 1, 'the exemption is positional, so the bare form must still fail');
        assert.match(stderr, /note\.md:1/);
        assert.ok(!stderr.includes(fakeSessionId), 'and must not print the value it caught');
      } finally {
        rmSync(dir, { recursive: true, force: true });
        rmSync(dirname(gate), { recursive: true, force: true });
      }
    });

    // This is why the list is an allowlist. A conversation-sharing link is a
    // URL, so "a UUID inside a URL is public" is false, and a URL-shaped
    // allowance with no host test would exempt exactly the class the gate
    // exists for.
    test('the proposal still rejects a UUID inside a conversation-sharing URL', () => {
      const dir = sandbox({ 'docs/design/plan.md': `Trial: ${conversationUrl}\n` });
      const gate = gateFile(withProposal(REAL()));
      try {
        const { code, stderr } = runCheck(dir, [`--workflow=${gate}`]);
        assert.equal(code, 1, 'claude.ai/chat/<id> carries session identity and must stay caught');
        assert.match(stderr, /plan\.md:1/);
      } finally {
        rmSync(dir, { recursive: true, force: true });
        rmSync(dirname(gate), { recursive: true, force: true });
      }
    });

    test('the proposal still rejects a UUID path on a host not on the list', () => {
      const dir = sandbox({ 'docs/market/brief.md': `Source: ${otherHostUrl}\n` });
      const gate = gateFile(withProposal(REAL()));
      try {
        const { code } = runCheck(dir, [`--workflow=${gate}`]);
        assert.equal(code, 1, 'a new source host is a one-line addition, not an automatic pass');
      } finally {
        rmSync(dir, { recursive: true, force: true });
        rmSync(dirname(gate), { recursive: true, force: true });
      }
    });

    // THE RESIDUAL COST, asserted rather than described, because a known
    // hole that no test pins is a hole that moves. The gate shares ONE
    // allowance across all three patterns and applies it with `grep -vE`,
    // which is line scoped. So a line the proposal exempts stops being
    // checked for Class A and Class B as well.
    //
    // The proposal does not create this; the allowance has been shared and
    // line scoped since the gate was written, and this script's own header
    // names it. The proposal adds one more line shape that can trigger it.
    // Measured cost over every blob in every ref, by
    // `node scripts/uuid-shape-census.mjs`: Q4 is 0 lines of 8,969 blobs,
    // and Q3, lines carrying both an exempt and a bare value, is also 0.
    // The structural repair is a per-scan allowance, which changes the
    // gate's shape and is a separate proposal.
    test('documents the residual: one line carrying both loses the other classes', () => {
      const dir = sandbox({
        'docs/market/brief.md': `Source ${citedUrl} read from ${fakeHomePath}\n`,
      });
      const gate = gateFile(withProposal(REAL()));
      try {
        const { code } = runCheck(dir, [`--workflow=${gate}`]);
        assert.equal(
          code,
          0,
          'KNOWN COST of a shared line-scoped allowance: the Class A path on this line is missed. ' +
            'If this ever starts failing, the gate grew per-scan allowances and this test is the ' +
            'one to delete.'
        );
        // And the same Class A path on its own line is still caught, so the
        // loss is the line and not the pattern.
        const split = sandbox({
          'docs/market/brief.md': `Source ${citedUrl}\nread from ${fakeHomePath}\n`,
        });
        try {
          const { code: splitCode, stderr } = runCheck(split, [`--workflow=${gate}`]);
          assert.equal(splitCode, 1);
          assert.match(stderr, /brief\.md:2/);
        } finally {
          rmSync(split, { recursive: true, force: true });
        }
      } finally {
        rmSync(dir, { recursive: true, force: true });
        rmSync(dirname(gate), { recursive: true, force: true });
      }
    });

    // So that the owner applying the patch twice, or applying it to a gate
    // that already carries it, is not a second alternative in the allowance.
    test('applying the proposal twice is the same file as applying it once', () => {
      const once = withProposal(REAL());
      assert.equal(withProposal(once), once);
      assert.notEqual(once, REAL(), 'and applying it once must actually change the gate');
    });

    // The patch the owner applies and this suite's in-memory transformation
    // must be the same edit, or the tests above are green about something
    // nobody will ship.
    test('the committed patch makes exactly the edit these tests exercise', () => {
      const patch = resolve(HERE, '..', 'docs', 'security', 'redaction-gate-uuid-narrowing.patch');
      const dir = mkdtempSync(join(tmpdir(), 'redaction-patch-'));
      try {
        mkdirSync(join(dir, '.github', 'workflows'), { recursive: true });
        writeFileSync(join(dir, '.github', 'workflows', 'redaction-gate.yml'), REAL());
        execFileSync('git', ['init', '--quiet'], { cwd: dir });
        execFileSync('git', ['apply', patch], { cwd: dir });
        const applied = readFileSync(join(dir, '.github', 'workflows', 'redaction-gate.yml'), 'utf8');
        assert.equal(applied, withProposal(REAL()), 'the patch and the test transformation diverged');
      } finally {
        rmSync(dir, { recursive: true, force: true });
      }
    });
  });

});
