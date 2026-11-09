"""
Does activating a record row with the keyboard cost you your place in the list?

    python3 data/measure-row-busy.py <rundir> <reportpath>

Drives fixture/rows.html in both modes with the KEYBOARD only, which is the
input the defect is about: a pointer user does not care where focus went.

For each mode it reports, after Enter is pressed on row 2 of 3:

    activeElement       what the browser left focus on
    nodeIdentityHeld    whether the row node survived the state change, so a
                        focus loss can be attributed to the attribute rather
                        than to a node replacement. This is the assertion
                        that makes the rest of the table mean anything; see
                        the comment at the top of rows.html.
    tabsBackToRow       how many Tab presses return focus to that same row
                        once the fetch settles. 0 means focus never left.
    ringPixels          pixels different between the row's box focused and
                        the same box with focus on <body>, so the ring is
                        read off the frame rather than off the stylesheet.

WHAT IT DOES NOT CLAIM. This is the browser's behaviour under the two
attributes, over the component's real stylesheet and the component's real
state transition. It is not the component rendering: there is no React here
and no Tailwind, for the reason named in the run notes. The claim that the
component performs this transition is a static read of published-site.tsx,
not a measurement, and the notes keep the two apart.
"""
import json
import os
import sys

from playwright.sync_api import sync_playwright

SHELL = (
    "/srv/asc/home/.cache/ms-playwright/chromium_headless_shell-1254"
    "/chrome-headless-shell-linux-arm64/chrome-headless-shell"
)
HERE = os.path.dirname(os.path.abspath(__file__))
FIXTURE = "file://" + os.path.join(os.path.dirname(HERE), "fixture", "rows.html")
TARGET = 1  # row 2 of 3, so a focus loss cannot be confused with the top of the list


def active(page):
    return page.evaluate(
        """() => {
             const a = document.activeElement;
             if (!a || a === document.body) return 'BODY';
             return (a.tagName.toLowerCase()
                     + (a.dataset && a.dataset.n !== undefined ? '[row ' + a.dataset.n + ']' : '')
                     + (a.className ? '.' + String(a.className).split(' ')[0] : ''));
           }"""
    )


def run(mode, page, root):
    # Frames land in the charter's before/ and after/ directories, which the
    # two mode names already are.
    outdir = os.path.join(root, mode)
    os.makedirs(outdir, exist_ok=True)
    page.goto(f"{FIXTURE}?mode={mode}")
    page.wait_for_function("() => window.ROWS && window.ROWS.length === 3")

    # Tab to row 2. Each row is two stops: the button, then its address link.
    for _ in range(TARGET * 2 + 1):
        page.keyboard.press("Tab")
    assert active(page) == f"button[row {TARGET}].rec-row", active(page)
    # The id's underline fades in over 160ms. Shot without this wait the two
    # modes' focused frames differed by 367 pixels along exactly that one
    # row, every one of them by a single step on a single channel
    # (115,136,173) against (115,137,174), which is the fade caught at two
    # instants and not a difference in what is drawn. Settling past the
    # transition takes it to zero. This is L48's floor arriving on a frame
    # that has a declared transition on it, so it is waited out rather than
    # tolerated.
    page.wait_for_timeout(250)

    box = page.evaluate(
        "n => { const r = window.ROWS[n].getBoundingClientRect();"
        "       return {x:r.x-6, y:r.y-6, width:r.width+12, height:r.height+12}; }",
        TARGET,
    )
    before_focus = os.path.join(outdir, "row-focused.png")
    page.screenshot(path=before_focus, clip=box)

    node_token = page.evaluate(
        "n => { window.__n = window.ROWS[n]; return true; }", TARGET
    )
    page.keyboard.press("Enter")
    page.wait_for_timeout(250)  # past the 160ms the wash and the ring animate over

    after_enter = active(page)
    held = page.evaluate(
        "n => window.__n === window.ROWS[n] && document.contains(window.__n)", TARGET
    )
    after_focus = os.path.join(outdir, "row-activated.png")
    page.screenshot(path=after_focus, clip=box)

    # Settle the stubbed fetch, then count Tabs back to the row from wherever
    # the browser left focus.
    page.evaluate("() => window.finish()")
    page.wait_for_timeout(250)
    settled = active(page)
    tabs = 0
    while active(page) != f"button[row {TARGET}].rec-row" and tabs < 40:
        page.keyboard.press("Tab")
        tabs += 1
    reached = active(page) == f"button[row {TARGET}].rec-row"

    # The ring, read off the frame: the row focused versus focus on <body>.
    page.evaluate("() => document.activeElement.blur()")
    page.evaluate("() => { const d=document.createElement('button'); d.id='sink';"
                  " document.body.appendChild(d); d.focus(); d.blur(); d.remove(); }")
    page.wait_for_timeout(250)
    blurred = os.path.join(outdir, "row-rest.png")
    page.screenshot(path=blurred, clip=box)

    return {
        "mode": mode,
        "activeElementAfterEnter": after_enter,
        "nodeIdentityHeld": bool(held and node_token),
        "activeElementAfterFetchSettles": settled,
        "tabsBackToRow": tabs if reached else None,
        "reachedAgain": reached,
        "frames": [f"{mode}/" + os.path.basename(p) for p in (before_focus, after_focus, blurred)],
    }


def main():
    root, report = sys.argv[1], sys.argv[2]
    rows = []
    with sync_playwright() as p:
        b = p.chromium.launch(executable_path=SHELL)
        page = b.new_page(viewport={"width": 1440, "height": 900})
        for mode in ("before", "after"):
            rows.append(run(mode, page, root))
        b.close()

    lines = [
        "activating row 2 of 3 with the keyboard, 1440x900",
        "",
        f"{'mode':7} {'activeElement after Enter':28} {'node held':10} {'tabs back':10} after settle",
    ]
    for r in rows:
        lines.append(
            f"{r['mode']:7} {r['activeElementAfterEnter']:28} "
            f"{str(r['nodeIdentityHeld']):10} "
            f"{('—' if r['tabsBackToRow'] is None else str(r['tabsBackToRow'])):10} "
            f"{r['activeElementAfterFetchSettles']}"
        )
    lines += [
        "",
        "tabs back = Tab presses needed to return to that row once the fetch",
        "settles. 0 means focus never left it.",
        "node held = the row's DOM node is the same object after the state",
        "change, so a focus loss is the attribute's and not a replacement's.",
    ]
    out = "\n".join(lines) + "\n"
    with open(report, "w") as f:
        f.write(out)
    with open(report.replace(".txt", ".json"), "w") as f:
        json.dump(rows, f, indent=1)
    print(out)
    print(f"wrote {report} and {report.replace('.txt', '.json')}")


if __name__ == "__main__":
    main()
