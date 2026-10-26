# Engineer run 2026-10-26 (message) — the third run of the day

Woken by a message event whose payload says PR #458 merged and asks this
seat to continue with the next item in its lane. #458's own description
names two things for the next run, and both are done here.

## Observe

- **Own seat's open PRs, first, per the org rule of 2026-10-04.**
  `gh pr list --state open --limit 100 --json number,headRefName,title,
  updatedAt,isDraft --jq '.[] | select(.headRefName | test("engineer"))'`
  returned nothing. No draft of this seat was left behind by the two
  earlier runs of today: #451 was subsumed by #458 and #458 is merged.
  There is nothing to absorb, ready or close that is not this run's own
  pull request.
- **Sprint.** The newest file in `docs/sprints/` is
  `sprint-2026-10-12.md`, fourteen days old, and
  `docs/sprints/dispatch-queue.md` is dated 2026-10-17. Both of its
  engineer items are finished on `main`, checked rather than assumed:
  item 1's test exists at `ursa-major/src/resolver.test.ts:168`,
  `describe('resolve (survived_verbatim means byte-identical)')`, with
  the case-change and em-dash cases at lines 203 and 204; item 2's
  `RESOLVER_IDENTIFIED` exists at `ursa-major/src/invariants.ts:58`
  with its bound at 214 and its four `push` sites from 846. So there is
  no unfinished sprint item to take, and the charter's fallback applies.
- **Pipeline health.** No `modal` CLI in this environment and no Modal
  deployment in this repository. The charter's step is inherited from
  alexandria and does not apply; observation skipped.
- **Checkout shape, which turned out to be the subject.** This sandbox
  arrived `--depth 1 --single-branch`: `git rev-parse
  --is-shallow-repository` true, `git rev-list --count HEAD` 2,
  `remote.origin.fetch` `+refs/heads/main:refs/remotes/origin/main`.

## Orient

Two items, both break-fixes, which outrank everything under the
charter's Orient section.

1. The ledger entry of 2026-10-26 (hook), "`tools/ensure-full-clone.test.mjs`
   test 13 is red on every unrepaired seat checkout, so its red carries
   no information". Reproduced on this sandbox before touching it:
   `node --test tools/ensure-full-clone.test.mjs`, 17 pass, 1 fail.
2. A second defect of the same class, found by fixing the first:
   `ursa-major/src/regen-commands-runnable.test.ts` is red on a repaired
   checkout and was green all day only because every run that read it
   had an unrepaired one.
3. A third break, found while running the rest of the gates and red on
   `origin/main` at `177b7f6` independently of this branch:
   `node --test tools/ledger/*.test.mjs`, 58 pass / 1 fail.

Plus the housekeeping #458 handed forward: moving the 2026-10-25
`urgent` ledger entry to `built`, which the charter does on the merge
and not before.

## Act — what shipped

| Commit | What it did |
|---|---|
| `tools/ensure-full-clone.test.mjs` | Replaced the ambient subtest with one that compares `--check`'s verdict to the verdict git's own two readings imply, and added the unconditional complete-clone assertion the old one was reaching for. 18 tests becomes 19. |
| `docs/design/clone-completeness.md` | Re-measured guard strength at 19, stated per checkout shape where it differs, and recorded the 19/0-on-both-shapes reading. |
| `docs/ideas.md` | The 2026-10-25 `fixtures:violations:check` entry moves `urgent` to `built`, verified on `main` at `67865dd` before moving it. |
| `ursa-major/src/regen-commands-runnable.test.ts` | Asserts the set of the script's two outputs instead of one of them, plus a shape-independent identity check via `--help`. |
| `docs/ideas.md` | Two craft-scan notes unlabelled from `- First step:` to prose, which is what turns `tools/ledger/block-kinds.test.mjs` green. Not one word of either sentence changed. |
| `tools/ledger/block-kinds.test.mjs` | The failing assertion's message named two causes; the cause that fired was a third. It now names all three and says which to check first. |
| `docs/ideas.md` | Three new entries and the craft scan, appended at the end. |

## Measurements this run took

Every number below was produced in this session, in the shape named.

```
# cwd: repository root
node --test tools/ensure-full-clone.test.mjs
  before, sandbox as it arrived (shallow + single-branch):  17 pass, 1 fail
  after,  same unrepaired shape:                            19 pass, 0 fail
  after,  same checkout repaired:                           19 pass, 0 fail
```

```
# cwd: ursa-major/ , complete checkout
npx vitest run --reporter=json
  before this run's second fix:  993 total, 988 passed, 1 failed,  4 skipped
  after:                         993 total, 989 passed, 0 failed,  4 skipped
# cwd: ursa-major/ inside a --depth 1 --single-branch clone of this branch
npx vitest run --reporter=json
                                 993 total, 983 passed, 0 failed, 10 skipped
```

The six-test gap is all of `src/provenance-index.test.ts`, the staleness
gate on the digest index a buyer follows a `task.resolvedBy.digest`
through. That is the measurement the 2026-10-26 hook entry asked for
before anyone proposes a policy, and it is written up as its own ledger
entry rather than acted on, because that entry's first step is "decide
the policy before writing code".

```
# cwd: repository root
node --test tools/ledger/*.test.mjs
  origin/main at 177b7f6, untouched by this branch:  58 pass, 1 fail
  this branch:                                       59 pass, 0 fail
```

## Every gate, on the merged branch, in both checkout shapes

| Gate | complete checkout | `--depth 1 --single-branch` clone |
|---|---|---|
| `node --test tools/ensure-full-clone.test.mjs` | 19 pass, 0 fail | 19 pass, 0 fail |
| `node --test tools/ledger/*.test.mjs` | 59 pass, 0 fail | 59 pass, 0 fail |
| `node --test tools/stack/integrate.test.mjs` | 8 pass, 0 fail | not run |
| `cd ursa-major && npm test` | 989 passed, 4 skipped, 0 failed | 983 passed, 10 skipped, 0 failed |
| `npx vitest run src/regen-commands-runnable.test.ts` | 23 pass | 23 pass |
| `node tools/secret-scan.mjs` | 1868 files, 16 classes, 0 hits | — |
| `node scripts/redaction-check.mjs` | clean, 3 patterns | — |
| `npm run bundle:check` | current, sha256 `89aa5998…`, 308,181 bytes | — |
| `npm run regen:check` | clean | — |
| `npm run provenance:bundles:check` | 44 versions match history | — |
| `npm run fixtures:violations:check` | 47 of 47 match | — |

## Not done, and why

- **No policy change to what a green `npm test` means.** Measured, not
  decided. The ledger entry now carries a third option the earlier one
  did not name, which is a second reporter rather than a changed exit
  code, and the owner has not accepted any of the three.
- **`tools/ensure-full-clone.sh` is untouched.** Its own `--check`
  output still prints `Run: bash tools/ensure-full-clone.sh`, which has
  the cwd defect #458 described and deliberately left alone because
  other seats' registers quote those lines verbatim. This run agrees
  with that call and did not reopen it.
