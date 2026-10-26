/**
 * Prove that `measure-contrast.mjs` can still fail.
 *
 * The tool's headline on this site is one short run out of 524, and the
 * one it finds is exempt. That is the right answer and it is also what a
 * tool that had stopped looking would print, so the two cannot be told
 * apart from the site alone. This serves `contrast.html`, whose answers
 * are hand-computable from WCAG 1.4.3, and asserts every verdict the
 * tool can reach, plus two of the numbers themselves, because a verdict
 * can be right while the arithmetic under it is wrong.
 *
 * usage: node check-contrast.mjs [port]
 * exit 0 on pass, 1 on fail, and it says which expectation missed.
 */
import { spawn } from "node:child_process";
import { readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const port = process.argv[2] ?? "4972";
const out = join(tmpdir(), `contrast-selftest-${process.pid}.json`);

const server = spawn("python3", ["-m", "http.server", port, "-d", here], {
  stdio: "ignore",
});
const stop = () => {
  server.kill();
  try { rmSync(out); } catch {}
};

// The same rule the tool applies, restated here rather than imported, so a
// change to the tool's own classifier cannot quietly change the test.
const verdict = (r) =>
  r.unmeasured ? "UNMEASURED"
  : r.median >= r.threshold ? (r.p5 < r.threshold ? "short in places" : "ok")
  : r.inactive ? "inactive and exempt"
  : "SHORT";

try {
  const url = `http://127.0.0.1:${port}/contrast.html`;
  for (let i = 0; i < 60; i++) {
    try {
      if ((await fetch(url)).ok) break;
    } catch {}
    await new Promise((r) => setTimeout(r, 250));
    if (i === 59) throw new Error(`fixture never answered at ${url}`);
  }

  const run = spawn(
    process.execPath,
    [
      join(here, "..", "measure-contrast.mjs"),
      "--base", `http://127.0.0.1:${port}`,
      "--pages", "selftest=/contrast.html",
      "--only", "desktop",
      "--out", tmpdir(),
      "--json", out,
    ],
    { stdio: "ignore" },
  );
  const code = await new Promise((r) => run.on("exit", r));
  if (code !== 0) throw new Error(`measure-contrast.mjs exited ${code}`);

  const rows = JSON.parse(readFileSync(out, "utf8"));
  const by = (t) => rows.find((r) => r.text.startsWith(t));
  const near = (got, want, tol) => got != null && Math.abs(got - want) <= tol;

  // Each expectation names the case in the fixture it reads, so a failure
  // says which half is wrong rather than only that a count moved.
  const want = [
    ["text runs seen", rows.length, 8],
    ["(1) white on black is ok", verdict(by("White body text")), "ok"],
    ["(1) and it reads 21.0:1", near(by("White body text").median, 21, 0.3), true],
    ["(2) 4.31:1 body text is SHORT", verdict(by("Grey body text")), "SHORT"],
    ["(2) and the arithmetic is right, not just the verdict", near(by("Grey body text").median, 4.31, 0.06), true],
    ["(3) the same grey in a disabled control is exempt", verdict(by("Disabled control")), "inactive and exempt"],
    ["(3) and it is still measured rather than skipped", near(by("Disabled control").median, 4.31, 0.06), true],
    ["(4) 4.31:1 at 28px passes the large-text floor", verdict(by("Large grey text")), "ok"],
    ["(4) and it was judged against 3:1", by("Large grey text").threshold, 3],
    ["(5) declared alpha composites to 3.00:1 and is SHORT", verdict(by("White text at thirty five")), "SHORT"],
    ["(5) and the composite arithmetic is right", near(by("White text at thirty five").median, 3.0, 0.06), true],
    ["(6) an ancestor's opacity reaches the same 3.00:1", verdict(by("White text under an ancestor")), "SHORT"],
    ["(7) a run crossing a lighter patch is short in places", verdict(by("White text crossing")), "short in places"],
    ["(7) with its median still at 21", near(by("White text crossing").median, 21, 0.3), true],
    ["(7) and its fifth percentile down at 3.45", near(by("White text crossing").p5, 3.45, 0.1), true],
    ["(8) invisible text is UNMEASURED, never ok", verdict(by("Invisible text")), "UNMEASURED"],
    ["(8) and it is the dangerous reason, not a small glyph", by("Invisible text").maxCov, 0],
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
  console.error(String(err));
  stop();
  process.exit(1);
}
