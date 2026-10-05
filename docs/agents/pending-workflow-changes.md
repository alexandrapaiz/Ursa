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

## PWC-5 — dogfood the resolver Action on this repository

Queued by the engineer seat, 2026-10-05, from the `asc/chair:ursa`
handoff "Build stage one of the surfaces: the resolver as a GitHub
Action." Evidence that it is needed: the Action
(`ursa-major/action.yml`) is built, tested and bundled on pull request
#92, and `docs/design/resolver-action.md` §8.1 records that nothing has
run on a real GitHub runner yet, because the first real run needs a
workflow file and this seat's run instructions forbid writing one.

Why this repository first: Ursa's own commits carry the
`Co-Authored-By: Claude` trailer that `src/pairfinder.ts` matches, so
every seat's merged pull request is a work unit the resolver can read.
The product plan's own GitHub-spine milestone is written as "one real
merged PR in a repo she owns, run through the Action," and this is that
repository.

Exact file to create: `.github/workflows/ursa-resolve.yml`. Exact
content: a copy of `ursa-major/examples/resolve-on-merge.yml` with two
changes, both for a first run on a live repository.

1. `uses: alexandrapaiz/Ursa/ursa-major@main` becomes
   `uses: ./ursa-major`, because the Action lives in this repository and
   a local path needs no tag.
2. `post-comment: 'false'` for the first run, so the first live
   execution writes to the job log and comments on nobody's pull
   request. Flip it to `'true'` once one run's log shows the five fields.

```yaml
name: Ursa resolve

on:
  pull_request:
    types: [closed]

permissions:
  contents: read
  pull-requests: write

jobs:
  resolve:
    if: github.event.pull_request.merged == true
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
        with:
          fetch-depth: 0
      - id: ursa
        uses: ./ursa-major
        with:
          min-chars: '200'
          post-comment: 'false'
      - name: Print the five fields the comment carries
        run: |
          echo "units resolved:            ${{ steps.ursa.outputs.units-resolved }} of ${{ steps.ursa.outputs.units-found }}"
          echo "chars survived verbatim:   ${{ steps.ursa.outputs.chars-survived-verbatim }}"
          echo "chars survived edited:     ${{ steps.ursa.outputs.chars-survived-edited }}"
          echo "most corrected artifact:   ${{ steps.ursa.outputs.most-corrected-artifact || 'none' }}"
          echo "tuning delta:              ${{ steps.ursa.outputs.tuning-delta }} (${{ steps.ursa.outputs.tuning-mode }})"
```

No secret is required. The default `GITHUB_TOKEN` with
`pull-requests: write` is enough, and no Anthropic credential is passed,
so the distiller runs in CI mode and the tuning delta is an honest zero.

Apply after pull request #92 merges, since the workflow references
`./ursa-major/action.yml` and `ursa-major/dist/ursa.cjs`, neither of
which exists on `main` until then.
