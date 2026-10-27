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
});
