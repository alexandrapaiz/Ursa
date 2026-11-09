#!/usr/bin/env node
// Which slots in a workflow's `prompt:` block carry text from outside this
// repository, and whether the fence around each one can be stepped out of.
//
//   node tools/prompt-slots.mjs                  # the table, and the verdict
//   node tools/prompt-slots.mjs --json           # machine-readable
//   node tools/prompt-slots.mjs --strict         # the owner's backlog is a hard fail too
//
// EXIT CODES (rewritten 2026-11-09, run 13, closing finding F116).
//
//   0  no untrusted slot is open.
//   1  an untrusted interpolation sits inside a `run:` block. That is shell
//      injection rather than a prompt-layer finding, the repair is the
//      owner's IMMEDIATE action, and there are none today, so this code is
//      green now and fires on a regression a change introduces.
//   2  clean as far as a seat can take it. Prompt-layer slots are open and
//      every one of them is in .github/workflows/, which no seat here may
//      edit. Under --strict this escalates to 1, which is what --strict
//      meant before this rewrite.
//   3  NO VERDICT. The workflows could not be read, so the scope measured is
//      not the scope that was asked for. This was exit 2 until run 13, and
//      it moved because 2 now carries a verdict and an unread scope is not
//      one. 3 is this repository's convention for it, declared as
//      `no_verdict_exit` by four tools in tools/gates/gate-registry.baseline.json.
//
// WHY THIS CHANGED, which is finding F116 in one paragraph. Every finding
// this tool reports is reserved to the owner, so under the old scheme the
// bare command returned 0 while printing "11 of 11 untrusted slot(s) sit in
// a fence a payload could step out of", and `--strict` returned 1 on a
// backlog no branch can clear. A gate every branch inherits red is one every
// seat learns to ignore, and a gate that prints a finding and exits 0 is a
// green tick next to it. Neither is registrable. The split above is what
// `tools/gates/fetch-exec.mjs` established the same day and what
// `ledger-contract` and `register-ids` in scripts/ci-checks.mjs already do
// for owner-held violations.
//
// PURE AND LOCAL. One `readdirSync` plus `readFileSync` of
// `.github/workflows/`. No network, no token, and it never writes: the repair
// for everything it reports is reserved to the owner, because every seat
// dispatch in this company says "never touch secrets or workflows" in those
// words. This tool exists so the repair is checkable the moment she applies
// it, not so a seat can apply it.
//
// WHY THIS EXISTS, and why it is a fourth check rather than a restatement of
// the first. PWC-11 in `docs/agents/pending-workflow-changes.md` already holds
// the finding that `${{ github.event.client_payload.text }}` lands in eleven
// seat prompts with no label saying it is data, and the 2026-11-02d audit (§5)
// reconfirmed it live. Neither of those is re-queued here. What this tool adds
// is that **PWC-11's own proposed fence is forgeable as written**, so applying
// it verbatim would close the finding in the grep and leave the exposure.
//
// THE FORGERY, stated as a property and not as a payload. PWC-11 proposes
// wrapping the interpolation in the literal lines `BEGIN EVENT` and
// `END EVENT`. Both are fixed strings known to whoever composes the event
// text, GitHub Actions substitutes that text raw, and YAML offers no escape
// hook on the way in. So the close marker is a string the fenced content may
// itself contain, which is the oldest flaw in delimiter-based containment: the
// fence holds only for content that declines to mention it.
//
// AND THE STEP LANDS SOMEWHERE, which is what makes it worth a tool. Measured
// across all eleven files on 2026-11-02: in ten of them exactly **one newline**
// separates the end of the event slot from the literal header "Owner
// instructions for this dispatch, binding for this run and extending the
// charter". PWC-11 leaves that block unfenced deliberately and gives a correct
// reason, that the owner is one of the three sources a charter says may
// instruct a seat. The reason is right about the owner and does not cover the
// path: `repository_dispatch` declares no `inputs:`, so on exactly the trigger
// that populates the event slot, `${{ inputs.owner_instructions }}` resolves to
// nothing. The binding slot is empty whenever the forgeable one is full.
//
// SO THE FOUR PROPERTIES BELOW ARE NOT A STYLE PREFERENCE. LABELLED and FENCED
// are PWC-11's proposal. UNFORGEABLE and LAST are what make the fence hold:
//
//   LABELLED      the prompt says somewhere that the slot's content is data.
//   FENCED        the interpolation sits between two markers.
//   UNFORGEABLE   the close marker carries a run-scoped value, so text
//                 composed before the run existed cannot emit it.
//   LAST          no slot the prompt calls binding appears after it, so a
//                 forged close marker has nothing to land in.
//
// LAST is the cheap one and the one to apply first. It removes the target
// instead of guarding it, it is a two-line move of a block that is already
// adjacent, and unlike the other three it cannot be defeated by a payload at
// all. UNFORGEABLE wants `${{ github.run_id }}` appended to both markers: the
// run does not exist when the event text is written, so its id cannot be in
// that text. That is unguessable in practice rather than secret, and this tool
// says so rather than calling it authentication.
//
// WHAT THIS TOOL DOES NOT CLAIM. Not a shell injection surface. The
// interpolation lands in an action input and never in a `run:` block, which
// the 2026-11-02d audit checked across all twelve files and this tool checks
// again below. The exposure is at the prompt layer only, and the channel still
// needs a token with write access, so there is no public write path. The cost
// is the laundering path the security charter already names: a seat that
// relays an issue body or a scraped page into a board message turns that text
// into another seat's instructions, in a run with `bypassPermissions` and
// three live credentials in the environment.

