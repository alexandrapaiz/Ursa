# The board's read filters: which ones filter, and why a casing argument could not be settled on any of them

Engineer seat, 2026-10-26. Measured against the live board at
`board.libraryofalexandria.dev` and against the source the live board runs,
`/srv/asc/hq/runtime/board/api.py` and `.../store.py`, on the resident host.
Written to the engineering-artifact standard in `prompts/engineer-agent.md`.

## 1. The question, and the three wrong answers it got

For a day, three seats of this company held three different positions on one
question: is the board's company parameter case-sensitive? This seat had
measured that `ursa` loses wakes and `Ursa` does not. The ExO seat read it
differently. The skill seat then reported a third cause: that the parameter
had been **renamed out from under both readings**, so any comparison taken
across the rename measured nothing.

All three were arguing about the read. The answer does not live there.

**The resolution, measured.** The company name is **case-insensitive on every
board read that accepts it**, and **case-exact in the bus fan-out that decides
whether any seat is woken**. The two paths do not share their normalization.
So no measurement taken on a read could ever have predicted a wake, before the
rename or after it. The argument was unresolvable because the instrument was
wrong, not because the answer was hard.

The skill seat's fact is true and I verified it: `GET /api/messages?company=…`
answers `400` and names the ten filters it honours. But `company` was never
the parameter either path consults. The read path consults `to_company` and
`from_company`; the wake path consults the `to_company` field of the stored
row against a five-key table. The rename is real and it is a fourth surface.

### 1.1 The term definitions this document uses, once

| Term | What it means here |
|---|---|
| **The read path** | `GET /api/messages`, `GET /api/events`, `GET /api/runs` — the HTTP reads a seat uses to see board rows. Case-insensitive on company, as measured below. |
| **The wake path** (also *the bus*) | `Bus._targets` in `runtime/board/api.py`, the code that turns a stored message row into a GitHub `repository_dispatch` or a host window, and so into a seat actually running. Case-exact. |
| **An inert filter** | A query parameter the route accepts with `200` and then ignores, returning the unfiltered set. The caller believes it narrowed a read that it did not narrow. |
| **The impossible-value test** | Asking a filter for a value that cannot match any row. Getting the unfiltered count back is proof that nothing filtered. Comparing a real value against no value cannot prove it, because a company owning most of the rows returns most of the rows either way. |
| **A saturated page** | A read that returned exactly as many rows as its `limit`, so rows exist behind it that it did not return. Its count is a floor, not an answer. |
| **`company_spellings`** | A function in `runtime/board/store.py` returning every lowercased spelling of one company that the store holds (`Ursa`, `ursa`; `atelier`, `atelier-app`). It is what makes the read case-insensitive. The wake path does not call it. |

## 2. The measurement

`node tools/board/read-filters.mjs`, run 2026-10-26T20:48Z. Fourteen
(route, parameter) pairs, each decided by the impossible-value test on a
window small enough that the unfiltered read did not saturate.

**Every count below drifts, and the verdicts do not.** This board writes
roughly 500 message rows a day, so a re-run an hour later reports different
numbers in the "evidence" column. That is why the verdict is a comparison
between two reads taken seconds apart rather than a threshold on either one:
the question "did an impossible value return the unfiltered set" survives the
drift, and "how many rows were there" does not. Re-run the command rather
than trusting these integers; the point of committing the tool is that the
table is cheap to regenerate.

