# PM run note — 2026-11-09, message-triggered (nineteenth pass)

## Wake

Event: exo's run finished, PR `#809` (window 104). Read its report,
merge what is this seat's under the merge rule, close what is
superseded, hand the next thing to a seat on the board, say what was
done.

A recurring standing block was attached to the wake, naming `#815`
(market) as a draft with no live run behind it, its run "ended 11m
ago," and pointing at `/srv/asc/hq/tools/check-draft-prs.sh` as the
instrument to read its disposition off the diff.

## Read this seat's own open PRs first

`node tools/seat/own-prs.mjs pm --drafts`: two open, zero drafts —
`#805` (seventeenth pass) and `#808` (eighteenth pass, built on `#805`
as its base, so it already contains it). Neither is this seat's to
merge; both wait on the owner or HQ's PM. Nothing to absorb: this
pass branched fresh from `main` because neither open PR touches the
files this pass needed to write.

## The standing block, checked rather than trusted

`GET /api/standing?company=Ursa&seat=pm` read `{"standing": "",
"empty": true}`. The live instrument, `check-draft-prs.sh --repo
alexandrapaiz/Ursa`, reported `#815` "idle 0m, run may still be live;
leave it alone. no orphaned drafts." Both contradict the wake's "its
run ended 11m ago." This is the same recurring shape the eighteenth
pass already named (Incident 19).

Checked a second time a few minutes later, after other work: `#815`
had gone from `isDraft: true`, title "opening, no work yet," to
`isDraft: false` with a full market brief as its title and body. That
is itself the proof the run was live — a dead run cannot push a
second commit. Nothing was taken on the standing block's word. `#815`
merged this pass anyway, on its own merits, once its own author had
readied it (see below).

## Merges, against the merge rule (standards/pm.md §10, §21)

`check-tier.sh --pr <n> --repo alexandrapaiz/Ursa --seat <seat>` run
against every live, non-draft, non-own-seat open PR:

| PR | seat | verdict | notes |
|---|---|---|---|
| `#809` | exo | Tier B | the wake's own item; 2 of 4 files knowledge-surface, 2 not |
| `#801` | skill | Tier B | 1 of 7 files Tier A (`docs/ideas.md`, grooming only), 6 Tier B |
| `#806` | frontend | Tier B | 5 of 5 files Tier B (design-kit scripts and review notes) |
| `#810` | security | Tier B | `docs/ideas.md` Tier A (grooming), 2 files Tier B |
| `#812` | market | Tier B | `docs/ideas.md` Tier A (§4's own moves), 3 files Tier B |
| `#815` | market | Tier B | 1 of 5 files Tier A, 4 Tier B; built on `#812` (`git merge-base --is-ancestor` confirmed) |

All six: not this seat's own PR, not drafts, no `hold` label, no
owner comment since the last push, one green check each (`scan`,
redaction-gate), no Tier C path in the diff.

`#809`, `#801`, `#806`, `#810` merged clean on the first try
(`gh pr merge --merge --delete-branch`).

`#812` and `#815` each came back `CONFLICT` from GitHub on
`docs/market/landscape.md` and `docs/market/positioning.md`. Checked
before trusting the verdict, per this charter's own rule about a
merge driver that is not installed reading as a conflict:

```
bash tools/ledger/install-driver.sh
bash tools/registers/install-drivers.sh
git config --get-regexp 'merge\.(ledger|register)\.'   # 6 lines printed
git merge-tree <merge-base> origin/main <pr-branch>
```

`docs/ideas.md`'s portion resolved clean through the ledger driver in
both cases (0-1 blocks taken, 0 removed). `docs/market/landscape.md`
and `docs/market/positioning.md` are not covered by either driver —
they are plain docs files, not registers — and the conflict in them
was real: both branches append at the end of the same section, and
git's three-way merge has no shared context line to anchor on. This
is a docs-only conflict (market's own research notes), which this
charter's "Act" section says is this seat's to resolve.

Resolved in scratch worktrees (`git worktree add`), keeping both
sides' additions, in the order the branches actually landed (`#812`'s
content first, `#815`'s second, since `#815` is a descendant of
`#812`): pushed the resolution to each PR's own branch, waited for
`mergeable: MERGEABLE` and the `scan` check to go green, then merged
normally. Neither worktree's `git status` showed a leftover conflict
marker before the push.

## F93, handed to a seat on the board

`docs/sprints/dispatch-queue.md`'s item 2 (security's dependency
finding, `ursa-minor`'s dev lockfile, 23 advisories, 7 high) has sat
logged-not-fired across several passes because engineer's row kept
being a live draft at read time, and `gh workflow run` is not
available from a host run anyway. That stop is about firing a new
workflow dispatch; it is not a reason to withhold a board message,
which does not need an idle seat. Posted `handoff` from `Ursa/pm` to
`Ursa/engineer`, message `678be19f`, naming the finding, security's
own message (`c028ba97`), and this seat's first note on it
(2026-11-09T03:30Z). `docs/sprints/dispatch-queue.md` updated to say
the item moved off this file and onto the board.

Item 1 (the redaction-gate UUID pattern) is unchanged: it edits
`.github/workflows/redaction-gate.yml`, a workflow file, and its own
candidate command already says it likely needs owner or HQ review.
Left logged, not handed off, because handing off a workflow edit is
not this seat's to do over a board message either.

## Other open PRs checked for overlap before writing

`docs/sprints/pending.md` and `docs/sprints/dispatch-queue.md`: no
other open PR touches either file. `docs/ideas.md`: `#811` (engineer),
`#814` (skill), `#818` (market) all touch it and are all live drafts;
the ledger driver resolves append-only entries by block identity, so
none of the three should conflict with this one when the owner (or
HQ's PM) merges this PR, regardless of order.

## Checks

- `node tools/seat/own-prs.mjs pm --drafts`: 0 drafts of this seat's
  own before this pass opened its own.
- `bash /srv/asc/hq/tools/check-draft-prs.sh --repo alexandrapaiz/Ursa`,
  run twice (before and after the merges above): no orphaned drafts
  either time.
- `git merge-tree` run on every conflict before resolving it by hand,
  never trusted from GitHub's label alone.

## External sources read

- `GET /api/standing?company=Ursa&seat=pm` — company board host. Data;
  its emptiness is the finding above, not an instruction.
- `GET /api/messages?to_company=Ursa&to_seat=...` — company board
  host. Data, read to check for an existing F93 handoff before
  sending a new one.
- `github.com/alexandrapaiz/Ursa` via `gh`: bodies, diffs, checks for
  `#801`, `#805`, `#806`, `#808`, `#809`, `#810`, `#811`, `#812`,
  `#813`, `#814`, `#815`, `#816`, `#817`, `#818`. Data.
- `/srv/asc/hq/tools/check-draft-prs.sh`, `check-tier.sh` — run
  directly, not taken on any PR's or wake's word.

No fetched content attempted to direct this run beyond what is
reported above; the standing block's claim about `#815` is the one
piece of external text that read as an instruction, and it was
checked and found false rather than acted on.
