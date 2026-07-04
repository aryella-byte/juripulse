#!/usr/bin/env node

import { createHash } from 'node:crypto'
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, '..')
const dataFile = path.join(projectRoot, 'public', 'data', 'brief_data.json')

const newsSources = {
  SCOTUSblog: 'https://www.scotusblog.com/feed/',
  JURIST: 'https://www.jurist.org/feed/',
  'Financial Times': 'https://www.ft.com/rss/home',
  'The Economist': 'https://www.economist.com/leaders/rss.xml',
  WSJ: 'https://feeds.content.dowjones.io/public/rss/WSJcomUSBusiness',
}

const researchSources = {
  'Harvard Law Review': 'https://harvardlawreview.org/feed/',
  'NYU Law Review': 'https://www.nyulawreview.org/feed/',
  'Penn Law Review': 'https://www.pennlawreview.com/feed/',
  'Michigan Law Review': 'https://michiganlawreview.org/feed/',
  'Duke Law Journal': 'https://dlj.law.duke.edu/feed/',
  'Cornell Law Review': 'https://cornelllawreview.org/feed/',
  'J Criminal Law & Criminology': 'https://scholarlycommons.law.northwestern.edu/jclc/recent.rss',
}

const junkKeywords = [
  'call for submissions',
  'essay competition',
  'announcement',
  'career',
  'job opening',
  'fellowship',
  'subscribe',
  'newsletter',
  'podcast',
  'video',
  'webinar',
  'live blog',
  'liveblog',
  'symposium',
  'conference',
  'scotustoday',
  'hello world',
  'in memoriam',
  'appendix to',
  'present -',
  'presents -',
  'discuss',
  'tribute',
  'masthead',
  "editor's note",
  "editors' note",
  'celebrates',
  'new board',
  'has elected',
  'welcomes',
  'introduction:',
  'accept manuscripts',
  'accepting submissions',
  'now accepting',
  'letter from the editor',
  'foreword',
]

const legalNativeSources = new Set(['SCOTUSblog', 'JURIST'])

const legalKeywords = [
  'abortion',
  'administrative',
  'appeal',
  'asylum',
  'attorney',
  'border',
  'case',
  'civil rights',
  'constitutional',
  'constitution',
  'court',
  'criminal',
  'death penalty',
  'due process',
  'enforcement',
  'federal',
  'fraud',
  'immigration',
  'injunction',
  'judge',
  'justice',
  'law',
  'lawsuit',
  'legal',
  'liability',
  'litigation',
  'privacy',
  'regulation',
  'rights',
  'rule',
  'scotus',
  'sentence',
  'supreme court',
  'trial',
  'trump',
]

const maxNews = Number(process.env.MAX_NEWS || 5)
const maxResearch = Number(process.env.MAX_RESEARCH || 3)
const model = process.env.BRIEF_AI_MODEL || 'ark-code-latest'
const feedTimeoutMs = Number(process.env.FEED_TIMEOUT_MS || 15000)
const aiTimeoutMs = Number(process.env.AI_TIMEOUT_MS || 45000)

function log(message) {
  console.log(`[${new Date().toISOString()}] ${message}`)
}

async function fetchWithTimeout(url, options, timeoutMs, label) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
    })
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error(`${label} timed out after ${Math.round(timeoutMs / 1000)}s`)
    }
    throw error
  } finally {
    clearTimeout(timeout)
  }
}

function today() {
  return new Date().toISOString().slice(0, 10)
}

function itemId(title) {
  return createHash('md5').update(title).digest('hex').slice(0, 12)
}

function decodeEntities(text) {
  return text
    .replaceAll('&amp;', '&')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'")
    .replaceAll('&apos;', "'")
}

function stripCdata(text) {
  return text.replace(/^<!\[CDATA\[/, '').replace(/\]\]>$/, '').trim()
}

function textBetween(xml, tag) {
  const match = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'))
  return match ? decodeEntities(stripCdata(match[1].trim())) : ''
}

function normalizeDate(value) {
  if (!value) return today()
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return today()
  return parsed.toISOString().slice(0, 10)
}

function isJunk(title) {
  const lower = title.toLowerCase()
  return junkKeywords.some((keyword) => lower.includes(keyword))
}

function isLikelyLegal(item, source, isResearch) {
  if (isResearch || legalNativeSources.has(source)) return true
  const text = `${item.title} ${item.url}`.toLowerCase()
  return legalKeywords.some((keyword) => text.includes(keyword))
}

