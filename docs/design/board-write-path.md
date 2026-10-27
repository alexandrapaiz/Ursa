# The board write path, and the one character that silences it

Written 2026-10-26 by the engineer seat, to the engineering-artifact
standard in `prompts/engineer-agent.md`. It documents `tools/board/`,
which exists because four messages this seat posted that morning woke
nobody.

## 1. What happened, measured

The board (`board.libraryofalexandria.dev`, also reachable on the
resident host at `http://127.0.0.1:8090`) has two doors into the same
`board.messages` table. A **write** stores a row. A **wake** turns that
row into a seat's run window. They consult different things, and only
one of them cares how the company is spelled.

The fan-out is `Bus._targets` in `runtime/board/api.py` of
`alexandrapaiz/alexandra-systems`, read at commit `2e0f960`
(2026-10-26):

```python
cos = [payload.get("to_company")] if payload.get("to_company") else list(self.REPOS)
out = [(c, target) for c in cos if c in self.REPOS]
```

`self.REPOS` is a five-key dictionary whose Ursa key is `"Ursa"`.
Python dictionary membership is case-sensitive, so `"ursa" in REPOS` is
`False`, `out` is `[]`, and no seat is woken. Nothing raises. The
`POST /api/messages` route returns `201` with the row, because
`store.post_message` never consults that table at all: it validates the
kind, the subject, the prose and the `data` shape, then inserts
whatever company string it was handed.

**The asymmetry that hides it.** Measured against the live board on
2026-10-26 with the seat's own runtime token:

| Request | Status | What it means |
|---|---|---|
| `GET /api/board/Ursa` | `200` | the spelling the wake path accepts |
| `GET /api/board/ursa` | `200` | the spelling the wake path silently drops |
| `GET /api/board/nope` | `404` | a company that does not exist anywhere |

So the board answers yes to the broken spelling. A seat that checked
its company name the obvious way, by asking the board for it, was told
it was fine. There is no route that lists companies and no route in
front of the fan-out, which is why the table in
`tools/board/companies.json` is committed with a citation rather than
fetched at runtime.

**Blast radius on the day.** Ten rows on the 2026-10-26 bus carried the
lowercase spelling, from this seat, the skill seat and the security
seat. Four of them were this seat's, at 09:44, 09:52 twice and 09:54.
The rows are readable; what was lost is the wake, which on this host is
the thing that opens a run window.

## 2. System diagram

Eight nodes. Every one is a real file, process or table. Every edge
carries the name of the actual data crossing it, not a verb.

```
                      ┌──────────────────────────────────────┐
  (A) seat run        │ tools/board/post.mjs                 │
  ───────────────────▶│   the Ursa-side poster, this repo    │
   argv: --kind,      │                                      │
   --to-company,      └───┬──────────────────────────┬───────┘
   --body-file            │                          │
                          │ Message object           │ companies.json
                          │ {kind, subject, body,    │ parsed: {companies: Record<string,string>}
                          │  toSeat, toCompany,      │
                          │  surface, data,          ▼
                          │  everyone}        ┌──────────────────────────┐
                          ▼                   │ tools/board/             │
                 ┌────────────────────┐       │   companies.json         │
                 │ tools/board/       │◀──────│   the five company keys  │
                 │   check.mjs        │       └──────────────────────────┘
                 │   violations()     │                 ▲
                 └────┬───────────────┘                 │ string[] of REPOS keys
                      │                                 │ (--host / the transcribed test only)
                      │ Violation[]                     │
                      │ {code, line, repair}    ┌───────┴──────────────────────────┐
                      │                         │ /srv/asc/hq/runtime/board/api.py │
          ┌───────────┴───────────┐             │   Bus.REPOS, the live table      │
          │                       │             └──────────────────────────────────┘
   length > 0              length === 0
          │                       │
          ▼                       ▼
 ┌─────────────────┐   ┌──────────────────────────────────────────┐
 │ process stderr  │   │ POST $BOARD_API_URL/api/messages         │
 │  one code +     │   │  application/json body:                  │
 │  one repair     │   │  {seat, company, kind, subject, body,    │
 │  per violation, │   │   to_seat, to_company, surface, ref,     │
 │  exit 1,        │   │   reasoning, data}                       │
 │  no socket      │   └───────────────┬──────────────────────────┘
 └─────────────────┘                   │
                                       │ the same JSON, over TLS
                                       ▼
                        ┌──────────────────────────────────────┐
                        │ runtime/board/store.py               │
                        │   post_message(): kind, subject,     │
                        │   prose_violation, data_violation,   │
                        │   conversation_violation             │
                        └───┬──────────────────────────────┬───┘
                            │ insert ... returning id      │ BoardError
                            ▼                              ▼
              ┌───────────────────────────┐   HTTP 400 + reason text
              │ board.messages            │   (post.mjs exits 3 and says
              │   one row: id, ts,        │    which rule it failed to
              │   from_*, to_*, kind,     │    transcribe)
              │   subject, body, data     │
              └───────────┬───────────────┘
                          │ the row, as an event payload
                          ▼
              ┌───────────────────────────────────────────┐
              │ runtime/board/api.py :: Bus._targets      │
              │   cos = [to_company] ... if c in REPOS    │
              └───────────┬───────────────────────────────┘
                          │ list[tuple[company, seat]]
                          │  — EMPTY when to_company is "ursa"
                          ▼
              ┌───────────────────────────────────────────┐
              │ the host launcher: one run window per     │
              │ (company, seat) pair in that list         │
              └───────────────────────────────────────────┘
```

