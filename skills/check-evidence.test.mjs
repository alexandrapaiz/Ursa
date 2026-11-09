// node --test skills/check-evidence.test.mjs
//
// Covers the 2026-10-18 change to `--update` and nothing else, because that is
// the part with a demonstrated failure behind it: before this change, one bare
// `--update` took the real library from 43 drifted ranges to a green checker
// with nobody reading anything and a zero exit status, which is the same shape
// as the 2026-10-08 incident the lock was built to prevent.
//
// Each test builds a throwaway two-skill library in a temp directory and runs
// the real script against it, so the frontmatter parsing and the lock file
// round-trip are exercised rather than described.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, copyFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

/** The fingerprint the real script writes: the cited lines trimmed, hashed. */
const hash = (text) => createHash('sha256').update(text).digest('hex').slice(0, 16)

const CHECKER = new URL('check-evidence.mjs', import.meta.url).pathname
// The checker imports these; a temp library has to carry them too. Adding one
// and forgetting this line makes every test here fail at exit 1 with a module
// resolution error, which looks identical to the checker reporting a problem;
// that is how the 2026-10-26 run learned the list is load-bearing.
const IMPORTS = ['source-line.mjs', 'citing-files.mjs', 'library-dirs.mjs']
  .map((f) => new URL(f, import.meta.url).pathname)

/** A library with two skills, each citing one line of its own file, and a lock
 *  recording fingerprints for both. `drift` names the skills whose cited line
 *  is changed afterwards, so their recorded fingerprint no longer matches.
 *
 *  `shift` names the skills that drift the other way: a line is inserted above
 *  the cited one, so the citation's line number now covers different text while
 *  the text it cited is still in the file one line down. Both arms are drift to
 *  the lock and the gate below has to tell them apart, so a fixture that can
 *  only produce one of them cannot test the thing. */
function library(drift = [], shift = []) {
  const dir = mkdtempSync(join(tmpdir(), 'check-evidence-'))
  mkdirSync(join(dir, 'src'), { recursive: true })
  mkdirSync(join(dir, 'skills'), { recursive: true })
  copyFileSync(CHECKER, join(dir, 'skills', 'check-evidence.mjs'))
  for (const f of IMPORTS) copyFileSync(f, join(dir, 'skills', f.split('/').pop()))
  const lock = {}
  for (const slug of ['alpha', 'beta']) {
    mkdirSync(join(dir, 'skills', slug), { recursive: true })
    writeFileSync(join(dir, 'src', `${slug}.ts`), `the cited line of ${slug}\nfiller\n`)
    writeFileSync(join(dir, 'skills', slug, 'SKILL.md'), `---
name: ${slug}
description: a fixture
evidence:
  - ref: E1
    what: the cited line
    source: src/${slug}.ts:1
---

A claim [E1].
`)
    lock[`${slug}/E1/src/${slug}.ts:1`] = hash(`the cited line of ${slug}`)
  }
  writeFileSync(join(dir, 'skills', 'evidence.lock.json'),
    JSON.stringify(lock, Object.keys(lock).sort(), 2) + '\n')
  for (const slug of drift)
    writeFileSync(join(dir, 'src', `${slug}.ts`), `a different line of ${slug}\nfiller\n`)
  for (const slug of shift)
    writeFileSync(join(dir, 'src', `${slug}.ts`), `an inserted first line\nthe cited line of ${slug}\nfiller\n`)
  return { dir, lock }
}

const run = (dir, ...args) => {
  try {
    return { status: 0, out: execFileSync(process.execPath, [join(dir, 'skills', 'check-evidence.mjs'), ...args], { cwd: dir, encoding: 'utf8' }) }
  } catch (e) {
    return { status: e.status, out: (e.stdout ?? '') + (e.stderr ?? '') }
  }
}

const lockOf = (dir) => JSON.parse(readFileSync(join(dir, 'skills', 'evidence.lock.json'), 'utf8'))

