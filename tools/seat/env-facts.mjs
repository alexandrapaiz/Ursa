#!/usr/bin/env node
// env-facts.mjs — the facts about this host that bind every seat, printed from
// one table instead of copied into eleven charters.
//
//     node tools/seat/env-facts.mjs                 # print the table
//     node tools/seat/env-facts.mjs --ids           # ids only
//     node tools/seat/env-facts.mjs --json
//     node tools/seat/env-facts.mjs --audit         # grade the class; exit 1 on a gap
//
// Exit 0 when the read succeeded, 1 when --audit found a gap, 2 on usage.
//
// WHY THIS EXISTS.
//
// Every seat here wakes in the same environment and docs/agents/runner-facts.md
// is where this org has written that environment down, at the cost of a window
// per section. Measured 2026-10-27 over prompts/*-agent.md: **2 of 11** seat
// charters cite that file at all, and the ten roster-general facts in
// env-facts.json reached between 2/11 and 0/11 of the charters individually.
// Nine seats are handed a characterised environment and no route to the
// characterisation, and the cost is not hypothetical — the same night, Ursa's
// skill seat lost a pull request to a merge conflict that did not exist,
// because the clone it was given has no register merge drivers and its charter
// does not say so.
//
// WHY A TABLE AND A CHECK, RATHER THAN TEN PARAGRAPHS IN ELEVEN FILES.
//
// This seat's previous window propagated two rules by copying them into all
// eleven charters, reported the ratio honestly, and registered the remaining
// four as owed. HQ's exo-centralizer answered the same question from the other
// end that night: 212 rules in the company register, 26 per cent of them named
// by a file that runs, and the shape is a gradient rather than a split
// precisely because eleven charters there cite one register instead of each
// holding a copy. Its rule, quoted:
//
//     a rule binding a class of surfaces is enforced over the class, with a
//     declared table and a check that fails on a member missing from it
//
// So: env-facts.json is the table, this file prints it, each charter carries
// ONE citation, and --audit is the check. Copying would have made the citation
// rate 11/11 and left the next fact at 1/11 again, which is measuring the act
// instead of the mechanism.
//
// THE CLASS IS DERIVED, WHICH IS THE PART THAT COMPOUNDS.
//
// --audit does not know there are eleven seats. It intersects the seats
// declared in branch-patterns.json with the charter files on disk and FAILS IF
// THOSE TWO DISAGREE IN EITHER DIRECTION, so a twelfth seat joins the class
// when its charter file appears and a deleted charter is a failure rather than
// a quietly smaller denominator. That is the half a hard-coded count cannot do,
// and a frozen count is the exact defect that took three files and three
// different numbers for one measurement on 2026-10-27 (own-prs.mjs --audit).
//
// AND IT GRADES TWO DIFFERENT THINGS, DELIBERATELY NOT JOINED.
//
//   coverage — every member of the class cites the command.
//   integrity — every row of the table resolves: its `reading` sections exist
//               in runner-facts.md, and its `command` names a path that exists
//               when it names a path at all.
//
// They fail for unrelated reasons and a run needs to know which it is reading.
// A table every charter cites and whose rows point at nothing is the same
// defect one layer down, and that is not a hypothetical either: this
// repository's dangling-citation check spent a window reporting its own
// documentation as half its output.
import { readFileSync, readdirSync, existsSync } from 'node:fs';

const HERE = new URL('./', import.meta.url).pathname;
const ROOT = new URL('../../', import.meta.url).pathname;

const SPEC = JSON.parse(readFileSync(`${HERE}env-facts.json`, 'utf8'));
const BRANCH_SPEC = JSON.parse(readFileSync(`${HERE}branch-patterns.json`, 'utf8'));

export const facts = () => SPEC.facts;
export const citation = () => SPEC.cite;

/**
 * The class this table binds: one charter per seat, resolved from the seat
 * roster and the filesystem rather than from a literal.
 *
 * Returns both sides of the disagreement as well as the intersection, because
 * "11 charters" is a conclusion and the two inputs are the evidence.
 */
export function charterClass(root = ROOT) {
  const seats = Object.keys(BRANCH_SPEC.seats).sort();
  const onDisk = readdirSync(`${root}prompts`)
    .filter((f) => f.endsWith('-agent.md'))
    .map((f) => f.replace(/-agent\.md$/, ''))
    .sort();
  return {
    seats,
    on_disk: onDisk,
    members: seats.filter((s) => onDisk.includes(s)).map((s) => ({ seat: s, path: `prompts/${s}-agent.md` })),
    seats_without_charter: seats.filter((s) => !onDisk.includes(s)),
    charters_without_seat: onDisk.filter((s) => !seats.includes(s)),
  };
}

