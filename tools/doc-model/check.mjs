#!/usr/bin/env node
// Documented-model drift gate: run every prose claim about a mechanism
// against the one executable form of it.
//
//   node tools/doc-model/check.mjs                    # all mechanisms
//   node tools/doc-model/check.mjs --mechanism wake-cut
//   node tools/doc-model/check.mjs --json             # machine-readable
//   node tools/doc-model/check.mjs --corpus-from-board  # add live board rows
//
// Exit 0 every claim holds, every refutation still refutes, and the registry
// accounts for every candidate site. Exit 1 one or more findings. Exit 2 the
// registry itself is unusable (a reference that will not import), which is a
// different thing from a claim being wrong and is not a verdict on any doc.
//
// WHY THIS IS A GATE AND NOT A REPORT. The event it was built from is in
// `tools/doc-model/models.mjs`: two contradictory statements of one mechanism
// in one file on `main`, six days, and the later one winning because it was
// later. Both were corrected by hand, by two seats, after each had already
// acted on the wrong one. A report would have been read by whoever already
// knew. The check that matters is the one that fires on the *new* wrong
// sentence, which is `UNREGISTERED_SITE` below: a section that talks about a
// registered mechanism and is not itself registered is a finding, so the
// 2026-10-26 section could not have been added without someone transcribing
// its claim and watching it fail.
//
// WHAT THIS DOES NOT DO. It does not judge prose, rank writing, or check that
// a document is complete. It answers exactly one question per site: when the
// rule this prose states is executed, does it produce what the code produces.
// A site whose prose states no rule is dismissed on the record in the
// registry, with the reason, and the gate's only interest in it is that
// somebody looked.
import { readFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { MECHANISMS, NORMATIVE_SURFACES, RECORD_SURFACES } from './models.mjs';
import { corpus } from './corpus.mjs';

const REPO = new URL('../../', import.meta.url).pathname.replace(/\/$/, '');

/** Every heading in a markdown file, with its line index and depth.
 *  @param {string[]} lines @returns {{i: number, depth: number, text: string}[]} */
function headings(lines) {
  const out = [];
  for (let i = 0; i < lines.length; i++) {
    const m = /^(#{1,6}) /.exec(lines[i]);
    if (m) out.push({ i, depth: m[1].length, text: lines[i].trim() });
  }
  return out;
}

/** The text under a heading up to the next heading of ANY level. This is the
 *  unit a probe match is attributed to, because a reader scanning for the
 *  nearest heading above a sentence finds this one regardless of its depth.
 *  @param {string[]} lines @param {number} i @returns {string} */
function sectionFlat(lines, i) {
  let j = i + 1;
  while (j < lines.length && !/^#{1,6} /.test(lines[j])) j++;
  return lines.slice(i, j).join('\n');
}

/** The text under a heading INCLUDING its subsections, up to the next heading
 *  of the same or shallower depth. This is the unit a correction is looked for
 *  in, because the house pattern for correcting a section is a subsection
 *  underneath it rather than an edit to its body.
 *  @param {string[]} lines @param {number} i @returns {string} */
function sectionTree(lines, i) {
  const depth = (/^(#{1,6}) /.exec(lines[i]) || [, '#'])[1].length;
  let j = i + 1;
  while (j < lines.length) {
    const m = /^(#{1,6}) /.exec(lines[j]);
    if (m && m[1].length <= depth) break;
    j++;
  }
  return lines.slice(i, j).join('\n');
}

/** @param {string} p @returns {boolean} */
const isNormative = (p) => NORMATIVE_SURFACES.some((s) => p.startsWith(s.prefix));
/** The declared owner of the surface a path sits on, longest prefix first so
 *  `docs/ideas.md` is not decided by a shorter `docs/` entry if one is ever
 *  added.
 *  @param {string} p @returns {string} */
function surfaceSeat(p) {
  const hit = [...NORMATIVE_SURFACES].sort((a, b) => b.prefix.length - a.prefix.length)
    .find((s) => p.startsWith(s.prefix));
  return hit ? (hit.seat || 'any') : 'any';
}
/** Can the running seat edit this path? `any` is everyone's; a named seat is
 *  only its own. An unset `ASC_SEAT` owns nothing, which is the safe default:
 *  it downgrades rather than demanding an edit the runtime cannot attribute.
 *  @param {string} p @returns {boolean} */
function mineToEdit(p) {
  const seat = surfaceSeat(p);
  if (seat === 'any') return true;
  return Boolean(process.env.ASC_SEAT) && process.env.ASC_SEAT === seat;
}
/** @param {string} p @returns {boolean} */
const isRecord = (p) => RECORD_SURFACES.some((s) => p.startsWith(s.prefix));

/** Does `rev` carry a correction mark inside THIS SECTION of this path?
 *  Section-scoped on purpose. The first version of this function tested the
 *  whole blob, and it reported `runner-facts.md` §25 as corrected on a branch
 *  because a correction to §44, 1,343 lines away, mentioned the same model.
 *  "Beside it" is the whole of what makes a correction work on a reader, so
 *  the check has to mean it literally.
 *  @param {string} rev @param {string} path @param {string} heading
 *  @param {RegExp[]} marks @returns {boolean} */
function revSectionHasMark(rev, path, heading, marks) {
  let blob;
  try {
    blob = execFileSync('git', ['show', `${rev}:${path}`],
      { cwd: REPO, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'] });
  } catch {
    return false;
  }
  const lines = blob.split('\n');
  const i = lines.findIndex((l) => l.trim() === heading);
  if (i === -1) return false;
  const tree = sectionTree(lines, i);
  return marks.some((m) => m.test(tree));
}

/** Is this path present on `origin/main`? The reference being absent there
 *  while its prose sites are present is the condition under which the prose is
 *  the only copy a reader can reach, which is how this class of drift starts.
 *  @param {string} path @returns {boolean} */
function onMain(path) {
  try {
    execFileSync('git', ['cat-file', '-e', `origin/main:${path}`],
      { cwd: REPO, stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

/** Board rows as extra corpus bodies. Optional, additive, and never able to
 *  clear a finding the committed corpus found, because it is appended.
 *  @returns {{name: string, body: string}[]} */
function boardBodies() {
  const url = process.env.BOARD_API_URL;
  const token = process.env.BOARD_RUNTIME_TOKEN;
  if (!url || !token) return [];
  try {
    const raw = execFileSync('curl', ['-s', '--max-time', '30',
      `${url}/api/messages?limit=500&since_hours=2400`,
      '-H', `Authorization: Bearer ${token}`], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
    const rows = JSON.parse(raw).messages || [];
    return rows
      .filter((r) => typeof r.body === 'string')
      .map((r, n) => ({ name: `board-${String(r.id || n).slice(0, 8)}`, body: r.body }));
  } catch {
    return [];
  }
}

/** Run one transcribed model against the reference over every body, and
 *  return the disagreements worst-first. The number this returns is the one a
 *  report quotes: how many characters the prose is wrong by, on the body it
 *  is most wrong about.
 *  @param {(b: string, l: number) => number} model
 *  @param {(b: string, l: number) => number} ref
 *  @param {{name: string, body: string}[]} bodies @param {number} limit
 *  @returns {{name: string, chars: number, said: number, actual: number, off: number}[]} */
function disagreements(model, ref, bodies, limit) {
  const out = [];
  for (const { name, body } of bodies) {
    const said = model(body, limit);
    const actual = ref(body, limit);
    if (said !== actual) {
      out.push({ name, chars: body.length, said, actual, off: said - actual });
    }
  }
  return out.sort((a, b) => Math.abs(b.off) - Math.abs(a.off));
}

/** Every finding for one mechanism.
 *  @param {object} mech @param {{name: string, body: string}[]} extra
 *  @returns {{findings: object[], checked: object}} */
export async function auditMechanism(mech, extra = []) {
  const findings = [];
  const limit = mech.limit;

  let refFn;
  try {
    const mod = await import(new URL(mech.reference.module, import.meta.url).href);
    refFn = mod[mech.reference.export];
    if (typeof refFn !== 'function') throw new Error('not a function');
  } catch (e) {
    return {
      fatal: true,
      findings: [{
        code: 'REFERENCE_MISSING', mechanism: mech.id, severity: 'fatal',
        detail: `${mech.reference.path} does not export \`${mech.reference.export}\`: ${e.message}. `
          + 'Nothing in this registry can be checked until it does.',
      }],
      checked: {},
    };
  }
  const ref = (b, l) => mech.reference.delivered(refFn, b, l);
  const bodies = [...corpus(limit), ...extra];

  // The reference is the only copy that cannot drift, so where it is readable
  // from matters. A reference that is not on `origin/main` while the prose
  // about it is leaves a reader of `main` with prose alone.
  const refOnMain = onMain(mech.reference.path);
  const siteFiles = [...new Set(mech.sites.map((s) => s.file))];
  if (!refOnMain && siteFiles.some((f) => onMain(f))) {
    findings.push({
      code: 'UNMERGED_REFERENCE', mechanism: mech.id, severity: 'warn',
      detail: `${mech.reference.path} is not on origin/main, but prose about `
        + `${mech.id} is (${siteFiles.filter(onMain).join(', ')}). Until it merges, a `
        + 'reader of main has the summaries and not the executable form, which is the '
        + 'state this gate exists to make visible rather than the state it can fix.',
    });
  }

  const registered = new Set();
  for (const site of mech.sites) {
    const abs = `${REPO}/${site.file}`;
    if (!existsSync(abs)) {
      findings.push({
        code: 'SITE_MOVED', mechanism: mech.id, severity: 'error', site: site.file,
        detail: `${site.file} does not exist. The registry is pointing at prose that moved, `
          + 'so this claim is unchecked rather than passing.',
      });
      continue;
    }
    const lines = readFileSync(abs, 'utf8').split('\n');
    const hs = headings(lines);
    const found = hs.find((h) => h.text === site.heading);
    if (!found) {
      findings.push({
        code: 'SITE_MOVED', mechanism: mech.id, severity: 'error', site: site.file,
        detail: `${site.file} has no heading \`${site.heading.slice(0, 80)}…\`. The section was `
          + 'renamed or removed; re-point or re-classify it, because an unmatched site is '
          + 'silently unchecked.',
      });
      continue;
    }
    registered.add(`${site.file}:${found.i + 1}`);

    if (site.verdict === 'mentions-only') continue;

    const diffs = disagreements(site.model, ref, bodies, limit);

    if (site.verdict === 'states' && diffs.length) {
      const w = diffs[0];
      findings.push({
        code: 'MODEL_DRIFT', mechanism: mech.id, severity: 'error',
        site: `${site.file}:${found.i + 1}`,
        detail: `This section states the rule for ${mech.id} and the rule it states is wrong on `
          + `${diffs.length} of ${bodies.length} bodies. Worst: \`${w.name}\`, a ${w.chars}-character `
          + `body, where the prose predicts ${w.said} characters delivered and `
          + `${mech.reference.path}'s \`${mech.reference.export}\` delivers ${w.actual}, off by `
          + `${w.off > 0 ? '+' : ''}${w.off}. The prose quoted in the registry is: `
          + `"${site.quote}".`,
      });
    }

    if (site.verdict === 'refuted' && !diffs.length) {
      findings.push({
        code: 'CORRECTION_STALE', mechanism: mech.id, severity: 'error',
        site: `${site.file}:${found.i + 1}`,
        detail: 'This section is registered as refuted, and its model now agrees with '
          + `${mech.reference.path} on all ${bodies.length} bodies. Either the reference changed, `
          + 'or the transcription of this claim is wrong, or the refutation recorded beside it is '
          + 'itself false. All three are worth more than a passing gate.',
      });
    }

    if (site.verdict === 'refuted' && site.correctionMarks) {
      const tree = sectionTree(lines, found.i);
      const marked = site.correctionMarks.some((m) => m.test(tree));
      if (!marked && site.correctedIn && revSectionHasMark(
        `origin/${site.correctedIn}`, site.file, site.heading, site.correctionMarks)) {
        findings.push({
          code: 'CORRECTION_UNMERGED', mechanism: mech.id, severity: 'warn',
          site: `${site.file}:${found.i + 1}`,
          detail: `A refuted claim with no correction beside it here, and the correction written `
            + `on origin/${site.correctedIn}. A reader of this checkout gets the wrong rule with `
            + 'nothing next to it. Not a defect in that branch and not fixable from here: it '
            + 'clears when that branch merges.',
        });
      } else if (!marked) {
        findings.push({
          code: 'UNMARKED_REFUTATION', mechanism: mech.id, severity: 'error',
          site: `${site.file}:${found.i + 1}`,
          detail: 'This section states a rule known to be wrong and carries no pointer to the '
            + 'correction, in this checkout or on any branch named in the registry. That is the '
            + 'exact shape a later reader cites in good faith.',
        });
      }
    }
  }

  // Discovery. Everything above only checks prose somebody already registered,
  // which is the half of the problem that was never the problem.
  const candidates = [];
  for (const file of normativeFiles()) {
    const lines = readFileSync(`${REPO}/${file}`, 'utf8').split('\n');
    const hs = headings(lines);
    for (const h of hs) {
      const text = sectionFlat(lines, h.i);
      if (mech.probes.some((p) => p.test(text))) candidates.push({ file, line: h.i + 1, text: h.text });
    }
  }
  for (const c of candidates) {
    if (registered.has(`${c.file}:${c.line}`)) continue;
    findings.push({
      code: 'UNREGISTERED_SITE', mechanism: mech.id, severity: 'error',
      site: `${c.file}:${c.line}`,
      detail: `A normative section mentions ${mech.id} and the registry does not account for it: `
        + `"${c.text.slice(0, 90)}". Either transcribe the rule it states into `
        + 'tools/doc-model/models.mjs so it is executed against the reference, or record it as '
        + '`mentions-only` with the reason it states no rule. Both are cheap; neither is optional, '
        + 'because an unregistered section is how the last one of these got written.',
    });
  }

  // Ownership downgrade, applied last so every check above stays free to
  // state the finding at its true severity and this is the only place that
  // decides what it costs.
  for (const f of findings) {
    if (f.severity !== 'error' || !f.site) continue;
    const path = f.site.split(':')[0];
    if (mineToEdit(path)) continue;
    f.severity = 'warn';
    f.downgradedFrom = 'error';
    f.ownedBy = surfaceSeat(path);
    f.detail += ` Reported rather than fixed: ${path} belongs to the \`${f.ownedBy}\` seat`
      + `${process.env.ASC_SEAT ? ` and this run is \`${process.env.ASC_SEAT}\`` : ' and this run declares no seat'}`
      + ', so the finding goes to that seat by mail and not through this exit code.';
  }

  return {
    findings,
    checked: {
      bodies: bodies.length,
      sites: mech.sites.length,
      transcribed: mech.sites.filter((s) => s.model).length,
      candidates: candidates.length,
      referenceOnMain: refOnMain,
    },
  };
}

/** Markdown files on normative surfaces, excluding anything a record surface
 *  claims. A path matching both is a record: the exemption is the narrower
 *  statement and the one that would otherwise be lost.
 *  @returns {string[]} */
export function normativeFiles() {
  const out = execFileSync('git', ['ls-files', '*.md'], { cwd: REPO, encoding: 'utf8' })
    .split('\n').filter(Boolean);
  return out.filter((p) => isNormative(p) && !isRecord(p));
}

/** @param {string[]} argv */
async function main(argv) {
  const want = argv.includes('--mechanism') ? argv[argv.indexOf('--mechanism') + 1] : null;
  const asJson = argv.includes('--json');
  const extra = argv.includes('--corpus-from-board') ? boardBodies() : [];

  const picked = MECHANISMS.filter((m) => !want || m.id === want);
  if (!picked.length) {
    process.stderr.write(`no mechanism \`${want}\` in tools/doc-model/models.mjs\n`);
    return 2;
  }

  const all = [];
  let fatal = false;
  const summary = {};
  for (const mech of picked) {
    const r = await auditMechanism(mech, extra);
    if (r.fatal) fatal = true;
    all.push(...r.findings);
    summary[mech.id] = r.checked;
  }

  if (asJson) {
    process.stdout.write(`${JSON.stringify({ findings: all, checked: summary }, null, 2)}\n`);
  } else {
    for (const mech of picked) {
      const c = summary[mech.id] || {};
      process.stdout.write(`${mech.id}: ${c.transcribed ?? 0} transcribed claims and `
        + `${(c.sites ?? 0) - (c.transcribed ?? 0)} dismissed, against `
        + `${mech.reference.path}:${mech.reference.export} over ${c.bodies ?? 0} bodies; `
        + `${c.candidates ?? 0} candidate sections found by probe.\n`);
      if (extra.length) process.stdout.write(`  ${extra.length} live board bodies appended to the corpus.\n`);
    }
    if (!all.length) {
      process.stdout.write('\nNo findings. Every stated rule reproduces the reference, every '
        + 'refuted rule still fails against it, and every candidate section is accounted for.\n');
    }
    for (const f of all) {
      process.stdout.write(`\n[${f.severity.toUpperCase()}] ${f.code}`
        + `${f.site ? ` ${f.site}` : ''}\n  ${f.detail.replace(/\n/g, '\n  ')}\n`);
    }
    const errs = all.filter((f) => f.severity !== 'warn').length;
    const warns = all.length - errs;
    const down = all.filter((f) => f.downgradedFrom);
    if (down.length) {
      const by = [...new Set(down.map((f) => f.ownedBy))].sort();
      process.stdout.write(`\n${down.length} finding(s) downgraded to warnings because the surface `
        + `belongs to another seat (${by.join(', ')}): ${down.map((f) => f.site).join(', ')}. `
        + 'Each is owed to that seat as a message. This line exists so the downgrade is '
        + 'countable rather than a quiet pass.\n');
    }
    if (all.length) process.stdout.write(`\n${errs} error(s), ${warns} warning(s).\n`);
  }

  if (fatal) return 2;
  return all.some((f) => f.severity !== 'warn') ? 1 : 0;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main(process.argv.slice(2)).then((c) => process.exit(c));
}
