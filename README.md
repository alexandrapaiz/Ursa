# Ursa

**Turn AI peer-to-peer.**

Ursa is one parent with two products. Ursa Minor trains models on the
world's dispersed knowledge and earns all the revenue. Ursa Major
imports your taste into every model and earns none, permanently, by
design. Neither works without the other.

The full mission text and the principles that bind the project are in
[`docs/vision.md`](docs/vision.md).

## The principles

Four theses, taken from the Ursa Minor site, guide every decision here.

1. **Distributed intelligence.** The information a decision needs is
   dispersed across many individuals. No single observer holds it whole.
2. **Discovery of intelligence.** Generation discovers facts that would
   otherwise stay unknown. If the result could be specified beforehand,
   there would be nothing to discover.
3. **Tacit intelligence.** Much of what people know cannot be stated as
   rules. It shows up only in action, applied to a particular case.
4. **Pretence of intelligence.** Claims of information sufficient for
   central assessment always overreach. Systems built on them conform
   to the measure, not the world.

A central grader breaks the first. A benchmark that demands the spec up
front breaks the second. A stated-preference survey breaks the third. A
metric the system starts conforming to breaks the fourth.

## What the product does

Every session where a person steers an AI through a piece of work is a
fine-tuning session. The person corrects, the agent adapts, and the
person often does not know what they want until they see it. Ursa
Major reads that session after the fact and reverse-engineers the
whys. The finished work and the person's own satisfaction supply the
grade, never the instructions, because instructions mid-session are
guesses.

The core data artifact is the **outcome record**: a finished piece of
work joined backward to every model generation that fed it, with each
span of the final text classified by what happened to it.

| Class | Meaning |
|---|---|
| `survived_verbatim` | generated and kept unchanged |
| `survived_mutated` | kept but edited. The edit is the correction. |
| `generated_deleted` | produced and thrown away |
| `no_generation_provenance` | in the finished work but traceable to no generation. The model was never in the running. |

Two capture paths feed it. Session logs carry the **trace**, which is
where the fine-tuning churns. Git commit pairs carry the **label**, a
generated commit followed by the person's edit of it. A full record
joins both. The reasoning is in
[`docs/beyond-preference-pairs.md`](docs/beyond-preference-pairs.md).

## What is built

`ursa-major/` is a TypeScript package. It has no daemon, no watcher,
and no timer. You select a finished project and launch a run.

```bash
cd ursa-major
npm install
npm test                                   # 25 tests

# Read a project's git history for generated-then-edited commit pairs,
# resolve each pair into an outcome record under <project>/.ursa/,
# and print a summary that leads with what survived.
npx tsx src/bin/ursa.ts run <projectPath> --declare unsatisfied

# Distill one record's corrections into evidence-backed taste units.
# Runs locally through the claude CLI on your own subscription.
npx tsx src/taste/cli.ts distill --record <project>/.ursa/records/<id>.json \
  --taste <project>/.ursa/taste.json --model sonnet

# Render the taste store as a block any model can read.
npx tsx src/taste/cli.ts export --taste <project>/.ursa/taste.json --out taste.md
```

`--declare` records your own verdict on the project's current state.
Without it the record says `undeclared`. Retention is never treated as
acceptance; only the owner's declaration is.

The older session-log path is `src/cli.ts`, which takes `--final` and
`--sessions` flags and produces the same record plus a self-contained
HTML viewer.

| Module | Job |
|---|---|
| `src/pairfinder.ts` | walks git history, identifies agent commits by their `Co-Authored-By` trailer or author pattern, pairs each with the next human edit |
| `src/episodes.ts` | one episode per commit pair; boundaries are explicit, never inferred from idle time |
| `src/resolve.ts` | joins final text to generations and classifies every span |
| `src/signals.ts` | derives correction signals from a record; carries the owner's declaration |
| `src/store.ts` | writes records and the episode index to `<project>/.ursa/` |
| `src/taste/` | distillation into rules and cases, deterministic merge with revocation tombstones, export |

`.ursa/` belongs in the target project's `.gitignore`. Raw records and
the taste store never leave the machine they were made on.

## Trials

| Trial | Subject | Result |
|---|---|---|
| n=1 | Ursa Major run over the building of the Ursa Minor site, from Claude Code session logs | 193 generations, 79.2% of the site survived verbatim, 82.1% of generated characters deleted, four correction loops and three regressions hand-annotated |
| n=2 | the full alexandria repo, 374 commits, from git commit pairs | 19 records from one command, 11 carrying the owner's corrections; the digest is the most-corrected artifact. Owner-declared unsatisfied, so survived text is not endorsed text. |

Raw trial records contain verbatim prompts and are kept in a private
repository. Redacted records return here only after the security
seat's pass and the owner's sign-off.

## Plan

[`docs/design/product-plan.md`](docs/design/product-plan.md) is the
plan of record: architecture with real signatures, exact commands,
on-disk layout, tooling with versions and reasons, milestones with
acceptance tests, the scale architecture, the cross-tool matrix, and
the encouragement mechanics. Where a presentation and the plan
disagree, the plan wins.

Other governance files:

- [`docs/okrs/2026-q4.md`](docs/okrs/2026-q4.md), the quarter's
  objectives and key results
- [`docs/decisions.md`](docs/decisions.md), architecture decision
  records
- [`docs/ideas.md`](docs/ideas.md), the ledger of proposed work
- [`docs/agents/incidents.md`](docs/agents/incidents.md), blameless
  postmortems
- [`docs/allhands/`](docs/allhands/), meeting minutes
- [`docs/presentations/`](docs/presentations/), slide sources

## Operations

Ursa is a portfolio product of
[Alexandra Systems Company](https://github.com/alexandrapaiz/alexandra-systems)
and runs on its agent-seat model. Charters live in `prompts/`,
workflows in `.github/workflows/`, and the standards in
`docs/standards/`. The OKR, PM, and ExO seats are active on a schedule.
The builder seats are dormant until one full governance cycle has been
merged. The owner's merge is the only authority. See
[`docs/agents/org-chart.md`](docs/agents/org-chart.md).

## Constraints that do not move

1. Ursa Major never monetizes the user directly.
2. The user can always see, edit, revoke, and delete what has been
   inferred about them.
3. Raw processing happens on the user's machine. Raw data never touches
   Ursa-operated compute.
4. The software is not the moat. The consenting constellation of users
   is.
