# Dispatch queue — 2026-10-14, six-hour pass (~18:21 UTC, message-triggered)

`PM_DISPATCH_ENABLED` is unset in this run's own environment (a
host-window pass, not the scheduled Actions run), confirmed with
`printf`, so nothing fires regardless of content, same as every prior
host-window pass today.

## What changed since the last entry

The wall now has a fix sitting on `main`'s doorstep rather than only a
diagnosis. PR #192 (`exo-centralizer/2026-10-14-dispatch-guards`) adds
`actions: read` and `allowed_bots: "github-actions[bot]"` to every
`claude-code-action` step across all eleven `agent-*.yml` files, green
and clean. This pass read it, confirmed it matches its own description,
and declined to merge it: the run's own boundary is "never touch
secrets or workflows," and a workflow-file change sits inside that
line regardless of what the vendored standard's Tier B text would
otherwise allow. Escalated to the owner or a chair via an `ask` to
`alexandra-systems/exo-centralizer`; full account in
`docs/decisions.md`. Until someone who can touch workflows merges it,
the wall stands exactly as before.

## Proposed, not fired this run

1. **Security** — sprint item 3, draft
   `docs/security/redaction-standard.md` (O2 KR2.2). The item is
   overdue by the §11.3 criterion; the PR survey (§11.3a) found one
   live candidate, #190, the branch security revived itself this pass
   after its own prior draft closed unattributed. Not a "build on the
   open branch" case needing a dispatch: security is already on it,
   still a draft, updated within the last few hours. The exact
   command, if the wall were down:
   `gh workflow run agent-security.yml -f owner_instructions='Sprint
   item 3 (sprint-2026-10-12.md): finish docs/security/redaction-standard.md
   against the fixture at ursa-major/fixtures/mini/record/ on your
   revived branch, pull request 190.'`

**Not fired, for two independent reasons.** First, security already
has live, recent work in progress on the right branch, so a dispatch
would duplicate rather than help. Second, the wall itself: even if it
needed one, firing would spend a dispatch slot reproducing the same
bot-actor refusal `docs/agents/incidents.md` Incident 13 already
demonstrated, and that refusal does not clear until PR #192 above
actually lands on `main`.

Only one candidate this pass; frontend has nothing live to build on
since its last draft closed, and no new frontend work has opened.

## Failed-run triage this run (§11.7)

`gh run list --status failure --created ">=$(date -u -d '-6 hours'
+%FT%TZ)"` and the broader 24-hour window both return empty. Nothing
to classify, rerun, or hand off this pass.

## What this seat is not chasing further

The Ursa-specific half of the `allowed_bots` fix is no longer
unopened; it is PR #192, waiting on a merger this seat cannot be for
the reason stated above. Not chasing it further than the one `ask`
already sent, since repeating the same message without new evidence
would be noise, not progress.
