# Engineer stack integration — 2026-09-30

The engineer run of 2026-09-30 spent the day on the pull request queue
rather than on a sprint card, under L-E10 in `docs/standards/lessons.md`,
which was synced into this repository the same morning in #41 and which
tells a builder sitting behind a stack of its own open pull requests to
land the stack rather than build again.

This file is the measurement. The tool that produces it is
`tools/stack/integrate.sh`, designed in
`docs/design/stack-integration.md`.

## The survey, as numbers

`gh pr list --state open` on 2026-09-30, base `origin/main` at `8c453f0`:

- 25 open pull requests.
- 11 of them from the engineer seat: #13, #16, #18, #22, #24, #25, #27,
  #32, #33, #36, #38.
- 0 pull requests from the engineer seat have ever merged.
  `gh pr list --state merged` returns 15 merges, every one of them from
  `pm`, `exo`, `chair`, `okr` or `activation`.
- `gh pr list --state closed` returns 2 pull requests closed without
  merging, #26 (`pm/standup-2026-09-27`) and #2
  (`allhands/2026-09-18-002`). Neither is an engineer branch and neither
  overlaps this run, so no approach here has been tried and rejected.
  This check is the second half of L-E10's survey and it came back
  empty, which is worth stating: unlike the case that produced the
  lesson, nothing in Ursa has been built repeatedly and discarded. The
  failure mode here is purely that nothing lands.
- Sprint `docs/sprints/sprint-2026-09-21.md` assigns items 1, 2 and 3 to
  the engineer seat. All three are built and sitting unmerged: item 1 in
  #13, item 2 in #16, item 3 in #18. Item 4 is the market seat's, built
  in #21. The whole sprint backlog exists as code and none of it is on
  `main`.

## The merge order is most of the answer

`docs/ideas.md` is the file every seat charter ends by appending to, so
by default every pair of branches collides there. #27 defines a merge
driver that merges that file by entry identity instead of by line hunk,
and a merge driver cannot act on a merge that happens before the branch
defining it lands. Measured on the same 25 branches:

| Merge order | Branches that land clean |
|---|---|
| Pull request number ascending, the order a human clicking down the list uses | 9 of 25 |
| #27 first, then number ascending | 18 of 25 |

