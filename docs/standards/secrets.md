# Standard: Secrets

> Vendored from alexandra-systems `standards/secrets.md` (HQ ADR-038,
> 2026-09-25). Ursa's adoption is ADR-006. Deviations go in
> docs/decisions.md.

How every Alexandra Systems company stores, moves, and rotates
credentials. Decided at Ursa (Ursa ADR-006, 2026-09-25) and generalized
to the portfolio the same day at the owner's instruction. A product
adopts this by vendoring it into `docs/standards/secrets.md`; deviations
are that product's ADRs. Changes to this standard are HQ ADRs.

## 1. Source of truth

**Infisical is the portfolio's secrets store of record** (US cloud, the
owner's account, `app.infisical.com`). GitHub Actions secrets are a
sync target, never a store: they are write-only by design, so a value
that lives only in GitHub cannot be recovered, rotated centrally, or
audited. A secret's home is an Infisical project; everything else is a
copy the sync layer maintains.

One Infisical project per company (`ursa`, `alexandria`, `epitome`,
`alexandra-systems`), each with a `prod` environment. A secret shared
across companies (a Slack webhook, an OpenRouter key) lives in
`alexandra-systems` and syncs outward, so rotation is one edit.

## 2. Migration is lazy, never bulk

Existing GitHub Actions secrets keep working untouched. GitHub cannot
export them, so bulk migration would mean re-pasting every value by
hand, which is exactly the friction this standard exists to remove. A
secret enters Infisical at its **next natural rotation** (expiry,
provider reset, or incident), not before. Until then GitHub remains its
only home and that is acceptable.

## 3. Entry: once, blind, at the terminal

New and rotated secrets enter through the CLI, piped so the value is
never displayed, never in chat, never in shell history as a literal:

    pbpaste | tr -d '\n' | infisical secrets set NAME --env=prod

The owner copies the value at the provider, runs the line, and is done.
Agents and seats never type, paste, display, or relay a secret value;
an agent's role ends at preparing the command and naming the secret.
Generated tokens that support output capture may be piped
generator-to-CLI directly so no human sees them either.

## 4. Distribution: sync, not hands

Infisical's native GitHub integration pushes each project's secrets to
its repos' Actions secrets. One OAuth authorize by the owner per
account; after that, rotation in Infisical propagates without anyone
touching a value. Prefer the native sync over machine identities.
Machine identities (Universal Auth) are allowed only where a runtime
must read secrets at boot outside GitHub Actions (the host's Temporal
workers, a Modal deployment), and each one is an ADR in its company
with the scope it can read.

## 5. Invariants

- No secret value in chat, logs, PR text, workflow output, or any
  repository file. Redaction gates (Ursa `redaction-gate.yml`) stay in
  CI regardless of this standard.
- Seats cannot list or read secrets (`gh secret list` returns 403 by
  design); they infer presence from behavior and queue misses for the
  owner.
- Creating provider keys and granting OAuth stays owner-only. Money,
  secrets, purpose: the three owner-only lanes (pm standard) are
  unchanged.
- `.infisical/` and `infisical-config.json` never enter a repository.
