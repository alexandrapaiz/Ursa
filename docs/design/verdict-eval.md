# Verdict-reader evaluation: measuring the false-satisfied rate

**Status:** in progress, engineer run 2026-09-27.
**Serves:** product-plan §16.8 risk 1, whose stated mitigation is "the
reader is evaluated first against the n=1 transcript, where the true
verdicts are known." No evaluation harness exists yet.

## Why this is the highest-stakes gap in the overlay

`ursa-major/src/verdict.ts` is the only component in Ursa that creates
a label. Everything else joins work to generations; the verdict reader
decides whether the finished work was accepted. A false `satisfied` is
therefore not a bug in a display, it is a fabricated label entering an
outcome record that Ursa Minor sells to a lab, and it violates
vision §0b directly: acceptance is never inferred, only declared.

The reader ships with seven unit tests and no measurement. This
document specifies the corpus, the harness, and the metric.
