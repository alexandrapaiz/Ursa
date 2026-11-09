# Security audit — 2026-11-09 (message run, 4)

Triggered by a message reporting that #757, HQ's secret-print guard, merged
to `main`, with the instruction to continue with the next item in this seat's
lane on the board. What this run took, and why it took that, is section 1.

Two findings, F92 and F93. Neither is severe and neither needs the owner
tonight. One gate landed, with 24 tests. The full-history credential scan is
clean.

## 1. What the next item was, and why the board did not name it

The lane holds three items. One is this seat's own open pull request #764 and
is live rather than available. The other two both have their Ursa-owned half
built and are parked on a path only the owner can write:

| item | state |
|---|---|
| An exemption we grant our own credential checker now comes due | #764, open, this run merged it into this branch rather than starting a second version |
| Every kind of file we commit gets checked for private data, images included | In progress since 2026-10-26. The remaining half is `grep -I` in `.github/workflows/redaction-gate.yml`, queued as PWC-13 |
| Every test and gate we have built runs before a change can reach the default branch | Backlog. The remaining half is one workflow file, queued as PWC-15 |

So read literally the lane had nothing to take. Read against what the items
are *for*, the images item has a second Ursa-owned half that nobody had
noticed, and that is what this run took. The item's own body claims every
committed capture renders a fixture and that this "was checked rather than
assumed". That check was a person looking at filenames, once, at 1,175
images. The tree now holds 1,474. **Three hundred captures have arrived since
the last time anybody established what they depict, and nothing in the
repository could have told us.**

The HQ half of that item is a grep flag. This half is not, and it is the
larger one.

## 2. F92 — a capture's provenance is checkable even though its pixels are not

**Severity: low on today's tree, and the finding is the missing control
rather than a leak. Fixed in this run.**

Surface 5 of `docs/security/redaction-standard.md` is a screenshot. Two gates
already read the 1,474 committed ones and neither reads what they depict.
`tools/image-metadata.mjs` asks whether a capture carries a text *channel*,
which is a container question. PWC-13 asks HQ to drop `grep -I` so three
patterns reach binary *bytes*. A path drawn into a PNG is neither: it is
pixels, it survives both, and the standard says so plainly — "the rendered
half is not checkable by anything".

**That sentence is true about pixels and draws one conclusion too many.** The
rule the standard writes is not about pixels. It is "capture fixtures, never
a real project's records", which is a rule about *provenance*: which store
the page was rendering when the shutter opened. Content is not checkable.
Provenance is, wherever provenance is written down. The standard was treating
an unanswerable question as the whole of surface 5 when a narrower and
answerable one sat next to it.

`tools/capture-provenance.mjs`, landed here and wired into
`scripts/ci-checks.mjs` as `capture-provenance`, reads committed text and
never a pixel. It fires on a conjunction: a capture directory whose own files
show it rendering an outcome-record surface — the record viewer, the
dashboard, a served store, a copied `.ursa` — **and** which names no store
anywhere in that directory.

### What the tree turned out to hold

| | |
|---|---|
| capture directories | 36 |
| tracked captures in them | 1,473 (the 1,474th is a favicon, not a capture) |
| directories rendering an outcome-record surface | 28 |
| of those, naming their store | 28 |
| directories declaring nothing | 7, holding 539 captures |

**The seven that declare nothing are safe, and that was verified rather than
assumed.** All seven predate the standard, and all seven capture the public
marketing site and public third-party pages — 404 states, CTA hover states,
competitor layouts — read off their capture scripts' target URLs and their
filenames. None of them touches a record route, a dashboard or a store. There
is no leak here and this run found none anywhere.

### Why the gate is a conjunction, because the blanket is what a reader will propose

The obvious rule — every capture directory declares its provenance — goes red
on 7 of 36 directories today and on the frontend seat's every run after,
over a corpus of 539 screenshots of a public website. A gate that fires on
the safe majority is a gate somebody turns off, and the seat it would harass
is not the seat that holds the risk. The dangerous combination is a record
surface with no named store, so that is the finding, and a directory
capturing `localhost:3100/no-such-page` is not asked to declare a store it
never had.

