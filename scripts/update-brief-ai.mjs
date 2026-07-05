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
  'Just Security': 'https://www.justsecurity.org/feed/',
  'ABA Journal': 'https://www.abajournal.com/rss',
}

const researchSources = {
  'Harvard Law Review': 'https://harvardlawreview.org/feed/',
  'Stanford Law Review': 'https://www.stanfordlawreview.org/feed/',
  'Columbia Law Review': 'https://columbialawreview.org/feed/',
  'NYU Law Review': 'https://www.nyulawreview.org/feed/',
  'Penn Law Review': 'https://www.pennlawreview.com/feed/',
  'Michigan Law Review': 'https://michiganlawreview.org/feed/',
  'Duke Law Journal': 'https://dlj.law.duke.edu/feed/',
  'Cornell Law Review': 'https://cornelllawreview.org/feed/',
  'Virginia Law Review': 'https://virginialawreview.org/feed/',
  'Northwestern Law Review': 'https://northwesternlawreview.org/feed/',
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
  'book review',
  'book notes',
  'case note',
  'recent case',
  'recent cases',
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
  'afterword',
  'preface',
  'dedication',
]

const softNewsKeywords = [
  'announcement of opinions',
  'attorney switcheroo',
  'children’s books',
  "children's books",
  'celebrity magicians',
  'driving the conversation',
  'hospitalized',
  'inscrutable',
  'law, memoir',
  'mystery of justice',
  'sports stars',
  'supreme court of canada',
  'supreme court of india',
  'the biggest names on the briefs',
  'the trump term',
]

const legalNativeSources = new Set(Object.keys(newsSources))
const approvedNewsSources = new Set(Object.keys(newsSources))
const approvedResearchSources = new Set(Object.keys(researchSources))

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

const researchKeywords = [
  'abstract',
  'article',
  'claim',
  'constitutional',
  'criminal',
  'doctrine',
  'empirical',
  'enforcement',
  'federal',
  'governance',
  'institution',
  'jurisdiction',
  'law',
  'legal',
  'liability',
  'litigation',
  'regulation',
  'rights',
  'statutory',
  'theory',
]

const expandedResearchSources = new Set([
  ...approvedResearchSources,
  'Boston U Law Review',
  'Minnesota Law Review',
  'UCLA Law Review',
  'Wash U Law Review',
])

const sourceWeights = {
  SCOTUSblog: 9,
  JURIST: 8,
  'Just Security': 8,
  'ABA Journal': 7,
}

const maxNews = Number(process.env.MAX_NEWS || 3)
const maxResearch = Number(process.env.MAX_RESEARCH || 1)
const minExistingQuality = Number(process.env.MIN_EXISTING_QUALITY || 7)
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

function ageInDays(date) {
  const parsed = new Date(date)
  if (Number.isNaN(parsed.getTime())) return 999
  return Math.max(0, Math.floor((Date.now() - parsed.getTime()) / 86400000))
}

function isJunk(title) {
  const lower = title.toLowerCase()
  return [
    ...junkKeywords,
    ...softNewsKeywords,
  ].some((keyword) => lower.includes(keyword))
}

function isLikelyLegal(item, source, isResearch) {
  const text = `${item.title} ${item.excerpt || ''} ${item.url}`.toLowerCase()
  if (isResearch) {
    return researchKeywords.some((keyword) => text.includes(keyword))
  }
  if (legalNativeSources.has(source)) return true
  return legalKeywords.some((keyword) => text.includes(keyword))
}

function keywordHits(text, keywords) {
  const lower = text.toLowerCase()
  return keywords.reduce((score, keyword) => score + (lower.includes(keyword) ? 1 : 0), 0)
}

