#!/usr/bin/env bash
# Kept as the name every existing caller already uses (tools/ledger/requeue.sh,
# docs/design/ledger-union-merge.md, three ledger entries). It now installs
# both of this repository's merge drivers, because as of 2026-10-24 there are
# two registers with two grammars and installing one of them is how a clone
# ends up merging the other by lines.
#
#   bash tools/ledger/install-driver.sh
#
# The work is in tools/registers/install-drivers.sh. See
# docs/design/register-merge.md for why the second driver is a separate
# grammar rather than a parameter on this one.
set -euo pipefail
root="$(git rev-parse --show-toplevel)"
exec bash "$root/tools/registers/install-drivers.sh" "$@"
