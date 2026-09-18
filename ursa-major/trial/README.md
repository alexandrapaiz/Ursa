# n=1 trial — how to feed the resolver

The resolver takes a **finished work** plus the **model generations that fed it**
and emits a provenance-resolved outcome record (`outcome_record.json`) and a
viewer (`outcome_record.html` — open it in any browser; everything is local).

## Input 1: the finished work

Any files or a directory: `--final <path>`. Code files are matched line-by-line,
prose files (`.md`, `.txt`, `.tex`) sentence-by-sentence.

## Input 2a: Claude Code sessions (automatic)

Claude Code already stores every session transcript at
`~/.claude/projects/<project-slug>/<session-id>.jsonl`. Pass them with
`--sessions`. Every `Write`/`Edit` the model made is treated as a generation;
`--path-filter <substring>` keeps only generations aimed at the relevant files.

## Input 2b: pasted conversations (Claude.ai, ChatGPT, Gemini…)

One markdown file per conversation in a folder, passed with `--conversations <dir>`:

```markdown
---
model: claude-opus-5
source: claude.ai
date: 2026-08-05
---

## user
what you asked

## assistant
what the model produced
```

## task-001: the Ursa Minor site

The finished work is `~/Desktop/ursa-minor-site`; the generations are the
"Ursa Minor UI" Claude Code session. From `ursa-major/`:

```bash
npx tsx src/cli.ts \
  --id ursa-minor-site \
  --final ~/Desktop/ursa-minor-site/app ~/Desktop/ursa-minor-site/components \
  --sessions ~/.claude/projects/-Users-alexandrapaiz-Desktop/64899e58-98dd-44a6-940a-3ee95949a31f.jsonl \
  --path-filter ursa-minor \
  --out trial/task-001
```

Then open `trial/task-001/outcome_record.html`.

## Reading the record

- `survived_verbatim` — generated and kept unchanged
- `survived_mutated` — kept but edited; the stored diff *is* the correction
- `no_generation_provenance` — in the final work, traceable to no generation (the human part)
- `generated_deleted` — produced and thrown away (includes superseded drafts — that's the churn signal)

Spans flagged **uncertain** had a rejected best-match between the thresholds
(0.35–0.6); eyeball those first when calibrating. Thresholds live in
`src/match.ts`.
