# Narrowing the redaction gate's Class C pattern for cited public URLs

Written 2026-11-09 by the engineer seat, window 14. Routed to this lane by
Ursa/pm. Held to the engineering-artifact standard in
`prompts/engineer-agent.md`, including its redaction rider: every identifier
in every payload below is truncated to eight characters or assembled from
parts, because this document is scanned by the gate it is about.

## 1. The defect, stated as a mechanism

`.github/workflows/redaction-gate.yml` runs three extended regular
expressions over the working tree. The third one, which
`docs/security/redaction-standard.md` §3 calls **Class C, session
identity**, is this:

```
[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}
```

That expression recognises session identity by **shape**, and four
different things in this repository have that shape:

| What it is | Is it private? | The standard's remedy | Does the remedy work? |
|---|---|---|---|
| A Claude Code conversation or session identifier, the thing Ursa incident 2 leaked | Yes | Truncate it to its first eight characters | Yes. Eight characters still identify the record to anyone holding the record. |
| A board message, dispatch, note or `ask` identifier, issued by the company host's message route | No. It names a row in this company's own message table. | Truncate it to eight characters, stated explicitly in §3 | Yes, same reason. |
| A `board.runs` row identifier, an Alexandra Systems project identifier, an `--internal-nudge-id` | No | Not stated; seats truncate by analogy | Yes, same reason. |
| The article-id path segment of a **cited public URL**, for example a news outlet whose content management system addresses articles by UUID | No. It is a public web address. | **None. The standard does not cover this case.** | **No, and it cannot.** A URL's identifier *is* its address. Truncating an address does not redact it, it breaks it. |

The fourth row is the defect. It is not a gap in the standard's prose, it is
a case where the standard's only remedy is unavailable, because the string's
whole function is to be resolvable.

## 2. What it has already cost, twice, a week apart

Both instances are the market seat, both are on `main`, and neither touched
the gate.

| Date | Commit | What the seat did instead | What was lost |
|---|---|---|---|
| 2026-11-02 | `a0087473` | Deleted three source URLs from `docs/market/briefs/2026-11-02-message.md` and `docs/market/positioning.md`, replacing each with outlet-plus-headline prose and a sentence explaining that the URL is omitted because it trips the gate | Three citations became unresolvable. A reader cannot get from the brief to the source without a headline search. |
| 2026-11-09 | `9512b85b` | Percent-encoded one hyphen inside the article slug, writing `%2D` in place of `-`, in three files, so the 8-4-4-4-12 shape would no longer match while the link still resolved | The citations resolve but are corrupted. Nothing in the files says why, so the next seat copying one of them propagates a mangled URL, and any tool comparing the cited URL against the outlet's own canonical form reports a mismatch. |

Both are workarounds in the citation rather than fixes in the gate, so the
cost is not paid once. It is paid again by the next seat that cites the next
outlet whose content management system issues UUID article identifiers.

**Why this matters beyond tidiness.** `CLAUDE.md` §5 makes publishing
methodology openly simultaneously the enterprise sales channel and the user
trust proof, and `docs/market/landscape.md` is a published artifact whose
value is that its claims are traceable to sources. A security gate that
makes a market claim untraceable is spending the thing the gate exists to
protect.

## 3. Why the fix is an allowance and not a narrower Class C pattern

The honest statement of the rule is positional: *a UUID shape that sits in
the path of an http(s) URL on a published-source host is not session
identity.* Deciding that requires looking **left** of the match, at whether
a URL scheme and host precede it.

`grep -E` gives the gate POSIX extended regular expressions, which have **no
lookbehind and no lookahead**. There is therefore no way to write a Class C
pattern that declines to match when a URL precedes it. The gate's `grep`
flag cluster is `-rInE` and does not include `-P`, so Perl-compatible
lookbehind is not available either, and adding `-P` would be a far larger
change to a security gate than this defect justifies.

What the gate does have is a second stage. Its scan is:

```
hits=$(grep -rInE "$pattern" . <exclusions> | grep -vE '<allowance>')
```

The `grep -vE '<allowance>'` stage is where a positional rule can be
expressed, because by then the URL and the match are on the same line of
`grep`'s output. So the fix goes there.

## 4. The population the fix runs over

A narrowing of a security gate is only defensible on the population the gate
actually sees, so that population was enumerated rather than assumed, by
`scripts/uuid-shape-census.mjs`, over **every blob in the object store**
(8,969 of them) rather than over `HEAD`. The scope is every object for the
reason `scripts/redaction-check.mjs --history=all` gives: the question a
public repository raises is what GitHub *serves*, which includes the
closed-pull-request branches nobody deleted.

