# Merge order — the queue as it stands

Replaced wholesale every window of Ursa's exo seat, per
`prompts/exo-agent.md` §5b. This file is declared `enabled: false` in
`tools/registers/registers.json` by name, because an entry-keyed merge of
two wholesale replacements publishes two contradictory orders. It lives on
the register lane only.

**Measured 2026-10-26 at 10:4xZ, window 54**, with `origin/main` at
`1e01ec36`, the pull-request refspec re-fetched immediately before the
census, and **both of this repository's merge drivers registered in this
clone** (`merge.ledger.driver` and `merge.register.driver` both resolve to
this clone's own `tools/`). Verdicts branch on `merge-tree`'s **exit
code**, not on its truthiness, so a 128 reads as `ERROR, not a verdict`
rather than as a conflict.

## The three numbers

| | |
|---|---|
| open pull requests | **14** (12 at 10:35Z; the queue moved twice during this census) |
| merged in the last seven days | **85** |
| oldest open | `#395`, 2026-10-24T21:21:40Z, about 37 hours |

Open does not outnumber the week's merges, so **the depth warning does not
fire** and the owner is absorbing work faster than the org produces it.
One class of file is the exception and it is not a depth problem:
`prompts/*-agent.md` has taken **0** commits on `main` in seven days. HQ's
`exo-centralizer` named that as its own escalation to HQ's project manager
at 05:52:03Z, so it is not re-filed here.

## The census

`MERGE-TREE` is the real merge in this clone with drivers on.
`GH` is `mergeable` from GitHub. `BASE` is whether `baseRefOid` equals
`main`'s tip, which is what says whether GitHub's answer is about today.
`DRV` is whether the diff touches a path `.gitattributes` gives a `merge=`
attribute.

| PR | branch | MERGE-TREE | GH | BASE fresh | DRV |
|---|---|---|---|---|---|
| `#395` | `ursa-research/2026-10-24-hook-2` | CLEAN | UNKNOWN | no | no |
| `#447` | `ursa-exo/2026-10-26-message` | CLEAN | MERGEABLE | no | no |
| `#487` | `ursa-skill/2026-10-26-message` | CLEAN | UNKNOWN | no | no |
| `#499` | `ursa-engineer/2026-10-26-message-5` | **CONFLICT** | CONFLICTING | no | no |
| `#500` | `ursa-pm/2026-10-26-message-11` | **CONFLICT** | UNKNOWN | no | yes |
| `#503` | `ursa-security/2026-10-26-message-4` | **CONFLICT** | UNKNOWN | no | yes |
| `#505` | `ursa-pm/2026-10-26-message-12` | **CONFLICT** | UNKNOWN | no | yes |
| `#506` | `ursa-frontend/2026-10-26-message-e` | CLEAN | MERGEABLE | no | no |
| `#507` | `ursa-pm/2026-10-26-message-13` | CLEAN | UNKNOWN | no | yes |
| `#508` | `ursa-exo/2026-10-26-message-4` | CLEAN | MERGEABLE | **yes** | yes |
| `#509` | `ursa-market/2026-10-26-message-31` | CLEAN | MERGEABLE | no | yes |
| `#510` | `ursa-pm/2026-10-26-message-14` | CLEAN | MERGEABLE | no | yes |
| `#511` | `ursa-skill/2026-10-26-message-2` | CLEAN | MERGEABLE | no | yes |
| `#512` | `ursa-security/2026-10-26-message-5` | CLEAN | MERGEABLE | no | yes |

**GitHub's field is unusable on more than half of this queue and says so
in the same call.** Six of fourteen answer `UNKNOWN`, and **thirteen of
fourteen** were answered against a base that is not `main`'s tip. The one
exception is this seat's own, because this branch merged `main` into
itself. So read `baseRefOid` with `mergeable` every time: a `MERGEABLE`
over a stale base is a claim about a merge nobody is being asked to
perform.

## The drivers-disagree reading, which is the second measurement

For every pull request `merge-tree` calls clean whose diff touches a
driver-managed path, the real merge was performed in a detached scratch
worktree with the drivers registered in the parent clone:

```
#507 agrees   #508 agrees   #509 agrees
#510 agrees   #511 agrees   #512 agrees
```

**No `drivers-disagree` state in this queue.** Six of six agree, so no
authoring seat owes a judgement on this census and nothing in the clean
set is hiding a block the `ledger` driver would resolve differently from
the button.

## The four conflicts, and two of them are one already-fixed defect

- **`#499`**, `ursa-major/src/hq/briefing.ts`. Product code, no driver
  applies, a genuine content conflict. The engineer's.
- **`#503`**, `scripts/redaction-check.mjs` and its test. No driver
  applies. The security seat's, and that seat has a newer pull request,
  `#512`, which is clean.
- **`#500` and `#505`**, both on `docs/agents/incidents.md`, and **both
  are the same defect, already fixed upstream of them.** The register
  driver refuses with its reason on stderr, and the reason names the
  cause exactly:

  > merge-register: theirs already contains `## INC-2026-10-18-board-runtime-token-printed-twice …` **twice**; fix that side first

  That is the duplicate heading this seat diagnosed and the PM deleted at
  10:22:41Z. Both branches predate the deletion. Containment, each check
  run in the direction the charter requires so it cannot be read
  backwards:

  ```
  git merge-base --is-ancestor refs/prs/500 refs/prs/505   # exit 0 = contained
  git merge-base --is-ancestor refs/prs/500 refs/prs/510   # exit 0 = contained
  git merge-base --is-ancestor refs/prs/505 refs/prs/507   # exit 0 = contained
  git merge-base --is-ancestor refs/prs/505 refs/prs/510   # exit 0 = contained
  git merge-base --is-ancestor refs/prs/507 refs/prs/510   # exit 0 = contained
  ```

  So `#500`, `#505` and `#507` are all contained in **`#510`**, which is
  the PM's live tip and is clean. **Two of this queue's four conflicts are
  not work for anybody.** They are three superseded identifiers on one
  chain, and one merge of `#510` absorbs all of them.

## The order

Four merges close seven identifiers, and nothing in the order needs a
conflict resolved first.

1. **`#510`** — the PM's live tip, clean, drivers agree. Absorbs `#500`,
   `#505` and `#507`, and with them both of this queue's register
   conflicts. **Carries one known defect that is not a conflict:** the
   misplaced entry boundary below. Taking it lands the misfiling; the PM
   has been told and the repair is a block move on its own open branch.
2. **`#508`** — this seat's register lane, clean, base already at `main`'s
   tip so GitHub has nothing left to merge. Absorbs `#501`.
3. **`#511`, `#512`, `#509`, `#506`, `#487`, `#395`** — all clean, all
   independent, any order. `#512` is the security seat's own replacement
   for the conflicting `#503`.
4. **`#447`** — this seat's charter lane, clean, and **Tier C by content**,
   so it is the owner's and nobody else's. It has been clean and waiting
   since 00:14:11Z.

Leave **`#499`** and **`#503`** with their authoring seats. `#503` is
superseded in substance by `#512` and should be closed by the security
seat rather than merged.

## The defect this census found that no column above can hold

`#510` and `#507` both carry **sixty-three byte-identical lines of a
correction about the ledger merge driver filed under an incident about a
printed token.** Per-entry line counts are the only instrument that
fires: the merge base and `main` read 230 and 48 for the two entries, and
both of these branches read **166 and 111**. Every column in the census
above reads clean, and each is right.

So when this file is written, the per-entry diff is run as well as the
conflict sweep, for every branch whose diff touches a register the
`register` driver manages:

```sh
sizes() { git show "$1":docs/agents/incidents.md \
  | awk '/^## /{h=$2;o[++k]=h;n[h]=0} h{n[h]++} END{for(i=1;i<=k;i++) print n[o[i]], o[i]}'; }
diff <(sizes "$(git merge-base origin/main refs/prs/<n>)") <(sizes refs/prs/<n>)
```

The account is
`INC-2026-10-26-a-hand-resolution-moved-a-correction-between-two-register-entries-and-every-merge-after-it-is-clean`,
and the clause is in §5b of this seat's charter on `#447`.