/** Coverage: does each member of the class cite the one command? */
export function gradeCoverage(root = ROOT, cite = SPEC.cite) {
  const cls = charterClass(root);
  const rows = cls.members.map((m) => {
    const text = readFileSync(`${root}${m.path}`, 'utf8');
    return { ...m, cites: text.includes(cite) };
  });
  return { cite, rows, covered: rows.filter((r) => r.cites).length, total: rows.length,
           seats_without_charter: cls.seats_without_charter,
           charters_without_seat: cls.charters_without_seat };
}

/**
 * Integrity: every row's `reading` resolves to a real section of the reading
 * register, and every `command` that names a repository path names one that
 * exists. A command whose first token is not a path (`git`, `curl`, `date`,
 * `ls`) is not checked for existence — that is stated rather than silently
 * skipped, because an unchecked row that reads as checked is this file's own
 * failure mode.
 */
export function gradeIntegrity(root = ROOT) {
  const readingPath = `${root}${SPEC.reading}`;
  const present = new Set();
  if (existsSync(readingPath)) {
    for (const line of readFileSync(readingPath, 'utf8').split('\n')) {
      const m = /^## (\d+[a-z]?)\./.exec(line);
      if (m) present.add(m[1]);
    }
  }
  const rows = SPEC.facts.map((f) => {
    const missing = (f.reading || []).filter((s) => !present.has(s));
    // The path is the longest leading token that looks like a repo path.
    const tok = (f.command || '').split(/\s+/).find((t) => /^(tools|docs|scripts|skills)\//.test(t));
    return {
      id: f.id,
      reading_missing: missing,
      path_checked: tok || null,
      path_ok: tok ? existsSync(`${root}${tok}`) : null,
    };
  });
  return { reading: SPEC.reading, reading_resolved: existsSync(readingPath),
           sections_found: present.size, rows };
}

function printTable() {
  console.log(`# ${SPEC.facts.length} facts about this host that bind every seat`);
  console.log(`# full reading: ${SPEC.reading}   cite this command: ${SPEC.cite}`);
  for (const f of SPEC.facts) {
    console.log(`\n## ${f.id}   (${SPEC.reading} §${(f.reading || []).join(', §')})`);
    console.log(f.one_line);
    if (f.command) console.log(`    ${f.command}`);
    if (f.cost) console.log(`  cost when it was missed: ${f.cost}`);
  }
}

function runAudit(json) {
  const cov = gradeCoverage();
  const integ = gradeIntegrity();
  const gaps = [];
  for (const s of cov.seats_without_charter) gaps.push(`seat "${s}" is on the roster and has no charter file`);
  for (const s of cov.charters_without_seat) gaps.push(`charter "prompts/${s}-agent.md" names no seat on the roster`);
  for (const r of cov.rows) if (!r.cites) gaps.push(`${r.path} does not cite ${cov.cite}`);
  if (!integ.reading_resolved) gaps.push(`the reading register ${integ.reading} does not exist`);
  for (const r of integ.rows) {
    for (const s of r.reading_missing) gaps.push(`fact "${r.id}" cites ${integ.reading} §${s}, which has no such section`);
    if (r.path_ok === false) gaps.push(`fact "${r.id}" names the path ${r.path_checked}, which does not exist`);
  }
  if (json) {
    console.log(JSON.stringify({ coverage: cov, integrity: integ, gaps }, null, 2));
  } else {
    // The count line is unconditional, including when it is clean. An absence
    // printed as nothing is indistinguishable from a filter that saw nothing.
    console.log(
      `class=${cov.total} cites=${cov.covered} facts=${SPEC.facts.length} ` +
      `reading_sections=${integ.sections_found} gaps=${gaps.length}`);
    const unchecked = integ.rows.filter((r) => r.path_checked === null).map((r) => r.id);
    if (unchecked.length) console.log(`no repository path to check (stated, not skipped): ${unchecked.join(', ')}`);
    for (const g of gaps) console.log(`GAP\t${g}`);
  }
  return gaps.length ? 1 : 0;
}

function main(argv) {
  const flags = new Set(argv.filter((a) => a.startsWith('--')));
  if (flags.has('--help')) {
    console.error('usage: env-facts.mjs [--ids|--json|--audit]');
    return 2;
  }
  if (flags.has('--audit')) return runAudit(flags.has('--json'));
  if (flags.has('--json')) { console.log(JSON.stringify(SPEC, null, 2)); return 0; }
  if (flags.has('--ids')) { for (const f of SPEC.facts) console.log(f.id); return 0; }
  printTable();
  return 0;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  process.exit(main(process.argv.slice(2)));
}