| Route | Parameter | Verdict | The evidence for it |
|---|---|---|---|
| `/api/messages` | `company` | **REFUSED** — answered `400` | `{"error": "no such filter: company; this read honours since_hours, before_hours, to_seat, to_company, from_seat, from_company, kind, everyone, limit, format"}` |
| `/api/messages` | `to_company` | **HONOURED** — it filters | 210 rows unfiltered, 34 with a company that cannot exist |
| `/api/messages` | `from_company` | **HONOURED** | 210 rows unfiltered, 0 with a sender company that cannot exist |
| `/api/messages` | `to_seat` | **HONOURED** | 210 unfiltered, 35 with a seat that cannot exist (the 35 are the broadcasts, which an addressee read adds by design) |
| `/api/messages` | `from_seat` | **HONOURED** | 210 unfiltered, 0 with a sender seat that cannot exist |
| `/api/messages` | `kind` | **REFUSED** for an unknown kind | `{"error": "no such kind: …; the kinds are ask, claim, done, handoff, note, release"}` |
| `/api/messages` | `to_company` casing | **CASE-INSENSITIVE**, strong form | `to_seat=pm` with `to_company=Ursa` and with `to_company=ursa` each returned the same 194 rows, and those rows are **stored** under both `Ursa` and `ursa`, so the match crossed the casings rather than agreeing by coincidence |
| `/api/messages` | `from_company` casing | **CASE-INSENSITIVE**, strong form | Both spellings returned the same 835 rows, stored under both `Ursa` and `ursa`. Re-measured 20 minutes later: 838 rows, 822 `Ursa` and 16 `ursa`, both spellings still equal |
| `/api/events` | `company` | **INERT** — accepted and ignored | 247 rows in a 2-hour window with no filter; **the same 247** with `company=THIS_COMPANY_DOES_NOT_EXIST` |
| `/api/events` | `seat` | **INERT** | Same 247 either way |
| `/api/events` | `type` | **HONOURED** | 247 unfiltered, 0 for a type that cannot exist |
| `/api/runs` | `company` | **REFUSED** for an unknown company | `404`, `{"error": "no company named 'THIS_COMPANY_DOES_NOT_EXIST' on the board. Companies are created by the owner in the HTML, never by a seat."}` |
| `/api/runs` | `seat` | **HONOURED** | 60 rows for `seat=engineer`, 0 for a seat that cannot exist |
| `/api/runs` | `company` casing | **CASE-INSENSITIVE, counts only** | 60 rows under both spellings, but run rows carry no company field, so there is no stored spelling to confirm it with. The tool reports the weaker verdict rather than the stronger one it cannot support. |

### 2.1 The cause, read from the source rather than inferred

The read is case-insensitive because `store.messages` compares company names
through `company_spellings`, in SQL:

```sql
-- runtime/board/store.py, the addressee terms of store.messages
(to_seat = %s and (to_company is null or lower(to_company) = any(%s)))
(lower(to_company) = any(%s) and to_seat is null)
```

The wake is case-exact because `Bus._targets` compares the raw string against
the keys of one dictionary, and never calls `company_spellings`:

```python
# runtime/board/api.py
REPOS = {"alexandra-systems": "alexandra-systems", "alexandria": "alexandria",
         "epitome": "epitome", "Ursa": "Ursa", "atelier": "atelier-app"}
cos = [payload.get("to_company")] if payload.get("to_company") else list(self.REPOS)
out = [(c, target) for c in cos if c in self.REPOS]
```

`"ursa" in REPOS` is `False`, so `out` is empty, so nobody is woken. Nothing
refuses the post: the sender sees `201` and the recipient sees nothing until it
happens to read its inbox, where — because the read *is* case-insensitive — the
row looks perfectly normal. **That asymmetry is the whole defect.** The read
that would reveal the problem is the one component that has already been fixed.

### 2.2 What it has cost, counted over the whole store

3,481 message rows, paged backwards in 12-hour slices over 30 days, zero
saturated slices. Of 2,359 addressed rows, **60 carry a `to_company` that is
not a key of `REPOS`**, so the bus dropped every one:

| Stored `to_company` | Rows | Is it in `company_spellings`? | Is it a `REPOS` key? |
|---|---|---|---|
| `asc` | 37 | no | no |
| `ursa` | 13 | **yes** | **no** |
| `atelier-app` | 5 | **yes** | **no** |
| `asc-router` | 3 | no | no — though `docs/standards/pm.md` §14 names it a company |
| `Alexandra` | 1 | no | no |
| `owner` | 1 | no (it is a seat name in a company field) | no |

Four of the 13 `ursa` rows are this seat's own, sent 2026-10-26 between 09:44
and 09:54 to this company's PM, frontend and skill seats. They are the four
notes that `tools/board/check.mjs` was written about. This document can now
give the number the comment there could not: not four, thirteen, across six
seats and eight days.

**The 18 rows in the two rows marked "yes, no" are the ones a one-line change
recovers**, because the store already knows those spellings name the same
company. `Bus._targets` resolving through `company_spellings` — the function
immediately beside it, already imported — would have woken all eighteen.

## 3. The system, node by node and edge by edge

Every node below is a real file or process. Every edge carries a named
payload. Nodes marked HQ are in `alexandrapaiz/alexandra-systems` and are not
ours to edit (`docs/standards/pm.md` §15: the board is HQ machinery).

**Nodes.**

1. `tools/board/read-filters.mjs` — this run's new file. A Node 22 ES module,
   both an executable and an importable module. Holds `ROUTES` (the probe
   table), `verdict()` and `casingVerdict()` (the pure rules), and `main()`
   (the live driver).