function candidateScore(item, source, isResearch) {
  const text = `${item.title} ${item.excerpt || ''} ${item.url}`
  const freshness = Math.max(0, 10 - ageInDays(item.date))
  const sourceScore = sourceWeights[source] || (isResearch ? 8 : 5)
  const topicality = isResearch
    ? keywordHits(text, researchKeywords)
    : keywordHits(text, legalKeywords)
  return sourceScore + freshness + topicality * 2
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
      const excerpt =
        textBetween(block, 'description') ||
        textBetween(block, 'summary') ||
        textBetween(block, 'content:encoded')

      return {
        title: title.trim(),
        url: link.trim(),
        date: normalizeDate(date),
        excerpt: excerpt.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 700),
      }
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
  const grabBoolean = (key, fallback) => {
    const match = text.match(new RegExp(`"${key}"\\s*:\\s*(true|false)`, 'i'))
    return match ? match[1].toLowerCase() === 'true' : fallback
  }
  const grabNumber = (key) => {
    const match = text.match(new RegExp(`"${key}"\\s*:\\s*([0-9]+(?:\\.[0-9]+)?)`))
    return match ? Number(match[1]) : Number(grab(key)) || 0
  }
  const tagsBlock = text.match(/"tags"\s*:\s*\[([\s\S]*?)\]/)
  const tags = tagsBlock ? [...tagsBlock[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]) : []

  return {
    shouldInclude: grabBoolean('shouldInclude', !/false/i.test(grab('shouldInclude'))),
    qualityScore: grabNumber('qualityScore'),
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

async function analyzeWithAi(aiConfig, item, source, isResearch) {
  const contentType = isResearch ? '法学研究论文' : '法律新闻'
  const selectionRule = isResearch
    ? '只收录正式法学论文、评论或实证研究；排除 foreword、introduction、book review、case note、征稿、会议、播客、新闻稿和纯目录页。优先选择有明确研究问题、方法、制度贡献或比较法价值的论文。'
    : '只收录具有明确法律制度影响的新闻：重要法院判决、监管执法、立法政策、宪政争议、刑事司法、国际法、科技法或公司合规。排除泛政治、泛商业、人物八卦、单纯观点评论和没有法律增量的新闻。'
  const prompt = `你是 JuriPulse 的法学简报编辑。请分析以下${contentType}，只返回 JSON，不要 markdown 代码块。

标题：${item.title}
来源：${source}
发布日期：${item.date}
RSS摘要：${item.excerpt || '无'}

{
  "shouldInclude": true,
  "qualityScore": 1-10,
  "summaryCN": "120-180字中文摘要，交代事实或论文问题、核心规则/论证、最新进展或结论",
  "whyMattersCN": "160-240字重要性分析，必须指出具体制度、判例、监管、研究方法或中国法/比较法启发，避免空泛套话",
  "tags": ["标签1", "标签2"],
  "category": "constitutional|criminal|international|corporate|tech|general"
}

选稿标准：${selectionRule}
要求：如果不符合选稿标准，返回 shouldInclude=false，qualityScore 不高于 4；字段值内不要使用英文双引号。`

  const response = await fetchWithTimeout(aiConfig.url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${aiConfig.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      max_tokens: 1400,
      temperature: 0.45,
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

function hasSoftNewsSignal(item) {
  const title = String(item.title || '').toLowerCase()
  return softNewsKeywords.some((keyword) => title.includes(keyword))
}

function shouldKeepExistingNews(item) {
  if (!approvedNewsSources.has(item.source)) return false
  if ((item.quality_score || 0) < minExistingQuality) return false
  if (isJunk(item.title || '') || hasSoftNewsSignal(item)) return false
  return true
}

function shouldKeepExistingResearch(item) {
  const source = item.journal || item.source
  if (!expandedResearchSources.has(source)) return false
  if ((item.quality_score || 0) < minExistingQuality) return false
  if (isJunk(item.title || '')) return false
  return true
}

function pruneExistingData(data) {
  const before = {
    news: data.news?.length || 0,
    research: data.research?.length || 0,
  }

  data.news = (data.news || []).filter(shouldKeepExistingNews)
  data.research = (data.research || []).filter(shouldKeepExistingResearch)

  const after = {
    news: data.news.length,
    research: data.research.length,
  }

  if (before.news !== after.news || before.research !== after.research) {
    log(`Pruned existing brief data: news ${before.news}->${after.news}, research ${before.research}->${after.research}`)
    return true
  }
  return false
}

async function saveData(data) {
  const sortBriefItems = (items) => items.sort((a, b) => {
    const aKey = a.addedAt || a.date || ''
    const bKey = b.addedAt || b.date || ''
    return String(bKey).localeCompare(String(aKey))
  })

  data.meta = {
    ...(data.meta || {}),
    updatedAt: new Date().toISOString(),
    generator: 'ai',
  }
  sortBriefItems(data.news)
  sortBriefItems(data.research)
  await mkdir(path.dirname(dataFile), { recursive: true })
  await writeFile(dataFile, `${JSON.stringify(data, null, 2)}\n`, 'utf8')
}

async function buildQueue(sources, { isResearch = false } = {}) {
  const entries = await Promise.all(
    Object.entries(sources).map(async ([source, url]) => {
      const items = (await fetchFeed(url, source))
        .filter((item) => isLikelyLegal(item, source, isResearch))
        .map((item) => ({ ...item, score: candidateScore(item, source, isResearch) }))
        .sort((a, b) => b.score - a.score)
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
  const addedAt = new Date().toISOString()

  for (const { source, item } of queue) {
    if (additions.length >= limit) break
    if (existing.has(itemId(item.title))) continue

    try {
      log(`AI analyzing: ${item.title.slice(0, 80)}`)
      const analysis = await analyzeWithAi(aiConfig, item, source, isResearch)
      const qualityScore = Number(analysis?.qualityScore || 0)
      if (analysis?.shouldInclude === false || qualityScore < 6) {
        log(`AI result skipped: low editorial score for ${item.title.slice(0, 60)}`)
        continue
      }
      if (!analysis?.summaryCN || analysis.summaryCN.length < 20) {
        log(`AI result skipped: invalid summary for ${item.title.slice(0, 60)}`)
        continue
      }

      additions.push({
        title: item.title,
        titleCN: item.title,
        url: item.url,
        date: item.date,
        addedAt,
        summaryCN: analysis.summaryCN,
        summaryEN: '',
        whyMattersCN: analysis.whyMattersCN || '',
        whyMattersEN: '',
        tags: tagsFor(analysis.category, analysis.tags),
        quality_score: qualityScore || Math.min(10, Math.max(7, Math.round(item.score / 3))),
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
  const data = await loadData()
  data.news ||= []
  data.research ||= []

  const pruned = pruneExistingData(data)
  const aiConfig = createAiConfig()
  if (!aiConfig) {
    if (pruned) await saveData(data)
    log('No ARK_API_KEY, MOONSHOT_API_KEY, or KIMI_API_KEY. Existing brief data cleaned when needed; no new items generated.')
    return
  }
  log(`Using ${aiConfig.provider} model: ${model}`)

  await updateSection({ aiConfig, data, sources: newsSources, key: 'news', limit: maxNews, isResearch: false })
  await updateSection({ aiConfig, data, sources: researchSources, key: 'research', limit: maxResearch, isResearch: true })
  await saveData(data)
  log(`Saved ${data.news.length} news and ${data.research.length} research items`)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
