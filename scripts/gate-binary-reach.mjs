// Can the redaction gate's pipeline report a match that exists only inside a
// binary file? A function, so that the answer is measured on each run instead
// of argued about in a queue entry.
//
//   import { readPipeline, binaryReach, LAYER } from './gate-binary-reach.mjs'
//
//   const reach = binaryReach(readPipeline(readFileSync(workflow, 'utf8')))
//   reach.layer   // which of four things blocks it, or REACHES
//   reach.line    // the one sentence to quote
//
// WHY THIS EXISTS, and it is a correction to this seat's own filed work rather
// than a new idea. `docs/agents/pending-workflow-changes.md` PWC-13 has been
// live with HQ since 2026-10-26 and says, in the ranked table the owner reads,
// that the repair is "one character, deleted from one line": the `-I` in the
// gate's `grep -rInE`. That is the first of three things in the way, and
// applying exactly what the entry asks for leaves the gate reporting clean on a
// binary file carrying all three of its patterns. Measured on GNU grep 3.11,
// which is what `ubuntu-latest` runs, by running the gate's own `scan()` body
// against a tracked file holding a fabricated home path.
//
// THE THREE LAYERS, each measured separately and each on its own sufficient to
// keep the gate blind. The point of listing them is that only the first is a
// flag, so a reader who checks the flags and stops gets the wrong answer.
//
//   1. `-I` on the scanning grep. "Process a binary file as if it did not
//      contain matching data". grep finds nothing and exits 1.
//
//   2. The capture reads standard output only. With `-I` gone, GNU grep since
//      3.5 announces a binary match as `grep: <path>: binary file matches` on
//      standard ERROR and writes nothing at all on standard output. The gate's
//      line is `hits=$(grep ... 2>/dev/null | ...)`, which discards exactly
//      that stream and then tests `[ -n "$hits" ]`. Measured: stdout 0 bytes,
//      stderr 51 bytes, grep exit 0, gate verdict clean.
//
//   3. The post-filter is a grep too. Forcing the scan to emit the bytes
//      (`-a`) gets a line onto standard output, and that line then goes through
//      the gate's allowance, `grep -vE '<allowance>'`, which has no `-a`
//      either. It treats its own binary standard input the same way and emits
//      nothing. Measured: clean with `-a` on the scan alone, correctly red with
//      `-a` on both.
//
// AND A FOURTH THING, WHICH IS WHY THE REPAIR IS NOT SIMPLY `-a`. The gate
// prints its hits into the Actions log of a public repository, `head -20` of
// them. `-a` on a binary carrier prints raw file bytes there, so the naive
// repair turns the redaction gate into a disclosure channel for the values it
// exists to catch. `-l` names the file and echoes nothing, which is the rule
// this seat's charter states outright and the discipline
// `tools/image-metadata.mjs` already keeps by reading chunk types and never
// chunk contents.
//
// `-l` HAS A COST AND IT IS NAMED RATHER THAN DISCOVERED LATER. The gate's
// allowance is line-scoped: it drops a hit whose TEXT contains `/home/runner/`
// or `/Users/<you>/`. There is no line in `-l` output, so an allowance that
// has to keep working moves to a path-scoped form or to a second pass over the
// text files alone. That is a real design decision and it belongs to whoever
// writes the workflow, which is not this seat.
//
// WHAT THIS MODULE IS NOT. It does not scan anything and it has no
// `process.exit`, so it is not a gate. It is the predicate a gate or a test
// asks. `scripts/gate-binary-reach.test.mjs` checks every branch of it by
// building a fixture carrying fabricated values and running the real pipeline
// with the real grep, so the table below is verified against the tool's
// behaviour on the machine it runs on rather than asserted from a manual page.
// A grep that changed its binary reporting would turn that test red, which is
// the only way a claim like layer 2 stays true after the day it was measured.

/** The first thing in the way, or that nothing is. */
export const LAYER = {
  /** `-I`: the scanning grep treats a binary file as holding no match. */
  SCAN_SKIPS_BINARY: 'SCAN_SKIPS_BINARY',
  /** The match is announced on standard error and the capture reads stdout. */
  NOTICE_OFF_STDOUT: 'NOTICE_OFF_STDOUT',
  /** The allowance filter is itself binary-blind, so the line dies in it. */
  FILTER_SKIPS_BINARY: 'FILTER_SKIPS_BINARY',
  /** The pipeline reports it, by printing the matched bytes. */
  REACHES_BY_ECHOING: 'REACHES_BY_ECHOING',
  /** The pipeline reports it by naming the file, quoting nothing. */
  REACHES: 'REACHES',
}

/**
 * @typedef {object} Pipeline
 * @property {string} scanFlags the flag cluster on the scanning grep, with its
 *   leading dash, as the workflow writes it.
 * @property {boolean} scanDropsStderr whether the scan's standard error is
 *   discarded before the capture sees it.
 * @property {string | null} filterFlags the flag cluster on the allowance
 *   grep, or null when the pipeline has no second grep in it.
 */