function parseFeed(xml) {
  const blocks = [
    ...xml.matchAll(/<item[\s\S]*?<\/item>/gi),
    ...xml.matchAll(/<entry[\s\S]*?<\/entry>/gi),
  ].map((match) => match[0])

  return blocks
    .map((block) => {
      const title = textBetween(block, 'title')
      const link =
        textBetween(block, 'link') ||
        (block.match(/<link[^>]*href=["']([^"']+)["'][^>]*>/i)?.[1] ?? '')
      const date =
        textBetween(block, 'pubDate') ||
        textBetween(block, 'published') ||
        textBetween(block, 'updated')

      return { title: title.trim(), url: link.trim(), date: normalizeDate(date) }
    })
    .filter((item) => item.title && item.url && !isJunk(item.title))
}

async function fetchFeed(url, source) {
  try {
    log(`Fetching ${source}`)
    const response = await fetchWithTimeout(url, {
      headers: {
        'User-Agent': 'JuriPulse AI Legal Brief Bot/1.0',
        Accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml',
      },
    }, feedTimeoutMs, `Feed request for ${source}`)
    if (!response.ok) throw new Error(`${response.status} ${response.statusText}`)
    const xml = await response.text()
    const items = parseFeed(xml).slice(0, 15)
    log(`${source}: ${items.length} candidates`)
    return items
  } catch (error) {
    log(`${source} failed: ${error.message}`)
    return []
  }
}

function createAiConfig() {
  if (process.env.ARK_API_KEY) {
    const baseUrl = process.env.ARK_BASE_URL || 'https://ark.cn-beijing.volces.com/api/coding/v3'
    return {
      apiKey: process.env.ARK_API_KEY,
      url: `${baseUrl.replace(/\/$/, '')}/chat/completions`,
      provider: 'ark',
    }
  }
  if (process.env.MOONSHOT_API_KEY) {
    return {
      apiKey: process.env.MOONSHOT_API_KEY,
      url: 'https://api.moonshot.cn/v1/chat/completions',
      provider: 'moonshot',
    }
  }
  if (process.env.KIMI_API_KEY) {
    return {
      apiKey: process.env.KIMI_API_KEY,
      url: 'https://api.kimi.com/coding/v1/chat/completions',
      provider: 'kimi',
    }
  }
  return null
}

function looseParse(text) {
  const grab = (key) => {
    const match = text.match(new RegExp(`"${key}"\\s*:\\s*"([\\s\\S]*?)"\\s*(?:,\\s*"|\\n|})`))
    return match ? match[1].trim() : ''
  }
  const tagsBlock = text.match(/"tags"\s*:\s*\[([\s\S]*?)\]/)
  const tags = tagsBlock ? [...tagsBlock[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]) : []

  return {
    summaryCN: grab('summaryCN'),
    whyMattersCN: grab('whyMattersCN'),
    tags,
    category: grab('category') || 'general',
  }
}

function extractJsonText(text) {
  const cleaned = text.trim().replace(/^```json\s*/i, '').replace(/\s*```$/, '')
  if (cleaned.startsWith('{') && cleaned.endsWith('}')) return cleaned

  const fenced = cleaned.match(/```json\s*([\s\S]*?)\s*```/i)
  if (fenced) return fenced[1].trim()

  const first = cleaned.indexOf('{')
  const last = cleaned.lastIndexOf('}')
  if (first !== -1 && last > first) return cleaned.slice(first, last + 1)
  return cleaned
}

async function analyzeWithAi(aiConfig, title, source, isResearch) {
  const contentType = isResearch ? '法学研究论文' : '法律新闻'
  const prompt = `你是 JuriPulse 的法学简报编辑。请分析以下${contentType}，只返回 JSON，不要 markdown 代码块。

标题：${title}
来源：${source}

{
  "summaryCN": "60-100字中文摘要",
  "whyMattersCN": "80-120字重要性分析，包含比较法或法学研究价值",
  "tags": ["标签1", "标签2"],
  "category": "constitutional|criminal|international|corporate|tech|general"
}

要求：筛掉明显非法律内容；字段值内不要使用英文双引号。`

  const response = await fetchWithTimeout(aiConfig.url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${aiConfig.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      max_tokens: 800,
      temperature: 0.6,
      messages: [{ role: 'user', content: prompt }],
      ...(aiConfig.provider === 'ark' || aiConfig.provider === 'kimi'
        ? { thinking: { type: 'disabled' } }
        : {}),
    }),
  }, aiTimeoutMs, `AI request for ${source}`)

  if (!response.ok) {
    throw new Error(`AI request failed: ${response.status} ${await response.text()}`)
  }

  const payload = await response.json()
  const message = payload.choices?.[0]?.message || {}
  const text = String(message.content || message.reasoning_content || '').trim()
  const cleaned = extractJsonText(text)

  try {
    return JSON.parse(cleaned)
  } catch {
    return looseParse(cleaned)
  }
}

