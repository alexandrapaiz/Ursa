/**
 * Prove that `measure-narrow.mjs` reports its own blindness in the exit
 * status, and not only in its prose.
 *
 * The other selftests in here prove a tool can still find a defect in a
 * page. This one proves the opposite half, because that is the half that
 * failed. On 2026-11-09 the tool was pointed at a port with nothing behind
 * it, printed "NOT MEASURED: 20 of 20 page-by-width cells could not be
 * loaded ... so this run makes no claim about them", and exited 0. The
 * sentence and the status disagreed, and a run gates on the status.
 *
 * Why that is the dangerous direction. A tool that misses a defect costs
 * one finding. A tool that reports clean while measuring nothing costs
 * every finding it would ever have made, and it does so silently, because
 * "0 of 20 put content out of reach" and "0 of 0 were looked at" are the
 * same shape. The kit already knows this: L19 and L23 are both about a
 * zero denominator reading as a pass, and `measure-hit-areas.mjs` gives the
 * zero-denominator case its own sentence for exactly this reason. What was
 * missing was the machine-readable half of that care.
 *
 * Two cases, because one of them alone proves nothing:
 *
 *   1. Nothing is listening. Every cell fails to load. The tool must say
 *      so and exit 2.
 *   2. A real page is served. Every cell is measured. The tool must exit 0.
 *
 * Case 2 is what stops the repair from being "exit non-zero always", which
 * would satisfy case 1 and be worth nothing.
 *
 * usage: node check-narrow.mjs [port]
 * exit 0 on pass, 1 on fail, and it says which expectation missed.
 */
import { spawn } from "node:child_process";
import { cannotLook, deadPort, serveFixture } from "../lib/fixture-server.mjs";
import { rmSync, writeFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
// The port comes from the operating system and not from a literal, and a
// premise failure takes its own code. Measured on this host 2026-11-09 (run
// ad): another seat's python3 held the port one of these checks names, so the
// bind lost, the fixture never answered, and the check exited 1 with the
// status it uses for `the instrument under test answered wrongly`. The ports
// are shared between seats the same way /tmp is. See lib/fixture-server.mjs.
const port = process.argv[2] ?? null;
const dir = mkdtempSync(join(tmpdir(), "narrow-selftest-"));
const out = join(dir, "narrow.txt");

// A page with nothing in it that can fail: one short line, no script, no
// fonts, no fixed-position anything. The point of case 2 is that the tool
// RAN, so the page must not be able to produce a finding of its own.
writeFileSync(
  join(dir, "plain.html"),
  "<!doctype html><meta charset=utf-8>" +
    "<meta name=viewport content='width=device-width,initial-scale=1'>" +
    "<style>html,body{margin:0;background:#000;color:#fff;font:14px system-ui}" +
    "main{padding:16px}</style><main>narrow selftest</main>\n",
);

const run = (extra) =>
  new Promise((resolve) => {
    const p = spawn(
      process.execPath,
      [
        join(here, "..", "measure-narrow.mjs"),
        "--pages", "plain=/plain.html",
        "--widths", "320,390",
        "--out", out,
        ...extra,
      ],
      { stdio: ["ignore", "pipe", "pipe"] },
    );
    let text = "";
    p.stdout.on("data", (d) => (text += d));
    p.stderr.on("data", (d) => (text += d));
    p.on("exit", (code) => resolve({ code, text }));
  });

let server = null;
const stop = () => {
  if (server) server.kill();
  try { rmSync(dir, { recursive: true, force: true }); } catch {}
};

try {
  // Case 1: nothing is listening on this port. Picked one above the range
  // the kit's other tools default to, so a stray server from another run
  // cannot turn this case into a pass.
  const blind = await run(["--base", `http://127.0.0.1:${port ?? (await deadPort())}`]);

  // Case 2: the same tool, the same flags, over a page that is really there.
  const fixture = await serveFixture(dir, "/plain.html");
  server = fixture.proc;
  const seeing = await run(["--base", fixture.base]);

  const want = [
    ["(1) a matrix it could not load exits non-zero", blind.code !== 0, true],
    ["(1) and the status is 2, the instrument's own code", blind.code, 2],
    ["(1) and it still says so in words", /NOT MEASURED: 2 of 2/.test(blind.text), true],
    ["(1) and it never prints the passing headline", /put content out of reach/.test(blind.text), false],
    ["(2) a matrix it did measure exits 0", seeing.code, 0],
    ["(2) and it prints the passing headline", /0 of 2 page-by-width cells put content out of reach/.test(seeing.text), true],
    ["(2) and claims nothing unmeasured", /NOT MEASURED/.test(seeing.text), false],
  ];

  let bad = 0;
  for (const [what, got, exp] of want) {
    const ok = got === exp;
    if (!ok) bad++;
    console.log(`${ok ? "ok  " : "FAIL"}  ${String(got).padStart(18)} (want ${exp})  ${what}`);
  }
  console.log(bad ? `\n${bad} of ${want.length} expectations failed` : `\nall ${want.length} expectations hold`);
  stop();
  process.exit(bad ? 1 : 0);
} catch (err) {
  // A throw here is this check's own premise failing and not a verdict about
  // `measure-narrow.mjs`, so it takes the reserved code and says which it is.
  stop();
  cannotLook(`this check threw before it could compare anything (${String(err).split("\n")[0]})`);
}
