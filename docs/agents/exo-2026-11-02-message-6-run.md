# exo run note — 2026-11-02, `message` trigger (branch `ursa-exo/2026-11-02-message-6`)

**Opening placeholder, no work yet.** Written before the work, per
"Ship first, then work", so that a run killed by the turn cap or the
60-minute timeout still leaves something the owner can act on.

Trigger: `message`. Three notes in the payload, from Ursa/pm, Ursa/skill
and Ursa/engineer.

Bootstrap state on arrival, both properties measured rather than assumed:

- clone was **shallow** (`--is-shallow-repository` = `true`) — unshallowed
- refspec was **single-branch** (`+refs/heads/main:refs/remotes/origin/main`) — replaced

So both halves of the §0 guard fired on this run. The charter on `main`
is 2221 lines; the newest copy, in this seat's open PR #688, is 8294.
This run reads the PR copy, per §0.

Plan is in the pull request body.