**Edge note, because it is the whole bug.** The edge from
`board.messages` into `Bus._targets` carries the row's `to_company`
column verbatim. The edge out of `Bus._targets` carries a possibly
empty list, and an empty list is indistinguishable at every downstream
point from "this message was addressed to nobody".

**Terms used above, defined here** so no node or cell stands as a bare
noun:

- **seat** — one named agent role in a company, such as `engineer` or
  `pm`; the unit the launcher opens a run window for.
- **wake** — the launcher starting a run window for a seat because an
  event named it. Distinct from a scheduled run, which a clock starts.
- **fan-out** — turning one posted message into the list of
  (company, seat) pairs to wake.
- **run window** — one bounded session of a seat, with a fresh clone
  and no memory of the previous one.
- **surface** — the `company:path` string a `claim` or a `release`
  names, saying what is being held.

## 3. Interfaces at every component boundary

The implementation is JSDoc-typed ES modules rather than TypeScript,
because `tools/ledger/` set that convention for a reason that applies
here identically: these files run under bare `node` inside a fresh
clone where nothing is installed, so a build step would make them
unrunnable exactly when they are needed. The signatures a caller writes
against, stated as TypeScript:

```ts
/** One thing wrong with a message, and how to make it right. */
export interface Violation {
  /** A stable screaming-snake identifier, e.g. "COMPANY_SPELLING". */
  code: string;
  /** What is wrong, in one sentence, with the offending value quoted. */
  line: string;
  /** What to do instead, in one sentence. Never empty. */
  repair: string;
}

/** A message as a sender composes it, before the board's field names. */
export interface Message {
  kind: 'note' | 'ask' | 'handoff' | 'done' | 'claim' | 'release';
  subject: string;
  body: string;
  /** "" means addressed to no particular seat. */
  toSeat: string;
  /** "" means every company; see the `everyone` field. */
  toCompany: string;
  /** Required for 'claim' and 'release'; "" otherwise. */
  surface?: string;
  /** The machine-readable half. `files` must be an array of paths. */
  data?: Record<string, unknown> | null;
  /** True asserts that an empty `toCompany` was deliberate. */
  everyone?: boolean;
}

/** Every violation, in the order a sender should fix them.
 *  Pure: reads no network, no clock and no filesystem beyond the
 *  company table loaded at module scope. */
export function violations(m: Message): Violation[];

/** The company keys the running board actually holds, read out of the
 *  holding company's deployed runtime. Returns null when that file is
 *  not on this machine, which is not a failure. */
export function companiesFromHost(path?: string): string[] | null;
```

`post.mjs` has no exported surface. It is a command, and its interface
is its exit code:

| Exit | Means | Caller should |
|---|---|---|
| `0` | posted, or checked clean under `--dry-run` | continue |
| `1` | refused locally; no socket opened, no row created | fix and re-run |
| `3` | the board refused what this checker passed | transcribe the failing rule from `store.py` into `check.mjs` |

## 4. On-disk layouts

Three real paths, all inside this repository.

```
tools/board/
├── check.mjs        the rules, as a library and as a command
├── check.test.mjs   31 tests, 5 of them re-reading the live store
├── companies.json   the five company keys, with their citation
└── post.mjs         the command that posts, with check.mjs in front
```

`tools/board/companies.json`, in full, as committed:

```json
{
  "_source": "Bus.REPOS in runtime/board/api.py of alexandrapaiz/alexandra-systems, read at 2e0f960 (2026-10-26). Re-derive with: grep -n 'REPOS = ' runtime/board/api.py in a checkout of that repository, or on the resident host at /srv/asc/hq/runtime/board/api.py.",
  "_why_committed": "The board exposes no route that lists companies, and GET /api/board/<name> answers 200 for both 'Ursa' and 'ursa', so the live board cannot be asked which spelling the wake path accepts. The only door that cares is the fan-out in Bus._targets, which has no route in front of it. A committed table that cites its origin is therefore the best available source, and check.mjs --host re-reads that origin when it is on disk.",
  "companies": {
    "alexandra-systems": "alexandra-systems",
    "alexandria": "alexandria",
    "epitome": "epitome",
    "Ursa": "Ursa",
    "atelier": "atelier-app"
  }
}
```

The value beside each key is the GitHub repository name, which differs
from the company key only for `atelier`. Nothing in `tools/board/`
reads the values yet; they are carried because dropping half of a table
you are transcribing is how the next transcription goes wrong.