test('a bare --update over a drifted library refuses and writes nothing', () => {
  // Re-pointed 2026-11-09, second message run of the day: the relocate-anchors
  // assertion moved to the test below. This fixture drifts by replacement, so
  // its cited text is gone rather than moved, and the refusal now names the
  // repair each half wants rather than one route for both.
  const { dir, lock } = library(['alpha'])
  assert.equal(run(dir).status, 1)
  const refused = run(dir, '--update')
  assert.equal(refused.status, 2)
  assert.match(refused.out, /refusing to --update/)
  assert.match(refused.out, /alpha\/E1\/src\/alpha\.ts:1/)
  assert.match(refused.out, /nowhere in the file any more/)
  assert.deepEqual(lockOf(dir), lock, 'the lock is untouched by a refusal')
})

test('a bare --update over a clean library still records everything', () => {
  // The ordinary authoring path, which this change must not disturb.
  const { dir, lock } = library()
  assert.equal(run(dir).status, 0)
  const updated = run(dir, '--update')
  assert.equal(updated.status, 0)
  assert.match(updated.out, /fingerprints recorded: 2 ranges/)
  assert.deepEqual(lockOf(dir), lock)
})

test('a scoped --update records what was named and leaves the rest red', () => {
  // This test is about the scope mechanics and not about the gone-or-moved
  // split, so it names the one range it wants recorded at the granularity the
  // gate asks for. It has been re-pointed twice in one day and the history is
  // the point: the fixture drifted by replacement and a slug covered it, then
  // by relocation because a slug still covered that, and now by relocation
  // named by ref, because as of the second message run of 2026-11-09 a slug is
  // not a name for a drifted range of either kind.
  const { dir, lock } = library([], ['alpha', 'beta'])
  const updated = run(dir, '--update', 'alpha/E1')
  assert.equal(updated.status, 0)
  assert.match(updated.out, /left drifted on purpose/)
  assert.match(updated.out, /beta\/E1\/src\/beta\.ts:1/)
  const after = lockOf(dir)
  assert.notEqual(after['alpha/E1/src/alpha.ts:1'], lock['alpha/E1/src/alpha.ts:1'],
    'the named skill was re-recorded')
  assert.equal(after['beta/E1/src/beta.ts:1'], lock['beta/E1/src/beta.ts:1'],
    'the unnamed skill kept the fingerprint it had, so it stays red')
  // And the checker agrees: one range still failing, the one nobody named.
  const re = run(dir)
  assert.equal(re.status, 1)
  assert.match(re.out, /evidence check FAILED \(1, 1 of them drifted\)/)
  assert.match(re.out, /beta E1/)
})

test('a scope can be a whole lock key, not only a skill slug', () => {
  const { dir, lock } = library(['alpha', 'beta'])
  const updated = run(dir, '--update', 'alpha/E1/src/alpha.ts:1')
  assert.equal(updated.status, 0)
  const after = lockOf(dir)
  assert.notEqual(after['alpha/E1/src/alpha.ts:1'], lock['alpha/E1/src/alpha.ts:1'])
  assert.equal(after['beta/E1/src/beta.ts:1'], lock['beta/E1/src/beta.ts:1'])
})

test('a scope that names nothing drifted is not a way around the refusal', () => {
  // Naming the clean skill must not license re-recording the drifted one.
  const { dir, lock } = library(['alpha'])
  const updated = run(dir, '--update', 'beta')
  assert.equal(updated.status, 0)
  assert.equal(lockOf(dir)['alpha/E1/src/alpha.ts:1'], lock['alpha/E1/src/alpha.ts:1'])
  assert.equal(run(dir).status, 1)
})

