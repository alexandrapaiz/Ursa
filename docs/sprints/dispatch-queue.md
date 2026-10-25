# Dispatch queue — 2026-10-25, standup, hook-triggered (ninety-ninth pass)

`PM_DISPATCH_ENABLED` is unset in this run's own environment
(`[ -n "$PM_DISPATCH_ENABLED" ]` false), and `DEFAULT_WORKFLOW_TOKEN`
is also unset, so nothing fires as a `gh workflow run` dispatch below
regardless of what qualifies. Same shape as every host-triggered pass
this week; the switch has only been confirmed non-empty from inside a
scheduled GitHub Actions run (2026-10-17), not from this host surface.
Written in full per pm.md §0b.

## This run's trigger

A `hook` event: "capacity returned — the provider limit that refused
your last run has reset, and nothing else would have woken you until
your next scheduled window." Not a message naming a specific PR or
seat; the charter's own standup reading order applies in full.

## Candidates considered, none fired as a dispatch

1. **The market self-trigger loop (Incident 20, this pass's own
   finding) is not a dispatch candidate.** The fix is event-bus or
   workflow wiring, not a seat building something; dispatching market
   again would just add an eleventh link to the same chain. Handed to
   HQ/exo-centralizer via the ledger proposal instead.
2. **#404/#394 (exo) and #395 (research) are not dispatch
   candidates.** Both are green, clean, finished work waiting on a
   merge authority this seat does not hold (Tier C). There is nothing
   to dispatch either seat to go build; the work is already done.
3. **Exo may never be dispatched by this seat in any case** (pm.md
   §11.4: never the exo that audits this seat).
4. **#348 (skill, `CONFLICTING`) is a rebase the skill seat owns, not
   a dispatch candidate today.** It does not meet §11.3's "two or more
   open PRs on one scope, none merged" test by itself, and the skill
   seat's own cadence already reads its open PRs first.
5. **No other §11.3 criterion is newly met.** No failing Minor-site or
   Major-resolver check (`gh run list --limit 30` shows nothing
   non-success since yesterday). No ADR names an experiment with no
   run behind it. No tuning or trial run sits unrecorded in the ledger
   for a day. No Minor-site or Major-resolver check is red on any open
   PR.

## Dispatched by the PM

None this run. `PM_DISPATCH_ENABLED` is unset, and no candidate above
would have fired even with it set.
