// What `tools/image-metadata.mjs` and its verdict actually do.
//
//   node --test tools/image-metadata.test.mjs
//
// Two halves, and the split is deliberate. The verdict is a pure function, so
// its branches are driven directly. The scan reads a git repository, so it is
// driven against temporary repositories built here with synthetic containers
// -- including the two shapes that must produce exit 2 rather than a clean
// zero, which are the ones a gate like this gets wrong.
//
// The last half is the one measurement that cannot be synthesised: this
// repository's own tree. It is asserted clean, so the day a capture arrives
// with a text chunk in it, this suite says so and not only the gate.

import assert from 'node:assert/strict'
import { crc32 } from 'node:zlib'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, it } from 'node:test'
import { LOCUS } from './gates/verdict-shape.mjs'
import { GATE, TEXT_CHUNKS, carrierLine, unusable, verdict } from './image-metadata-verdict.mjs'
import { icoChunks, looksBinary, pngChunks, scan, trackedImages, unreadBinaries } from './image-metadata.mjs'

const PNG_SIG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])

/** A chunk, framed the way a PNG frames one: length, type, data, CRC. */
function chunk(type, data = Buffer.alloc(0)) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const typed = Buffer.concat([Buffer.from(type, 'latin1'), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(typed) >>> 0)
  return Buffer.concat([len, typed, crc])
}

const IHDR = chunk('IHDR', Buffer.from([0, 0, 0, 1, 0, 0, 0, 1, 8, 0, 0, 0, 0]))
const IDAT = chunk('IDAT', Buffer.from([0x78, 0x9c, 0x63, 0x00, 0x00, 0x00, 0x02, 0x00, 0x01]))
const IEND = chunk('IEND')

/** A one pixel PNG, optionally carrying extra chunks between header and data.
 *  No real path or identifier goes into any of them: this suite proves the
 *  gate sees the CHANNEL, so the payload may as well be the word for it. */
function png(...extra) {
  return Buffer.concat([PNG_SIG, IHDR, ...extra, IDAT, IEND])
}

/** A throwaway git repository holding the files given, so `git ls-files` has
 *  something to answer. Nothing is committed: the index is what ls-files
 *  reads, and staging is enough. */
function repoWith(files) {
  const dir = mkdtempSync(join(tmpdir(), 'image-metadata-'))
  execFileSync('git', ['init', '-q'], { cwd: dir })
  for (const [path, body] of Object.entries(files)) {
    const full = join(dir, path)
    mkdirSync(join(full, '..'), { recursive: true })
    writeFileSync(full, body)
  }
  execFileSync('git', ['add', '-A'], { cwd: dir })
  return dir
}

describe('the verdict', () => {
  it('is clean over no carriers, and says what it read rather than only that it passed', () => {
    const v = verdict([], { images: 1303, chunks: 8914, formats: ['ico', 'png'] })
    assert.equal(v.exitCode, 0)
    assert.equal(v.cause, 'NO_TEXT_CHANNEL')
    assert.match(v.line, /1303 tracked images in 2 format\(s\), 8914 container chunks read/)
  })

  it('is clean over a tree with no images at all, which is measured and not unmeasured', () => {
    const v = verdict([], { images: 0, chunks: 0, formats: [] })
    assert.equal(v.exitCode, 0)
    assert.equal(v.cause, 'NO_TEXT_CHANNEL')
  })

  it('reds on a named metadata chunk and names the commit as the repair', () => {
    const v = verdict([{ path: 'a.png', chunk: 'tEXt', locus: LOCUS.COMMITTED }], { images: 10, chunks: 40, formats: ['png'] })
    assert.equal(v.exitCode, 1)
    assert.equal(v.cause, 'TEXT_CHUNK_PRESENT')
    assert.match(v.line, /1 of 10 tracked images/)
    assert.match(v.trailer.join('\n'), /comes off in a\ncommit/)
  })

  it('reds on an unclassified chunk under its own cause, since the repair is a different person', () => {
    const v = verdict([{ path: 'a.png', chunk: 'caNv', locus: LOCUS.READER }], { images: 10, chunks: 40, formats: ['png'] })
    assert.equal(v.exitCode, 1)
    assert.equal(v.cause, 'CHUNK_UNCLASSIFIED')
    assert.match(v.line, /unestablished rather than clean/)
  })

  it('names both loci when both are present, so one count does not stand for two repairs', () => {
    const v = verdict(
      [
        { path: 'a.png', chunk: 'iTXt', locus: LOCUS.COMMITTED },
        { path: 'b.png', chunk: 'caNv', locus: LOCUS.READER },
      ],
      { images: 10, chunks: 40, formats: ['png'] },
    )
    assert.equal(v.cause, 'TEXT_CHUNK_PRESENT')
    assert.match(v.line, /a named metadata chunk/)
    assert.match(v.line, /cannot classify/)
  })

  it('routes the two repairs to two different files in the per-finding line', () => {
    assert.match(carrierLine({ path: 'a.png', chunk: 'tEXt', locus: LOCUS.COMMITTED }), /re-commit the image/)
    assert.match(carrierLine({ path: 'a.png', chunk: 'caNv', locus: LOCUS.READER }), /image-metadata-verdict\.mjs/)
  })

  it('never reports a ground branch as clean, and writes it to standard error', () => {
    for (const cause of ['FORMAT_UNPARSED', 'CONTAINER_UNWALKABLE', 'SCAN_GROUND_UNUSABLE']) {
      const v = unusable(cause, 'why')
      assert.equal(v.exitCode, 2)
      assert.equal(v.stream, 'err')
      assert.equal(v.derivedFrom, 'ground')
      assert.equal(v.cause, cause)
    }
  })

  it('declares every probe the enumerator needs, and no outcome', () => {
    assert.equal(GATE.id, 'tools/image-metadata.mjs')
    assert.equal(GATE.probes.length, 5)
    assert.equal(GATE.groundProbes.length, 4)
    for (const probe of GATE.probes) assert.ok(!('exitCode' in probe), 'a probe may not declare its own outcome')
  })
})