test('an --update that records anything says a re-read is owed', () => {
  // The failure this guards, from prompts/skill-extract.md §5o: when cited
  // lines change the checker goes red, and --update is the command that clears
  // the red. The relevance verdict was given to the old lines, so clearing the
  // red erases the only visible sign that a claim needs reading again. The
  // reading half is a different file and nobody runs a tool they do not know
  // about, so the command that hides the signal is the one that has to name it.
  //
  // Scoped by ref rather than by slug because alpha's cited text was replaced
  // rather than moved, and a slug has not been enough for that since
  // 2026-11-09. A re-read being owed is the same either way, which is why this
  // test takes the stricter arm rather than switching to the shifted fixture.
  const { dir } = library(['alpha'])
  const updated = run(dir, '--update', 'alpha/E1')
  assert.equal(updated.status, 0)
  assert.match(updated.out, /A re-recorded range is a claim somebody has to read again/)
  assert.match(updated.out, /relevance-sweep\.mjs --stale/)
  assert.match(updated.out, /relevance-sweep\.mjs --record/)
  // And a refusal does not print it, because nothing was recorded and nothing
  // is owed yet.
  const refused = run(library(['alpha']).dir, '--update')
  assert.equal(refused.status, 2)
  assert.doesNotMatch(refused.out, /has to read again/)
})

// The 2026-11-09 split. A skill slug used to license re-recording every
// drifted range under it, whatever the drift was. On 2026-11-02 a run of this
// seat saw nine drifted ranges in one skill, ran `--update <slug>` before
// reading seven, and four of those seven had stopped pointing at a shifted
// copy of their own text and started pointing at a different section of the
// file. So the gate now sorts a drifted range by whether the lines the lock
// recorded are still somewhere in the file, and only the half that is still
// there stays coverable by a slug. Both arms are drift to the lock, which is
// why the fixture above grew a second one.

test('a slug does not license re-recording a range whose cited text is gone', () => {
  const { dir, lock } = library(['alpha'])
  const refused = run(dir, '--update', 'alpha')
  assert.equal(refused.status, 2)
  assert.match(refused.out, /1 whose cited text is nowhere in the file any more/)
  assert.match(refused.out, /alpha\/E1\/src\/alpha\.ts:1/)
  // And it prints the narrower name the caller has to use, rather than leaving
  // them to work out that a slug is not the only granularity there is.
  assert.match(refused.out, /--update alpha\/E1\b/)
  assert.deepEqual(lockOf(dir), lock, 'the lock is untouched by a refusal')
})

test('naming the ref is the way through, and it is not the same as naming the slug', () => {
  // The escape hatch the refusal above points at. Without this the gate would
  // make a genuinely changed claim unrecordable, which is a gate nobody can
  // satisfy and therefore a gate somebody deletes.
  const { dir, lock } = library(['alpha'])
  for (const scope of ['alpha/E1', 'alpha/E1/src/alpha.ts:1']) {
    const { dir: d, lock: l } = library(['alpha'])
    const out = run(d, '--update', scope)
    assert.equal(out.status, 0, `${scope} is a name the gate accepts`)
    assert.notEqual(lockOf(d)['alpha/E1/src/alpha.ts:1'], l['alpha/E1/src/alpha.ts:1'])
  }
  assert.equal(run(dir, '--update', 'alpha').status, 2, 'the slug still is not')
  assert.deepEqual(lockOf(dir), lock)
})

test('a slug does not license re-recording a range whose cited text has moved either', () => {
  // Re-pointed from 'a slug still covers a range whose text moved rather than
  // changed', 2026-11-09, second message run of the day. The old premise was
  // deliberate and it was measured wrong on the same day it shipped: the
  // argument for it was that nine tenths of a drift batch needs no reading,
  // which is true of the text and false of the anchor. Pointed at the sixteen
  // drifted ranges on main, the gate sorted fifteen as moved and would have
  // re-recorded all fifteen at line numbers no longer holding the claim. The
  // ledger entry carries the batch.
  const { dir, lock } = library([], ['alpha'])
  assert.equal(run(dir).status, 1, 'a shifted range is drift like any other')
  const refused = run(dir, '--update', 'alpha')
  assert.equal(refused.status, 2)
  assert.match(refused.out, /1 whose cited text is still in the file, at a different offset/)
  // The offset the text moved to is the part that makes the refusal actionable
  // rather than a wall, and it is the same number relocate-anchors.mjs writes.
  assert.match(refused.out, /cited text now at src\/alpha\.ts:2/)
  assert.match(refused.out, /relocate-anchors\.mjs/)
  assert.deepEqual(lockOf(dir), lock, 'the lock is untouched by a refusal')
})

