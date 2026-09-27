# Pending workflow changes — for the owner to apply

The ExO seat designs `.github/workflows/` but cannot write it. The
runner's token is refused on that path and no `permissions:` setting
changes it, so changes are specified here in full and the owner applies
them by hand. Each entry carries the evidence, the exact file, and the
exact content. Delete an entry once it is applied.

Verify the boundary by attempting it rather than trusting this file. If
a future run finds the path writable, apply the change directly and fix
prompts/exo-agent.md §5 instead of queueing here.

---

All four queued entries (PWC-1 redaction gate, PWC-2 product-plan
redaction, PWC-3 trial README redaction, PWC-4 repo description and
topics) were applied by the chair on the owner's directive,
2026-09-24. Entries deleted per this file's own rule.

---

## PWC-5 — Pin actions to commit SHAs

Queued by the security seat, 2026-09-27. Evidence:
docs/security/audit-2026-09-27.md finding 4. The boundary was verified
rather than trusted, as this file asks: a push touching
`.github/workflows/` was attempted this run and the remote refused it
with "refusing to allow a GitHub App to create or update workflow ...
without `workflows` permission". So this file is still the right place.

**Evidence.** Every `uses:` in `.github/workflows/` names a mutable
tag: `anthropics/claude-code-action@v1` 15 times,
`actions/checkout@v4` 12 times, `actions/setup-node@v4` once. A tag can
be moved to any commit by whoever controls the repository that owns it.
The step that would then run holds `contents: write`,
`pull-requests: write`, `id-token: write`, and every secret in its
job's environment, including `CLAUDE_CODE_OAUTH_TOKEN`. This is the one
finding in the audit whose blast radius is the whole repository.

**Change.** Replace each tag reference with the commit SHA it currently
resolves to, keeping the tag in a trailing comment so the version stays
readable and Dependabot can still bump it:

    - uses: actions/checkout@<sha>  # v5.0.0

Resolve each SHA at apply time rather than from this file, since the
tags may have moved between the writing and the applying:

    gh api repos/actions/checkout/git/ref/tags/v5 --jq .object.sha
    gh api repos/actions/setup-node/git/ref/tags/v4 --jq .object.sha
    gh api repos/anthropics/claude-code-action/git/ref/tags/v1 --jq .object.sha

An annotated tag returns a tag object rather than a commit; dereference
with `--jq .object.sha` against
`repos/OWNER/REPO/git/tags/<sha>` in that case.

**One version bump to fold in.** Every run currently logs
"Node.js 20 is deprecated. The following actions target Node.js 20 but
are being forced to run on Node.js 24: actions/checkout@v4." Move
checkout to v5 while pinning, rather than pinning a version that is
already being overridden at runtime.

**Files.** All twelve files in `.github/workflows/`.

**Risk.** None to behavior, since a SHA that a tag currently points at
runs exactly what the tag runs today. The cost is maintenance: pinned
actions no longer pick up upstream fixes on their own, so this is worth
pairing with Dependabot for `github-actions` if the owner wants the
bumps offered automatically.

---

## PWC-6 — Stop handing `PROJECTS_TOKEN` to seats that never read it

Queued by the security seat, 2026-09-27. Evidence:
docs/security/audit-2026-09-27.md finding 4.

**Evidence.** `PROJECTS_TOKEN: ${{ secrets.PROJECTS_TOKEN }}` sits in
the job-level `env:` block of all eleven agent workflows, and appears
exactly once in each file, which is that line. Nothing reads it, in any
workflow or any script. Only `prompts/exo-agent.md` and
`docs/standards/pm.md` mention it at all, and
`docs/sprints/pending.md` records the secret as still unset.

A job-level `env:` value is readable by every step in that job,
including the agent step, which runs with `--permission-mode
bypassPermissions`. `agent-security.yml` already documents this exact
reasoning for `SLACK_WEBHOOK_URL` and deliberately scopes that value to
the single step that needs it. The same reasoning applies here and has
not been applied.

**Change.** Delete the `PROJECTS_TOKEN` line from the job-level `env:`
block of these nine, none of whose charters mention it:

    agent-engineer.yml   agent-finance.yml   agent-frontend.yml
    agent-market.yml     agent-okr.yml       agent-research.yml
    agent-sales.yml      agent-security.yml  agent-skill.yml

Keep it in `agent-exo.yml` and `agent-pm.yml`, whose charters do use it
for the Projects board, and scope it there to the step that needs it
rather than to the job, matching the `SLACK_WEBHOOK_URL` pattern
already in `agent-security.yml`.

**Risk.** None. The secret is unset today and unread everywhere. If a
seat later needs it, adding it back to one step is a one-line change,
and that is the direction the least-privilege argument runs in anyway.

**Same shape, not queued.** `NEON_RO_URL` is job-level in
`agent-research.yml` and `agent-skill.yml`, and `OPENROUTE` is
job-level in four more. Those are named in their seats' charters, so
narrowing them is the owning seat's call rather than a security fix.
Worth the same treatment when those workflows are next edited.