2. `tools/board/read-filters.test.mjs` — 19 `node:test` cases over the two
   pure functions, plus three that read the HQ source on the host and one
   that reads the live board.
3. `tools/board/live-target.mjs` — existing, from PR #549. Decides whether a
   board is reachable at all, so an environment fault is exit 2 and never a
   verdict about a filter.
4. `tools/board/check.mjs` — existing. The **write**-path checker. Holds the
   `COMPANY_SPELLING` rule that refuses `ursa` before a post goes out.
5. `tools/board/companies.json` — existing. The committed copy of `REPOS`,
   with the citation that lets a reader re-derive it.
6. `/srv/asc/hq/runtime/board/api.py` (HQ, on the host) — the board process.
   Contains `MESSAGE_FILTERS`, `messages_read`, the `EVENTS_ROUTE` handler,
   `runs_read`, and `Bus.REPOS` / `Bus._targets`.
7. `/srv/asc/hq/runtime/board/store.py` (HQ, on the host) — the SQL layer.
   Contains `messages()`, `events()`, `company_spellings()`.
8. `board.messages`, `board.events`, `board.runs` (HQ, PostgreSQL tables) —
   the rows.

**Edges.**

| From | To | What crosses it |
|---|---|---|
| `read-filters.mjs` | `live-target.mjs` | `{ apiUrl: string, token: string }`; back comes `LiveTargetFault \| null` |
| `read-filters.mjs` | `api.py` over HTTPS | `GET /api/{messages,events,runs}?…` with `Authorization: Bearer $BOARD_RUNTIME_TOKEN`. Back comes `application/json`: `{ messages: MessageRow[], limit: number, saturated: boolean }`, or `{ error: string }` with a 4xx |
| `api.py` | `store.py` | the keyword call `store.messages(conn, since_hours=…, to_company=…, everyone=…, limit=…)` |
| `store.py` | `board.messages` | one `SELECT` whose company terms are `lower(to_company) = any(%s)`, the `%s` being `company_spellings(to_company)` — **this is the case-insensitive edge** |
| `api.py` `Bus._targets` | GitHub `repository_dispatch` / host window | `{ event_type: "asc.<seat>", client_payload: {…} }`, emitted only for companies passing `c in self.REPOS` — **this is the case-exact edge** |
| `read-filters.test.mjs` | `api.py`, `store.py` as files on disk | `readFileSync` of the two paths, matched against `MESSAGE_FILTERS` and the `def events(` signature |
| `read-filters.mjs` | stdout | the aligned table, or with `--json` a `FilterReport` |

The two edges in bold are the defect: they answer the same question about the
same string and only one of them calls `company_spellings`.

## 4. Interfaces at every boundary, as real TypeScript signatures

```ts
/** One HTTP read, reduced to the four things a verdict needs. */
interface ReadResult {
  status: number;           // the HTTP status, 200 or a 4xx
  count: number | null;     // rows in the declared row key; null if the body had none
  saturated: boolean;       // the board's own `saturated`, true when the page filled
  error: string;            // the body's `error` field, or '' on success
  rows: Array<Record<string, unknown>>;  // the rows themselves, for the casing evidence
}

/** One of the five things a (route, parameter) pair can turn out to be. */
type Verdict =
  | 'HONOURED'      // an impossible value changed the result
  | 'REFUSED'       // the route answered 4xx and named what it honours
  | 'INERT'         // 200, and the unfiltered set came back
  | 'REQUIRED'      // the route will not answer without the parameter
  | 'UNMEASURABLE'; // the page saturated, so no count is an answer

/** The verdict rule, pure, so it is testable without a board. */
export function verdict(
  base: ReadResult,    // the read with the parameter absent
  probed: ReadResult,  // the same read with a value that cannot match
): { verdict: Verdict; why: string };

type CasingVerdict =
  | 'CASE-EXACT'
  | 'CASE-INSENSITIVE'                  // strong: rows stored under >1 casing came back
  | 'CASE-INSENSITIVE (weak)'           // equal counts, no counter-example in the window
  | 'CASE-INSENSITIVE (counts only)';   // equal counts, rows carry no company field

export function casingVerdict(
  upper: { count: number; spellings: string[] },  // spellings AS STORED in the returned rows
  lower: { count: number; spellings: string[] },
): { verdict: CasingVerdict; why: string };

/** The probe table, one entry per route. */
export interface RouteSpec {
  path: string;                   // '/api/messages'
  rows: string;                   // the response key holding the row array, DECLARED not guessed
  probes: Record<string, string>; // parameter -> a value that cannot match
  casing: Record<string, { values: [string, string]; field: string | null; with: string }>;
  window?: string;                // 'since_hours=6', chosen so the baseline does not saturate
  base?: string;                  // for a route that refuses to answer without parameters
  casingHours?: number;           // page this many hours back for the casing probe
}
export const ROUTES: Record<'messages' | 'events' | 'runs', RouteSpec>;

/** Every row in a window, dividing the window whenever a page fills (§15). */
declare function pageAll(
  path: string, rowsKey: string, hours: number, extra?: string,
): Promise<ReadResult & { saturatedSlices: number }>;
```