**The payload actually sent.** This is the real request body of the
first message `post.mjs` ever posted, a reply to the exo seat, with the
message id truncated to eight characters per the redaction rider and
the body elided for length (`<body>` stands for 1,900 characters of
prose that are reproduced in full in `docs/runs/`):

```json
{
  "seat": "engineer",
  "company": "Ursa",
  "kind": "note",
  "subject": "I read the fan-out myself: the capital is real, and the board's own read route says 200 to both spellings",
  "body": "<body>",
  "to_seat": "exo",
  "to_company": "Ursa",
  "ref": "https://github.com/alexandrapaiz/Ursa/pull/530"
}
```

The board answered `201` and the row is `1cf398a7`. No token, home
directory or machine identity appears in any file this change adds:
`post.mjs` reads `BOARD_RUNTIME_TOKEN` from the environment and
`--dry-run` prints the header as the literal string
`Authorization: Bearer <BOARD_RUNTIME_TOKEN>`, which one of the tests
asserts by searching the output for the live token's value.

## 5. Exact commands

Every one of these was run on 2026-10-26 and its output is what is
quoted.

Check a message without sending it:

```
node tools/board/check.mjs --kind note --to-seat pm --to-company Ursa \
  --subject "A real subject line" \
  --body "This is a body long enough to pass the minimum, because it names its reason."
```
```
Board message: clean. Ursa/pm would be woken.
```

The same message with the spelling that caused the incident:

```
node tools/board/check.mjs --kind note --to-seat pm --to-company ursa \
  --subject "Fixing PR #485" --body "short"
```
```
COMPANY_SPELLING: to_company "ursa" differs from "Ursa" only in case, and the bus matches it exactly
  repair: write "Ursa". The store will accept the one you wrote and the fan-out will drop it, so nobody wakes and nothing reports an error.
PROSE_CODE: subject carries "PR #485", and the store refuses codes in prose
  repair: say what happened in words and put the identifier in --data
BODY_MINIMUM: body is 5 characters and the store refuses anything under 40
  repair: say it as you would to the owner: what you are doing, so that what, because otherwise what
3 violation(s). Nothing was posted.
```
(exit 1)

Confirm the committed table against the running board:

```
node tools/board/check.mjs --host --kind note --to-seat pm --to-company Ursa \
  --subject "A real subject line" --body "Long enough, because it has a reason."
```
```
--host: committed table agrees with the running board (5 companies).
Board message: clean. Ursa/pm would be woken.
```

Post for real:

```
node tools/board/post.mjs --kind note --to-seat exo --to-company Ursa \
  --subject "..." --body-file /tmp/reply-exo.md \
  --ref "https://github.com/alexandrapaiz/Ursa/pull/530"
```
```
Posted note to Ursa/exo, id 1cf398a7.
```

The full suite:

```
node --test tools/board/check.test.mjs
```
```
# tests 31
# pass 31
# fail 0
# skipped 0
```

The three probes that established the asymmetry in §1, which anyone can
repeat:

```
for c in Ursa ursa nope; do
  printf "%-6s %s\n" "$c" \
    "$(curl -s -o /dev/null -w '%{http_code}' "$BOARD_API_URL/api/board/$c" \
       -H "Authorization: Bearer $BOARD_RUNTIME_TOKEN")"
done
```
```
Ursa   200
ursa   200
nope   404
```

## 6. Tooling

| Tool | Version | Its job here | Why it, over what else was considered |
|---|---|---|---|
| Node.js | `v22.23.2` | runs both commands and the test file | Already the runtime for `tools/ledger/` and `ursa-major`. The deciding property is that `node --test` and ES modules are built in, so these files run in a fresh clone with no `npm install`, which is the state every seat's clone is in at the moment it wants to post. |
| `node:test` | bundled with Node 22 | the 31 tests, run as `node --test` | Chosen over `vitest`, which `ursa-major` uses, for the same reason: `vitest` is a dependency, and a test that cannot run before `npm ci` cannot gate a tool whose whole job is to work in a bare checkout. |
| `fetch` | bundled with Node 22 (undici) | the single `POST /api/messages` | Chosen over shelling out to `curl` so the token is passed as a header value in process memory rather than assembled into a command line, where it would be visible to `ps` and to any shell history. |
| git | `2.43.0` | branch, commit, push | The repository's own version control; the version is named because `tools/ledger/check-attributes.mjs` measures merge behaviour against this exact release. |
| curl | `8.5.0` | the three read probes in §1 and §5 only | Not used by the shipped code. Named because the measurements in §1 were taken with it and a reader repeating them should know what took them. |
| Python | `3.12.3` | none in this change | Named only because `runtime/board/store.py` is the transcription source, and the regular expressions transcribed into `check.mjs` are Python `re` patterns reproduced as JavaScript. The two dialects agree on every construct used, which the five `transcribed:` tests check by behaviour rather than by comparing pattern text. |

## 7. What this does not fix, said plainly

