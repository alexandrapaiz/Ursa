"""
The six guards this run rewrote still guard the thing they guarded.

    python3 data/check-wash-guard.py

`.rec-row`'s hover and press rules were guarded by `:not(:disabled)` and are
now guarded by `:not([aria-disabled="true"])`, because the control no longer
carries `disabled`. A guard that no longer matches anything is invisible: the
wash would simply light up while the list is busy and no frame of the resting
page would show it. So this asserts the guard from both sides, in both
stylesheets, which is what a rewrite of six selectors owes.

For each arm: the wash is ON when the row is hovered or pressed and idle, and
OFF when the row is hovered or pressed and busy. Read off the computed style
of `.rec-item`, which is the element the wash is painted on.

`measure-row-busy.py` covers focus; this covers the pointer. Together they are
the two inputs the attribute change touches.
"""
import os
import sys

from playwright.sync_api import sync_playwright

SHELL = (
    "/srv/asc/home/.cache/ms-playwright/chromium_headless_shell-1254"
    "/chrome-headless-shell-linux-arm64/chrome-headless-shell"
)
HERE = os.path.dirname(os.path.abspath(__file__))
FIXTURE = "file://" + os.path.join(os.path.dirname(HERE), "fixture", "rows.html")
IDLE = "rgba(232, 237, 247, 0)"
WASHED = "rgba(232, 237, 247, 0.03)"
TARGET = 1

failures, lines = [], []


def item_bg(page, n):
    return page.evaluate(
        "n => getComputedStyle(window.ROWS[n].closest('.rec-item')).backgroundColor", n
    )


def check(label, got, want):
    ok = got == want
    lines.append(f"  {'ok  ' if ok else 'FAIL'}  {label:46} {got}")
    if not ok:
        failures.append(f"{label}: got {got}, want {want}")


def arm(page, mode):
    lines.append(f"{mode} ({'disabled' if mode == 'before' else 'aria-disabled'}):")
    page.goto(f"{FIXTURE}?mode={mode}")
    page.wait_for_function("() => window.ROWS && window.ROWS.length === 3")
    hoverable = page.evaluate("() => matchMedia('(hover: hover)').matches")
    row = page.evaluate_handle("n => window.ROWS[n]", TARGET).as_element()

    check("at rest, no pointer", item_bg(page, TARGET), IDLE)

    if hoverable:
        row.hover()
        page.wait_for_timeout(250)
        check("idle + hover -> washed", item_bg(page, TARGET), WASHED)
    else:
        lines.append("  skip  (hover: hover) is false on this browser, hover arm skipped")

    # press, which is the state touch has and hover does not
    box = row.bounding_box()
    page.mouse.move(box["x"] + box["width"] / 2, box["y"] + box["height"] / 2)
    page.mouse.down()
    page.wait_for_timeout(250)
    check("idle + press -> washed", item_bg(page, TARGET), WASHED)
    page.mouse.up()
    page.wait_for_timeout(250)

    # now busy: the click above set it. Pointer is still over the row.
    busy = page.evaluate(
        "n => window.ROWS[n].hasAttribute('disabled')"
        " || window.ROWS[n].getAttribute('aria-disabled') === 'true'",
        TARGET,
    )
    check("the click put the list in its busy state", str(busy), "True")
    if hoverable:
        row.hover()
        page.wait_for_timeout(250)
        check("busy + hover -> NOT washed", item_bg(page, TARGET), IDLE)
    page.mouse.down()
    page.wait_for_timeout(250)
    check("busy + press -> NOT washed", item_bg(page, TARGET), IDLE)
    page.mouse.up()
    lines.append("")


def main():
    with sync_playwright() as p:
        b = p.chromium.launch(executable_path=SHELL)
        page = b.new_page(viewport={"width": 1440, "height": 900})
        for mode in ("before", "after"):
            arm(page, mode)
        b.close()
    print("\n".join(lines))
    n = sum(1 for l in lines if l.strip().startswith(("ok", "FAIL")))
    if failures:
        print(f"{len(failures)} of {n} assertions FAILED")
        for f in failures:
            print("  " + f)
        sys.exit(1)
    print(f"{n} assertions, all passed")


if __name__ == "__main__":
    main()