/**
 * Read the three fields out of the workflow's own text. Textual, for the
 * reason `scripts/redaction-check.mjs` gives for reading the same file the
 * same way: this repository has no YAML parser and needs none to read three
 * fields, and the workflow is the authority for all three.
 *
 * @param {string} yml the workflow file's contents.
 * @returns {Pipeline | {fault: string}} the fault case when the pipeline is
 *   not the shape this reader knows, which is never reported as an answer.
 */
export function readPipeline(yml) {
  const scan = yml.match(/\bgrep\s+(-[A-Za-z]+)\s+"\$pattern"/)
  if (!scan) return { fault: 'found no `grep -<flags> "$pattern"` invocation' }

  // The capture is `hits=$(grep ... 2>/dev/null | grep -vE '...' || true)`.
  // Taken from the `$pattern` invocation to the end of that command
  // substitution, so a `2>/dev/null` somewhere else in the file is not read as
  // this pipeline's.
  const from = yml.indexOf(scan[0])
  const segment = yml.slice(from, yml.indexOf('\n          }', from) + 1 || undefined)

  const filter = segment.match(/\|\s*grep\s+(-[A-Za-z]+)\s+'/)
  return {
    scanFlags: scan[1],
    scanDropsStderr: /2>\s*\/dev\/null/.test(segment),
    filterFlags: filter ? filter[1] : null,
  }
}

/**
 * The decision. Each branch is one of the measurements in the header.
 *
 * @param {Pipeline | {fault: string}} p
 * @returns {{layer: string, line: string, repair: string} | {fault: string, line: string}}
 */
export function binaryReach(p) {
  if ('fault' in p) {
    return {
      fault: p.fault,
      line: `gate-binary-reach: cannot read the gate's pipeline: ${p.fault}`,
    }
  }
  const { scanFlags, scanDropsStderr, filterFlags } = p
  const has = (f) => scanFlags.includes(f)

  if (has('I')) {
    return {
      layer: LAYER.SCAN_SKIPS_BINARY,
      line:
        `gate-binary-reach: the scan runs \`grep ${scanFlags}\`, and \`-I\` treats a binary file as ` +
        'holding no match, so no binary file is read at all.',
      repair: 'drop -I, which is necessary and on its own not sufficient: see the two layers behind it.',
    }
  }

  // No `-a`: the scan matches, exits 0, and says so only on standard error.
  if (!has('a') && !has('l')) {
    return scanDropsStderr
      ? {
          layer: LAYER.NOTICE_OFF_STDOUT,
          line:
            `gate-binary-reach: the scan runs \`grep ${scanFlags}\` and its standard error is discarded, ` +
            'but a binary match is announced only there and puts nothing on standard output, so the capture stays empty.',
          repair: 'read standard error and turn the notice into a location-only finding, or scan with -l.',
        }
      : {
          layer: LAYER.REACHES,
          line:
            `gate-binary-reach: the scan runs \`grep ${scanFlags}\` and keeps standard error, where a ` +
            'binary match is announced by path with no matched text, so the pipeline reports it and quotes nothing.',
          repair: 'none: this reports the file without echoing its bytes.',
        }
  }

  // `-l` prints the path and no content, so the filter has text to work on and
  // nothing is echoed. This is the shape the charter's no-quoting rule wants.
  if (has('l')) {
    return {
      layer: LAYER.REACHES,
      line:
        `gate-binary-reach: the scan runs \`grep ${scanFlags}\`, which names a matching file and prints ` +
        'none of its contents, so a binary carrier is reported and no value is quoted.',
      repair:
        'none for reach. The gate\'s allowance is line-scoped and -l output has no line, so the ' +
        'allowance moves to a path-scoped form or to a second pass over text files.',
    }
  }

  // `-a` forces the bytes onto standard output, where the allowance grep then
  // has to survive them.
  if (filterFlags !== null && !filterFlags.includes('a')) {
    return {
      layer: LAYER.FILTER_SKIPS_BINARY,
      line:
        `gate-binary-reach: the scan runs \`grep ${scanFlags}\` and reaches the file, but the allowance ` +
        `runs \`grep ${filterFlags}\` with no \`-a\`, so it treats the piped bytes as binary and emits nothing.`,
      repair: 'give the allowance -a as well, or scan with -l so the pipeline carries paths rather than bytes.',
    }
  }

  return {
    layer: LAYER.REACHES_BY_ECHOING,
    line:
      `gate-binary-reach: the scan runs \`grep ${scanFlags}\` and the pipeline reports a binary carrier, ` +
      'by printing the matched bytes into a public Actions log, which is the disclosure this gate exists to prevent.',
    repair: 'scan with -l instead, so the finding is a path and the value is never quoted.',
  }
}
