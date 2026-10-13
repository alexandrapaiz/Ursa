#!/usr/bin/env bash
# Quantise the review screenshots so the repo stays light. Quality floor 90:
# at the default 55-88 the night sky dithers visibly and the evidence stops
# being faithful to what the browser drew.
set -e
for f in "$1"/*.png; do
  pngquant --quality 90-100 --speed 1 --strip --force --output "$f" "$f" 2>/dev/null || true
done