test('naming a moved range by ref is a decision the gate accepts, and it still says what moved', () => {
  // The escape has to exist for the moved half too, and it is not a formality.
  // A range whose line numbers are the citation rather than its text is a real
  // case: the caller is saying this claim means these lines and not the text
  // that used to be at them. Naming one range is the act that says a person
  // looked at that range, which is the whole difference from the slug.
  const { dir, lock } = library([], ['alpha'])
  const updated = run(dir, '--update', 'alpha/E1')
  assert.equal(updated.status, 0)
  assert.notEqual(lockOf(dir)['alpha/E1/src/alpha.ts:1'], lock['alpha/E1/src/alpha.ts:1'])
  // Succeeding quietly would hide the one thing worth saying about this case,
  // which is that re-recording the anchor is probably not the repair the drift
  // wanted, and the caller is the person best placed to notice.
  assert.match(updated.out, /which you named by ref/)
  assert.match(updated.out, /cited text now at src\/alpha\.ts:2/)
  assert.match(updated.out, /relocate-anchors\.mjs/)
})

test('a mixed batch is refused as two halves, each with the repair it wants', () => {
  // The mixed case, which is the shape a real drift batch has. Re-pointed
  // 2026-11-09, second message run: the old version asserted that the moved
  // half was not named at all, because a slug covered it. Both halves are
  // refused now, so what the refusal owes a reader is no longer "which one of
  // these" but "which of two repairs for each one", and a caller who cannot
  // tell them apart falls back to naming every ref, which is the name-them-all
  // habit the refusal exists to replace.
  const { dir, lock } = library(['alpha'], ['beta'])
  const refused = run(dir, '--update', 'alpha', 'beta')
  assert.equal(refused.status, 2)
  assert.match(refused.out, /2 drifted ranges named by no ref/)
  assert.match(refused.out, /1 whose cited text is still in the file, at a different offset/)
  assert.match(refused.out, /1 whose cited text is nowhere in the file any more/)
  // Each key appears under its own half, and only there.
  const movedHalf = refused.out.split('still in the file, at a different offset')[1].split('nowhere in the file')[0]
  assert.match(movedHalf, /beta\/E1\/src\/beta\.ts:1/)
  assert.doesNotMatch(movedHalf, /alpha\/E1/)
  const goneHalf = refused.out.split('nowhere in the file any more')[1]
  assert.match(goneHalf, /alpha\/E1\/src\/alpha\.ts:1/)
  assert.doesNotMatch(goneHalf, /beta\/E1/)
  assert.deepEqual(lockOf(dir), lock, 'nothing is written, including the half that is only an anchor')
  // Named by ref, both go through in one command. The moved half would
  // ordinarily go to relocate-anchors.mjs instead; this asserts the gate is
  // satisfiable, not that this is the repair to reach for.
  const out = run(dir, '--update', 'alpha/E1', 'beta/E1')
  assert.equal(out.status, 0)
  const after = lockOf(dir)
  assert.notEqual(after['alpha/E1/src/alpha.ts:1'], lock['alpha/E1/src/alpha.ts:1'])
  assert.notEqual(after['beta/E1/src/beta.ts:1'], lock['beta/E1/src/beta.ts:1'])
  assert.equal(run(dir).status, 0)
})

