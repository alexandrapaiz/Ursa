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
# WHEN THIS SCRIPT CAN BE DELETED, written here because this is the file
# somebody will be reading when the condition arrives. Both defects above
# were reported upstream and HQ's engineer fixed both on 2026-11-09: a
# missing scan root is now named on stderr and in the JSON as
# `skipped_roots`, a scan where none of the roots exist is a new exit 3
# instead of exit 0, and the default baseline now applies to the repository
# scan and not only to the hook, with `--no-baseline` to ask for the raw set.
# So the bare command will do what its name says. That fix is in an OPEN
# pull request at HQ as this is written, not on HQ's main and not re-vendored
# here, so the wrapper stays until the re-vendor actually lands. What makes
# it droppable then is not the exit codes, it is the roots: HQ deliberately
# did not change them, because an explicit file list is the answer this tool
# has always supported and a second configuration surface for scan scope is
# worse than this script. So the half of this file that survives any
# re-vendor is the `find` below; the two paragraphs above it are the part
# that becomes history.
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

# `--print-files` emits the list and scans nothing, so another tool can run
# the checker over the IDENTICAL set rather than re-deriving it. The whole
# point of this script is that Ursa's layout is written down once;
# `tools/secret-print-exemptions.py` needs the same list to run the checker
# twice with suppression on and off, and a second copy of the `find` above
# would be two implementations that agree only on the day they are written.
if [ "${1:-}" = "--print-files" ]; then
  printf '%s\0' "${files[@]}"
  exit 0
fi

exec python3 tools/check-secret-print.py \
  --baseline tools/secret-print-baseline.txt "$@" "${files[@]}"