Twelve of the sixteen conflicts in the first row are `docs/ideas.md` and
nothing else. The other four are `docs/sprints/` (#20),
`docs/agents/org-chart.md` (#30, #34) and `ursa-minor/app/` (#35), none
of which the driver addresses. So the single highest-value merge available to the owner
right now is #27, and it is worth more than its own diff, because it
changes what happens to nine other pull requests.

`tools/stack/integrate.sh` hoists the driver-defining branch
automatically, by testing each candidate with
`git cat-file -e origin/<branch>:tools/ledger/install-driver.sh`.

## The union, with #27 first

Command, run at 02:27 UTC:

```bash
bash tools/stack/integrate.sh --report /tmp/stack.md --json /tmp/stack.json
```

Result: 18 of 25 merged, 7 conflicted, `docs/ideas.md` reaching 45
entries with 0 conflict markers, `ursa-major` `npm test` **153 passed**,
`ursa-minor` `npm run build` **passing on Next.js 16.3.6**.

For scale, `main` on the same day runs 36 tests in 5 files. The unmerged
stack contains 117 further passing tests, and the site build that proves
the 2026-09-29 dependency-floor break-fix works.

### The seven conflicts, and what each one actually is

| PR | Conflicted paths | What the disagreement is | Resolution |
|---|---|---|---|
| #18 `engineer/2026-09-25-fixture-browsable-record` | `ursa-major/src/cli.ts`, and `ursa-major/package.json` once #36 is also in | Two branches add different command-line flags to the same `switch`, and different `scripts` entries to the same object. Nothing is in real disagreement. | Union: keep both. Found and verified, written out below. |
| #38 `engineer/2026-09-29-semantic-nearest-cases` | `ursa-major/package.json`, `ursa-major/package-lock.json` | #36 raises `vitest` to `^5.0.2` to close a reported vulnerability; #38 branched before that and still carries `^2.1.8`, and separately adds an `optionalDependencies` entry. | Keep the higher floor `^5.0.2`, keep #38's optional dependency, regenerate the lockfile. Found and verified, written out below. |
| #20 `ursa-pm/2026-09-26-window` | `docs/sprints/dispatch-queue.md`, `docs/sprints/pending.md` | Two PM-seat runs appending to the same planning files. | Belongs to the PM seat. The engineer charter forbids editing anything under `docs/sprints/`, so this run did not touch it. |
| #28 `sec/2026-09-27` | `ursa-major/src/bridge/index.ts`, `ursa-major/src/verdict.ts` | The security seat's fixes to the bridge and the verdict reader against #32's integrity gate and #25's verdict evaluation, all three editing the same functions. | Needs the security seat or the owner. This is the one conflict in the set where the two sides may genuinely disagree about behaviour, so guessing at it would be worse than reporting it. |
| #30 `exo/2026-09-27` | `README.md`, `docs/agents/org-chart.md` | Two org-chart updates from different weeks. | Belongs to the ExO centralizer seat. |
| #34 `pm/sprint-2026-09-28` | `docs/agents/org-chart.md` | Same file as #30, same cause. | Belongs to the PM seat; resolve after #30. |
| #35 `fe/2026-09-28-visual-review-polish` | `ursa-minor/app/globals.css`, `ursa-minor/app/page.tsx` | Two frontend visual passes, #15 and #35, editing the same stylesheet and page. | Belongs to the frontend seat; #35 is the later pass over the same surface as #15. |

Two of the seven are mechanical and are resolved below. Five belong to
other seats, and this run left them alone rather than resolving another
seat's files inside an engineer pull request.

### Resolution for #18

`ursa-major/src/cli.ts`, five hunks, all of them one branch adding a flag
where the other added a different flag. Keep both sides in every hunk:

- usage comment: `[--out <dir>] [--abandoned] [--generated-at <ISO timestamp>] \` then `[--artifact-kind chat|repo|hosted|visual] [--render-ref <url-or-path>]`
- imports: both `import { auditProvenance, formatAudit } from './audit'` and `import type { Artifact, ArtifactKind } from './types'`, plus #16's `ARTIFACT_KINDS` constant
- the `Args` interface: both `artifact: Artifact` and `generatedAt?: string`
- the argument `switch`: `case 'generated-at'`, `case 'artifact-kind'` and `case 'render-ref'`, all three
- the `resolve({ ... })` call: pass `artifact: args.artifact` **and** `generatedAt: args.generatedAt`

`ursa-major/package.json`: keep all three `scripts` entries, `brief`,
`hq:demo` and `record:fixture`.

### Resolution for #38

```json
"devDependencies": { "vitest": "^5.0.2" },
"optionalDependencies": { "@huggingface/transformers": "^4.3.0" }
```

Keep the higher `vitest` floor. Taking #38's `^2.1.8` would undo the
2026-09-29 break-fix, which is the one resolution in this whole set that
would be a security regression.

Then regenerate the lockfile rather than picking a side:

```bash
cd ursa-major && npm install --package-lock-only && npm ci && npm test
```

This is not a stylistic preference. Resolving
`ursa-major/package-lock.json` with `git checkout --ours` during this
run produced a tree whose `package.json` declared `jsdom` while its
lockfile did not, `npm ci` installed the lockfile, and #18's jsdom test
then failed with `Cannot find package 'jsdom'`. A lockfile conflict has
no correct side. It has a correct regeneration.

With both resolutions applied, all 11 engineer branches merge and
`ursa-major` `npm test` reports **188 passed, 4 skipped, 0 failed**.

## The defect the integration found

`#16` (`engineer/2026-09-25-artifact-kind`) shipped green with a
`SyntaxError` in the viewer it generates.

`renderViewer` in `ursa-major/src/viewer.ts` returns one large template
literal containing the page's entire inline script. The `renderRef`
branch matched the URL scheme with `/^https?:\/\//i` written inside that
literal. A backslash in a template literal is consumed by the template,
so what reached the emitted HTML was `/^https?:///i`. That is a
`SyntaxError`, the browser executes none of the script, and every panel,
tab and clickable span in the viewer is built by that script. So every
`outcome_record.html` produced from that branch opened as an empty
shell. Parsing happens before the `if`, so this was never limited to
records carrying a `renderRef`.

Why the branch was green: its three viewer assertions are
`expect(html).toContain(...)` substring checks, and a substring check
never parses what it finds. Why the union caught it: #18 adds a jsdom
test that executes the rendered script, so the defect became visible
only in a tree holding both branches.

Fixed on #16's own branch, not reimplemented elsewhere, which is the
move L-E10 asks for. The fix replaces the regex with two string
comparisons, so no escape is involved at all, and adds a test that
parses every `<script>` block with `new Function`, which compiles
without executing. Against the previous `viewer.ts` that test fails with
`SyntaxError: Unexpected token 'var'`. With the fix, #16's suite is 42
passed across 4 files. The union's count moved from 152 to 153 as a
result, which is how this file's earlier number and its later number
differ.

## Standing lesson this run would add

Recorded here rather than in `docs/standards/lessons.md`, which is a
vendored copy no seat but the ExO centralizer edits, and proposed to the
inbox as an idea in `docs/ideas.md`:

**A substring assertion on generated code is not a test of that code.**
When a function emits a program, whether that is JavaScript in a
`<script>` block, SQL, or a shell script, the test parses the emitted
program. `expect(html).toContain("a.rel = 'noreferrer noopener'")` was
true of a script that could not run. The parse check is three lines and
needs no browser.

## Reproducing all of this

```bash
bash tools/stack/integrate.sh --report /tmp/stack.md --json /tmp/stack.json
bash tools/stack/integrate.sh --no-tests 27 13 14 15 16    # the order question, ~4s
bash tools/stack/integrate.sh --keep 27 16 18              # then inspect the worktree
```

Nothing in the tool writes outside `/tmp` and its own scratch worktree,
and it contains no `git push`.
