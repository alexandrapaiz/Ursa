// Sprint 2026-09-21 item 3: the browsable record from the public fixture, and the
// audit of its provenance navigation. Two halves:
//   1. auditProvenance over the record — every pointer resolves, and each kind of
//      break is actually caught (regression tests for the audit itself).
//   2. the rendered HTML, executed in jsdom — from a span you reach the generation
//      and the user's own words, and a span with neither says so.

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { JSDOM } from 'jsdom'
import { parsePasteConversation } from './parse'
import { resolve } from './resolve'
import { renderViewer } from './viewer'
import { auditProvenance, elicitingPrompt, elicitingPrompts } from './audit'
import type { OutcomeRecord } from './types'

const FIXTURE = join(__dirname, '..', 'fixtures', 'mini')

function fixtureRecord(): OutcomeRecord {
  const finalText = readFileSync(join(FIXTURE, 'final.md'), 'utf8')
  const convs = ['01-claude', '02-chatgpt'].map((id) =>
    parsePasteConversation(readFileSync(join(FIXTURE, 'conversations', `${id}.md`), 'utf8'), id),
  )
  return resolve({
    taskId: 'fixture-mini',
    files: [{ path: 'final.md', text: finalText }],
    conversations: convs.map((c) => c.conversation),
    generations: convs.flatMap((c) => c.generations),
    finished: true,
  })
}

const clone = (r: OutcomeRecord): OutcomeRecord => JSON.parse(JSON.stringify(r))

describe('provenance audit (fixtures/mini)', () => {
  const record = fixtureRecord()

  it('walks the whole record and finds no broken pointer', () => {
    const audit = auditProvenance(record)
    expect(audit.broken).toEqual([])
    expect(audit.pointersChecked).toBeGreaterThan(record.files[0].spans.length)
  })

  it('every span with a generation source also reaches the user prompt behind it', () => {
    const audit = auditProvenance(record)
    expect(audit.spansWithSource).toBeGreaterThan(0)
    expect(audit.spansReachingPrompt).toBe(audit.spansWithSource)
  })

  it('resolves the eliciting prompt as the last one before the turn', () => {
    expect(elicitingPrompt(record, '01-claude', 1)!.text).toBe('Draft two sentences about the resolver.')
    expect(elicitingPrompt(record, '02-chatgpt', 1)!.text).toBe('One line on what labs get.')
    // a turn with nothing in front of it, and a conversation that is not here
    expect(elicitingPrompt(record, '01-claude', 0)).toBeNull()
    expect(elicitingPrompt(record, 'no-such-conversation', 3)).toBeNull()
    expect(elicitingPrompts(record)).toHaveLength(record.generations.length)
  })

  it('picks the latest prompt when several precede the same turn', () => {
    const r = clone(record)
    r.conversations[0].prompts = [
      { step: 0, text: 'first ask' },
      { step: 0, text: 'actually, do it this way' },
      { step: 3, text: 'much later' },
    ]
    expect(elicitingPrompt(r, '01-claude', 1)!.text).toBe('actually, do it this way')
  })
})

describe('provenance audit catches each kind of break', () => {
  const base = fixtureRecord()
  const sourced = base.files[0].spans.findIndex((s) => s.source)
  const kinds = (r: OutcomeRecord) => auditProvenance(r).broken.map((b) => b.kind)

  it('catches a generationIndex past the end of generations[]', () => {
    const r = clone(base)
    r.files[0].spans[sourced].source!.generationIndex = 99
    expect(kinds(r)).toContain('generation_index_out_of_range')
  })

  it('catches a source pointing at a conversation the record does not carry', () => {
    const r = clone(base)
    r.files[0].spans[sourced].source!.conversationId = 'ghost-conversation'
    const k = kinds(r)
    expect(k).toContain('unknown_conversation')
    expect(k).toContain('generation_conversation_mismatch')
  })

  it('catches a source range that does not slice inside the generation', () => {
    const r = clone(base)
    r.files[0].spans[sourced].source!.end = 10_000
    expect(kinds(r)).toContain('source_range_out_of_bounds')
  })

  it('catches span text that no longer matches its offsets', () => {
    const r = clone(base)
    r.files[0].spans[0].text = 'something nobody wrote'
    expect(kinds(r)).toContain('span_text_mismatch')
  })

  it('catches generations[] that cannot be addressed by generationIndex', () => {
    const r = clone(base)
    r.generations.reverse()
    expect(kinds(r)).toContain('generation_index_mismatch')
  })

  it('catches a generation whose turn no user prompt precedes', () => {
    const r = clone(base)
    for (const c of r.conversations) c.prompts = []
    expect(kinds(r)).toContain('no_eliciting_prompt')
    expect(auditProvenance(r).spansReachingPrompt).toBe(0)
  })

  it('catches a stats row naming a file or conversation that is not in the record', () => {
    const r = clone(base)
    r.stats.perFile[0].path = 'not-a-file.md'
    r.stats.perConversation[0].conversationId = 'not-a-conversation'
    const k = kinds(r)
    expect(k).toContain('stats_path_unknown')
    expect(k).toContain('stats_conversation_unknown')
  })
})

