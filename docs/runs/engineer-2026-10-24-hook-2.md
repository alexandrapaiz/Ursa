# Engineer run note — 2026-10-24 (hook, seventh run)

Trigger: `hook`. Payload reason: capacity returned, the provider limit that
refused the previous run has reset.

Status: in progress. This file is written as the run proceeds.

## What woke it

The run before this one (message, sixth run) was refused by a provider limit
mid-flight. It left PR #387 as a silent draft: one real commit following
renames in the durability walk, a stub run note, a placeholder description,
and no test covering the fix.

Under the amended ship-first rule in `prompts/engineer-agent.md`, a draft left
by a killed run is the next run's first obligation. This run inherits #387,
verifies its claim with tests, and ships it.