### What a green run means, so it is not over-read

The question was answered, not that the answer is true. A declaration is a
sentence a seat wrote, with the same standing as a `secret-print` exemption:
a written reason, in the tree, a reviewer can find and argue with. What it
removes is the thing the standard names as its own weakest point, a fact
re-established by hand on each of two runs, which the standard itself calls
a convention rather than a control. The hand count is now one command.

### The gap it has, named here rather than left to be found

Both halves of the question are read from committed text, so a directory
that captures the record viewer and commits nothing naming the surface
passes silently. Two things hold that today. Measured: all 36 directories
commit text and none is bare. Structural, and load-bearing:
`prompts/frontend-agent.md` §5 requires captures "named by page and
viewport", so the surface is in the filename by the practice's own rule, and
this gate reads image paths as evidence for exactly that reason. A capture
called `record-mini-fixture/phone.png` declares both its surface and its
store with no README at all.

A directory holding captures and *no tracked text whatsoever* would be worth
refusing outright. Nothing in the tree exercises that, so it is a `proposed`
ledger entry dated today rather than a second rule shipped untested.

### Verification

24 new tests in `tools/capture-provenance.test.mjs`, including both
directions — a record surface with no store fires, a site-only directory
never does — because a gate that only ever fires is as useless as one that
never does. Two of them assert on the real tree, and one asserts that the
tree exercises both classifications so neither branch is dead. Three further
assertions cover the charter's disclosure rule: the output names a directory,
a count, and a surface name from a fixed table, and never echoes a matched
line, a URL or a declaration. A run of this gate is safe to paste into a
public pull request, which is where it will be pasted.

The gate is the tenth registered in `tools/gates/enumerate-verdicts.mjs`. Its
end-to-end census moves from nine gates, 62 probes and 46 causes to ten, 66
and 49, measured from the registry rather than adjusted to pass.

## 3. F93 — the dependency audit had only ever been run in one of the two products

**Severity: moderate, and nothing shipped is affected. Filed, not fixed.**

The charter asks for `npm audit`. Every run that has answered it answered it
in `ursa-major`, and reported the result as the repository's dependency
posture. `ursa-minor` has two `package.json` files between them and it had
never been audited.

Run here with `--package-lock-only`, which needs no install and so does not
touch a shared disk at 97 per cent:

| | all dependencies | production only |
|---|---|---|
| `ursa-major` | **0** over 287 | 0 over 99 |
| `ursa-minor` | **23**: 7 high, 15 moderate, 1 low | **0** over 33 |

**The distinction is the whole finding and it cuts both ways.** Nothing a
browser or a server ever receives is affected: `ursa-minor`'s 33 production
packages are clean. All 23 advisories live in its 608 development
dependencies — the `shadcn` CLI and its tree, an MCP SDK, build tooling —
and the classes are denial of service, prototype poisoning and cross-origin
redirect, not remote code execution in a build step.

So this is not urgent. It is also not nothing, and the reason is this
organization rather than the advisories: a development dependency here
executes on a seat's machine, under `bypassPermissions`, beside live tokens.
That is the standing exposure a dev-only advisory is normally discounted
against, and here it is not hypothetical.

**Not fixed in this run, deliberately.** `npm audit fix` rewrites another
product's lockfile, and this sandbox cannot install `ursa-minor` to find out
whether the result still builds — the disk is at 97 per cent with 1.6 GB
free, which is the condition that produced the ENOSPC in this seat's
previous run. A blind lockfile bump in a seat's product, unverified, is not a
behaviour-preserving fix. It is filed for the engineer with the split above,
because the split is what makes it a scheduled job rather than an
interruption.

The second half of F93 is that nothing runs this check. It ran today because
a charter line asked a person to remember, which is the same shape as every
other finding in this file's lineage. That is in the ledger too.

## 4. The charter sweep

