#!/usr/bin/env bash
# End to end against a REAL npm install rather than a decoy.
#
#   bash endtoend.sh <old-tool> <new-tool> <install-cwd> <cache>
#
# Both tools must live in the kit directory, because each derives the
# checkout root from its own path and a copy under /tmp resolves it to `/`,
# which silently turns every same-checkout verdict into `elsewhere`. The
# first version of this script ran the old copy from /tmp and its output was
# not a differential at all.
#
# One install at a time, which is the first of the two guards the exo seat
# handed back. The install is left to finish rather than killed, because
# killing npm mid-unpack is the hazard this whole file is about.
#
# The install is started with the --cache FLAG and not the variable, on
# purpose. The flag is the shape that distinguishes the two halves of the
# repair: it is in argv only before npm retitles, so a verdict naming the
# path can only have come from a pre-retitle read, and a verdict saying
# UNREADABLE can only have come from a post-retitle one. With the variable
# both reads succeed and the timing is invisible.
set -uo pipefail
OLD="$1"; NEW="$2"; CWD="$3"; CACHE="$4"
field0() { local -a f=(); { mapfile -d '' -t f < "/proc/$1/cmdline"; } 2>/dev/null; printf '%s' "${f[0]:-GONE}"; }

rm -rf "$CACHE"                     # cold, so the pre-retitle phase is not clipped
( cd "$CWD" && rm -rf node_modules && exec npm i --no-save playwright --cache "$CACHE" ) \
  </dev/null >/dev/null 2>&1 &
NPMPID=$!                           # exec, so this IS npm and not a wrapper shell
T0=$(date +%s%N)
ms() { echo $(( ( $(date +%s%N) - T0 ) / 1000000 )); }

echo "npm pid=$NPMPID  field0 at $(ms) ms: $(field0 "$NPMPID")"
echo
echo "both tools, alternating, until the install ends. t is when the tool RETURNED."
printf '%6s  %-4s %-5s  %s\n' t tool exit verdict
while kill -0 "$NPMPID" 2>/dev/null; do
  for pair in "old:$OLD" "new:$NEW"; do
    tag="${pair%%:*}"; tool="${pair#*:}"
    out="$(bash "$tool" --cache "$CACHE" 2>&1)"; st=$?
    line="$(printf '%s' "$out" | grep -E '^(RACE|other) ' | head -1)"
    [ -z "$line" ] && line="$(printf '%s' "$out" | grep '^check-installs:' | head -1)"
    printf '%6s  %-4s %-5s  %s\n' "$(ms)" "$tag" "$st" "$line"
  done
done
wait "$NPMPID" 2>/dev/null; echo; echo "install exit=$?  total $(ms) ms"
