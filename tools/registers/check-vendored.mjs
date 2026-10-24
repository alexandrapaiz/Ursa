#!/usr/bin/env node
// Is the vendored register merger still the one HQ has?
//
//   node tools/registers/check-vendored.mjs           # offline: sha256 vs vendored.json
//   node tools/registers/check-vendored.mjs --remote   # also compare against HQ's main
//
// This exists because of Ursa INC-2026-10-18-host-clone-of-hq-tools-is-stale,
// where the host's checkout of an HQ tool sat 557 commits behind HQ's main and
// answered every question anyway, in the same shape a correct answer has. A
// missing tool fails loudly. A stale one does not. So staleness gets its own
// exit code rather than relying on somebody remembering to look.
//
// --remote needs `gh` authenticated and network. Without it the check is still
// worth running: it catches a local edit to a file that is supposed to be
// byte-identical to HQ's, which is the thing INC-2026-10-18-hq-tool-paths-are-hq-s
// says never to do.
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const record = JSON.parse(readFileSync(join(here, 'vendored.json'), 'utf8'));
const local = readFileSync(join(here, '..', '..', record.file));
const localSha = createHash('sha256').update(local).digest('hex');

let failed = false;
const fail = (msg) => {
  console.error(`check-vendored: ${msg}`);
  failed = true;
};

console.log(`vendored file:  ${record.file}`);
console.log(`recorded sha256: ${record.sha256}`);
console.log(`actual sha256:   ${localSha}`);

if (localSha !== record.sha256) {
  fail(
    `the vendored file does not match its own provenance record. It was edited locally, or ` +
      `vendored.json was updated without re-vendoring. This file is supposed to be byte-identical ` +
      `to ${record.source_repo}:${record.source_path}; a local patch drifts from the standard that ` +
      `calls it while continuing to answer (INC-2026-10-18-hq-tool-paths-are-hq-s).`,
  );
} else {
  console.log('offline check: the vendored bytes match the record.');
}

if (process.argv.includes('--remote')) {
  const r = spawnSync(
    'gh',
    ['api', `repos/${record.source_repo}/contents/${record.source_path}`, '--jq', '.content'],
    { encoding: 'utf8', maxBuffer: 1024 * 1024 * 64 },
  );
  if (r.status !== 0) {
    // Not a failure of the vendored copy. Reported as a skip, with the reason,
    // because a check that could not read its source must say so on its own
    // code rather than let silence read as agreement.
    console.log(
      `remote check SKIPPED: could not read ${record.source_repo}:${record.source_path} ` +
        `(${(r.stderr || '').trim() || 'no stderr'}). This says nothing about whether the copy is current.`,
    );
  } else {
    const upstream = Buffer.from(r.stdout.trim(), 'base64');
    const upstreamSha = createHash('sha256').update(upstream).digest('hex');
    console.log(`HQ main sha256:  ${upstreamSha}`);
    if (upstreamSha !== localSha) {
      fail(
        `HQ's copy on main has moved. The vendored copy is from commit ${record.source_commit} ` +
          `(${record.source_commit_date}). Re-vendor it byte for byte, update vendored.json, and ` +
          `re-run the driver's tests before trusting a merge it performs.`,
      );
    } else {
      console.log('remote check: the vendored copy is current with HQ main.');
    }
  }
}

process.exit(failed ? 1 : 0);
