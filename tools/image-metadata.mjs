#!/usr/bin/env node
// Does any image this repository commits carry a text channel?
//
//   node tools/image-metadata.mjs            # exit 1 on a carrier
//   node tools/image-metadata.mjs --json     # same exit code, JSON out
//   node tools/image-metadata.mjs --list     # every chunk type seen, with counts
//
// Exit 0 no tracked image holds a chunk that can carry text. Exit 1 at least
// one does, or at least one holds a chunk type this gate cannot classify.
// Exit 2 the facts could not be established, so nothing is reported clean.
//
// The reasoning for all of it, including why this is not a second copy of
// PWC-13, is in `tools/image-metadata-verdict.mjs`. This file is the driver:
// it finds the tracked images, walks their containers, and prints what the
// verdict function returns.
//
// WHY IT READS THE CONTAINER AND NOT THE BYTES. A text chunk is declared by
// its four-character type and its length, so the question "is there a text
// channel here" is answered by the chunk list alone, with no need to look at
// what any chunk holds. That matters for a security tool in a public
// repository: this gate never reads, prints or copies the contents of a chunk
// it finds, so a leaked value stays unquoted even in the output of the thing
// that found it. The charter requires that and the structure gives it for
// free.
//
// WHY `git ls-files` AND NOT A DIRECTORY WALK. The question is about what this
// repository publishes, and that is the tracked set. A walk would also read
// whatever a review run left loose in the working copy, which is not
// published, and would miss nothing that is.

import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { LOCUS } from './gates/verdict-shape.mjs'
import { INERT_CHUNKS, TEXT_CHUNKS, carrierLine, unusable, verdict } from './image-metadata-verdict.mjs'

const JSON_OUT = process.argv.includes('--json')
const LIST = process.argv.includes('--list')

const PNG_SIG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])

/** Extensions this gate parses, and the ones it deliberately leaves alone.
 *  SVG is text: the redaction gate's three patterns already read it, because
 *  `-I` only suppresses binary files. Saying so by name is the point; a format
 *  skipped silently is how a gate becomes a no-op nobody notices. */
const PARSED = new Set(['png', 'ico'])
const TEXT_FORMATS = new Set(['svg'])
const IMAGE_EXT = /\.(png|ico|svg|jpg|jpeg|gif|webp|bmp|tif|tiff|avif|heic)$/i

/**
 * Walk a PNG chunk list. Returns the types in order, or throws if the lengths
 * do not land on the end of the file -- a chunk list that only half parses is
 * not a chunk list.
 *
 * @param {Buffer} buf
 * @param {number} [start] where the signature begins, for an ICO's embedded PNG.
 * @returns {string[]}
 */
export function pngChunks(buf, start = 0) {
  if (!buf.subarray(start, start + 8).equals(PNG_SIG)) throw new Error('not a PNG signature')
  const types = []
  let off = start + 8
  while (off + 8 <= buf.length) {
    const len = buf.readUInt32BE(off)
    const type = buf.subarray(off + 4, off + 8).toString('latin1')
    if (!/^[A-Za-z]{4}$/.test(type)) throw new Error(`chunk type at byte ${off + 4} is not four letters`)
    types.push(type)
    if (type === 'IEND') return types
    // 4 length + 4 type + len data + 4 CRC.
    off += 12 + len
  }
  throw new Error('chunk lengths run past the end of the file without an IEND')
}

/**
 * Walk an ICO directory and classify each embedded image. An ICO entry is
 * either a PNG, signature and all, or a DIB -- a bare Windows bitmap header
 * and its pixels, which has no field that holds a string.
 *
 * @param {Buffer} buf
 * @returns {string[]} one pseudo-chunk per DIB entry, plus every chunk of
 *   every embedded PNG, so the census counts what was actually read.
 */
export function icoChunks(buf) {
  if (buf.length < 6 || buf.readUInt16LE(0) !== 0 || buf.readUInt16LE(2) !== 1) {
    throw new Error('not an ICO header')
  }
  const count = buf.readUInt16LE(4)
  if (count === 0) throw new Error('ICO declares no entries')
  const types = []
  for (let i = 0; i < count; i += 1) {
    const entry = 6 + i * 16
    if (entry + 16 > buf.length) throw new Error(`ICO entry ${i + 1} is past the end of the file`)
    const offset = buf.readUInt32LE(entry + 12)
    if (offset + 8 > buf.length) throw new Error(`ICO entry ${i + 1} points past the end of the file`)
    if (buf.subarray(offset, offset + 8).equals(PNG_SIG)) types.push(...pngChunks(buf, offset))
    else types.push('DIB')
  }
  return types
}

