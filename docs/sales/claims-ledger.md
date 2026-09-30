# The claims ledger

Opened 2026-09-30, first sales run.

Ursa's charter honesty law is one sentence — "every claim in every draft
must be true and sourced; nothing is promised that the product does not
do today" — and one sentence is not executable. This file makes it
executable. Every claim the company is allowed to make today has an ID
and a source. Every draft in `docs/sales/` cites claim IDs inline, so
the owner can fire a draft without re-deriving whether each line is
still true, and any seat can find, in one grep, every asset that breaks
when a fact changes.

**How to use it.** Before the owner sends anything, the only question is
whether every `[C-n]` in the draft still resolves. When a gate below is
met, the claim moves from the forbidden table to the permitted one, and
`git log` on this file is the record of when the company earned the
right to say it.

**Who maintains it.** The sales seat, every run. Any seat that ships
something on this list should say so in its PR; a claim is not the
sales seat's to invent.

---

## Permitted today

Each row is true as of 2026-09-30 and sourced to a file in this repo.
"Source" is where a reader verifies it, not where it was marketed.

| ID | The claim, in the narrowest wording that is true | Source |
|---|---|---|
| **C-1** | `ursa run <project>` produces outcome records from a git repo's full history in one command, with no daemon, no watcher, and no process running before the command or after it exits. | `CLAUDE.md` §0; `docs/design/product-plan.md` §5 (M0) |
| **C-2** | The run emits `outcome_record.json` plus a browser viewer, and everything stays on the machine it ran on. | `ursa-major/trial/README.md` |
| **C-3** | Four span classes are computed from the artifact, not solicited from anyone: `survived_verbatim`, `survived_mutated`, `generated_deleted`, `no_generation_provenance`. | `CLAUDE.md` §1; `ursa-major/trial/README.md` |
| **C-4** | Two input paths are implemented and documented: Claude Code session transcripts (`--sessions`, every Write/Edit is a generation) and conversations pasted from Claude.ai, ChatGPT or Gemini as markdown (`--conversations`). | `ursa-major/trial/README.md` |
| **C-5** | Code is matched line-by-line and prose (`.md`, `.txt`, `.tex`) sentence-by-sentence, so the method is not code-only. | `ursa-major/trial/README.md` |
| **C-6** | Two trials have been run end to end: n=1 over the Ursa Minor site build, n=2 over the full alexandria repo. | `CLAUDE.md` §0 |
| **C-7** | Acceptance is never inferred from retention. Only the owner's declaration counts, and on the n=2 trial she declared herself **unsatisfied** — recorded as such in the repo. | `CLAUDE.md` §0 |
| **C-8** | The overlay shipped stage 0 on 2026-09-25 and was verified end to end: `ursa bridge <project>` against a hosted page, with a blob store that holds ciphertext only. | `docs/ideas.md`, chair entry 2026-09-25 |
| **C-9** | The satisfaction verdict is read out of the session log rather than asked for with a button, and on the real n=1 record it read satisfied at step 730 from the user's own words ("yesss finallyyy!! lol"), unaided. | `docs/ideas.md`, chair entry 2026-09-25 |
| **C-10** | When the security seat found that raw records carried verbatim user prompts and local paths, the records were moved to a private repo and this repo's history was purged. A record returns only redacted, after a security pass and the owner's per-record sign-off. | `ursa-major/trial/README.md`; All-Hands 002 §4 |
| **C-11** | The method's calibration problem is stated openly with numbers: 55 uncertain spans in task-001, match thresholds currently 0.35–0.6, retuning tracked as a public key result. | `docs/okrs/2026-q4.md` KR1.1; `ursa-major/src/match.ts` |
| **C-12** | Where the n=1 record relied on hand annotation, it says so in the data itself (`signals.method: "manual-annotation"`). | `docs/beyond-preference-pairs.md` §6 |
| **C-13** | The methodology is written down, names five specific deliverable corpora, and states its own limits in a section titled "Honest limits". Draft v0.1, in the open repo. | `docs/beyond-preference-pairs.md` §5, §6 |
| **C-14** | The four principles the product is built on are published on the Ursa Minor site as its north stars. | `ursa-minor/app/page.tsx`; `docs/vision.md` §0b |

