// Capture adapters. Each adapter turns one conversation source into
// (ConversationMeta, RawGeneration[]). Two exist:
//   - parseClaudeSession: Claude Code session transcripts (~/.claude/projects/**.jsonl)
//   - parsePasteConversation: hand-pasted transcripts (frontmatter + ## user / ## assistant)

import type { ConversationMeta, RawGeneration, UserPrompt } from './types'

export interface ParsedConversation {
  conversation: ConversationMeta
  generations: RawGeneration[]
}

export function parsePasteConversation(raw: string, id: string): ParsedConversation {
  let model = 'unknown'
  let source: string | undefined
  let date: string | undefined
  let body = raw
  const fm = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/)
  if (fm) {
    body = raw.slice(fm[0].length)
    for (const line of fm[1].split(/\r?\n/)) {
      const kv = line.match(/^(\w+)\s*:\s*(.+)$/)
      if (!kv) continue
      const v = kv[2].trim()
      if (kv[1] === 'model') model = v
      else if (kv[1] === 'source') source = v
      else if (kv[1] === 'date') date = v
    }
  }
  const headers = [...body.matchAll(/^##\s*(user|assistant)\s*$/gim)]
  const generations: RawGeneration[] = []
  const prompts: UserPrompt[] = []
  let assistantOrdinal = 0
  headers.forEach((h, i) => {
    const role = h[1].toLowerCase()
    const start = h.index! + h[0].length
    const end = i + 1 < headers.length ? headers[i + 1].index! : body.length
    const text = body.slice(start, end).trim()
    if (role === 'assistant') {
      assistantOrdinal++
      if (text) {
        generations.push({
          conversationId: id,
          model,
          turnIndex: assistantOrdinal,
          kind: 'assistant_text',
          text,
        })
      }
    } else if (text) {
      prompts.push({ step: assistantOrdinal, text })
    }
  })
  return {
    conversation: {
      id,
      title: id,
      adapter: 'paste',
      model,
      source,
      date,
      turns: headers.length,
      userTurns: prompts.length,
      prompts,
    },
    generations,
  }
}

export interface ClaudeSessionOptions {
  /** only keep Write/Edit generations whose file_path contains this substring */
  pathFilter?: string
}

export function parseClaudeSession(
  raw: string,
  id: string,
  opts: ClaudeSessionOptions = {},
): ParsedConversation {
  const generations: RawGeneration[] = []
  const prompts: UserPrompt[] = []
  let title: string | undefined
  let turns = 0
  let userTurns = 0
  let assistantOrdinal = 0
  let lastAssistantUuid: string | undefined
  let firstTs: string | undefined

  for (const line of raw.split('\n')) {
    if (!line.trim()) continue
    let o: any
    try {
      o = JSON.parse(line)
    } catch {
      continue
    }
    if (o.type === 'custom-title') {
      const t = o.customTitle ?? o.title
      if (typeof t === 'string' && t.trim()) title = t.trim()
      continue
    }
    if (o.type === 'user' && !o.isSidechain) {
      turns++
      const text = humanPromptText(o.message?.content)
      if (text) {
        userTurns++
        prompts.push({ step: assistantOrdinal, timestamp: o.timestamp, text })
      }
      continue
    }
    if (o.type !== 'assistant') continue
    const msg = o.message ?? {}
    const model: string = msg.model ?? 'unknown'
    turns++
    // consecutive assistant lines belong to one logical turn; count a new
    // ordinal only when the parent chain broke (cheap approximation: every line
    // is its own step, ordinals still order generations correctly)
    if (o.uuid !== lastAssistantUuid) assistantOrdinal++
    lastAssistantUuid = o.uuid
    if (o.timestamp && !firstTs) firstTs = o.timestamp

    const content = Array.isArray(msg.content) ? msg.content : []
    for (const c of content) {
      if (!c || c.type !== 'tool_use') continue
      const inp = c.input ?? {}
      const filePath: string = typeof inp.file_path === 'string' ? inp.file_path : ''
      const keep = (text: unknown): text is string =>
        typeof text === 'string' &&
        text.length > 0 &&
        (!opts.pathFilter || filePath.includes(opts.pathFilter))
      if (c.name === 'Write' && keep(inp.content)) {
        generations.push({
          conversationId: id, model, turnIndex: assistantOrdinal,
          kind: 'write', filePath, timestamp: o.timestamp, text: inp.content,
        })
      } else if (c.name === 'Edit' && keep(inp.new_string)) {
        generations.push({
          conversationId: id, model, turnIndex: assistantOrdinal,
          kind: 'edit', filePath, timestamp: o.timestamp, text: inp.new_string,
        })
      } else if (c.name === 'MultiEdit' && Array.isArray(inp.edits)) {
        for (const e of inp.edits) {
          if (keep(e?.new_string)) {
            generations.push({
              conversationId: id, model, turnIndex: assistantOrdinal,
              kind: 'edit', filePath, timestamp: o.timestamp, text: e.new_string,
            })
          }
        }
      }
    }
  }

  return {
    conversation: {
      id,
      title: title ?? id,
      adapter: 'claude-code',
      date: firstTs?.slice(0, 10),
      turns,
      userTurns,
      prompts,
    },
    generations,
  }
}

/** the human's actual words — skips tool results, attachments, system reminders */
function humanPromptText(content: unknown): string | null {
  let texts: string[] = []
  if (typeof content === 'string') texts = [content]
  else if (Array.isArray(content)) {
    for (const b of content) {
      if (b && typeof b === 'object' && (b as any).type === 'text' && typeof (b as any).text === 'string') {
        texts.push((b as any).text)
      }
    }
  }
  const t = texts.join(' ').trim()
  if (!t || t.startsWith('<') || t.includes('system-reminder')) return null
  return t
}