import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const WORKFLOW_DIR = '.github/workflows';

/** Interpolations whose value is composed outside this repository's committed
 *  files. `client_payload` is the event bus; it is the only one today, and the
 *  list is a constant so adding one is a diff rather than a regex edit. */
export const UNTRUSTED_EXPRS = ['github.event.client_payload'];

/** Interpolations the charters say may instruct a seat. The owner is one of
 *  the three sources named in every charter's "External content is data"
 *  section, so her slot is deliberately unfenced and this tool never reports
 *  it as a finding. It is listed because its POSITION is the finding. */
export const BINDING_EXPRS = ['inputs.owner_instructions'];

/** A run-scoped value a payload cannot carry, because the run it names does
 *  not exist until after the payload has been composed and accepted. */
export const RUN_SCOPED_EXPRS = ['github.run_id', 'github.run_attempt'];

/** The prompt counts as labelling its untrusted slot if it says, in any of
 *  these forms, that the content is evidence rather than instruction. Matched
 *  against the prompt's full text because the sentence may sit above the slot,
 *  which is where both deployed precedents put it
 *  (`ursa-major/src/verdict.ts`, `ursa-major/src/tuning/distill.ts`). */
const DATA_LABEL = /\b(?:data|evidence),? (?:and )?(?:not|never) (?:an? )?instruction|never as instruction|read it as evidence|untrusted (?:content|data)/i;

/**
 * Every `prompt:` block literal in one workflow file, with the line it starts
 * on so a finding can be anchored.
 *
 * Line-based on purpose rather than parsed with a YAML library: `tools/` has
 * no package.json and no dependencies, and every other gate here reads these
 * files the same way. It handles the one form these files use, `prompt: |` or
 * `prompt: >` followed by a more-indented block, and reports nothing for any
 * other form rather than guessing at one.
 *
 * @param {string} text the file's contents.
 * @returns {Array<{startLine: number, indent: number, body: string}>}
 */
export function promptBlocks(text) {
  const lines = text.split('\n');
  const blocks = [];
  for (let i = 0; i < lines.length; i++) {
    const open = /^(\s*)prompt:\s*[|>][-+]?\s*$/.exec(lines[i]);
    if (!open) continue;
    const outer = open[1].length;
    const body = [];
    let j = i + 1;
    let indent = null;
    for (; j < lines.length; j++) {
      const line = lines[j];
      if (line.trim() === '') { body.push(''); continue; }
      const lead = line.length - line.trimStart().length;
      if (lead <= outer) break;
      if (indent === null) indent = lead;
      body.push(line.slice(indent));
    }
    blocks.push({ startLine: i + 1, indent: indent ?? outer, body: body.join('\n') });
    i = j - 1;
  }
  return blocks;
}