Two of these are worth more in a pitch than any capability claim, and
both are the kind a vendor normally hides. **C-7** is the instrument
refusing to flatter its own builder. **C-10** is the consent
architecture costing the company its own demo. Lead with them.

## Forbidden until the gate is met

These are the claims a reasonable person would expect Ursa to make, and
none of them is true on 2026-09-30. Each names the gate that would make
it sayable. Nothing here goes in a draft, a deck, a reply, or an aside,
including in the softened form.

| ID | Do not claim | Why not, today | Gate that earns it |
|---|---|---|---|
| **F-1** | Population scale; "millions of users"; any plural-user statistic | Two trials, one user, who is the owner | O1 KR1.3 (n≥5 records on distinct real works), then M4 (one real second user onboarded) |
| **F-2** | "Cross-model data", or that Ursa holds the same artifact's provenance across two vendors' models | The `--conversations` path **accepts** other vendors' transcripts (C-4), but no record has yet joined generations from more than one source | O1 KR1.3's clause requiring at least one record to join a Claude Code session plus a pasted conversation |
| **F-3** | That a buyer can audit a span back to the generation and the user's words today | Every record with real provenance is in a private repo pending redaction (C-10) | O2 KR2.2: schema documented, viewer hosted, redaction standard written, owner sign-off per record |
| **F-4** | That a user's tuning is imported into every model; portability in production | The import half (MCP server, remote endpoint) is M2/M2.5, unshipped | M2 done: a fresh session states back an axiom unprompted |
| **F-5** | Any customer, pilot, letter of intent, lab conversation, or revenue; any "labs are asking us for this" | Zero contacts, by design, and O4 mandates zero cold outreach this quarter | The owner sending something, and reporting it into `results.md` |
| **F-6** | A shipped see/edit/revoke/delete surface for users | It is a binding non-negotiable and a design commitment (`docs/vision.md` §3), not a screen that exists | A merged PR shipping the surface; then this row cites it |
| **F-7** | Any statistic generalized from the trials — survival rates, percentages, "we find that…" | n=1 and n=2 are existence proofs for label *types*, stated as such | O2 KR2.1: every quantitative claim re-grounded in the n≥5 corpus |
| **F-8** | That exported tuning measurably improves a model's output | M1.5 is the *test* of that, with a pre-registered metric. It has not run | M1.5: `survived_verbatim` pct higher in cycle N+1 than cycle N |
| **F-9** | That the method beats, replaces, or outperforms any named vendor or benchmark | No comparative measurement has been run against any of the twelve entries in `docs/market/landscape.md` | A measurement, published with its method |

## Wordings that are the difference between true and false

The forbidden list fails quietly, in the softened version. These pairs
are the ones a draft is most likely to get wrong, and they are worth
copying verbatim rather than paraphrasing.

- **F-2.** Not "we have cross-model outcome records." Say: *the record's
  input format takes conversations pasted from Claude.ai, ChatGPT or
  Gemini, so a single artifact's provenance can span vendors by
  construction; no such record has been produced yet.*
- **F-1/F-7.** Not "records show that N% of model output never survives."
  Say: *on one record, of one real finished work, the classes came out
  as follows — an existence proof for the label type, not a statistic.*
- **F-3.** Not "fully auditable." Say: *the record carries step ordinals
  joining every label back to the generation and the user's verbatim
  words, which is what makes it auditable; the first public record is
  gated on a redaction pass, because the first one we looked at had
  verbatim prompts in it.*
- **F-4.** Not "works across every model." Say: *reading finished work
  and emitting the record works today; delivering the tuning back into
  a model is the next milestone, and it is not done.*

## Changelog

- 2026-09-30 — opened. 14 permitted claims, 9 forbidden with gates.