Measured 2026-11-09, on a clone repaired with `bash tools/ensure-full-clone.sh`:

| Question | Answer | What it decides |
|---|---|---|
| **Q1.** Distinct hosts carrying a UUID-shaped segment inside an http(s) URL | **1** — `finance.biggo.com`, 3 distinct values, 9 occurrences | An allowlist of published-source hosts is a cheap remedy, because the list is one entry long over the repository's entire history. Had this been forty hosts, the allowlist would have been the wrong shape and this document would have proposed something else. |
| **Q2.** Values the gate must keep catching | **24 distinct, 74 occurrences.** By kind: 11 board messages, 8 unclassified, 2 session files, 1 conversation, 1 third-party API team identifier, 1 internal nudge | The gate's catch population is mostly identifiers the standard already tells seats to truncate. Exactly **one** is genuinely private session identity: the Ursa incident 2 trial conversation, `64899e58`-and-the-rest, at 29 occurrences, all of them on the pre-rewrite lineage that `main` no longer reaches. |
| **Q3.** Lines carrying both an in-URL value and a bare value | **0** | The allowance is applied per line, so such a line would lose a true positive. None exists in the repository's history. |
| **Q4.** Lines the proposal exempts that also carry a Class A or Class B value | **0** | The gate shares one allowance across all three patterns, so an addition aimed at Class C widens the other two by construction. This is the measured size of that widening: zero lines of 8,969 blobs. |
| **Q5.** Members of Q2's population the proposal would exempt | **0** | The regression test, taken over history rather than over fixtures somebody chose. |

Reproduce all five with one command:

```bash
bash tools/ensure-full-clone.sh
node scripts/uuid-shape-census.mjs --kinds
```

## 5. The fix

One alternative added to the gate's shared allowance:

```
https?://finance\.biggo\.com/[A-Za-z0-9._~%/+-]*[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}
```

Read left to right: an `http` or `https` scheme, then the literal host
`finance.biggo.com` with its dots escaped so they match only dots, then one
path separator, then any run of characters legal in a URL path, then the
gate's **own** Class C pattern.

Three properties of that expression are load-bearing and none is incidental.

1. **It is an allowlist of hosts, not a denylist, and not a bare URL test.**
   A conversation-sharing link is a URL. `https://claude.ai/chat/<id>` and
   `https://chatgpt.com/c/<id>` carry real session identity, so the sentence
   "a UUID inside a URL is public" is false, and an allowance that tested
   only for a URL would exempt precisely the class the gate exists for. The
   two failure directions are not symmetric either: a **missing allowlist
   entry** costs one seat one red gate and a one-line addition, while a
   **missing denylist entry** publishes a private conversation identifier.
   Fail closed.
2. **The expression ends with the Class C pattern itself**, so the allowance
   only fires on a line where the allowlisted URL carries the UUID shape. An
   allowance of just `https?://finance\.biggo\.com/` would exempt every line
   mentioning that host from all three patterns, including lines where the
   UUID shape is somewhere else entirely.
3. **The host's dots are escaped.** Unescaped, `finance.biggo.com` also
   matches `financexbiggoycom`, which is a host an attacker can register.

### The residual cost, stated rather than omitted

The gate applies **one** allowance, shared by all three patterns, with
`grep -vE`, which is **line scoped**. So a single line carrying both an
exempt cited URL and a Class A home path loses the Class A finding.

The proposal does not create this. The allowance has been shared and line
scoped since the gate was written, and `scripts/redaction-check.mjs`'s own
header names it. The proposal adds one more line shape that can trigger it.
Its measured cost is Q4 above: zero lines of 8,969 blobs, with Q3 also zero.

This is not left as prose. `scripts/redaction-check.test.mjs` contains a
case named **"documents the residual: one line carrying both loses the other
classes"** which asserts the hole, and whose failure message says that if it
ever starts failing, the gate grew per-scan allowances and the test is the
one to delete. A known hole that no test pins is a hole that moves.

The structural repair is a **per-scan allowance**: `scan()` taking a third
argument so each pattern carries its own exemptions. That changes the gate's
shape, and it also changes `readGate()` in `scripts/redaction-check.mjs`,
whose parser expects exactly one `grep -vE '<allowance>'`. It is a separate
proposal, filed in `docs/ideas.md` under this date, and deliberately not
bundled here: this patch is one line in a file the owner has to apply by
hand, and a one-line patch is reviewable in a way a restructuring is not.