describe('the container walk', () => {
  it('reads a PNG chunk list in order', () => {
    assert.deepEqual(pngChunks(png()), ['IHDR', 'IDAT', 'IEND'])
    assert.deepEqual(pngChunks(png(chunk('tEXt', Buffer.from('k\0v')))), ['IHDR', 'tEXt', 'IDAT', 'IEND'])
  })

  it('refuses a truncated container rather than reporting the chunks it managed to read', () => {
    const whole = png(chunk('tEXt', Buffer.from('k\0v')))
    assert.throws(() => pngChunks(whole.subarray(0, whole.length - 20)), /past the end of the file/)
  })

  it('refuses something that is not a PNG at all', () => {
    assert.throws(() => pngChunks(Buffer.from('GIF89a and then some')), /not a PNG signature/)
  })

  it('walks an ICO into its entries, PNG chunks and bitmap entries alike', () => {
    const embedded = png(chunk('eXIf', Buffer.alloc(8)))
    const dir = Buffer.alloc(6 + 16)
    dir.writeUInt16LE(0, 0)
    dir.writeUInt16LE(1, 2)
    dir.writeUInt16LE(1, 4)
    dir.writeUInt32LE(embedded.length, 6 + 8)
    dir.writeUInt32LE(22, 6 + 12)
    assert.deepEqual(icoChunks(Buffer.concat([dir, embedded])), ['IHDR', 'eXIf', 'IDAT', 'IEND'])
  })

  it('refuses an ICO whose entry points past the end of the file', () => {
    const dir = Buffer.alloc(6 + 16)
    dir.writeUInt16LE(1, 2)
    dir.writeUInt16LE(1, 4)
    dir.writeUInt32LE(99999, 6 + 12)
    assert.throws(() => icoChunks(dir), /past the end of the file/)
  })
})

