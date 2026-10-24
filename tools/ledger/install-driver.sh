#!/usr/bin/env bash
# Kept as the name every existing caller already uses; the work moved.
#
# This script used to register the `ledger` driver and nothing else, and write
# one hardcoded line into .git/info/attributes. That was complete when the
# repository declared one merge attribute. It stopped being complete when
# `.gitattributes` gained `docs/agents/incidents.md merge=register` and
# `docs/decisions.md merge=register`: a clone that ran this script carried the
# ledger driver, carried no `merge.register.driver`, and git then merged both
# registers with the default line merge while naming no driver on either
# stream. `tools/ledger/requeue.sh` called this script, so the tool that drains
# the conflict backlog was the one leaving the two newest registers unprotected.
#
# There is now one installer for all of this repository's drivers, and it
# checks its own post-condition. This delegates to it so no caller has to
# change and no second copy can drift.
#
#   bash tools/ledger/install-driver.sh
#
set -euo pipefail
root="$(git rev-parse --show-toplevel)"
exec bash "$root/tools/registers/install-drivers.sh" "$@"