test('a gone range outside the named scope is left red rather than refused', () => {
  // The boundary of the refusal. Out of scope means untouched, so an unreadable
  // range nobody named keeps the value the lock holds and stays red on its own
  // account. Refusing on it would force a run to resolve the whole library
  // before it could record one range, which is the quadratic shape the scope
  // was introduced to avoid. Re-pointed to name beta by ref, 2026-11-09 second
  // message run, for the reason the two tests above carry; the boundary this
  // test is about is the scope filter and not the granularity.
  const { dir, lock } = library(['alpha'], ['beta'])
  const out = run(dir, '--update', 'beta/E1')
  assert.equal(out.status, 0)
  assert.match(out.out, /left drifted on purpose/)
  assert.match(out.out, /alpha\/E1\/src\/alpha\.ts:1/)
  assert.equal(lockOf(dir)['alpha/E1/src/alpha.ts:1'], lock['alpha/E1/src/alpha.ts:1'])
  assert.equal(run(dir).status, 1, 'alpha is still red, and on its own account')
})

test('a bare --update hears the same two halves a slug does, because there is one refusal now', () => {
  // Re-pointed from 'a bare --update is still caught by the first refusal, not
  // the second', 2026-11-09 second message run. There were two refusals and
  // their order was asserted here, on the argument that a bare command should
  // hear "you named nothing" rather than "one of these is unreadable", because
  // the latter invites naming that one and running the bare command again.
  // That argument is answered rather than abandoned: the one refusal names
  // every range and the repair each wants, so there is nothing left to invite.
  // The set the first refusal caught was a subset of the second's all along,
  // since naming by ref implies naming, so collapsing them changed no exit
  // status. What it changed is that the bare command used to end by printing
  // `--update <slug>` as the way through, and under this rule that is a
  // command the gate would then refuse.
  const { dir, lock } = library(['alpha'], ['beta'])
  const out = run(dir, '--update')
  assert.equal(out.status, 2)
  assert.match(out.out, /named by no ref/)
  assert.match(out.out, /still in the file, at a different offset/)
  assert.match(out.out, /nowhere in the file any more/)
  // A bare slug and nothing else. `\b` is not the boundary here, because it
  // matches before the slash of `alpha/E1`, which is the name the gate accepts.
  assert.doesNotMatch(out.out, /--update alpha\s*$/m, 'it never prescribes the slug it would refuse')
  assert.doesNotMatch(out.out, /--update beta\s*$/m)
  assert.deepEqual(lockOf(dir), lock)
})

test('a range the lock never recorded is not sorted by the split at all', () => {
  // The split reads lock[key], so a key with no lock row has nothing to search
  // for. That is the new-citation path, which the checker already reports as an
  // authoring debt, and an --update over it has always been the way to pay it.
  // Asserting it here because a split keyed on a lookup that can miss is one
  // `undefined` away from hashing every window of every file against nothing.
  const { dir } = library()
  const lock = lockOf(dir)
  delete lock['alpha/E1/src/alpha.ts:1']
  writeFileSync(join(dir, 'skills', 'evidence.lock.json'),
    JSON.stringify(lock, Object.keys(lock).sort(), 2) + '\n')
  assert.equal(run(dir).status, 1)
  const out = run(dir, '--update', 'alpha')
  assert.equal(out.status, 0, 'a missing fingerprint is paid by recording it, as before')
  assert.doesNotMatch(out.out, /anywhere in the file/)
  assert.ok('alpha/E1/src/alpha.ts:1' in lockOf(dir))
})

// The 2026-10-23 widening: a citation lives in any markdown file of a skill
// directory, not only in SKILL.md. Before it, the ten `[E…]` tags in the first
// draft of one TRIGGER-TEST.md were invisible to this checker and to the
// relevance sweep, and both exited 0 over all ten, which is a receipt nothing
// fingerprints. skills/citing-files.mjs carries the account.

/** Write a sibling file into one skill's directory. */
const sibling = (dir, slug, name, text) =>
  writeFileSync(join(dir, 'skills', slug, name), text)