describe('the rendered viewer, opened and clicked (jsdom)', () => {
  const record = fixtureRecord()

  function open() {
    const dom = new JSDOM(renderViewer(record), { runScripts: 'dangerously' })
    // jsdom has no layout, so scrolling is a no-op here
    dom.window.Element.prototype.scrollIntoView = function () {}
    return dom
  }
  const click = (dom: JSDOM, node: Element) =>
    node.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true, cancelable: true }))

  const fileSpans = (dom: JSDOM) =>
    Array.from(dom.window.document.querySelectorAll('.panel')[0].querySelectorAll('pre.doc .sp'))

  it('renders one clickable span per classified span in the file', () => {
    const dom = open()
    expect(fileSpans(dom)).toHaveLength(record.files[0].spans.length)
  })

  it('a model-sourced span names its generation and shows the user words behind it', () => {
    const dom = open()
    const idx = record.files[0].spans.findIndex((s) => s.class === 'survived_verbatim')
    click(dom, fileSpans(dom)[idx])
    const inspector = dom.window.document.getElementById('inspector')!
    expect(inspector.style.display).toBe('block')
    expect(inspector.textContent).toContain('Survived verbatim')
    expect(inspector.textContent).toContain('turn 1')
    expect(inspector.textContent).toContain('What the user asked for')
    expect(inspector.textContent).toContain('Draft two sentences about the resolver.')
  })

  it('the generation link opens the Generations tab and highlights the exact source range', () => {
    const dom = open()
    const doc = dom.window.document
    const idx = record.files[0].spans.findIndex((s) => s.class === 'survived_verbatim')
    click(dom, fileSpans(dom)[idx])
    const jump = doc.querySelector('#inspector button.jump')!
    expect(jump.textContent).toContain('Show this generation')
    click(dom, jump)

    const activeTab = doc.querySelector('nav.tabs button.active')!
    expect(activeTab.textContent).toBe('Generations')
    const src = record.files[0].spans[idx].source!
    const gen = record.generations[src.generationIndex]
    const lit = Array.from(doc.querySelectorAll('.hl'))
    expect(lit.length).toBeGreaterThan(0)
    // everything highlighted lies inside the range the pointer names
    const inRange = gen.text.slice(src.start, src.end)
    for (const node of lit) expect(inRange).toContain(node.textContent!.trim())
  })

  it('a mutated span shows the edit that the user made to the generation', () => {
    const dom = open()
    const idx = record.files[0].spans.findIndex((s) => s.class === 'survived_mutated')
    click(dom, fileSpans(dom)[idx])
    const inspector = dom.window.document.getElementById('inspector')!
    expect(inspector.textContent).toContain('Mutation (generation → final)')
    expect(inspector.querySelectorAll('.diff ins').length + inspector.querySelectorAll('.diff del').length)
      .toBeGreaterThan(0)
    expect(inspector.textContent).toContain('Draft two sentences about the resolver.')
  })

  it('a span with no generation says so instead of showing an empty panel', () => {
    const dom = open()
    const idx = record.files[0].spans.findIndex((s) => s.class === 'no_generation_provenance' && !s.candidate)
    click(dom, fileSpans(dom)[idx])
    const inspector = dom.window.document.getElementById('inspector')!
    expect(inspector.textContent).toContain('No generation in this record produced this text')
    expect(inspector.querySelector('button.jump')).toBeNull()
  })

  it('every span in the file reaches a non-empty inspector, with no dead click', () => {
    const dom = open()
    const inspector = dom.window.document.getElementById('inspector')!
    fileSpans(dom).forEach((node, i) => {
      click(dom, node)
      expect(inspector.style.display, `span ${i}`).toBe('block')
      expect(inspector.textContent!.length, `span ${i}`).toBeGreaterThan(20)
      const span = record.files[0].spans[i]
      if (span.source) {
        expect(inspector.querySelector('button.jump'), `span ${i} link to its generation`).not.toBeNull()
      }
    })
  })

  it('the Generations panel carries the user prompts inline, ahead of the turn they produced', () => {
    const dom = open()
    const genPanel = dom.window.document.querySelectorAll('.panel')[1]
    const prompts = Array.from(genPanel.querySelectorAll('.prompt'))
    expect(prompts).toHaveLength(2)
    expect(prompts[0].textContent).toContain('user, before turn 1')
    expect(prompts[0].textContent).toContain('Draft two sentences about the resolver.')
    // the prompt is rendered ahead of the generation it produced
    const first = genPanel.querySelector('.prompt, details.gen')!
    expect(first.className).toBe('prompt')
  })
})
