#!/usr/bin/env python3
"""HQ's test suite for the vendored secret-print checker, run against Ursa.

    python3 tools/secret-print-tests.py

Why this wrapper exists rather than `python3 -m unittest discover -s
tools/tests`. The suite is vendored from alexandra-systems alongside the
checker and says "do not edit here", and two of its 74 tests assert against
HQ's directory layout rather than against the checker:

  TheSafeFormsAreNeverFlagged.test_check_actions_reach_is_clean
      scans `tools/check-actions-reach.sh`, HQ's Actions-reachability probe,
      as the standing false-positive reference for all four safe shapes at
      once. Ursa does not have that tool, so the checker exits 2 (refused,
      cannot read) where the test wants 0.

  TheRegisterTheRuleLivesIn.test_the_register_is_still_scannable_when_a_caller_names_it
      names `standards/lessons.md`. Ursa keeps the register at
      `docs/standards/lessons.md`, so again 2 rather than the expected 1.

Both are absent fixtures and neither is a defect in the checker. Editing the
vendored file to skip them would be dropped by the next re-vendor without
telling anybody, so the knowledge lives here instead.

This runner fails if anything outside that pair fails, and it also fails if
either of the pair starts passing, because that means the fixture arrived and
this exemption should be deleted rather than carried.
"""
import os
import sys
import unittest

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

EXPECTED_ABSENT_FIXTURES = {
    "test_secret_print.TheSafeFormsAreNeverFlagged.test_check_actions_reach_is_clean":
        "tools/check-actions-reach.sh is HQ's and Ursa does not have it",
    "test_secret_print.TheRegisterTheRuleLivesIn"
    ".test_the_register_is_still_scannable_when_a_caller_names_it":
        "the register is at docs/standards/lessons.md here, not standards/",
}


def main():
    sys.path.insert(0, os.path.join(ROOT, "tools", "tests"))
    suite = unittest.defaultTestLoader.discover(
        start_dir=os.path.join(ROOT, "tools", "tests"), top_level_dir=os.path.join(ROOT, "tools", "tests"))
    result = unittest.TextTestRunner(verbosity=1, stream=sys.stderr).run(suite)

    def name(test):
        return f"{test.__class__.__module__}.{test.__class__.__name__}.{test._testMethodName}"

    failed = {name(t) for t, _ in list(result.failures) + list(result.errors)}
    unexpected = sorted(failed - set(EXPECTED_ABSENT_FIXTURES))
    now_passing = sorted(set(EXPECTED_ABSENT_FIXTURES) - failed)

    print()
    print(f"ran {result.testsRun}, "
          f"{len(failed & set(EXPECTED_ABSENT_FIXTURES))} exempt as absent fixtures, "
          f"{len(unexpected)} unexpected")

    for n in unexpected:
        print(f"  FAIL      {n}")
    for n in now_passing:
        print(f"  NOW GREEN {n} -- {EXPECTED_ABSENT_FIXTURES[n]}")
    if now_passing:
        print("  The fixture this exemption was written for now exists, so"
              " delete the entry from EXPECTED_ABSENT_FIXTURES.")

    if unexpected or now_passing:
        return 1
    print("the vendored checker passes every test that is about the checker")
    return 0


if __name__ == "__main__":
    sys.exit(main())