describe('the scan', () => {
  it('finds a text chunk in a staged capture', () => {
    const dir = repoWith({ 'docs/design/reviews/x/after/home.png': png(chunk('tEXt', Buffer.from('Software\0a tool'))) })
    const { carriers, seen } = scan(dir)
    assert.equal(carriers.length, 1)
    assert.equal(carriers[0].chunk, 'tEXt')
    assert.equal(carriers[0].locus, LOCUS.COMMITTED)
    assert.deepEqual(seen, { images: 1, chunks: 4, formats: ['png'] })
  })

  it('calls an unknown chunk type unclassified rather than inert', () => {
    const { carriers } = scan(repoWith({ 'a.png': png(chunk('caNv', Buffer.alloc(4))) }))
    assert.equal(carriers.length, 1)
    assert.equal(carriers[0].locus, LOCUS.READER)
  })

  it('is clean over a capture with only inert chunks, and counts what it read', () => {
    const { carriers, seen } = scan(repoWith({ 'a.png': png(chunk('pHYs', Buffer.alloc(9))), 'b.png': png() }))
    assert.deepEqual(carriers, [])
    assert.equal(seen.images, 2)
    assert.equal(seen.chunks, 7)
  })

  it('leaves SVG to the redaction gate by name, and does not call it an unparsed format', () => {
    const { carriers, seen, ground } = scan(repoWith({ 'a.svg': '<svg><!-- /Users/<you>/x --></svg>', 'b.png': png() }))
    assert.equal(ground, undefined)
    assert.deepEqual(carriers, [])
    assert.deepEqual(seen.formats, ['png'])
  })

  it('refuses a format it has no reader for instead of skipping it quietly', () => {
    const { ground } = scan(repoWith({ 'a.jpg': Buffer.from([0xff, 0xd8, 0xff, 0xe0]) }))
    assert.equal(ground.cause, 'FORMAT_UNPARSED')
    assert.match(ground.detail, /add a reader for jpg/)
  })

  it('refuses a container it cannot walk instead of reporting the file clean', () => {
    const whole = png(chunk('tEXt', Buffer.from('k\0v')))
    const { ground } = scan(repoWith({ 'a.png': whole.subarray(0, whole.length - 20) }))
    assert.equal(ground.cause, 'CONTAINER_UNWALKABLE')
  })

  it('refuses a directory that is not a git repository', () => {
    const { ground } = scan(mkdtempSync(join(tmpdir(), 'image-metadata-bare-')))
    assert.equal(ground.cause, 'SCAN_GROUND_UNUSABLE')
  })

  // The surface this gate did not have an enumerator for until 2026-11-02.
  // A binary that is not a recognised image was selected by nothing here and
  // skipped by the redaction gate's `-I`, so the fixtures below are the whole
  // of the evidence that it is now refused rather than passed over. No real
  // path or identifier goes into any of them, the same rule as the PNGs above.
  // The NUL is the whole of what makes this binary, and binary is the whole of
  // what these tests are about: the gate's question here is whether the file
  // was ENUMERATED, not what it holds. So the path is the redaction standard's
  // own placeholder form rather than a username-shaped string. That is not
  // cosmetic. Writing a plausible `/Users/<name>/` here reds
  // `scripts/redaction-check.mjs` on this very file, which this run did once
  // and is recorded in its audit, and a security suite that trips the
  // redaction gate to demonstrate the redaction gate is not a fixture.
  const NUL_WITH_TEXT = Buffer.concat([
    Buffer.from([0x00, 0x01, 0xff]),
    Buffer.from('/Users/<you>/notes'),
    Buffer.from([0x00]),
  ])

  it('refuses a tracked binary in no format it parses, rather than reporting the tree clean', () => {
    const { ground, carriers } = scan(repoWith({ 'a.png': png(), 'font.woff2': NUL_WITH_TEXT }))
    assert.equal(carriers, undefined, 'a ground fault must not also report a clean carrier list')
    assert.equal(ground.cause, 'BINARY_UNREAD')
    assert.match(ground.detail, /font\.woff2/)
    assert.match(ground.why, /nothing reads it/)
  })

  it('counts every unread binary, so the one it names is not read as the only one', () => {
    const { ground } = scan(repoWith({ 'a.bin': NUL_WITH_TEXT, 'b.bin': NUL_WITH_TEXT, 'c.bin': NUL_WITH_TEXT }))
    assert.match(ground.why, /^3 tracked binary files are/)
    assert.match(ground.detail, /and 2 more$/)
  })

  it('leaves text files alone however they are named, since the redaction gate reads those', () => {
    const dir = repoWith({ 'a.png': png(), 'notes.woff2': Buffer.from('plain text, no NUL'), 'logo.svg': Buffer.from('<svg/>') })
    assert.deepEqual(unreadBinaries(dir), [])
    assert.equal(scan(dir).ground, undefined)
  })

  it('keeps the sharper diagnosis when the unread binary is an image, since that names the reader it needs', () => {
    const { ground } = scan(repoWith({ 'a.jpg': Buffer.from([0xff, 0xd8, 0xff, 0x00]) }))
    assert.equal(ground.cause, 'FORMAT_UNPARSED', 'the image walk has to run before the binary sweep')
  })

  it('calls an unreadable file binary, because unreadable is as unestablished as unparsed', () => {
    const dir = repoWith({ 'a.png': png() })
    assert.equal(looksBinary(join(dir, 'does-not-exist')), true)
  })

  it('reads the tracked set and not the working copy, so untracked scratch is out of scope', () => {
    const dir = repoWith({ 'a.png': png() })
    writeFileSync(join(dir, 'loose.png'), png(chunk('tEXt', Buffer.from('k\0v'))))
    assert.deepEqual(trackedImages(dir), ['a.png'])
    assert.deepEqual(scan(dir).carriers, [])
  })
})

describe('this repository', () => {
  it('commits no image carrying a text channel, which is the rule and not a sample', () => {
    const { carriers, seen, ground } = scan('.')
    assert.equal(ground, undefined, 'the scan must be able to establish the facts here')
    assert.deepEqual(carriers, [], 'a tracked image carries a chunk that can hold text')
    assert.ok(seen.images > 1300, `only ${seen.images} images parsed, so the scan is reading less than the tree`)
  })

  it('tracks no binary that this gate does not parse, so `images` is a coverage claim', () => {
    // The equality the BINARY_UNREAD fault buys. Asserted against the real
    // tree rather than stated in a comment, so the day a font or an archive
    // is committed this suite says so and not only the gate.
    assert.deepEqual(unreadBinaries('.'), [], 'a tracked binary is read by nothing in this repository')
  })

  it("carries a favicon whose embedded PNG lost its EXIF chunk and none of its pixels", () => {
    const buf = readFileSync('ursa-minor/app/favicon.ico')
    const types = icoChunks(buf)
    assert.equal(types.filter((t) => t === 'DIB').length, 3, 'the three bitmap entries are untouched')
    for (const t of TEXT_CHUNKS) assert.ok(!types.includes(t), `the favicon still carries ${t}`)
    // IHDR declares 256 by 256 as it did before the chunk came out.
    const off = buf.readUInt32LE(6 + 3 * 16 + 12)
    assert.equal(buf.readUInt32BE(off + 16), 256)
    assert.equal(buf.readUInt32BE(off + 20), 256)
  })
})