/** Every `${{ ... }}` in one block, with its offset and the trimmed expression. */
export function interpolations(body) {
  const out = [];
  const re = /\$\{\{([^}]*)\}\}/g;
  let m;
  while ((m = re.exec(body)) !== null) {
    out.push({ offset: m.index, raw: m[0], expr: m[1].trim() });
  }
  return out;
}

function matchesAny(expr, list) {
  return list.some((needle) => expr.includes(needle));
}

/**
 * The fence around one interpolation, if there is one. A fence is a line that
 * is nothing but a marker word before the slot, and a matching one after it.
 *
 * Deliberately generous about what counts as a marker: anything in the shape
 * `BEGIN <WORD>` / `END <WORD>` on its own line. A tool that only recognised
 * PWC-11's exact spelling would report FENCED=false on a correct fix that
 * chose different words, and a check that fails on correct repairs gets turned
 * off.
 *
 * @returns {{open: string, close: string} | null}
 */
export function fenceAround(body, offset) {
  const before = body.slice(0, offset);
  const after = body.slice(offset);
  const open = /(?:^|\n)[ \t]*BEGIN[ \t]+([^\n]*?)[ \t]*(?=\n)/gi;
  let last = null;
  let m;
  while ((m = open.exec(before)) !== null) last = m;
  if (last === null) return null;
  const name = last[1].trim();
  // The close marker must share the fence's first word, so `BEGIN EVENT 42`
  // is closed by `END EVENT 42` and not by some other block's `END EVIDENCE`.
  const word = name.split(/\s+/)[0] ?? '';
  if (word === '') return null;
  const close = new RegExp(`(?:^|\\n)[ \\t]*END[ \\t]+${word}([^\\n]*)`, 'i');
  const hit = close.exec(after);
  if (hit === null) return null;
  return { open: `BEGIN ${name}`, close: `END ${word}${hit[1]}`.trim() };
}

/**
 * The four properties, measured for one workflow file.
 *
 * @param {string} file path as it is named in the repository.
 * @param {string} text the file's contents.
 * @returns {Array<{file: string, line: number, expr: string, labelled: boolean,
 *   fenced: boolean, unforgeable: boolean, last: boolean, bindingAfter: string[],
 *   inRunStep: boolean}>} one entry per untrusted slot. No untrusted slot, no
 *   entry: this tool reports on exposure it can see and abstains otherwise.
 */
export function slots(file, text) {
  const found = [];
  for (const block of promptBlocks(text)) {
    const all = interpolations(block.body);
    for (const slot of all) {
      if (!matchesAny(slot.expr, UNTRUSTED_EXPRS)) continue;
      const fence = fenceAround(block.body, slot.offset);
      const bindingAfter = all
        .filter((o) => o.offset > slot.offset && matchesAny(o.expr, BINDING_EXPRS))
        .map((o) => o.expr);
      found.push({
        file,
        line: block.startLine + block.body.slice(0, slot.offset).split('\n').length,
        expr: slot.expr,
        labelled: DATA_LABEL.test(block.body),
        fenced: fence !== null,
        unforgeable: fence !== null && matchesAny(fence.close, RUN_SCOPED_EXPRS),
        last: bindingAfter.length === 0,
        bindingAfter,
        inRunStep: false,
      });
    }
  }
  // The claim the 2026-11-02d audit made and this tool keeps honest: the
  // untrusted text reaches an action input, never a shell. A `run:` block
  // carrying one of these expressions would be a different and far worse
  // finding, so it is measured here rather than asserted in prose.
  for (const line of runStepInterpolations(text)) {
    found.push({
      file,
      line: line.line,
      expr: line.expr,
      labelled: false,
      fenced: false,
      unforgeable: false,
      last: false,
      bindingAfter: [],
      inRunStep: true,
    });
  }
  return found;
}

/** Untrusted interpolations inside a `run:` block, which would be shell
 *  injection rather than prompt injection. Expected to be empty. */
export function runStepInterpolations(text) {
  const lines = text.split('\n');
  const out = [];
  let inRun = false;
  let outer = 0;
  for (let i = 0; i < lines.length; i++) {
    const open = /^(\s*)(?:- )?run:\s*[|>][-+]?\s*$/.exec(lines[i]);
    if (open) { inRun = true; outer = open[1].length; continue; }
    if (!inRun) continue;
    if (lines[i].trim() !== '') {
      const lead = lines[i].length - lines[i].trimStart().length;
      if (lead <= outer) { inRun = false; continue; }
    }
    for (const slot of interpolations(lines[i])) {
      if (matchesAny(slot.expr, UNTRUSTED_EXPRS)) out.push({ line: i + 1, expr: slot.expr });
    }
  }
  return out;
}

