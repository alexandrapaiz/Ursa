"""
The same measurement, against the real component instead of the fixture.

    python3 data/drive-real-set-view.py <rundir> <reportpath> <baseurl> [before|after]

What this adds over `measure-row-busy.py`: React, Tailwind, and the actual
`published-site.tsx`. The fixture establishes the browser behaviour under the
two attributes over the real stylesheet; it cannot show that the component
performs the transition, because there is no component in it. This can.

HOW IT REACHES THE SET VIEW. `/record` shows an address form, and the record
rows only exist after an index has been fetched. The address given is a
fixture site this app serves out of its own `public/`, so the fetch is
same-origin, touches no network and no external host, and runs the real
`readSite` -> `parsePublishedIndex` path rather than a stub.

HOW IT HOLDS THE BUSY STATE STILL. Opening a record resolves in milliseconds
against a local file, and the busy state is the thing being photographed. So
the record fetch alone is delayed by a route handler. Nothing else is
intercepted; the index fetch, the parse, the render and the state transition
are all the shipped code.
"""
import json
import os
import sys

from playwright.sync_api import sync_playwright

SHELL = (
    "/srv/asc/home/.cache/ms-playwright/chromium_headless_shell-1254"
    "/chrome-headless-shell-linux-arm64/chrome-headless-shell"
)
SITE = "fixtures/site-04/"
TARGET = 1  # row 2 of 2


def active(page):
    return page.evaluate(
        """() => {
             const a = document.activeElement;
             if (!a || a === document.body) return 'BODY';
             const rows = [...document.querySelectorAll('.rec-row')];
             const i = rows.indexOf(a);
             return a.tagName.toLowerCase()
                    + (i >= 0 ? `[row ${i}]` : '')
                    + (a.className ? '.' + String(a.className).split(' ')[0] : '');
           }"""
    )


def main():
    root, report, base = sys.argv[1], sys.argv[2], sys.argv[3].rstrip("/")
    arm = sys.argv[4] if len(sys.argv) > 4 else "after"
    outdir = os.path.join(root, "real")
    os.makedirs(outdir, exist_ok=True)

    with sync_playwright() as p:
        b = p.chromium.launch(executable_path=SHELL)
        page = b.new_page(viewport={"width": 1440, "height": 900})

        # the record fetch, and only the record fetch, is held open
        page.route(
            f"**/{SITE}records/**",
            lambda route: (page.wait_for_timeout(0), route.continue_()) and None,
        )
        held = {"n": 0}

        def hold(route):
            held["n"] += 1
            page.wait_for_timeout(2500)
            route.continue_()

        page.unroute(f"**/{SITE}records/**")
        page.route(f"**/{SITE}records/**", hold)

        page.goto(f"{base}/record", wait_until="networkidle")
        # Wait for hydration before touching anything. Two traps here, both
        # of which look like a broken page rather than a waiting one:
        #
        #  - `base` must be `localhost` and not `127.0.0.1`. Next refuses
        #    dev requests from an origin not in `allowedDevOrigins`, the
        #    client runtime never starts, and the page stays as server HTML.
        #    Typed text then lands in the DOM, `address` state stays empty,
        #    and the submit button stays `disabled={busy || !address}`
        #    forever. Nothing is logged except a failed HMR websocket.
        #  - the field cannot be clicked. `.rec-field` is a label overlay
        #    that carries the 44px press and sits over the input, so a click
        #    at the input's own box is intercepted and times out. Focus it
        #    directly and type.
        FIELD = 'input[aria-label="the address of a published site"]'
        page.wait_for_selector(FIELD)
        page.wait_for_timeout(2500)
        page.focus(FIELD)
        page.keyboard.type(f"{base}/{SITE}", delay=3)
        page.wait_for_function(
            "sel => { const b = document.querySelector(sel).closest('form')"
            "            .querySelector('button[type=submit]');"
            "          return b && !b.disabled; }",
            arg=FIELD,
            timeout=15000,
        )
        page.keyboard.press("Enter")
        page.wait_for_selector(".rec-row", timeout=15000)
        rows = page.eval_on_selector_all(".rec-row", "els => els.length")

        # Tab to row TARGET from the top of the document.
        page.evaluate("() => document.body.focus()")
        tabs = 0
        while active(page) != f"button[row {TARGET}].rec-row" and tabs < 60:
            page.keyboard.press("Tab")
            tabs += 1
        assert active(page) == f"button[row {TARGET}].rec-row", active(page)
        tabs_in = tabs

        # The row is below the fold on a real index, so the clip has to be
        # computed after it is scrolled to, not before. `block: 'center'`
        # rather than the default so the box is never flush against an edge.
        page.evaluate(
            "n => document.querySelectorAll('.rec-row')[n]"
            "      .scrollIntoView({block: 'center'})",
            TARGET,
        )
        page.wait_for_timeout(400)
        box = page.evaluate(
            "n => { const r = document.querySelectorAll('.rec-row')[n]"
            "        .closest('.rec-item').getBoundingClientRect();"
            "       return {x:r.x-6, y:r.y-6, width:r.width+12, height:r.height+12}; }",
            TARGET,
        )
        page.wait_for_timeout(250)
        page.screenshot(path=os.path.join(outdir, f"real-{arm}-row-focused.png"), clip=box)

        page.evaluate(
            "n => { window.__n = document.querySelectorAll('.rec-row')[n]; }", TARGET
        )
        attr_before = page.evaluate(
            "() => ({disabled: window.__n.hasAttribute('disabled'),"
            " aria: window.__n.getAttribute('aria-disabled')})"
        )
        page.keyboard.press("Enter")
        page.wait_for_timeout(600)  # inside the held fetch

        after_enter = active(page)
        same_node = page.evaluate(
            "n => window.__n === document.querySelectorAll('.rec-row')[n]"
            " && document.contains(window.__n)",
            TARGET,
        )
        attr_busy = page.evaluate(
            "() => ({disabled: window.__n.hasAttribute('disabled'),"
            " aria: window.__n.getAttribute('aria-disabled'),"
            " busy: window.__n.getAttribute('aria-busy')})"
        )
        page.screenshot(path=os.path.join(outdir, f"real-{arm}-row-activated.png"), clip=box)

        result = {
            "rowsRendered": rows,
            "tabsToReachRow": tabs_in,
            "attrsIdle": attr_before,
            "attrsBusy": attr_busy,
            "activeElementAfterEnter": after_enter,
            "nodeIdentityHeld": bool(same_node),
            "arm": arm,
            "recordFetchesHeld": held["n"],
        }
        page.unroute_all(behavior="ignoreErrors")
        b.close()

    out = json.dumps(result, indent=1)
    with open(report, "w") as f:
        f.write(out + "\n")
    print(out)


if __name__ == "__main__":
    main()
