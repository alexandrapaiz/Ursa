# Trajectory annotation — task-001 (ursa-minor-site × "Ursa Minor UI")

Hand-annotated from the 31 user prompts now embedded in `outcome_record.json`
(`conversations[0].prompts`), correlated with per-file regeneration churn.
Steps are assistant-step ordinals; the session ran 2026-08-02 (00:17–01:33)
and resumed 2026-08-05 (18:59–20:33).

The organizing principle (Tacit Information): the user could not state what she
wanted in advance — she recognized it on contact. Each **recurrence** of the
same correction is therefore an agentic failure to extract the tacit spec; the
step where the loop closes is where the spec was finally discovered.

## Loop A — star-motion quality: 5 recurrences over 3 days. FAILURE → late success

| step | prompt | signal |
|---|---|---|
| 42 | "make like a shader background? stars kind of like pixels?" | initial tacit ask ("like", "kind of") |
| 100 | "i love the background, but make it move" | accepted statics, opened motion |
| 175 | "dont make the stale stars move left. they can stay twinkling" | failure 1 — wrong motion model |
| 286 | "movement smoother, centered on the mouse. not opposite and away. its quite unsatisfying" | failure 2 — direction inverted; "unsatisfying" = felt, not specified |
| 558 | "smoother… i know its supposed to be pixely, but right now it just looks like its crashing" | failure 3 — **recurred after 3-day gap**; she returned still dissatisfied |
| 615 | "the stars still look like diagonal lines. not randomly placed" | failure 4 — "still" |

Churn: 19 pixel-sky regenerations in steps 100–300; 14 more in 558–660.
`pixel-sky.tsx` is the most-regenerated real file of the project (60 of 193
generations). The spec that was never stated but finally satisfied:
*ambient, smooth, random, mouse-centered — pixelated in look but never in motion.*

## Loop B — constellation placement/scale: 7 recurrences. FAILURE → REGRESSION → success

| step | prompt | signal |
|---|---|---|
| 365 | "in iphone view make the constellation visible, it overlaps with the other stars" | initial |
| 422 | "**still** not clearly visible… scaled too big, text covers it, overlaps frontier labs" | failure 1 |
| 453 | "desktop view is very off now. **it was perfect before**… please restore how it was" | **regression** — fixing mobile broke accepted desktop |
| 497 | "look its oof… **it used to be placed perfectly before**" | regression persists |
| 521 | "i want it on iphone like on laptop: upper right, diagonal star cutoff, not layered" | she now articulates the spec — discovered by seeing wrong versions |
| 650 | "should **not** move with mouse. separate layer. brighter." | failure — motion coupling wrong |
| 710 | "please place the constellation where my mouse is" | **contradicts 650** — tacit information in its purest form |
| 730 | "yesss finallyyy!! lol" | **acceptance, 365 steps after loop opened** |

Churn in window 365–730: 44 index.html + 37 pixel-sky regenerations.
Note steps 650→710: the stated preference reversed within an hour. Neither
statement was the preference; the accepted artifact at 730 is.

## Loop C — darkness calibration: overshoot discovered days later. Closed tacitly at 757–758

| step | prompt | signal |
|---|---|---|
| 77 | "make the background darker" | direction set |
| 175 | "stars visible higher up, the black corner reaches too deep" | overshoot, localized |
| 220 | "top right corner **still** looks too dark" | failure 1 |
| 286 | "when i scroll down the background should get darker" | darkness now wanted — as scroll dynamics |
| 732 | "the color change on scroll disappeared" | **regression** — accepted feature silently lost |
| 754 | "not really, its so dark overall i dont see changes upon scroll" | the step-77 preference boomerangs: global darkness now masks the scroll effect she wants |
| 757–758 | (generations, not prompts) | the fix inverts the approach — raise top-of-page ambience instead of deepening the floor; 75–100% survival, session ends |

**This loop closed tacitly.** The last two generations of the session are the
fix; no verbal acceptance follows in the transcript, but the user confirmed
satisfaction out of band and the site shipped and was retained unchanged.
Silence-plus-retention *is* the acceptance signal (Demonstrated Preference) —
the artifact supplies the label the chat never does. A trajectory reader that
requires stated approval would misclassify this loop as open; retention is the
stronger evidence.

## Loop D — copy overreach: 1 failure, then a learned guardrail

- Step 77: "change the text thats weird… get rid of it" → agent deleted more than intended.
- Step 100: "**no but** the 'ground truth' whatever was the font i actually loved" — the agent conflated content-removal with style-removal.
- Step 402: "change 'information' to 'intelligence' in the titles. **dont change anything else and dont touch the descriptions**" — the double guardrail is the scar tissue of step 100. The user now pre-defends against the agent's known failure mode. Recurrent overreach teaches users defensive prompting; its presence in a prompt is itself evidence of prior failure.
- Step 420: "was information better?" — she asks the model to judge her own reversal; preference not introspectable even to her.

## One-shot successes (for contrast — the baseline that makes failures legible)

- Step 203→220: "more padding from the edge" → "**perfect** on the padding." Geometry with a stateable spec: one shot.
- Steps 335–350: GitHub upload + Vercel deploy: zero corrections. Procedural tasks with verifiable outcomes don't loop.
- Step 120: text shortening + Next.js port + "Systems plural" title fix: accepted without recurrence.

## What this adds to the outcome record

1. **Recurrence count is the failure metric.** Same correction ≥2 times = the
   agent failed to extract tacit intent; Loop B needed 7 rounds. One-shot
   corrections (padding) are normal steering, not failure.
2. **Regressions are a distinct failure class** (3 in this session: 453, 497,
   732): previously *accepted* state destroyed by later edits. For a lab this
   is a direct reward signal — an accepted state is ground truth, and undoing
   it is a measurable error.
3. **Corrections cluster where language runs out.** Every multi-round loop is
   visual/motion ("unsatisfying", "oof", "looks like crashing", "it would be
   better if"); every one-shot is stateable (padding px, plural noun, deploy).
   The recurrence map locates exactly where this user cannot specify and must
   recognize — which is where outcome-based signal is worth the most.
4. **Acceptance is the only stable label — and it is usually tacit.** Step 650
   vs 710 contradict each other; Loop C closed with no verbal approval at all
   (the user was satisfied but never said so in the chat — retention of the
   shipped artifact is the evidence). Stated preferences expire; the kept
   artifact doesn't. Machine-readable form of all of this:
   `annotations.json`, merged into `outcome_record.json` as `signals`.

## v2 implications for the resolver

- Auto-detect candidate loops: cluster user prompts by shared rare tokens
  ("constellation", "smoother", "dark") + same-file regeneration bursts between
  them; a cluster with ≥2 prompts = candidate recurring correction.
- Detect regressions mechanically: a span accepted at step *t* (survived
  several subsequent generations) that disappears at step *t+k* after being
  present in the final's history.
- Per-loop trajectory fields: `opened_step`, `recurrences[]`, `closed_step |
  null`, `resolution: accepted | abandoned | open`.
