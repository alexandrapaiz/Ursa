#!/usr/bin/env bash
# Ursa's layout, handed to HQ's vendored checker.
#
# `tools/check-secret-print.py` is vendored and says "do not edit here", so
# its `SCAN_DIRS` stays HQ's: `tools`, `standards`, `runtime`,
# `.github/workflows`, `site`. Three of those five are alexandra-systems
# directories that Ursa does not have, and Ursa keeps its standards under
# `docs/standards/`. `default_targets()` skips a missing directory in
# silence, so the bare command reads as repository-wide and covers 24 files,
# all of them under `tools/` and `.github/workflows/`, while Ursa's own
# runnable code in `ursa-major/` and `docs/design/` is never looked at.
#
# The checker takes an explicit file list that overrides its defaults
# (`targets = files or default_targets()`), and it takes files rather than
# directories. So the adaptation belongs in a file of ours that builds the
# list, not in a one-line edit to a vendored file that the next re-vendor
# would drop without telling anybody.
#
# It also supplies `--baseline`, which the bare command does not. The
# checker defines `DEFAULT_BASELINE` but consults it only on the hook's
# file-edit path, so a repository scan without the flag reports the 22
# accepted GitHub Actions masking lines as findings and exits 1. That is
# upstream behaviour and is not worked around here beyond passing the flag.
#
# Exit status is the checker's own: 0 clean, 1 findings, 2 refused.
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$root"

mapfile -d '' files < <(
  find tools .github/workflows ursa-major ursa-minor docs prompts \
    -type d \( -name node_modules -o -name __pycache__ -o -name .venv \
               -o -name dist -o -name build \) -prune -o \
    -type f \( -name '*.sh' -o -name '*.bash' -o -name '*.zsh' \
               -o -name '*.yml' -o -name '*.yaml' -o -name '*.py' \) \
    -print0 2>/dev/null | sort -z
)

if [ "${#files[@]}" -eq 0 ]; then
  echo "secret-print-sweep: found no files to scan, which is a bug in this" \
       "script and not a clean result" >&2
  exit 2
fi

exec python3 tools/check-secret-print.py \
  --baseline tools/secret-print-baseline.txt "$@" "${files[@]}"
