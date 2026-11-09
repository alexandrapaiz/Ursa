"""
The submit button on /record, driven from the keyboard, in both arms.

    python3 data/drive-submit-busy.py <rundir> <reportpath> <baseurl> [before|after]

WHAT THIS MEASURES AND WHY IT IS NOT THE SAME DRIVE AS THE ROW. L65 settled
the row (`disabled` takes focus off the control the person just used) and
carried the submit button forward as "the same defect at a smaller size".
It is not quite. The row's condition was one state, `opening !== null`. The
button's is a disjunction of two, `busy || !address`, and the two halves
want different attributes:

  - `!address` is genuinely unavailable. Nothing has been typed, the person
    has never used the control, and there is nothing to submit. `disabled`
    is right, and it cannot cost a focus loss, because the only way to empty
    the field is to be standing in the field.
  - `busy` is the L65 case. The person has just pressed this button and is
    waiting on it.

So the fix is not a swap. It splits the disjunction.

WHAT THE BROWSER WAS DOING FOR US, which is the cost of the change. A
`disabled` submit button refuses a second activation for free. Once the
attribute is advisory the refusal has to exist in the handler, so this
driver presses Enter a second time inside the held fetch and counts index
fetches. Two is the regression this change could introduce and one is the
assertion.

HOW THE BUSY STATE IS HELD STILL. The index fetch is the one `busy` covers,
so the index fetch is the one delayed, by 2.5s in a route handler. The
address is a fixture site this app serves out of its own `public/`, so the
request is same-origin and touches no network.
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
FIELD = 'input[aria-label="the address of a published site"]'


def active(page):
    return page.evaluate(
        """() => {
             const a = document.activeElement;
             if (!a || a === document.body) return 'BODY';
             if (a === window.__btn) return 'the submit button';
             if (a.matches('input[type=url]')) return 'the address field';
             return a.tagName.toLowerCase()
                    + (a.className ? '.' + String(a.className).split(' ')[0] : '');
           }"""
    )


def matching(page):
    """Which of the four selectors in play actually match, right now.

    The computed colour alone cannot say WHY, and the first version of this
    script carried a specificity-and-source-order explanation that had not
    been measured. This is the measurement.
    """
    return page.evaluate(
        """() => {
             const b = window.__btn;
             const m = s => { try { return b.matches(s); } catch { return 'bad selector'; } };
             return {hover: m(':hover'),
                     active: m(':active'),
                     disabled: m(':disabled'),
                     ariaDisabledSel: m('[aria-disabled="true"]'),
                     width: Math.round(b.getBoundingClientRect().width)};
           }"""
    )


def attrs(page):
    return page.evaluate(
        """() => ({disabled: window.__btn.hasAttribute('disabled'),
                   ariaDisabled: window.__btn.getAttribute('aria-disabled'),
                   ariaBusy: window.__btn.getAttribute('aria-busy'),
                   label: window.__btn.textContent.trim()})"""
    )


def main():
    root, report, base = sys.argv[1], sys.argv[2], sys.argv[3].rstrip("/")
    arm = sys.argv[4] if len(sys.argv) > 4 else "after"
    outdir = os.path.join(root, "real")
    os.makedirs(outdir, exist_ok=True)

    with sync_playwright() as p:
        b = p.chromium.launch(executable_path=SHELL)
        page = b.new_page(viewport={"width": 1440, "height": 900})

        # The index fetch, and only the index fetch, is held open. The
        # pattern is anchored at index.json so the record fetches this page
        # may make later are untouched.
        held = {"n": 0}

        def hold(route):
            held["n"] += 1
            page.wait_for_timeout(2500)
            route.continue_()

        page.route(f"**/{SITE}index.json", hold)

        # localhost and not 127.0.0.1: Next refuses dev requests from an
        # origin outside allowedDevOrigins, the client runtime never starts,
        # and the page stays as server HTML with `address` permanently empty.
        page.goto(f"{base}/record", wait_until="networkidle")
        page.wait_for_selector(FIELD)
        page.wait_for_timeout(2500)  # hydration

        page.evaluate(
            "sel => { window.__btn = document.querySelector(sel).closest('form')"
            "          .querySelector('button[type=submit]'); }",
            FIELD,
        )
        attrs_empty = attrs(page)

        # Hover the control in its OTHER unavailable state, the empty
        # field, before anything is typed. Same rule, same question.
        boxe = page.evaluate(
            "() => { const r = window.__btn.getBoundingClientRect();"
            "        return {x:r.x+r.width/2, y:r.y+r.height/2}; }"
        )
        # TWO MOVES, NOT ONE, and this is not caution. Measured on the
        # first version of this script: a single `mouse.move` onto the
        # control read `text-decoration-color: transparent` in the empty
        # state while the identical rule read it lit in the busy state
        # later in the same session. The rules are the same; the mouse was
        # not. Chromium had not yet dispatched a pointer into the viewport,
        # so the first move set a position without producing `:hover`, and
        # the reading was of the instrument. Every reading here is now
        # taken after a move away and back.
        page.mouse.move(4, 4)
        page.wait_for_timeout(120)
        page.mouse.move(boxe["x"], boxe["y"])
        page.wait_for_timeout(400)
        matched_empty = matching(page)
        hover_empty = page.evaluate(
            """() => { const s = getComputedStyle(window.__btn);
                       return {color: s.color,
                               underline: s.textDecorationColor,
                               cursor: s.cursor}; }"""
        )
        page.mouse.move(4, 4)

        # The field cannot be clicked: `.rec-field` is a label overlay that
        # carries the 44px press and intercepts a click at the input's box.
        page.focus(FIELD)
        page.keyboard.type(f"{base}/{SITE}", delay=3)
        page.wait_for_function(
            "() => !window.__btn.hasAttribute('disabled')", timeout=15000
        )
        attrs_idle = attrs(page)

        # One Tab from the field reaches the button, which is the whole
        # point: it is the next stop after the thing that fills it.
        page.keyboard.press("Tab")
        reached = active(page)
        assert reached == "the submit button", reached
        box = page.evaluate(
            "() => { const r = window.__btn.getBoundingClientRect();"
            "        return {x:r.x-10, y:r.y-10, width:r.width+20, height:r.height+20}; }"
        )
        page.wait_for_timeout(200)
        page.screenshot(path=os.path.join(outdir, f"real-{arm}-submit-focused.png"), clip=box)

        page.keyboard.press("Enter")
        page.wait_for_timeout(500)  # inside the held fetch
        after_enter = active(page)
        attrs_busy = attrs(page)
        same_node = page.evaluate(
            "sel => window.__btn === document.querySelector(sel).closest('form')"
            "        .querySelector('button[type=submit]')"
            "        && document.contains(window.__btn)",
            FIELD,
        )
        page.screenshot(path=os.path.join(outdir, f"real-{arm}-submit-busy.png"), clip=box)

        # The second activation. In the before arm the browser refuses it;
        # in the after arm the handler has to.
        page.keyboard.press("Enter")
        page.wait_for_timeout(300)
        held_after_second = held["n"]

        # Hover the busy control. `.rec-action`'s wash rules carry no busy
        # guard on main, and `:hover` matches a disabled button, so this
        # asks whether a control that refuses the pointer lights up for it.
        page.mouse.move(4, 4)
        page.wait_for_timeout(120)
        page.mouse.move(box["x"] + box["width"] / 2, box["y"] + box["height"] / 2)
        page.wait_for_timeout(400)
        matched_busy = matching(page)
        hover_busy = page.evaluate(
            """() => { const s = getComputedStyle(window.__btn);
                       return {color: s.color,
                               underline: s.textDecorationColor,
                               cursor: s.cursor}; }"""
        )
        page.screenshot(path=os.path.join(outdir, f"real-{arm}-submit-busy-hover.png"), clip=box)

        page.wait_for_timeout(3000)  # let the held fetch land
        settled = active(page)
        tabs = 0
        while active(page) != "the submit button" and tabs < 40:
            page.keyboard.press("Tab")
            tabs += 1
        tabs_back = tabs if active(page) == "the submit button" else None

        result = {
            "arm": arm,
            "attrsFieldEmpty": attrs_empty,
            "computedWhileEmptyUnderPointer": hover_empty,
            "selectorsMatchingWhileEmpty": matched_empty,
            "attrsIdle": attrs_idle,
            "attrsBusy": attrs_busy,
            "activeElementAfterEnter": after_enter,
            "activeElementOnceSettled": settled,
            "tabsBackToTheButton": tabs_back,
            "buttonNodeIdentityHeld": bool(same_node),
            "indexFetchesAfterTwoEnters": held_after_second,
            "computedWhileBusyUnderPointer": hover_busy,
            "selectorsMatchingWhileBusy": matched_busy,
        }
        page.unroute_all(behavior="ignoreErrors")
        b.close()

    out = json.dumps(result, indent=1)
    with open(report, "w") as f:
        f.write(out + "\n")
    print(out)


if __name__ == "__main__":
    main()