## 6. The system, node by node and edge by edge

Every node below is a real file or process. Every edge carries a named
artifact, not a verb.

**Nodes.**

- `N1` — `.github/workflows/redaction-gate.yml`. The GitHub Actions workflow
  file. **It is the authority**: it holds the three patterns, the exclusion
  arguments, the `grep` flag cluster, and the allowance. Runs on
  `ubuntu-latest` on `push` to `main`, on every `pull_request`, and on
  `workflow_dispatch`.
- `N2` — `/usr/bin/grep`, GNU grep 3.11, the process `N1` invokes twice per
  pattern: once with `-rInE` to find candidate lines and once with `-vE` to
  apply the allowance.
- `N3` — `scripts/redaction-check.mjs`. The local mirror, runnable before a
  push. It holds **no rules of its own**: it text-parses them out of `N1`,
  and exits `2` rather than reporting clean if it cannot find any of them.
- `N4` — `scripts/redaction-check.test.mjs`. The suite over `N3`, 41 cases.
  Eight of them are new and review this proposal.
- `N5` — `scripts/uuid-shape-census.mjs`. The measurement instrument behind
  §4. Unlike `N3` it transliterates the gate's patterns deliberately, because
  it is an argument *about* the gate and has to evaluate a rule the gate does
  not have yet.
- `N6` — `docs/security/redaction-gate-uuid-narrowing.patch`. The one-hunk
  unified diff against `N1` that nobody in this lane may apply.
- `N7` — `.git/objects/pack/*.pack`, the object store `N5` walks.
- `N8` — the working tree, the bytes `N1` and `N3` both scan.

**Edges.**

- `N1 → N3`, artifact: four fields parsed from YAML text — a list of
  `{ label: string, pattern: string }` from each `scan "<label>" \ '<ere>'`
  call, the flag cluster string from `grep -<flags> "$pattern"`, the
  `--exclude-dir` and `--exclude` argument lists, and the single allowance
  string from `grep -vE '<ere>'`.
- `N1 → N2`, artifact: an `argv` array, literally
  `['-rInE', '<ere>', '.', '--exclude-dir=.git', …]`.
- `N3 → N2`, artifact: the same `argv` array, re-emitted by
  `spawnSync('grep', …)` so the local answer is produced by the gate's own
  tool rather than by a JavaScript regular-expression engine with different
  semantics.
- `N2 → N3`, artifact: `grep`'s standard output as `<path>:<line>:<text>`
  records, **and** its standard error, which is where GNU grep announces a
  binary-file hit while printing nothing on standard output.
- `N3 → N4`, artifact: the process result `{ code: 0 | 1 | 2, stdout: string, stderr: string }`.
- `N4 → N6`, artifact: the patch file's bytes, read and applied with
  `git apply` into a throwaway repository, then compared byte-for-byte
  against the suite's own in-memory transformation of `N1`.
- `N7 → N5`, artifact: a stream of `<oid> blob <size>\n<bytes>` frames from
  one `git cat-file --batch` pipe.
- `N5 → stdout`, artifact: the five-question `CensusResult` record in §7,
  with every identifier truncated to eight characters.
- `N6 → N1`, artifact: the one-line allowance change. **This edge is the
  only one not traversed by this pull request**, and the owner or HQ is the
  process that traverses it.

## 7. Interfaces at every boundary, as real signatures

```ts
// scripts/redaction-check.mjs — what it parses out of the workflow.
// The workflow is the authority; this type is a reading of it.
interface GateRules {
  pairs: { label: string; pattern: string }[]; // one per `scan` call, in file order
  flags: string;        // the cluster passed to grep, e.g. "-rInE"
  excludeDirs: string[];
  excludeFiles: string[];
  allowance: string;    // the single shared `grep -vE` extended regular expression
}
function readGate(): GateRules; // calls process.exit(2) rather than returning partial rules

// scripts/uuid-shape-census.mjs — the measurement in §4.
type UuidKind =
  | 'conversation' | 'session-file' | 'board-message' | 'board-run'
  | 'project' | 'internal-nudge' | 'third-party-api' | 'unclassified';

interface CensusResult {
  scanned_blobs: number;
  lines_with_a_uuid_shape: number;
  total_matches: number;
  q1_in_url_hosts: { host: string; distinct_values: number; occurrences: number }[];
  q2_bare_distinct: number;
  q2_bare_occurrences: number;
  q2_by_kind: { kind: UuidKind; distinct_values: number }[];
  q2_values: { head: string; occurrences: number; kind: UuidKind; sample: string }[]; // head is 8 chars
  q3_mixed_lines: { oid: string; line: number }[];
  q4_widened_lines: { oid: string; line: number; sample: string }[];
  q5_exempted_true_positives: { oid: string; line: number; value: string }[];
  proposal: { source_hosts: string[]; allowance_ere: string };
}
function census(): Promise<CensusResult>;
function kindOf(line: string): UuidKind; // reported, never used to exempt anything

// scripts/redaction-check.test.mjs — the proposal, built from the gate's own rules
// so that no copy of the Class C pattern exists in the suite.
function gateRules(yml: string): {
  scans: { label: string; pattern: string }[];
  classC: { label: string; pattern: string };
  allowance: string;
};
function proposedAllowance(yml: string): string;
function withProposal(yml: string): string; // idempotent: withProposal(withProposal(x)) === withProposal(x)
```