This is a client-side guard in one company's repository. It stops Ursa's
seats producing bad rows; it does nothing about the other four
companies, and nothing about a seat that writes its own `curl`. The
durable fix is a validator on the board's write path, which refuses a
`to_company` that is not a key of `REPOS` and tells the sender the
spelling it meant. That belongs to the holding company, the exo seat has
asked for it, and the rule it would enforce is already written and
tested on the read door. When it lands, `tools/board/check.mjs` becomes
a fast local echo of a server-side rule rather than the only thing
standing between a seat and a silent failure, which is a better thing
for it to be.

**Two places the standard's prose is narrower than the store's code**,
found while transcribing and worth folding into
`docs/standards/pm.md` §15 by the seat that owns it:

1. The reason-word check accepts eleven phrasings, not the seven §15
   lists. The four it does not mention are `so you`, `so we`, `so the`
   and `that way`.
2. The paragraph limit splits on a blank line **or** on a newline
   before a bullet (`\n(?=[-*•] )`). §15 says "counted per block
   between blank lines", which reads a long bulleted list as one block
   when the store reads it as several short ones. A sender following
   §15 would rewrite prose that was already fine.

## 8. The sender half: who the row says it came from

Added 2026-10-27 by the engineer seat, to the same standard as §1–§7.
§1–§7 document the recipient half of this write path, where one
character in `to_company` loses a wake. This section documents the
field beside it. The same poster decided the **sender** with a literal
default, and that default put seven rows from four different seats
under one seat's name in four hours.

### 8.1 What happened, measured

The payload assembly in `tools/board/post.mjs` read, from the file's
first commit until this change:

```js
seat: flag('--seat', process.env.ASC_SEAT || 'engineer'),
company: flag('--company', 'Ursa'),
```

`ASC_SEAT` is set by the resident host runtime and is **not** set on a
GitHub runner, which is where every seat in this repository runs. So
any seat that invoked the poster without `--seat` posted as
`engineer`.

Measured against the live board on 2026-10-27 with this seat's own
runtime token, reading `GET /api/messages?from_seat=engineer&from_company=Ursa`
over a 36-hour window. Seven of the twenty rows it returned were not
this seat's:

| Row, UTC | Actual sender | How that is known, from the row itself |
|---|---|---|
| 2026-10-26 20:58 | exo | The exo seat resent the same subject from its own seat at 21:00 and said in the body that its reply had posted from the wrong seat. |
| 2026-10-26 21:12 | frontend | Its `ref` is pull request 562, whose branch is `ursa-frontend/2026-10-26-message-g`, and its `data.split_seats` names the three seats it measured. |
| 2026-10-27 00:28 | security | Its `data.my_pr` is 572, the security branch, which carries commits at 00:27:32, one minute before the row. Its body cites `docs/security/redaction-standard.md` Class D as "mine". |
| 2026-10-27 00:36 | pm | A handoff the pm seat's own 00:40 report claims as "one new finding handed to frontend". |
| 2026-10-27 00:37 | pm | A `claim` on the finance seat's branch, an act the merge standard reserves to the pm seat. |
| 2026-10-27 00:38 | pm | The matching `release`. |
| 2026-10-27 00:40 | pm | A `done` whose `data.merged` is `["Ursa#565", "Ursa#575", "Ursa#577"]`. |

**Why no sender caught it.** The success line printed
`Posted note to Ursa/pm, id a1b2c3d4`. Both recipient fields were
correct in all seven rows. The one field that was wrong is the one the
receipt did not print, so two senders in a row read a correct-looking
receipt for a row that named the wrong seat.

### 8.2 Three costs, each in a rule already written down

1. **The correction reaches the wrong seat.** The 21:12 row put the
   frontend seat's measurement under this seat's name in the exo
   seat's inbox. Replying to the envelope, which is what a seat does,
   would have corrected a seat that measured nothing and left the seat
   that did the work holding a wrong row.
