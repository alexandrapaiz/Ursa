# Merge order for the owner — replaced each window by Ursa's exo seat

**Measured 2026-11-02T03:47:39Z by window 80**, on `origin/main` at
`cdbdcdff`. Replaces the previous window's plan, per §5b of
`prompts/exo-agent.md`. Every verdict below names the instrument that
produced it, and this window's headline is that **the instrument is the
finding**: the same twenty-three branches read two conflicts or ten,
depending on whether this repository's declared merge drivers are
installed, and GitHub's gate can never install them.

## The five queue numbers (§5b)

| | |
|---|---|
| open now | **23** (1 draft, `#671`, with a live run behind it) |
| merged, last 7 days | **92** |
| oldest open | `#395`, 2026-10-24T21:21Z, **8.3 days** |
| newest merge | 2026-11-02T03:24:51Z, **23 minutes** before this read |
| merges per day | 10-23: 9, 10-24: 27, 10-25: 14, 10-26: 45, 10-27: 22, 11-01: 4, 11-02: 29 |

**Neither depth predicate fires.** Open does not outnumber the week's
merges, 23 against 92, and the gate moved inside the last half hour. The
five-day outage window 72 recorded is over: 2026-10-31 still attempted
46 runs and completed **0**, 2026-11-01 completed 45 of 114, and
2026-11-02 has completed 116 of 146.

## Conflicts, measured twice, because the two readings disagree by eight pull requests

Instrument: `git merge-tree --write-tree origin/main refs/prs/<n>`,
exit code branched on `0` versus non-zero rather than on truthiness, and
`2>&1` **not** used on the tree-capturing call so that a driver's
diagnostic on stderr cannot displace the tree object. Containment is
checked **first**, because an absorbed branch exits 0 with an empty
merge and reads as clean (§76 of `runner-facts.md`, this window).

| reading | conflicting | clean |
|---|---|---|
| **with this repository's drivers installed** (`tools/registers/install-drivers.sh`, `tools/ledger/install-driver.sh`) | **2** | 21 |
| **driverless, which is what GitHub's merge button computes** | **10** | 13 |

**Eight of twenty-three open pull requests, thirty-five per cent,
conflict only because of files this repository declares a driver for.**
They are `#618`, `#633`, `#643`, `#646`, `#649`, `#652`, `#660` and
`#668`, and every one of their conflicting paths is in
`.gitattributes`: `docs/ideas.md` for six of them,
`docs/agents/learning-log.md`, `docs/agents/runner-facts.md` and
`docs/agents/incidents.md` for the other two. This is the first reading
of `INC-2026-10-25-githubs-merge-verdict-is-the-driverless-merge-and-the-drivers-cannot-reach-the-gate`
with a denominator.

## The two real conflicts, which no driver resolves

| | |
|---|---|
| `#601` | skill's `2026-10-27-hook-2`, the queue's oldest real conflict. **Twelve files**, all under `skills/`, plus `skills/README.md`. `docs/ideas.md` conflicts driverlessly and the ledger driver resolves it, so the driver-installed verdict is the honest one and it is still a conflict. Routed to the skill seat 2026-11-02T03:18:58Z. |
| `#615` | engineer's `2026-11-01-hook`. **Three files**, `tools/gates/enumerate-verdicts.mjs`, its test, and `tools/secret-scan-verdict.mjs`, all inside that seat's own surface. Routed to the engineer 2026-11-02T03:18:44Z. |

## The order

1. **The eighteen driver-resolvable and clean ones, in creation order**,
   with the drivers installed first. `#395`, `#631`, `#633`, `#638`,
   `#640`, `#643`, `#644`, `#646`, `#649`, `#651`, `#652`, `#660`,
   `#664`, `#665`, `#666`, `#667`, `#669`, `#670`. Nothing in this group
   needs a judgement; it needs one `install-drivers.sh` before the
   first merge.
2. **`#668`**, this window's register half. Driver-resolvable.
   Tier B: it declares in bold that it moves no authority and touches no
   other seat's charter.
3. **`#618`**, the charter lane, and it is **one owner decision and not
   eight**. Twenty-four files, eleven of them `prompts/*-agent.md`,
   carrying every charter amendment this seat has written since
   2026-10-27. It is driver-resolvable and GitHub will keep calling it
   conflicting until it merges. Do not split it: splitting is
   `INC-2026-10-26-growing-the-open-pull-request-remerged-the-split-that-exists-to-avoid-the-owner`.
4. **`#601` and `#615`** after their own seats resolve them. Both were
   routed 2026-11-02T03:1xZ and neither is waiting on the owner.

## The charter freeze, measured again

| | |
|---|---|
| commits to `main` in 7 days | **660** |
| of those touching any `prompts/*-agent.md` | **0** |
| last charter merge to `main` | **2026-10-18T18:50:50Z**, fifteen days ago |
| charters with a newer copy in an open pull request | **11 of 11** |
| in a pull request the seat does not own | **2** — `prompts/engineer-agent.md` and `prompts/research-agent.md`, both in research's `#395` |

A parked charter edit still has no observed exit. The gate is absorbing
work faster than the org produces it, 92 against 23, and exactly one
class of file never passes it.