## 8. On-disk layouts, with real payloads

### `docs/security/redaction-gate-uuid-narrowing.patch`

A unified diff with a comment preamble, which `git apply` skips. Real
contents of the hunk, verbatim from the committed file:

```diff
--- a/.github/workflows/redaction-gate.yml
+++ b/.github/workflows/redaction-gate.yml
@@ -26,7 +26,7 @@ jobs:
             hits=$(grep -rInE "$pattern" . \
               --exclude-dir=.git --exclude-dir=node_modules --exclude-dir=.ursa \
               --exclude=redaction-gate.yml 2>/dev/null \
-              | grep -vE '/(home/runner|Users/<you>|home/<you>)/|projects/-Users-you-' || true)
+              | grep -vE '/(home/runner|Users/<you>|home/<you>)/|projects/-Users-you-|https?://finance\.biggo\.com/[A-Za-z0-9._~%/+-]*[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}' || true)
             if [ -n "$hits" ]; then
               echo "::error::$label"
               printf '%s\n' "$hits" | head -20
```

### The payload the gate rejects today and accepts after the patch

A real line from `docs/market/landscape.md` as it stood at `9512b85b`'s
parent, with the article identifier truncated to eight characters **for this
document only** — in the file itself it is necessarily complete, because that
is the whole point:

```markdown
Giants](https://finance.biggo.com/news/865c23cb-…-…-…-…).
```

And the same line as `9512b85b` left it on `main`, which is the workaround
this patch retires. The `%2D` is a percent-encoded hyphen:

```markdown
Giants](https://finance.biggo.com/news/865c23cb%2D3e0d-…-…-…).
```

### Census output, real, from the run that produced §4

```
blobs scanned: 8969
lines carrying an 8-4-4-4-12 hex shape: 83
matches in total: 83

Q1  hosts with a UUID-shaped segment inside an http(s) URL: 1
      finance.biggo.com  3 distinct values, 9 occurrences

Q2  values the gate must keep catching: 24 distinct, 74 occurrences
      board-message: 11
      unclassified: 8
      session-file: 2
      conversation: 1
      third-party-api: 1
      internal-nudge: 1

Q3  lines carrying both an in-URL and a bare value (the line-scoped blind spot): 0

Q4  lines the proposal exempts that also carry Class A or Class B: 0

Q5  values from Q2 the proposal would exempt (must be 0): 0
```

## 9. Exact commands

Run from the repository root. These are the literal invocations, with the
literal flags, that this artifact's claims were produced by.

```bash
# Prerequisite. Every history claim in §4 is false on the clone this host
# hands you, which is shallow AND single-branch (node tools/seat/env-facts.mjs,
# fact clone-shallow-and-single-branch).
bash tools/ensure-full-clone.sh

# §4, all five questions, with the per-value kind table.
node scripts/uuid-shape-census.mjs --kinds

# §4 as one JSON object, for a reviewer who wants to re-aggregate it.
node scripts/uuid-shape-census.mjs --json

# The suite, 41 cases, 8 of them this proposal's.
node --test scripts/redaction-check.test.mjs

# The gate's own question, over the working tree, before any push.
node scripts/redaction-check.mjs

# Confirm the patch applies to the gate as it stands, WITHOUT applying it.
git apply --check docs/security/redaction-gate-uuid-narrowing.patch

# The owner's or HQ's action. Not this seat's: see §10.
git apply docs/security/redaction-gate-uuid-narrowing.patch

# Roll back.
git apply -R docs/security/redaction-gate-uuid-narrowing.patch
```

## 10. Why the workflow hunk is not in the pull request

Two independent reasons, either of which alone is sufficient.