test('a trigger test citing an undeclared ref fails, and says which file', () => {
  const { dir } = library()
  sibling(dir, 'alpha', 'TRIGGER-TEST.md', 'Near miss 1 turns on the threshold [E9].\n')
  const out = run(dir)
  assert.equal(out.status, 1)
  assert.match(out.out, /alpha: TRIGGER-TEST\.md cites E9, not declared/)
})

test('a ref cited only in a trigger test counts as cited and is still fingerprinted', () => {
  // The other direction of the same rule. An uncited ref fails deliberately,
  // since it is a receipt for a claim the skill does not make, and a claim
  // made in the activation test is a claim the skill makes.
  const { dir } = library()
  const skill = join(dir, 'skills', 'alpha', 'SKILL.md')
  writeFileSync(skill, readFileSync(skill, 'utf8')
    .replace('A claim [E1].', 'A claim with no tag on it.'))
  const without = run(dir)
  assert.equal(without.status, 1)
  assert.match(without.out, /alpha: E1 declared but never cited/)
  sibling(dir, 'alpha', 'TRIGGER-TEST.md', 'Prompt 1 asks about the cited line [E1].\n')
  const withIt = run(dir)
  assert.equal(withIt.status, 0)
  // And the fingerprint is unaffected either way: it follows the declaration
  // in the frontmatter, not the file the citation sits in.
  assert.ok('alpha/E1/src/alpha.ts:1' in lockOf(dir))
})

test('a tag in a file no tool reads is reported rather than counted', () => {
  // The residual the widening leaves: `.md` is now read, and a tag in a
  // fixture or a note beside it would be exactly as green and exactly as
  // empty. Two shapes, a sibling file and one nested a directory down.
  const { dir } = library()
  sibling(dir, 'alpha', 'notes.txt', 'the reasoning for prompt 2 [E1]\n')
  mkdirSync(join(dir, 'skills', 'alpha', 'cases'), { recursive: true })
  writeFileSync(join(dir, 'skills', 'alpha', 'cases', 'one.json'), '{"why": "[E1]"}\n')
  const out = run(dir)
  assert.equal(out.status, 1)
  assert.match(out.out, /alpha: notes\.txt cites E1, and nothing reads that file/)
  assert.match(out.out, /alpha: cases\/one\.json cites E1, and nothing reads that file/)
})

test('a skill directory with no stray tags is unaffected', () => {
  // The ordinary case, asserted so the stray scan cannot start charging the
  // library for files that cite nothing.
  const { dir } = library()
  sibling(dir, 'alpha', 'TRIGGER-TEST.md', 'Five prompts, reasoning per prompt.\n')
  sibling(dir, 'alpha', 'notes.txt', 'no tags here\n')
  assert.equal(run(dir).status, 0)
})

// --base: the same library read against another git tree. These exist because
// the flag's whole claim is that "the evidence check is green" has a tense in
// it, and a flag that answers the wrong tense silently is worse than no flag.
// Each test commits the fixture library, then changes the working tree, so the
// two answers genuinely disagree.

/** The fixture library, clean, committed on a branch called `trunk`. Drift is
 *  applied afterwards by `driftAfterCommit`, so the committed tree and the
 *  working tree really can disagree; committing a drifted library would leave
 *  both trees saying the same thing and the tests would prove nothing. */
function committed() {
  const made = library()
  const git = (...args) => execFileSync('git', args,
    { cwd: made.dir, stdio: 'ignore', env: { ...process.env, GIT_AUTHOR_NAME: 't', GIT_AUTHOR_EMAIL: 't@t', GIT_COMMITTER_NAME: 't', GIT_COMMITTER_EMAIL: 't@t' } })
  git('init', '-q', '-b', 'trunk')
  git('add', '-A')
  git('commit', '-q', '-m', 'library')
  return made
}

/** Change a skill's cited line in the working tree only. */
const driftAfterCommit = (dir, slug) =>
  writeFileSync(join(dir, 'src', `${slug}.ts`), `a different line of ${slug}\nfiller\n`)