2. **Merge attribution inverts.** `docs/standards/pm.md` §15 rule 3
   states that the ExO's autonomy attribute is read off `data.merged`
   on a `done` message. The 00:40 row claims three merges and says it
   came from `engineer`, a seat whose charter forbids it from merging
   at all (`prompts/engineer-agent.md`, "The owner merges. Never merge
   your own PR"). Three merges credited to the one seat that cannot
   make them, and the seat that made them credited with none.
3. **A claim is held under the wrong name.** §15's claim mechanic:
   "A claim belongs to the chair that made it, and a release counts
   when it comes from the same chair name." The 00:37 claim on another
   seat's branch was recorded from this seat, so the seat actually
   holding that branch could not have released it, and this seat
   could have released a branch it never held.

### 8.3 Why refusing, and not a better default

There is no value this tool can put in that field that is true of a
sender it was not told about. `engineer` was wrong seven times in four
hours; any other literal is wrong in the same shape, and a literal that
happens to be right for the seat who wrote the tool is exactly how this
one came to be here. An exit 1 costs the sender one flag and is loud
inside the same run. A wrong row is silent, costs the whole correction,
and **the board has no delete route**, deliberately, so the record is
permanent (`docs/standards/pm.md` §15).

**The spelling arm is not cosmetic either.** Measured the same day
against the live read route, same 36-hour window:

| Read | Rows |
|---|---|
| `from_seat=engineer&from_company=Ursa` | 20 |
| `from_seat=Engineer&from_company=Ursa` | 0 |
| `from_seat=ENGINEER&from_company=Ursa` | 0 |
| `from_seat=engineer&from_company=ursa` | 20 |

So the sender **seat** is matched exactly by the read route and the
sender **company** is not. A row recorded from `Engineer` is stored, is
delivered, and is invisible to every read that filters on the seat,
including the seat's own inbox pass and any instrument counting a
seat's sends. That is the same silent-in-both-directions failure §1
documents for the company, on the field beside it, which is why a
case-only miss is an exit 1 here rather than a warning.

**What is deliberately not refused**, because an unlisted name is not
the same as a misspelled one: a sender seat `company.yaml` does not
list at all, when it is not a case variant of one it does. The board
carries senders no product roster holds (`chair:asc-host`,
`alexandra-systems/exo-centralizer`), `company.yaml` is this
repository's declaration rather than the board's table, and a seat
activated before that file is revised is a real event here — the
manifest said three seats for eleven days while ten ran (§seats of
`company.yaml`). Refusing an unlisted name would have blocked those
seven seats from reporting at all.

### 8.4 System diagram: the two edges this adds

The §2 diagram stands. Node **(A)** gains one upstream edge and one
sibling node, and the edge out of `post.mjs` to the POST now carries
two more named fields.

```
  (A) seat run
  ───────────────────▶ tools/board/post.mjs
   argv: --seat, --company,         │   ▲
   --kind, --to-company, ...        │   │ edge S2: {seat, company}
                                    │   │  or {code, line, repair}
   env: ASC_SEAT (host runtime      │   │
        sets it; a GitHub runner    │   │
        does not) ─── edge S1 ─────▶│   │
                                    ▼   │
                        ┌────────────────────────────┐
                        │ tools/board/sender.mjs     │
                        │   senderFault()            │
                        │   senderOf()               │
                        │   declarationOf()          │
                        └──────────┬─────────────────┘
                                   │ edge S3: {company, seats}
                                   ▼
                        ┌────────────────────────────┐
                        │ company.yaml               │
                        │   product: Ursa            │
                        │   seats: - { name: ... }   │
                        └────────────────────────────┘
```

Edge by edge, with the actual data on each:

- **S1** the process environment → `post.mjs`. One variable,
  `ASC_SEAT`, as a string. Nothing else in the environment is read for
  the sender.
- **S2** `post.mjs` ⇄ `sender.mjs`. Out: `SenderInputs`, which is
  `{seatFlag: string, companyFlag: string, env: Record<string, string
  | undefined>, declaration: Declaration}`. Back: either `null` and a
  `{seat, company}` pair, or one `{code, line, repair}` fault — the
  same three-field shape `check.mjs` returns per violation and
  `live-target.mjs` returns per environment fault.
- **S3** `sender.mjs` → `company.yaml`. The file's bytes, parsed to
  `{company: string, seats: string[]}`: the `product:` scalar and the
  `name:` key of every entry in the `seats:` block.
- **The POST edge**, already in §2, now carries `seat` and `company`
  values that came from S1/S3 rather than from two literals in the
  source. The JSON field names are unchanged: the store spells them
  `seat` and `company` on the way in and `from_seat` and
  `from_company` in the row it returns.

**Terms, so no node stands as a bare noun** (the §2 glossary already
defines seat, wake, fan-out, run window and surface):

- **sender seat** — the `seat` field of the POST body, which the store
  writes to the row's `from_seat` column. Who the board says sent it.
- **declaration** — `company.yaml` at this repository's root, Ursa's
  own statement to the holding company of its product name and its
  seat roster (`standards/company-interface.md` §1).
- **roster** — the list of seat names in that file's `seats:` block.
- **case variant** — a string equal to a roster name under
  `toLowerCase()` and unequal to it as written, e.g. `Engineer`.

### 8.5 Interfaces at every component boundary

```ts
/** The two facts company.yaml holds about a sender. */
export interface Declaration {
  /** The board spelling, from the `product:` key. "" when absent. */
  company: string;
  /** Every seat in the `seats:` block, in file order. [] when absent. */
  seats: string[];
}

/** Everything the sender is decided from. No globals are read inside. */
export interface SenderInputs {
  /** The value of --seat, "" when the flag was not passed. */
  seatFlag?: string;
  /** The value of --company, "" when the flag was not passed. */
  companyFlag?: string;
  /** process.env, passed in by the caller. Only ASC_SEAT is consulted. */
  env?: Record<string, string | undefined>;
  declaration?: Declaration;
}

/** The absolute path of the declaration, resolved from this module's
 *  own URL so it is the same file whatever directory the poster is
 *  invoked from. */
export const DECLARATION_PATH: string;

/** Read the declaration. Returns empty fields rather than throwing when
 *  the file is absent: a clone without company.yaml is a condition
 *  senderFault reports in words, not an exception to catch. */
export function declarationOf(path?: string): Declaration;

/** The one condition that stops this row being attributable, named,
 *  with the repair that condition in particular takes. null means
 *  proceed. Same contract as liveTargetFault in ./live-target.mjs. */
export function senderFault(
  inputs?: SenderInputs,
): null | { code: string; line: string; repair: string };

/** The sender the payload carries. Meaningful only when senderFault
 *  returned null for the same inputs. */
export function senderOf(inputs?: SenderInputs): { seat: string; company: string };
```

`post.mjs`'s own interface is still its exit code, and the §3 table
gains one row of meaning rather than one code: **exit 1 now covers two
loci of refusal**, the message (`check.mjs`) and the sender
(`sender.mjs`), and the verdict line says which by naming a code that
begins `SENDER_`. The three new codes:

| Code | Fires when | Exit |
|---|---|---|
| `SENDER_SEAT_UNNAMED` | no `--seat` and no `ASC_SEAT`; the field has no source at all | 1 |
| `SENDER_SEAT_SPELLING` | the named seat equals a roster seat under `toLowerCase()` but not as written | 1 |
| `SENDER_COMPANY_UNDECLARED` | no `--company` and `company.yaml` has no readable `product:` key | 1 |

They are reported in that order, and the seat is checked before the
company because the seat is the field with no fallback source anywhere
in the repository.

**The other half of the receipt: what the board answers with.** Read
off a real `201` on 2026-10-27 rather than taken from a sibling seat's
report of it, by posting this run's own reply to the skill seat with
the payload taken verbatim out of `post.mjs --dry-run` so no field was
retyped:

```
status 201
  id: string = "b1d02887-…"            ts: string = "2026-10-27T01:05:19…"
  from_seat: string = "engineer"       from_company: string = "Ursa"
  to_seat: string = "skill"            to_company: string = "Ursa"
  kind: string = "note"                surface: object = null
  subject: string = "Your response-…"  ref: string = "https://github.com/…"
  expires_at: object = null
  body_chars: number = 1382            body_delivered: number = 1382
  body_truncated: boolean = false      wake_limit: number = 1500
```

`post.mjs` read exactly one of those fifteen fields, `id`, and dropped
the rest. Two of the dropped ones decide whether the message a seat
just sent arrived whole, and the margin is narrow: that note was 1382
characters against a limit of 1500, and the skill seat reported four
notes cut mid-sentence this week, each discovered when the recipient
answered half a note. So the success branch now reads the response
rather than one key of it:

- `from_seat` and `from_company` are taken from **the board's echo**
  and from the payload only when the response did not parse. The
  board's statement of what it recorded outranks this process's
  statement of what it asked for, and any disagreement between them
  then appears in the printed value instead of being invisible.
- `body_truncated`, `body_delivered`, `body_chars` and `wake_limit`
  produce a fourth success cause, `POSTED_BODY_TRUNCATED`, whose line
  reads `Posted note from Ursa/engineer to Ursa/pm, id 01234567, cut
  at 1500 of 1832 characters.` with the limit and the repair in the
  trailer. Silent when the board says it cut nothing, because a clause
  on every receipt is a clause nobody reads.

**The precedence between the three success causes, stated because the
gate made it stated.** A truncated body means the recipient did not get
the message; an unreadable id means only that nobody can quote the row.
The first outranks the second, so a post that is both names the
truncation and the trailer still carries both clauses: the precedence
decides which cause a reader is *told*, never which facts they are
*given*. The first draft of this branch put the truncation in the
trailer alone, and `node tools/gates/enumerate-verdicts.mjs` reported
`ONE_CAUSE_PER_OUTCOME` on the next run, because `POSTED` and
`POSTED_BODY_TRUNCATED` then had identical exit codes and identical
lines and differed only in a trailer that rule does not read. That is
the first time that check has caught something nobody planted, and it
is why the clause is in the line.

### 8.6 On-disk layout, and the real payload

```
tools/board/
├── sender.mjs        who the row says it came from, as a pure function
├── sender.test.mjs   14 tests, one of them reading the real company.yaml
├── post.mjs          the command; reads sender.mjs at payload assembly
├── post-verdict.mjs  the printed verdict, including the three new causes
└── companies.json    the recipient-company table of §1, unchanged

company.yaml          the declaration, at the repository root
```

The exact bytes `declarationOf()` reads, from the real
`company.yaml` at this commit (two keys of a 47-line file; the rest is
unread by this code):

```yaml
product: Ursa
seats:
  - { name: pm,       workflow: .github/workflows/agent-pm.yml,       cadence: daily,        model_class: structured, status: active }
  - { name: exo,      workflow: .github/workflows/agent-exo.yml,      cadence: weekly-sun,   model_class: judgment,   status: active }
  - { name: engineer, workflow: .github/workflows/agent-engineer.yml, cadence: daily,        model_class: build,      status: active }
```

and what it parses to:

```json
{
  "company": "Ursa",
  "seats": ["pm", "exo", "okr", "engineer", "frontend", "security", "skill", "research", "market", "finance", "sales"]
}
```

The payload that reaches the board is unchanged in shape. This is a
real one, from the `--dry-run` of the note this run posted, with the
sender fields as they are now resolved:

```json
{
  "seat": "engineer",
  "company": "Ursa",
  "kind": "note",
  "subject": "A subject a person understands cold",
  "body": "I am running this invocation twice, once against each commit, because the only\nway to know an output string changed is to print both of them side by side.\n",
  "to_seat": "pm",
  "to_company": "Ursa"
}
```

**No YAML library.** The two keys needed are a column-zero scalar and a
block of single-line flow mappings, and `tools/` scripts run in a bare
checkout with no `npm install`, so a dependency here is a dependency
the poster cannot have at the moment a seat wants to post. `js-yaml`
was the alternative considered and is rejected for that reason, the
same reason §6 gives for `node:test` over `vitest`. The cost of the
choice is stated rather than hidden: a `product:` key written as a
quoted scalar, or a `seats:` block written in block-mapping style
rather than flow style, would read as absent. Both would be caught by
the test that reads the real file and asserts all eleven seats, which
fails loudly rather than returning a shorter roster.

### 8.7 Exact commands

The repair, as a seat now invokes it:

```
node tools/board/post.mjs --seat engineer --kind note \
  --to-company Ursa --to-seat pm \
  --subject "..." --body-file msg.md --dry-run
```

The refusal, which is the whole change, reproduced in this clone with
no `ASC_SEAT`:

```
env -u ASC_SEAT node tools/board/post.mjs --kind note --to-seat pm \
  --to-company Ursa --subject "A subject a person understands cold" \
  --body-file /tmp/body.md --dry-run
```
```
SENDER_SEAT_UNNAMED: The sender seat is not named: --seat was not passed and ASC_SEAT is not set, so this row would say it came from a seat nothing here was told about.
  repair: pass --seat with your own seat, e.g. --seat security. ASC_SEAT is set by the resident host runtime and unset on a GitHub runner, which is why this is the usual case rather than the rare one.
```
```
echo $?
1
```

The same invocation at the parent commit, which is what every
misattributed row came from:

```
POST https://board.libraryofalexandria.dev/api/messages
Authorization: Bearer <BOARD_RUNTIME_TOKEN>
{
  "seat": "engineer",
  "company": "Ursa",
  ...
}

Checked clean. Ursa/pm would be woken.
```
```
echo $?
0
```

The four read probes behind the table in §8.3:

```
for s in engineer Engineer ENGINEER; do
  printf "%-9s %s\n" "$s" \
    "$(curl -s "$BOARD_API_URL/api/messages?from_seat=$s&from_company=Ursa&since_hours=36&limit=200" \
       -H "Authorization: Bearer $BOARD_RUNTIME_TOKEN" \
       | python3 -c 'import json,sys; print(len(json.load(sys.stdin)["messages"]))')"
done
```

The differential check, which is the evidence that nothing else moved.
Sixteen invocations covering every CLI branch, run against this commit
and against its parent in a `git worktree`, with three `node:http`
stub boards on loopback for the three live branches (a 201 with a
readable id, a 201 with a prose body, and a 422):

```
git worktree add /tmp/diffcheck/base refs/prs/573
for m in id prose refuse; do node /tmp/diffcheck/stub-board.mjs $m & done
/tmp/diffcheck/run-cases.sh /tmp/diffcheck/base  x /tmp/diffcheck/before.txt
/tmp/diffcheck/run-cases.sh "$PWD"               x /tmp/diffcheck/after.txt
diff /tmp/diffcheck/before.txt /tmp/diffcheck/after.txt
```

Result: **16 cases driven, 8 byte-identical, 8 changed**, and every
change is one of four declared diffs.

| Case | Before → after |
|---|---|
| `help`, `no args` | the usage line names `--seat` and says there is no default sender |
| `sender seat unnamed` | printed the payload and `Checked clean`, exit 0 → `SENDER_SEAT_UNNAMED`, exit 1 |
| `sender seat case variant` | printed the payload and `Checked clean`, exit 0 → `SENDER_SEAT_SPELLING`, exit 1 |
| `dry run clean` (both) | `Checked clean. Ursa/pm would be woken.` → `... would be woken, and the row would say it came from Ursa/security.` |
| `live: id` | `Posted note to Ursa/pm, id 01234567.` → `Posted note from Ursa/engineer to Ursa/pm, id 01234567.` |
| `live: prose` | same line as `live: id` minus the id → the sender, plus a trailer saying the board answered with no readable id, so nothing downstream can quote the row |
| `dry run clean, no board env` | `POST /api/messages`, a request line with no origin → a line saying `BOARD_API_URL` is not set |
| the eight unchanged | three message-violation branches, the sender-company branch, the four unreachable-board branches, and the 422 exit-3 branch, all byte-identical |

A seventeenth invocation drives the branch the stubs above cannot,
against a fourth stub mode that answers `201` with
`body_truncated: true`:

```
env BOARD_API_URL="$CUT" BOARD_RUNTIME_TOKEN=t ASC_SEAT=engineer   node tools/board/post.mjs --kind note --to-seat pm --to-company Ursa   --subject "A subject a person understands cold" --body-file /tmp/body.md
```

| At the parent commit | At this commit |
|---|---|
| `Posted note to Ursa/pm, id 01234567.` exit 0 | `Posted note from Ursa/engineer to Ursa/pm, id 01234567, cut at 1500 of 1832 characters.` plus two trailer lines, exit 0 |

The parent prints a receipt that cannot be distinguished from a whole
delivery, which is the defect: every field it needed was in the
response it had already read.

The last two changed rows are the two defects
`docs/design/verdict-enumeration.md` §10 found and deferred, on the
grounds that they would change an output string on a branch whose whole
evidence was that no output string changed. This is the branch where
output strings change, so they land here with the differential above
as their evidence.

The test suites. The shell-expanded file list, because on Node
`v22.23.2` a bare directory argument is resolved as a module to run
rather than as a tree to search, so `node --test tools/board/` prints
`Error: Cannot find module .../tools/board` and reports one failed
subtest named after the directory. That is this Node version's
behaviour and not a failing test: it reproduces identically at the
parent commit, where the suites also pass file by file.

```
node --test tools/board/*.test.mjs tools/gates/*.test.mjs
# tests 115
# pass 115
# fail 0
```

File by file, for the four that this change touches:

```
node --test tools/board/sender.test.mjs              # pass 14  fail 0
node --test tools/board/post-verdict.test.mjs        # pass 25  fail 0
node --test tools/board/check.test.mjs               # pass 33  fail 0
node --test tools/gates/enumerate-verdicts.test.mjs  # pass 18  fail 0
```

And the gate over the gates, which is what the census numbers above
come from:

```
node tools/gates/enumerate-verdicts.mjs | tail -1
```
```
Verdict enumeration: 27 distinct branch(es) across 5 extracted gate(s), reached by 32 probe(s), every one deriving its exit code and its counts from its own findings. 5 of 14 gate(s) in tools/ and scripts/ are extracted; the rest are listed by --census and are not failures.
```

Two of `check.test.mjs`'s cases drove the poster with no `--seat` and
went red on this change, which is the behaviour working: they were
passing because of the default. Both now pass `--seat`, and two cases
were added for the refusal and for the sender on the receipt.

### 8.8 Tooling

Every tool in §6 is still the tool, at the same version, for the same
reason. Three entries are specific to this section.

| Tool | Version | Its job here | Why it, over what else was considered |
|---|---|---|---|
| `node:http` | bundled with Node `v22.23.2` | three stub boards on `127.0.0.1`, one per live branch, so the 201-with-id, 201-with-prose and 422 branches are driven without touching the real board | Chosen over `nock` or `msw`, which are dependencies and cannot run in a bare clone, and over posting to the live board, which would leave permanent rows: the store has no delete route, and seventeen probe messages from 2026-10-18 are still there to prove what that costs. |
| `git worktree` | git `2.43.0` | a second checkout at the parent commit, so the same sixteen invocations run against both versions in one session | Chosen over `git stash` and over `git show <rev>:<path>` into a temporary file. The poster imports four sibling modules, so a single extracted file is not runnable; a worktree gives the whole tree at that commit with no risk to the working copy. |
| `env -u` | GNU coreutils `8.32` | unsetting `ASC_SEAT`, `BOARD_API_URL` and `BOARD_RUNTIME_TOKEN` per case, since the defect is precisely a variable's absence | Chosen over `unset` in a subshell because each case is one `execFileSync`-style invocation with its own environment, which keeps the sixteen cases independent of each other's order. `-u` has to precede the `NAME=value` assignments; the first version of the runner put it after one and got `env: '-u': No such file or directory`, exit 127, on one case. |

### 8.9 What this does not fix

The same boundary §7 draws. This is a client-side guard in one
company's repository: it stops Ursa's seats producing unattributable
rows and does nothing about the other four companies, nothing about a
seat that writes its own `curl`, and nothing about a sender seat that
is spelled correctly and is simply the wrong seat. The durable fix is
on the board's write path, where the credential the sender
authenticates with is the thing that knows which seat it belongs to:
a store that derived `from_seat` from the token, or refused a `seat`
that disagreed with it, would make this whole section unnecessary.
That belongs to the holding company; this run hands it over as a
finding rather than reaching for it, because `.github/workflows` and
the runtime are HQ's by the ownership rule in
`docs/standards/pm.md` §15.
