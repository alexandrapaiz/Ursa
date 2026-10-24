#!/usr/bin/env node
// Does every merge attribute this repository commits actually do something?
//
//   node tools/ledger/check-attributes.mjs                 # the committed state
//   node tools/ledger/check-attributes.mjs --clone          # and this clone's config
//   node tools/ledger/check-attributes.mjs --repo <dir>     # check another checkout
//
// Exit 0 clean, exit 1 with one line per violation and the command that fixes it.
//
// WHY THIS EXISTS. A merge attribute has two halves that live in different
// files with different lifetimes. `.gitattributes` is committed and says
// `docs/ideas.md merge=ledger`. The command behind the name lives in
// `.git/config`, which is per-clone and never committed. A seat's clone is
// fresh every run, so the committed half is always present and the other half
// is absent by default, and git says NOTHING about the gap: measured on git
// 2.43.0, a merge of two appends with a declared-but-unregistered driver
// prints `Auto-merging` and `CONFLICT (content)` and never names the driver it
// could not find, on either stream. The convention reads as installed and
// behaves as absent. docs/standards/lessons.md L-A49 is the rule; this file is
// its exit code.
//
// WHAT IT REFUSES, and each refusal is measured rather than argued:
//
//   1. `merge=union` on any path. It is built into git, so it needs no config
//      and looks like the cheap fix. It aligns byte-identical trailing lines as
//      shared context and merges two register entries into one and a half at
//      exit 0 with no marker. Reason text lives in drivers.json.
//   2. A named driver no committed script in this repository registers. There
//      is then no command to run and no way to get the declared behaviour.
//   3. With --clone: a named driver this clone has not registered. This is the
//      state every fresh clone is in, which is why it is a separate mode: it is
//      a precondition for merging, not a defect in the commit. The installers
//      and tools/ledger/requeue.sh call it to check their own post-condition.
//   4. Disagreement between the attributes and a driver's own path table, in
//      both directions. A path the attributes send to a driver that its table
//      does not declare is refused at merge time; a path the table enables that
//      the attributes never declare does not reach the driver at all.
//
// WHAT IT READS. `git check-attr`, which is git's own attribute resolution and
// therefore exactly what governs a real merge, including `.git/info/attributes`
// if a clone has one. In CI the checkout is fresh and that file does not exist,
// so there the answer is the committed state alone; in a clone where an
// installer ran, a per-clone attributes file that has drifted from
// `.gitattributes` is also a disagreement worth catching, and this sees it.
import { readFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';

const args = process.argv.slice(2);
const checkClone = args.includes('--clone');
const repoIndex = args.indexOf('--repo');
const repo = repoIndex === -1 ? process.cwd() : args[repoIndex + 1];

if (args.includes('--help') || args.includes('-h')) {
  console.log('usage: check-attributes.mjs [--clone] [--repo <dir>]');
  process.exit(0);
}

const git = (...a) =>
  execFileSync('git', ['-C', repo, ...a], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });

const registryPath = join(repo, 'tools/ledger/drivers.json');
if (!existsSync(registryPath)) {
  console.error(`check-attributes: no driver registry at ${registryPath}`);
  process.exit(1);
}
const registry = JSON.parse(readFileSync(registryPath, 'utf8'));
const known = registry.drivers ?? {};
const refused = registry.refused ?? {};
const builtins = new Set(registry.builtin_allowed ?? []);

/** Every tracked path whose `merge` attribute git resolves to a real value.
 *  `-z` on both sides because a path may contain anything a filesystem allows,
 *  and `check-attr --stdin` emits path, attribute, value as three NUL-separated
 *  fields per declaration. */
function declarations() {
  const files = git('ls-files', '-z');
  const out = execFileSync('git', ['-C', repo, 'check-attr', 'merge', '-z', '--stdin'], {
    input: files,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  });
  const fields = out.split('\0');
  const found = [];
  for (let i = 0; i + 2 < fields.length; i += 3) {
    const [path, , value] = [fields[i], fields[i + 1], fields[i + 2]];
    if (value === 'unspecified' || value === 'unset' || value === '') continue;
    found.push({ path, driver: value });
  }
  return found;
}

/** @type {string[]} */
const violations = [];
const declared = declarations();

for (const { path, driver } of declared) {
  if (Object.hasOwn(refused, driver)) {
    violations.push(
      `${path} declares merge=${driver}, which this repository refuses by name. ${refused[driver]}`,
    );
    continue;
  }
  if (builtins.has(driver)) continue;
  const entry = known[driver];
  if (!entry) {
    violations.push(
      `${path} declares merge=${driver}, and no script in this repository registers a driver by that name. ` +
        `Add it to tools/ledger/drivers.json with the installer that defines it, or remove the attribute: ` +
        `a name nothing registers is the default line merge wearing a convention's clothes.`,
    );
    continue;
  }
  if (checkClone) {
    let configured = '';
    try {
      configured = git('config', '--get', entry.config_key).trim();
    } catch {
      configured = '';
    }
    if (!configured) {
      violations.push(
        `${path} declares merge=${driver} and this clone has no ${entry.config_key}, ` +
          `so git will fall back to the default line merge and say nothing about it. ` +
          `Run: bash ${entry.installer}`,
      );
    }
  }
}

// Rule 4: a driver that keeps its own path table must agree with the attributes.
for (const [driver, entry] of Object.entries(known)) {
  if (!entry.table) continue;
  const tablePath = join(repo, entry.table.path);
  if (!existsSync(tablePath)) {
    violations.push(`driver ${driver} names the table ${entry.table.path}, which does not exist.`);
    continue;
  }
  const table = JSON.parse(readFileSync(tablePath, 'utf8'));
  const enabled = new Set(
    (table.registers ?? []).filter((r) => r.enabled === true).map((r) => r.path),
  );
  const attributed = new Set(declared.filter((d) => d.driver === driver).map((d) => d.path));
  for (const path of attributed) {
    if (!enabled.has(path)) {
      violations.push(
        `${path} is declared merge=${driver} but ${entry.table.path} does not enable it, ` +
          `so the driver refuses the path by name at merge time and git records a conflict instead.`,
      );
    }
  }
  for (const path of enabled) {
    if (!attributed.has(path)) {
      violations.push(
        `${entry.table.path} enables ${path} but no .gitattributes line sends it to merge=${driver}, ` +
          `so the driver is never called for it and the table's promise is not kept.`,
      );
    }
  }
}

if (violations.length === 0) {
  const names = [...new Set(declared.map((d) => d.driver))].sort();
  console.log(
    `Merge attributes: ${declared.length} declaration(s) over ${names.length} driver(s) ` +
      `(${names.join(', ') || 'none'})${checkClone ? ', all registered in this clone' : ''}.`,
  );
  for (const { path, driver } of declared) console.log(`  ${path} -> ${driver}`);
  process.exit(0);
}

for (const v of violations) console.error(`::error::${v}`);
console.error(
  `Merge attributes: ${violations.length} violation(s)${checkClone ? ' (--clone)' : ''}.`,
);
process.exit(1);