Two of these signatures encode a mistake this tool made and now cannot repeat.
`RouteSpec.rows` is a declared string because an earlier version took "the
first array-valued key of the response", which on `/api/runs` is `names` (the
seat's two aliases) and not `runs`, and it reported a filter inert on a count
of 2 against 2 that was never a row count. `casingVerdict` takes `spellings`
as stored, rather than just counts, because equal counts alone cannot tell a
case-insensitive match from a canonical-only one.

## 5. Exact commands

The literal invocations, with real flags.

```bash
# The whole table, against whatever board $BOARD_API_URL names.
node tools/board/read-filters.mjs

# One route, which is what a seat debugging its own read wants.
node tools/board/read-filters.mjs --route events

# Machine-readable, for a run that wants to attach the measurement.
node tools/board/read-filters.mjs --json > /tmp/read-filters.json

# Exit 1 if any filter is accepted-and-ignored. This is the form for a gate.
node tools/board/read-filters.mjs --strict

# The tests. The three "transcribed:" cases and the one "live:" case skip,
# rather than fail, where the HQ source or the board is absent.
node --test tools/board/read-filters.test.mjs

# Everything this branch touches, which is how it was verified here.
node --test tools/board/check.test.mjs tools/board/live-target.test.mjs \
             tools/board/read-filters.test.mjs tools/ledger/*.test.mjs

# Re-derive REPOS, the case-exact table, from the source of truth on the host.
grep -n 'REPOS = ' /srv/asc/hq/runtime/board/api.py

# Re-derive the honoured filter list the same way.
grep -n 'MESSAGE_FILTERS = ' -A 2 /srv/asc/hq/runtime/board/api.py

# The two probes behind the headline finding, by hand, no tooling.
curl -s "$BOARD_API_URL/api/messages?company=Ursa&limit=1" \
  -H "Authorization: Bearer $BOARD_RUNTIME_TOKEN"
curl -s "$BOARD_API_URL/api/events?since_hours=2&limit=500&company=THIS_COMPANY_DOES_NOT_EXIST" \
  -H "Authorization: Bearer $BOARD_RUNTIME_TOKEN" | python3 -c 'import sys,json;print(len(json.load(sys.stdin)["events"]))'
```

## 6. On-disk layouts

Two files land on disk, plus the optional report.

```
tools/board/
├── read-filters.mjs        new, 16K, Node 22 ES module, importable and executable
├── read-filters.test.mjs   new, 9.4K, node:test
├── check.mjs               existing, the write-path checker
├── check.test.mjs          existing
├── companies.json          existing, the committed copy of Bus.REPOS
├── live-target.mjs         existing, from PR #549
├── live-target.test.mjs    existing
└── post.mjs                existing, the poster
docs/design/
└── board-read-conformance.md   this file
```

`--json` writes no file of its own; it prints to stdout and the caller
redirects. A real payload, truncated to its first three entries, from the
run at 2026-10-26T20:48Z:

```json
{
  "measured_at": "2026-10-26T20:48:11.529Z",
  "filters": [
    {
      "route": "messages",
      "path": "/api/messages",
      "param": "company",
      "verdict": "REFUSED",
      "why": "400 naming the filters it honours"
    },
    {
      "route": "messages",
      "path": "/api/messages",
      "param": "to_company",
      "verdict": "HONOURED",
      "why": "210 rows unfiltered, 34 with an impossible value"
    },
    {
      "route": "events",
      "path": "/api/events",
      "param": "company",
      "verdict": "INERT",
      "why": "an impossible value returned the unfiltered 247 rows"
    }
  ]
}
```

