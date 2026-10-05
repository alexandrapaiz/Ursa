# fixtures/real — one outcome record made from real git history

`ursa-main-4d5e401.json` is a record `ursa run` produced from a fresh
clone of this repository's own public `main`, not from synthetic input.
It exists because the invariant gate in `src/invariants.ts` was written
after a defect that every synthetic fixture passed and that only
appeared on real history: on 2026-10-04 a run over this repository
printed more characters surviving verbatim than were ever generated, in
all six of its records, with 344 tests green.

A gate that is only exercised against fixtures it was designed beside
is a gate that proves its author's assumptions. This one is exercised
against a record nobody shaped.

## Provenance

| Field | Value |
|---|---|
| Source repository | `https://github.com/alexandrapaiz/Ursa` (public) |
| Clone head at capture | `0d68df0`, "Merge pull request #73 from alexandrapaiz/pm/standup-2026-10-04" |
| Episode | generated commit `19f6535` (PM standup 2026-09-26), human edit `9e017a9` |
| File under provenance | `docs/sprints/dispatch-queue.md` |
| Captured | 2026-10-05, by the engineer run that added the gate |
| Size | 42 KB |

## Why this record and not the other one the run produced

That run produced two records. The second is 1.2 MB, because the
generation it holds is the whole of `docs/standards/lessons.md` at the
agent's commit. It carries the sharper numbers (2,996 separator
characters, 357 reused) and it is not committed, because a 1.2 MB
fixture to assert arithmetic on is a cost with no extra coverage. The
numbers it produced are recorded in
`docs/design/generated-denominator.md` §8 with the command that
reproduces them.

## Redaction

Nothing here is redacted and nothing needed to be. Every identifier in
the file is a commit SHA or a file path from this public repository, the
only author names are `claude[bot]` and the repository owner's public
GitHub handle in commit metadata, and no home directory, machine
username or session UUID appears. Checked with:

```bash
grep -oE '"(/(Users|home)/[^"]*|[a-f0-9]{32,})"' fixtures/real/ursa-main-4d5e401.json | sort -u
```

which returns three commit SHAs of this repository and nothing else.
The 1.2 MB record is excluded for size, not for redaction.

## Regenerating it

```bash
cd /tmp && rm -rf probe && git clone https://github.com/alexandrapaiz/Ursa.git probe
cd <path-to>/ursa-major
npx tsx src/bin/ursa.ts run /tmp/probe --declare unsatisfied
npx tsx src/invariants.cli.ts /tmp/probe/.ursa/records
cp /tmp/probe/.ursa/records/probe-2026-09-26-4d5e401.json fixtures/real/ursa-main-4d5e401.json
```

The record is keyed by the episode's commit pair, so it is stable as
long as those two commits stay in `main`'s history. New commits on
`main` add records; they do not change this one.