1. **The seat's writable surface.** This run's invocation states, in the
   owner's runtime, `never touch secrets or workflows`. A workflow file is
   named in that prohibition. Ursa/pm's handoff routing this item into the
   lane said the same thing from the other side, that the file "is outside
   your writable surface for a routine merge" and "this likely needs owner or
   HQ review once you open it, so say so in your own pull request rather than
   assuming a normal Tier B path."
2. **The token.** The GitHub token a seat run carries has no `workflows`
   scope. `scripts/redaction-check.mjs`'s own header records this, as the
   reason that script exists at all: it is "the part that can be installed
   without the `workflows` permission the runner does not have." A push
   carrying this hunk is refused by GitHub before any human sees it, so
   including it would not be a boundary violation so much as a branch that
   cannot be pushed.

So the hunk ships as `N6`, a patch, with the suite asserting that the patch
makes exactly the edit the suite's green cases exercise. That assertion is
the thing that makes a patch-instead-of-an-edit honest rather than a promise:
without it, a reviewer has eight passing tests about an in-memory
transformation and a separate file that may or may not be the same change.

## 11. Tooling list

| Tool | Version | Its job here | Why it, over what was considered |
|---|---|---|---|
| GNU grep | 3.11 | The process that evaluates all three gate patterns and the allowance, both in the workflow on `ubuntu-latest` and in the local mirror, which spawns it rather than using a JavaScript regular-expression engine | Not a choice so much as a constraint: the gate is written in `grep`, and its POSIX extended regular expressions have no lookbehind, which is the whole reason §3 concludes the fix must be an allowance. **The version was verified, not assumed.** This host's interactive shell resolves `grep` to ugrep 7.8.4, so a suite that had exercised ugrep would not be evidence about a gate that runs GNU grep. `spawnSync('grep', …)` resolves `/usr/bin/grep`, GNU grep 3.11, over `PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/snap/bin`. |
| git | 2.43.0 | `cat-file --batch-all-objects` enumerates the census population; `cat-file --batch` streams it; `apply --check` proves the patch applies; `apply -R` is the rollback | `git log -S` was the alternative for §4 and was rejected: it walks 5,200 commits per query and answers a question about *commits*, while the question here is about *blobs a public remote serves*, which is the object store. One pipe over 8,969 blobs runs in about 90 seconds; 28,771 `cat-file` spawns would be minutes of process setup alone. |
| Node.js | 22.23.2 | Runtime for the mirror, the census and the suite | Already the repository's only scripting runtime, and `node --test` is in the standard library, so the suite adds no dependency. The steady-state cost constraint in `prompts/engineer-agent.md` makes a new dependency a ledger proposal rather than an action, and nothing here needs one. |
| `node:test` | bundled with Node 22.23.2 | The 41-case suite, including this proposal's 8 | Chosen over Vitest and Jest for the same reason: both are installs, and this repository's test files are all run directly with `node --test`. |
| `node:assert/strict` | bundled with Node 22.23.2 | Assertions, including the failure message on the residual-cost case that tells a future reader to delete the test | Strict mode over loose `assert` so that an exit code of `'1'` never passes a test expecting `1`. |

## 12. Terms used above, defined in place

- **Class A, Class B, Class C** — the redaction standard's names for the
  three kinds of private value the gate pattern-matches:
  verbatim human text (Class A, which the gate cannot detect and which no
  regular expression can), machine and account identity (Class B, absolute
  home paths with a real username and Claude Code project slugs), and
  session identity (Class C, full conversation or session UUIDs). Defined in
  `docs/security/redaction-standard.md` §3.
- **The allowance** — the gate's second `grep` stage, `grep -vE '<ere>'`,
  which removes lines from the first stage's findings. One expression,
  shared by all three patterns, applied per line.
- **Line scoped** — a property of that stage: it removes a whole line of
  `grep` output, so it cannot remove one match from a line and keep another.
- **POSIX extended regular expression** — the dialect `grep -E` accepts.
  Relevantly here: it has alternation, bracket expressions and interval
  quantifiers, and it has no lookbehind, no lookahead and no non-greedy
  quantifier.
- **8-4-4-4-12** — the canonical textual shape of a UUID: five
  hyphen-separated groups of lowercase hexadecimal digits of those lengths.
- **Published-source host** — in this document, the hostname of a public web
  publication cited as a source in `docs/market/`, as distinct from a host
  that serves private conversations, such as `claude.ai` or `chatgpt.com`.
- **Tier B** — the Alexandra Systems review tier for a routine change merged
  by the owner without HQ involvement. Named here only because Ursa/pm's
  handoff says this change is not one.
