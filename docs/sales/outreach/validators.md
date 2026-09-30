# Validators and venues — the channel that isn't a channel

**Draft for the owner. Nothing sent, nothing submitted, no account
created.** Companion to `labs.md`. Where that file lists buyers, this
one lists the people and rooms that can make Ursa's claim credible
without Ursa asserting it. `CLAUDE.md` §2 names them as key partners —
"academic AI safety researchers as independent validators of our data
quality" — and this run found that the fit is much sharper than that
line suggests.

## The finding that reframes this

Searching public surfaces on 2026-09-30 for prior art on survival of
model output turned up something the company should know: **academia is
already running survival analysis on AI-generated code, at scale, and
publishing it.**

- "Will It Survive? Deciphering the Fate of AI-Generated Code in Open
  Source" (arXiv 2601.16809).
- A 2026 study reported out of Concordia University's DAS Lab (Emad
  Shihab), accepted at EASE 2026, tracking **200,000+ code units across
  201 open-source projects** with survival analysis, reporting that
  agent-authored code has a ~15% lower modification rate than human code.
- A NAIST study of **1,664 merged agentic pull requests across 197
  projects**, reporting 75% passing review with zero revisions.
- "Debt Behind the AI Boom" (arXiv 2603.28592), reporting ~22.7% of
  464,900 tracked AI-introduced issues still surviving at HEAD.

*(Author lists and venue details were read off search results this run and
must be re-verified before the owner writes to anyone — see `labs.md`
discipline 2.)*

**Read this two ways, and the owner should hear both.**

**It is validation.** "Does model output survive contact with real work,
and how long" is not a question Ursa invented and has to teach the market
to care about. It is a live, peer-reviewed research question in 2026 with
published numbers attached. The methodology publication (O2 KR2.1) is
landing into a conversation already in progress, which is a much cheaper
place to land than an empty one.

**It is also a partial threat, and the claims ledger should absorb it.**
These studies get survival curves from public repositories by
archaeology — diffing commits, attributing authorship, tracking
modification over time. If that becomes routine, then "we can measure
whether model output survived" is no longer differentiated on its own.
What archaeology structurally cannot do, and what remains Ursa's:

1. **The join.** Repo archaeology infers that a line was AI-authored.
   Ursa knows *which generation* produced it, from which prompt, at which
   step, and can hand a buyer the pointer `[C-3]` `[C-13]`. Survival
   without provenance is an aggregate; survival with provenance is a
   training label.
2. **`no_generation_provenance`.** The class that requires knowing what
   the model was *never* in the running for. Archaeology cannot see the
   negative space, because it only sees what is in the repo, not what was
   offered and ignored.
3. **The correction's content.** `survived_mutated` stores the diff, and
   the diff is the correction. A survival curve says the line changed; it
   cannot say along which dimension the user corrected it.
4. **Private and non-code work.** These studies are bounded by what is
   public and what is a repository. Ursa matches prose
   sentence-by-sentence `[C-5]`, and most valuable work is neither open
   source nor code.
5. **The user's verdict in their own words** `[C-9]`.

So the honest positioning against this literature is not "we do it
first." It is: *the field measures survival post-hoc from public repos;
we resolve it to the generation, in private and non-code work, with the
correction preserved and the user's own acceptance attached.* Add that to
the brief's phrasing discipline if a reviewer raises it — and one will.

## Why this is the cheapest credibility Ursa can get

The company's structural problem is stated in `CLAUDE.md` §5: the buyer
is also the entity most able to shut it down, and the primary asset can
be destroyed in a week. In that position, **a claim Ursa makes about its
own data quality is worth a fraction of the same claim made by someone
with no stake in it.**

And right now Ursa has something a research group genuinely wants and
cannot get: these studies are stuck with *inferred* AI authorship. Ursa
has resolved provenance on real finished work. That is not a favour being
asked; it is a dataset the literature is currently working around the
absence of. Two records is too few to matter to them today, which makes
this a real gate, not a soft one — but at n≥5 (O1 KR1.3) it becomes a
conversation with something in both hands.

| Group | Why them | What we'd have that they want | Gate |
|---|---|---|---|
| Concordia DAS Lab (**VERIFY** lead and current roster) | Closest published method to ours; already doing survival analysis at scale on code | Ground-truth provenance instead of inferred authorship, which is the acknowledged weak point of repo archaeology | O1 KR1.3 (n≥5) **and** `[F-3]` cleared, since they would need to see a record |
| NAIST agentic-PR group (**VERIFY**) | Studies agentic PRs specifically — and Ursa's own PR adapter reads corrections inside pull requests | Review-comment-level corrections joined to the generation they corrected | Same |
| Stanford CRFM / HELM lineage — **Percy Liang** (**HIGH**) | The most durable public position on evaluation transparency and reproducibility; HELM is the standing argument that benchmarks must be inspectable | A published methodology with a limits section and an open classifier — and a critic who will find what is wrong with it | O2 KR2.1 published (Nov 30) |
| **Douwe Kiela** — Contextual AI; previously DynaBench (**VERIFY** current role) | Built DynaBench explicitly because static benchmarks saturate and stop measuring anything. That is Ursa's fourth principle in someone else's words, from someone who already built a product on it. Also an enterprise fine-tuning company, so he is in-segment as a buyer too | An outcome signal that re-anchors continuously rather than saturating (`docs/beyond-preference-pairs.md` §2, assumption 3) | O2 KR2.1 published |

## Venues, and the one date that matters

| Venue | Culture note, and what actually works there | Timing |
|---|---|---|
| **NeurIPS 2026** — Dec 6–12, Sydney, with satellites in Atlanta (Dec 8–13) and Paris (Dec 9–13) | Not a place to pitch. It is the one week when most of `labs.md` is in three rooms. The asset that works is a printed one-pager and the ability to answer "how many users" with "two, here's what that does and doesn't establish." The satellites matter operationally: Atlanta and Paris are reachable without a Sydney trip | **The binding date in this document.** KR4.1 and KR4.2 are due Dec 15, nine days after NeurIPS ends. For the artifacts to be usable rather than merely delivered, they need to be final by late November |
| **ICLR 2027** — Apr 26–30, 2027, California | **The submission window has closed**: abstracts were due 2026-09-18, full papers 2026-09-25, both now past. Worth recording so nobody plans a Q4 sprint toward a deadline that has already gone | Deadline passed. Next realistic archival venue is ICML 2027 or a workshop |
| **ICML 2026** poster track, incl. "Rubric Curriculum RL: Exploiting the Generation-Verification Gap in Non-Verifiable Domains" | Names the exact gap Ursa's brief opens with, in the organizers' own words. The right use is citation and reading, not attendance | Already scheduled; read the room's output |
| **Interconnects** (Nathan Lambert) | Read by the buyer set. Never a pitch target — a reader. Coverage is earned by publishing something worth linking, which means it is downstream of O2 KR2.1 and nothing else | After Nov 30 |
| **arXiv / a workshop paper** | The methodology doc is already structured like a paper (claim, falsified assumptions, constructions, limits). Converting it is small work with outsized effect: it makes the citation permanent and is the difference between a company blog post and prior art | Owner's call. Not proposed as work; noted as available |

## The line this file must not cross

Independent validation is only worth anything if it is independent.
Nothing here proposes paying a validator, offering exclusivity, or
shaping a finding. If a group ever looks at an Ursa record and reports
that the labels are weaker than claimed, that result is an asset — it is
the same mechanism as `[C-7]`, the unsatisfied verdict we keep in the
repository, and the same reason a buyer would believe anything else we
say.
