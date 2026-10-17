#!/usr/bin/env bash
# Is a resolver digest a stand-in for a commit?
#
# Builds `dist/ursa.cjs` from ONE source tree laid out four different
# ways and prints the sha256 of each result. Every layout differs only
# in where `node_modules` resolves from, or in how deep the checkout
# sits, so four identical digests mean the artifact is a function of its
# source and three distinct ones mean it is a function of the machine.
#
# This exists because `npm run bundle:check` cannot answer the question.
# It builds in whatever layout the runner has, and in this repository's
# CI that layout is always the canonical one.
#
#   ./tools/measure-bundle-layouts.sh                 # this checkout
#   ./tools/measure-bundle-layouts.sh <repo> <nm>     # another one
#
# Arguments, both optional:
#   $1  path to a checkout of the repo whose ursa-major/ is under test
#       (default: the repo containing this script)
#   $2  path to a populated node_modules to borrow for every layout
#       (default: this package's own)
#
# Run against 181596a on 2026-10-17, before build/canonicalize.mjs
# existed, this printed three digests for the four layouts. The numbers
# and the reading are in docs/provenance/bundle-reproducibility.md.
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SRC="${1:-$(dirname "$HERE")}"
NM="${2:-$HERE/node_modules}"

[ -d "$SRC/ursa-major" ] || { echo "no ursa-major/ under $SRC" >&2; exit 2; }
[ -d "$NM/esbuild" ]     || { echo "no esbuild under $NM — run npm install first" >&2; exit 2; }

WORK="$(mktemp -d "${TMPDIR:-/tmp}/ursa-layout-XXXXXX")"
trap 'rm -rf "$WORK"' EXIT

# Copy the package without its node_modules, so each layout below
# supplies its own and nothing inherits the canonical one by accident.
lay () {  # $1 = destination dir that will contain ursa-major/
  mkdir -p "$1"
  cp -r "$SRC/ursa-major" "$1/ursa-major"
  rm -rf "$1/ursa-major/node_modules"
}

run () {  # $1 = label, $2 = the ursa-major dir to build in
  ( cd "$2" && node build/bundle.mjs >/dev/null )
  printf '%-46s %s\n' "$1" "$(sha256sum "$2/dist/ursa.cjs" | cut -c1-64)"
}

# L1 — canonical: node_modules is a real directory inside the package.
# This is what `npm install` in ursa-major/ produces and the only layout
# this repository's own checks have ever built in.
lay "$WORK/L1"
cp -r "$NM" "$WORK/L1/ursa-major/node_modules"
run "L1 node_modules/ real dir, in package" "$WORK/L1/ursa-major"

# L2 — node_modules is a symlink pointing outside the tree. This is the
# layout that found the problem: a scratch clone sharing another
# checkout's installed packages.
lay "$WORK/L2"
ln -s "$NM" "$WORK/L2/ursa-major/node_modules"
run "L2 node_modules/ symlink out of tree" "$WORK/L2/ursa-major"

# L3 — hoisted: node_modules sits in the PARENT of the package, which is
# what npm workspaces produce. Node resolves upward to find it and
# esbuild follows. This is the layout a contributor is most likely to
# have without having done anything unusual.
lay "$WORK/L3"
cp -r "$NM" "$WORK/L3/node_modules"
run "L3 node_modules/ hoisted to parent dir" "$WORK/L3/ursa-major"

# L4 — canonical again, but five directories deeper, which separates
# "where node_modules is relative to the package" from "how long the
# absolute path to the checkout happens to be". L4 matching L1 is what
# makes the first of those the explanation.
lay "$WORK/a/b/c/d/L4"
cp -r "$NM" "$WORK/a/b/c/d/L4/ursa-major/node_modules"
run "L4 real dir, checkout 5 levels deeper" "$WORK/a/b/c/d/L4/ursa-major"