/** DIB is this file's own name for an ICO's bitmap entry, not a PNG chunk, and
 *  it holds pixels and a size header. Classified here rather than in the
 *  verdict module's PNG table, which is about PNG. */
const INERT = new Set([...INERT_CHUNKS, 'DIB'])
const CARRIES_TEXT = new Set(TEXT_CHUNKS)

export function trackedImages(cwd = '.') {
  const out = execFileSync('git', ['ls-files', '-z'], { cwd, encoding: 'buffer' })
  return out
    .toString('latin1')
    .split('\0')
    .filter((p) => p !== '' && IMAGE_EXT.test(p))
}

/**
 * The scan. Separated from the printing so the suite can drive it on a
 * temporary repository without reading this process's output.
 *
 * @param {string} [cwd]
 * @returns {{carriers: object[], seen: object, ground?: object, tally: Map<string, number>}}
 */
export function scan(cwd = '.') {
  let paths
  try {
    paths = trackedImages(cwd)
  } catch (err) {
    return { ground: { cause: 'SCAN_GROUND_UNUSABLE', why: 'git could not list the tracked files here', detail: err.message.split('\n')[0] } }
  }

  const carriers = []
  const tally = new Map()
  const formats = new Set()
  let chunks = 0
  let images = 0

  for (const path of paths) {
    const ext = path.slice(path.lastIndexOf('.') + 1).toLowerCase()
    if (TEXT_FORMATS.has(ext)) continue
    if (!PARSED.has(ext)) {
      return {
        ground: {
          cause: 'FORMAT_UNPARSED',
          why: `1 tracked image is in a format this gate cannot parse, so its text channel is unread`,
          detail: `${path} — add a reader for ${ext}, or this gate is blind to it`,
        },
      }
    }
    let types
    try {
      const buf = readFileSync(`${cwd}/${path}`)
      types = ext === 'ico' ? icoChunks(buf) : pngChunks(buf)
    } catch (err) {
      return {
        ground: {
          cause: 'CONTAINER_UNWALKABLE',
          why: `1 tracked image's container could not be walked, so its chunk list is unknown`,
          detail: `${path} — ${err.message}`,
        },
      }
    }
    images += 1
    formats.add(ext)
    chunks += types.length
    for (const type of types) {
      tally.set(type, (tally.get(type) ?? 0) + 1)
      if (CARRIES_TEXT.has(type)) carriers.push({ path, chunk: type, locus: LOCUS.COMMITTED })
      else if (!INERT.has(type)) carriers.push({ path, chunk: type, locus: LOCUS.READER })
    }
  }

  return { carriers, tally, seen: { images, chunks, formats: [...formats].sort() } }
}

function main() {
  const result = scan('.')
  const v = result.ground
    ? unusable(result.ground.cause, result.ground.why, result.ground.detail)
    : verdict(result.carriers, result.seen)

  if (JSON_OUT) {
    console.log(JSON.stringify({
      verdict: v,
      carriers: result.carriers ?? [],
      seen: result.seen ?? {},
      chunkTypes: result.tally ? Object.fromEntries([...result.tally].sort((a, b) => b[1] - a[1])) : {},
    }, null, 2))
    process.exit(v.exitCode)
  }

  const write = v.stream === 'err' ? console.error : console.log
  write(v.line)
  for (const c of result.carriers ?? []) write(carrierLine(c))
  for (const line of v.trailer) write(line)
  if (LIST && result.tally) {
    write('')
    for (const [type, n] of [...result.tally].sort((a, b) => b[1] - a[1])) {
      write(`  ${type}  ${n}  ${CARRIES_TEXT.has(type) ? 'can hold text' : INERT.has(type) ? 'inert' : 'unclassified'}`)
    }
  }
  process.exit(v.exitCode)
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].split('/').pop())) main()