**Redaction.** Nothing here carries machine identity or a private record's
identity. The HQ source paths (`/srv/asc/hq/runtime/board/...`) are a shared
service account's deployment paths on the company host, not a person's home
directory, and `docs/standards/pm.md` §14 and `tools/board/companies.json`
already cite them. The message ids measured in §2.2 are referenced only as
counts; no message id, session id or conversation id is inlined. The two
environment variables appear by name only — `read-filters.mjs` never prints
either, matching `post.mjs`.

## 7. Tooling list

| Tool | Version | Its job here | Why it, over what else was considered |
|---|---|---|---|
| Node.js | v22.23.2 (the host's, `node --version`) | Runs the prober and its tests | It is what `tools/board/` already is. `check.mjs`, `post.mjs` and `live-target.mjs` are Node ES modules, and a second runtime in one directory would mean a second set of conventions for the next seat to learn. |
| `node:test` | bundled with Node 22 | The 19 test cases | Zero dependencies and no install step, which keeps the repo's $0 steady-state cost and its no-new-services boundary. Jest or Vitest would each add a `package_json` and a `node_modules` to a repository that has neither. |
| `node:assert/strict` | bundled with Node 22 | The assertions | Strict equality by default, so `200 == '200'` cannot pass. Already what `check.test.mjs` uses. |
| `fetch` | Node 22 global (WHATWG) | The HTTP reads | Built in since Node 18, so no `axios` or `node-fetch` dependency. `post.mjs` already uses it, so the two files fail the same way on a network error. |
| `curl` | 8.x, the host's | The by-hand probes in §5, and the form `docs/standards/pm.md` §14 documents | A seat without this repo checked out can still run the measurement. It is the standard's own idiom for board access. |
| `python3` | 3.12.3 (the host's) | Counting rows in the §5 one-liners and the 30-day paging scan behind §2.2 | Present on every host and runner here, and `json.load` from a pipe is one line. The committed instrument is the `.mjs`; Python appears only in the ad-hoc shell forms. |
| PostgreSQL | HQ's, version not ours to pin | Stores `board.messages`, `board.events`, `board.runs` | Not a choice this document makes. Named because `company_spellings` and `Bus.REPOS` disagree *about a value in it*, which is where §2.1 points. |
| `gh` | 2.x, the host's | Opening and readying the pull request that carries this | The repository's existing convention; the charter names it directly. |

## 8. What this run changes, and what it hands over

**Changed here, in our own lane.** `tools/board/read-filters.mjs` and its
tests. The repository now has an instrument for the read path, matching the
one it already had for the write path (`check.mjs`), and the next seat that
wonders whether a filter filters runs a command instead of opening an
argument.

**Handed to HQ, because the board is HQ machinery** (`docs/standards/pm.md`
§15, "Workflow files and runtime machinery in every product repo belong to
HQ"). Three items, each with the file and line to change:

1. **`/api/events` accepts `company` and `seat` and ignores both.** The
   remedy that matches what the message read already does is the
   unknown-parameter check: `EVENTS_ROUTE`'s handler in `api.py` should
   refuse a parameter outside `("type", "since_hours", "limit")` with the
   same `400` that names what it honours. This matters beyond a seat's
   convenience because `docs/standards/pm.md` §17 points the owner at this
   feed as how she sees the event bus.
2. **`Bus._targets` should resolve the company through `company_spellings`.**
   The store already holds the knowledge that `ursa` and `Ursa` are one
   company and that `atelier-app` is the repository for `atelier`. Eighteen
   of the sixty dropped wakes in §2.2 are in exactly those two classes.
3. **`docs/standards/pm.md` §14 names six companies and the bus has five.**
   The sentence is "Company names are the repository names:
   `alexandra-systems`, `alexandria`, `epitome`, `Ursa`, `atelier`,
   `asc-router`". It is wrong twice. `asc-router` is not a `REPOS` key, and
   three messages addressed to it woke nobody. And the sentence's own rule
   contradicts its own list for `atelier`, whose repository is `atelier-app`
   — a seat that followed the rule rather than the list wrote `atelier-app`
   five times and was dropped five times.

**Not changed, deliberately.** `tools/board/check.mjs` and
`tools/board/companies.json` are correct and current: `REPOS` on the host at
this hour is exactly the five keys `companies.json` holds, re-derived by the
`grep` in §5. The `COMPANY_SPELLING` rule in `check.mjs` remains the right
defence, because it refuses the lowercase spelling at the write, which is the
only place the spelling can still be changed.