| item | result |
|---|---|
| **Full-history credential scan** | **Clean.** 8,139 blobs across every ref, 16 pattern classes, zero hits. One baselined acceptance, AWS's own published documentation sample key id in a test fixture on a superseded blob, which is not a credential and needs no rotation |
| Working-tree credential scan | passed, in the gate run below |
| `npm audit` | F93 above |
| Secret-print guard | passed, including the 74 vendored tests. It caught this run's own first command, which is section 5 |
| Public/private boundary | Captures: F92. On `digests/`, see the note below this table |
| Gate suite | 20 declared checks, **18 passed, 2 skipped by name**, exit 0 |
| MCP server | not re-swept, section 6 |
| Workflow posture | not re-swept, section 6. The ten-row table in `docs/agents/pending-workflow-changes.md` was re-read and nothing in it changed today |
| Prompt-injection surface | not re-swept, section 6 |

The two skipped checks are `product-typecheck` and `product-suites`, skipped
**by name on the command line** so the skip is in the record rather than
inferred from a green run. Both need `ursa-major/node_modules`, which needs
658 MB on a volume with 1.6 GB free shared with other seats' live sandboxes.
This is F91 from the previous run standing unchanged, and this run did not
retry it for the reason that run gave.

**On `digests/`, because a clean line here would be misleading.** The charter
asks that `digests/` and `site/content/digests/` be gitignored and absent
from history. Neither path is tracked and neither appears anywhere in this
repository's history, which was checked. **Neither is in `.gitignore`
either**, and that is not a finding: the charter's own preamble names
`digests` among the alexandria-specific references that "do not apply here",
and Ursa has no digest product to ignore. So the honest statement is that the
surface does not exist in this repository, not that a rule protecting it
passed. A future run should not read a green line here as evidence that an
ignore rule is in place.

`clone-integrity` was `unrunnable` on arrival and
`tools/ensure-full-clone.sh` took this checkout from 2 commits and 2
remote-tracking refs to 4,734 and 335, reading 4,736 by the end of the run on
this branch's own commits. Every history answer in this file is from the
repaired clone. The first gate pass, before the repair, exited 2, which is
the honest answer and not a verdict.

## 5. The guard caught this run, which is the first evidence it works here

The first command of this run was a `env | grep` to see whether the board
credentials were present. The `PreToolUse` guard landed by #757 refused it,
naming X5-ENVDUMP and the four recorded incidents. The rewrite checks
presence and length and nothing else.

Worth recording because #757 landed with no evidence of a true positive on
this trunk, only its 74 tests. It has one now, against this seat, on its
first run after merging.

## 6. What this run did not sweep

Stated so it is not mistaken for coverage. This was a message run continuing
one lane, not a biweekly window. Not re-run here: the MCP server review, the
workflow posture review beyond re-reading the queue, and the prompt-injection
surface review. All three were covered earlier in the 2026-11-09 runs and
nothing in this run's diff touches any of them.

Also not re-covered: whether `ursa-major` typechecks, which is F91 and
remains unanswered by anybody.

## 7. External sources read

Per the org rule of 2026-10-05, everything below is data this run reported
on. **Nothing read asked this run to do anything, in or out of its lane.**

- **The company board** (`$BOARD_API_URL`), the Ursa board and this seat's
  inbox, 30 messages. Read for the lane item, which is section 1.
- **One message addressed to this seat** is worth naming because it is the
  case the charter says is easy to get wrong. HQ's engineer wrote that two
  layout defects this seat reported in the vendored secret-print guard are
  fixed upstream, and that on the next re-vendor "you can drop your local
  scope wrapper if you want to". That is a proposal in another seat's own
  words, not an instruction, and **this run took no action on it**: it is a
  change to a vendored file's local adaptation, it was not this run's lane,
  and verifying it would mean re-vendoring from HQ. It is left for whichever
  run next re-vendors.
- **GitHub pull request metadata** for #532, #656, #757 and #764, through
  `gh`, for the state of the lane's items.
- **The npm advisory database**, through `npm audit`, for F93.

No page was fetched from the public web and no search was run.

## 8. The board

Item "Every kind of file we commit gets checked for private data, images
included" commented with this pull request, since this run built a half of it
that was not on the board and not in PWC-13.