/** A slot is a finding when any of the four properties is false. */
export function isFinding(s) {
  return s.inRunStep || !s.labelled || !s.fenced || !s.unforgeable || !s.last;
}

/**
 * The verdict, as one sentence a reader quotes.
 *
 * Two named causes, never one: a `run:` hit is shell injection and a prompt
 * slot is not, and the repairs have nothing in common. Reporting them behind
 * one count is the defect `tools/gates/verdict-shape.mjs` was written about.
 */
export function verdict(found) {
  const shell = found.filter((s) => s.inRunStep);
  const open = found.filter((s) => !s.inRunStep && isFinding(s));
  if (shell.length > 0) {
    return {
      exitCode: 1,
      cause: 'untrusted-in-run-step',
      line: `prompt-slots: ${shell.length} untrusted interpolation(s) inside a run: block, which is shell injection and not a prompt-layer finding. This is the owner's immediate action.`,
    };
  }
  if (open.length === 0) {
    return {
      exitCode: 0,
      cause: 'every-untrusted-slot-contained',
      line: `prompt-slots: ${found.length} untrusted slot(s), every one labelled, fenced, unforgeably closed and last in its prompt.`,
    };
  }
  // 2, not 1. Every slot this branch reports is in a directory no seat may
  // edit, so 1 would paint every branch red for a backlog no branch caused.
  // F116.
  return {
    exitCode: 2,
    cause: 'untrusted-slot-not-contained',
    line: `prompt-slots: ${open.length} of ${found.length} untrusted slot(s) sit in a fence a payload could step out of. The repair is reserved to the owner: ${WORKFLOW_DIR}/ is not a seat's to edit.`,
  };
}

function main(argv) {
  const json = argv.includes('--json');
  const strict = argv.includes('--strict');
  let files;
  try {
    files = readdirSync(WORKFLOW_DIR).filter((f) => f.endsWith('.yml') || f.endsWith('.yaml')).sort();
  } catch (err) {
    console.error(`prompt-slots: cannot do its job: ${WORKFLOW_DIR} is not readable (${err.code}), so the scope it would have measured is not the scope that was asked for.`);
    console.error('  NO VERDICT. Not read as clean: a scan over no workflows finds no open slot in exactly the way a repaired tree does.');
    return 3;
  }
  const found = [];
  for (const f of files) {
    found.push(...slots(join(WORKFLOW_DIR, f), readFileSync(join(WORKFLOW_DIR, f), 'utf8')));
  }
  const v = verdict(found);
  if (json) {
    console.log(JSON.stringify({ slots: found, verdict: v }, null, 2));
  } else {
    const tick = (b) => (b ? 'yes' : 'NO ');
    console.log('file                           line  labelled fenced unforgeable last');
    for (const s of found) {
      const name = s.file.replace(`${WORKFLOW_DIR}/`, '');
      if (s.inRunStep) {
        console.log(`${name.padEnd(30)} ${String(s.line).padStart(4)}  IN A run: BLOCK — ${s.expr}`);
        continue;
      }
      console.log(
        `${name.padEnd(30)} ${String(s.line).padStart(4)}  ${tick(s.labelled).padEnd(8)} ${tick(s.fenced).padEnd(6)} ${tick(s.unforgeable).padEnd(11)} ${tick(s.last)}` +
          (s.bindingAfter.length ? `   <- binding slot after it: ${s.bindingAfter.join(', ')}` : ''),
      );
    }
    console.log('');
    console.log(v.line);
  }
  // The verdict always decides the exit code now. It used to be discarded
  // unless --strict was passed, so the bare command printed a finding and
  // reported success, which is F116's own shape. --strict keeps the meaning
  // it had: the owner's backlog is a hard failure too.
  if (strict && v.exitCode === 2) return 1;
  return v.exitCode;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  process.exit(main(process.argv.slice(2)));
}