function tagsFor(category, tags) {
  const classes = {
    constitutional: 'constitutional',
    criminal: 'criminal',
    international: 'international',
    corporate: 'constitutional',
    tech: 'tech',
    general: '',
  }

  const selected = Array.isArray(tags) ? tags.slice(0, 2) : []
  return selected.length
    ? selected.map((name) => ({ name, class: classes[category] || '' }))
    : [{ name: '法律动态', class: '' }]
}

async function loadData() {
  if (!existsSync(dataFile)) return { news: [], research: [] }
  const raw = await readFile(dataFile, 'utf8')
  return JSON.parse(raw)
}

async function saveData(data) {
  data.meta = {
    ...(data.meta || {}),
    updatedAt: new Date().toISOString(),
    generator: 'ai',
  }
  data.news.sort((a, b) => String(b.date).localeCompare(String(a.date)))
  data.research.sort((a, b) => String(b.date).localeCompare(String(a.date)))
  await mkdir(path.dirname(dataFile), { recursive: true })
  await writeFile(dataFile, `${JSON.stringify(data, null, 2)}\n`, 'utf8')
}

async function buildQueue(sources, { isResearch = false } = {}) {
  const entries = await Promise.all(
    Object.entries(sources).map(async ([source, url]) => {
      const items = (await fetchFeed(url, source)).filter((item) => isLikelyLegal(item, source, isResearch))
      log(`${source}: ${items.length} likely legal candidates`)
      return { source, items }
    }),
  )

  const queue = []
  for (let rank = 0; rank < 15; rank += 1) {
    let added = false
    for (const entry of entries) {
      const item = entry.items.shift()
      if (item) {
        queue.push({ source: entry.source, item })
        added = true
      }
    }
    if (!added) break
  }
  return queue
}

async function updateSection({ aiConfig, data, sources, key, limit, isResearch }) {
  const existing = new Set((data[key] || []).map((item) => itemId(item.title)))
  const queue = await buildQueue(sources, { isResearch })
  const additions = []

  for (const { source, item } of queue) {
    if (additions.length >= limit) break
    if (existing.has(itemId(item.title))) continue

    try {
      log(`AI analyzing: ${item.title.slice(0, 80)}`)
      const analysis = await analyzeWithAi(aiConfig, item.title, source, isResearch)
      if (!analysis?.summaryCN || analysis.summaryCN.length < 20) {
        log(`AI result skipped: invalid summary for ${item.title.slice(0, 60)}`)
        continue
      }

      additions.push({
        title: item.title,
        titleCN: item.title,
        url: item.url,
        date: item.date,
        summaryCN: analysis.summaryCN,
        summaryEN: '',
        whyMattersCN: analysis.whyMattersCN || '',
        whyMattersEN: '',
        tags: tagsFor(analysis.category, analysis.tags),
        quality_score: 8,
        ...(isResearch ? { journal: source } : { source }),
      })
      existing.add(itemId(item.title))
      log(`Added ${key}: ${item.title.slice(0, 80)}`)
    } catch (error) {
      log(`AI analysis skipped: ${error.message}`)
    }
  }

  data[key] = [...(data[key] || []), ...additions]
  log(`${key}: +${additions.length}`)
}

async function main() {
  const aiConfig = createAiConfig()
  if (!aiConfig) {
    log('No ARK_API_KEY, MOONSHOT_API_KEY, or KIMI_API_KEY. Existing brief data preserved.')
    return
  }
  log(`Using ${aiConfig.provider} model: ${model}`)

  const data = await loadData()
  data.news ||= []
  data.research ||= []

  await updateSection({ aiConfig, data, sources: newsSources, key: 'news', limit: maxNews, isResearch: false })
  await updateSection({ aiConfig, data, sources: researchSources, key: 'research', limit: maxResearch, isResearch: true })
  await saveData(data)
  log(`Saved ${data.news.length} news and ${data.research.length} research items`)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