test('--base reads the cited lines out of that tree, not the checkout', () => {
  // Committed clean, then alpha's cited line is changed on disk only. The
  // checkout is drifted and `trunk` is not, so the two answers must differ.
  const { dir } = committed()
  driftAfterCommit(dir, 'alpha')
  const here = run(dir)
  assert.equal(here.status, 1)
  assert.match(here.out, /alpha\/E1|alpha E1/)
  const there = run(dir, '--base', 'trunk')
  assert.equal(there.status, 0, 'trunk still carries the lines the lock recorded')
  assert.match(there.out, /evidence check OK in trunk/)
})

test('--base names the tree in the failing line too, and says the merge owes the fix', () => {
  // The inverse: the checkout is right and the base tree is not, which is the
  // case the flag exists for. A receipt green here that a reader on the base
  // tree would follow to other lines.
  const { dir } = committed()
  driftAfterCommit(dir, 'alpha')
  run(dir, '--update', 'alpha/E1')
  assert.equal(run(dir).status, 0, 'the checkout is green after re-recording')
  const there = run(dir, '--base', 'trunk')
  assert.equal(there.status, 1)
  assert.match(there.out, /evidence check FAILED in trunk/)
  assert.match(there.out, /resolves in this checkout and not in the base tree/)
})

test('--base and --update are refused together, and the lock is untouched', () => {
  // Re-recording from a tree nobody has checked out would write a lock
  // describing content this run cannot read.
  const { dir, lock } = committed()
  driftAfterCommit(dir, 'alpha')
  const out = run(dir, '--base', 'trunk', '--update', 'alpha')
  assert.equal(out.status, 2)
  assert.match(out.out, /cannot be combined with --update/)
  assert.deepEqual(lockOf(dir), lock)
})

test('a ref this clone cannot resolve is an abstention, not a library failure', () => {
  // §5v. A single-branch or shallow clone has no `origin/main`, and resolving
  // nothing would make all 437 citations look missing at exit 1, which reads
  // as the library being broken.
  const { dir } = committed()
  const out = run(dir, '--base', 'origin/main')
  assert.equal(out.status, 2, 'exit 2 is "I could not look", not "it is broken"')
  assert.match(out.out, /cannot resolve that ref/)
  assert.doesNotMatch(out.out, /evidence check FAILED/)
})

test('--base wants a ref, and a bare --base does not silently read the checkout', () => {
  const { dir } = committed()
  for (const args of [['--base'], ['--base=']]) {
    const out = run(dir, ...args)
    assert.equal(out.status, 2)
    assert.match(out.out, /--base wants a git ref/)
  }
})

test('the ref of --base is not read as an update scope', () => {
  // `--base trunk` filtered as a positional would have made `trunk` a scope,
  // which is how a read-only question becomes a write.
  const { dir, lock } = committed()
  driftAfterCommit(dir, 'alpha')
  driftAfterCommit(dir, 'beta')
  const out = run(dir, '--base', 'trunk')
  assert.equal(out.status, 0, 'trunk is clean, so the answer about trunk is green')
  assert.deepEqual(lockOf(dir), lock, 'a --base run writes nothing')
})

test('a citation with no recorded fingerprint is not a --base finding', () => {
  // A ref written on this branch is newer than the base tree by construction.
  // Reporting that as an authoring debt would make every new citation look
  // like a merge hazard.
  const { dir } = committed()
  const lock = lockOf(dir)
  delete lock['alpha/E1/src/alpha.ts:1']
  writeFileSync(join(dir, 'skills', 'evidence.lock.json'),
    JSON.stringify(lock, Object.keys(lock).sort(), 2) + '\n')
  assert.equal(run(dir).status, 1, 'the checkout still owes the fingerprint')
  const there = run(dir, '--base', 'trunk')
  assert.equal(there.status, 0)
  assert.match(there.out, /evidence check OK in trunk/)
})
