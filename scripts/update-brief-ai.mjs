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
  // 2026-10-29 加入：刑事司法与 AI 法律两个与本组研究线对口的来源
  'The Marshall Project': 'https://www.themarshallproject.org/rss/recent',
  Lawfare: 'https://www.lawfaremedia.org/feeds/articles',
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
  // 2026-10-29 加入：实证法学、犯罪学、法律心理学与 AI 法律期刊（Law and Human Behavior、Sentencing Law and Policy 等对脚本返回 403，未收）
  'J Empirical Legal Studies': 'https://onlinelibrary.wiley.com/feed/17401461/most-recent',
  Criminology: 'https://onlinelibrary.wiley.com/feed/17459125/most-recent',
  'Criminology & Public Policy': 'https://onlinelibrary.wiley.com/feed/17459133/most-recent',
  'Behavioral Sciences & the Law': 'https://onlinelibrary.wiley.com/feed/10990798/most-recent',
  'Justice Quarterly': 'https://www.tandfonline.com/feed/rss/rjqy20',
  'J Quantitative Criminology': 'https://link.springer.com/search.rss?facet-journal-id=10940&facet-content-type=Article',
  'Artificial Intelligence and Law': 'https://link.springer.com/search.rss?facet-journal-id=10506&facet-content-type=Article',
}

// 出版社文章页拒绝脚本访问（403），跳过可达性检查；链接改为 doi.org 永久地址
const publisherResearchSources = new Set([
  'J Empirical Legal Studies',
  'Criminology',
  'Criminology & Public Policy',
  'Behavioral Sciences & the Law',
  'Justice Quarterly',
])

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
  'court',
  'crime',
  'judge',
  'offend',
  'police',
  'prison',
  'punishment',
  'sentenc',
  'victim',
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
  'The Marshall Project': 9,
  Lawfare: 7,
  // 与本组研究线（量刑、司法行为、公众感知、AI 与法律判断、实证方法）对口的期刊优先
  'J Empirical Legal Studies': 12,
  Criminology: 11,
  'Criminology & Public Policy': 11,
  'Behavioral Sciences & the Law': 11,
  'Justice Quarterly': 11,
  'J Quantitative Criminology': 11,
  'Artificial Intelligence and Law': 11,
  'J Criminal Law & Criminology': 10,
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
  const decodeCodePoint = (value, radix = 10) => {
    const codePoint = Number.parseInt(value, radix)
    if (!Number.isFinite(codePoint)) return ''
    try {
      return String.fromCodePoint(codePoint)
    } catch {
      return ''
    }
  }

  return text
    .replaceAll('&amp;', '&')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'")
    .replaceAll('&apos;', "'")
    .replace(/&#(\d+);/g, (_, code) => decodeCodePoint(code))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => decodeCodePoint(code, 16))
}

function stripCdata(text) {
  return text.replace(/^<!\[CDATA\[/, '').replace(/\]\]>$/, '').trim()
}

function textBetween(xml, tag) {
  const match = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'))
  return match ? decodeEntities(stripCdata(match[1].trim())) : ''
}

function normalizeUrl(value) {
  return decodeEntities(String(value || '').trim())
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
        normalizeUrl(block.match(/<link[^>]*href=["']([^"']+)["'][^>]*>/i)?.[1] ?? '')
      const date =
        textBetween(block, 'pubDate') ||
        textBetween(block, 'dc:date') ||
        textBetween(block, 'published') ||
        textBetween(block, 'updated')
      const excerpt =
        textBetween(block, 'dc:description') ||
        textBetween(block, 'description') ||
        textBetween(block, 'summary') ||
        textBetween(block, 'content:encoded')

      return {
        title: title.trim(),
        url: normalizeUrl(link),
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
    const items = parseFeed(xml).slice(0, 15).map((item) => {
      if (!publisherResearchSources.has(source)) return item
      const doi = item.url.match(/\/doi\/(?:full\/|abs\/|epdf\/)?(10\.\d{4,9}\/[^?#\s]+)/i)?.[1]
      return doi ? { ...item, url: `https://doi.org/${doi}` } : item
    })
    log(`${source}: ${items.length} candidates`)
    return items
  } catch (error) {
    log(`${source} failed: ${error.message}`)
    return []
  }
}

async function isReachableUrl(url, source) {
  try {
    const response = await fetchWithTimeout(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'JuriPulse AI Legal Brief Bot/1.0',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        Range: 'bytes=0-0',
      },
      redirect: 'follow',
    }, feedTimeoutMs, `URL validation for ${source}`)

    response.body?.cancel()
    if (response.ok || (response.status >= 300 && response.status < 400)) return true
    log(`${source}: skipped unreachable URL ${response.status} ${url}`)
    return false
  } catch (error) {
    log(`${source}: skipped URL validation failure for ${url}: ${error.message}`)
    return false
  }
}

function createAiConfig() {
  // 2026-10-20 起主用 DeepSeek：火山引擎接口从 GitHub Actions 连不上（fetch failed），两个月没有新增内容
  if (process.env.DEEPSEEK_API_KEY) {
    return {
      apiKey: process.env.DEEPSEEK_API_KEY,
      url: 'https://api.deepseek.com/chat/completions',
      provider: 'deepseek',
      model: process.env.DEEPSEEK_MODEL || 'deepseek-flash',
    }
  }
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

const aiStats = { ok: 0, failed: 0, added: 0 }

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
      model: aiConfig.model || model,
      max_tokens: 1400,
      temperature: 0.45,
      messages: [{ role: 'user', content: prompt }],
      ...(aiConfig.provider === 'ark' || aiConfig.provider === 'kimi' || aiConfig.provider === 'deepseek'
        ? { thinking: { type: 'disabled' } }
        : {}),
    }),
  }, aiTimeoutMs, `AI request for ${source}`)

  if (!response.ok) {
    aiStats.failed += 1
    throw new Error(`AI request failed: ${response.status} ${(await response.text()).slice(0, 300)}`)
  }
  aiStats.ok += 1

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

  // updatedAt 只在真正新增内容时刷新（页面显示的“最近更新”）；每次运行的时间另记 checkedAt
  const now = new Date().toISOString()
  data.meta = {
    ...(data.meta || {}),
    ...(aiStats.added > 0 || aiStats.digests > 0 ? { updatedAt: now } : {}),
    checkedAt: now,
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

  // 轮流取各来源时，权重高（与本组研究线对口）的来源排在前面
  entries.sort((a, b) => (sourceWeights[b.source] || 0) - (sourceWeights[a.source] || 0))
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
      if (!publisherResearchSources.has(source) && !(await isReachableUrl(item.url, source))) continue
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
      if (!/AI request failed/.test(error.message)) aiStats.failed += 1
      log(`AI analysis skipped: ${error.message}`)
    }
  }

  data[key] = [...(data[key] || []), ...additions]
  aiStats.added += additions.length
  log(`${key}: +${additions.length}`)
}

// ============================================
// 补录模式（2026-10-20）：按页回翻 RSS，把指定日期区间内的内容按月均匀补进来。
// 用法：BACKFILL_FROM=2026-08-01 BACKFILL_TO=2026-10-12 BACKFILL_PAGES=30 BACKFILL_NEWS_PER_MONTH=12 BACKFILL_RESEARCH_PER_MONTH=4
// 只用支持 ?paged=N 的源；每次请求之间随机停 2–15 秒，2 秒是硬下限，不可调低。
// ============================================
const backfillNewsSources = { 'Just Security': 'https://www.justsecurity.org/feed/' }
const MIN_BACKFILL_DELAY_MS = 2000
async function politePause() {
  const ms = Math.max(MIN_BACKFILL_DELAY_MS, 2000 + Math.random() * 13000)
  await new Promise((resolve) => setTimeout(resolve, ms))
}

async function fetchPagedRange(source, url, from, to, maxPages) {
  const found = []
  const seen = new Set()
  for (let page = 1; page <= maxPages; page += 1) {
    await politePause()
    const pageUrl = `${url}${url.includes('?') ? '&' : '?'}paged=${page}`
    let items = []
    try {
      const response = await fetchWithTimeout(pageUrl, {
        headers: {
          'User-Agent': 'JuriPulse AI Legal Brief Bot/1.0',
          Accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml',
        },
      }, feedTimeoutMs, `Backfill feed ${source} p${page}`)
      if (!response.ok) { log(`${source} p${page}: ${response.status}`); break }
      items = parseFeed(await response.text())
    } catch (error) {
      log(`${source} p${page} failed: ${error.message}`)
      break
    }
    const fresh = items.filter((item) => !seen.has(item.url))
    if (!fresh.length) { log(`${source} p${page}: no new items, stop`); break }   // 不支持翻页的源会反复返回同一页
    fresh.forEach((item) => seen.add(item.url))
    found.push(...fresh.filter((item) => item.date >= from && item.date <= to))
    const oldest = fresh.map((item) => item.date).sort()[0]
    log(`${source} p${page}: ${fresh.length} items, oldest ${oldest}, in range so far ${found.length}`)
    if (oldest < from) break
  }
  return found
}

async function backfillSection({ aiConfig, data, sources, key, perMonth, isResearch, from, to, maxPages }) {
  const existing = new Set((data[key] || []).map((item) => itemId(item.title)))
  const byMonth = new Map()
  for (const [source, url] of Object.entries(sources)) {
    const items = await fetchPagedRange(source, url, from, to, maxPages)
    for (const item of items) {
      if (!isLikelyLegal(item, source, isResearch) || existing.has(itemId(item.title))) continue
      const month = item.date.slice(0, 7)
      if (!byMonth.has(month)) byMonth.set(month, [])
      byMonth.get(month).push({ source, item, score: candidateScore(item, source, isResearch) })
    }
  }
  const additions = []
  for (const [month, candidates] of [...byMonth.entries()].sort()) {
    candidates.sort((a, b) => b.score - a.score)
    let taken = 0
    for (const { source, item } of candidates) {
      if (taken >= perMonth) break
      try {
        log(`AI analyzing (${month}): ${item.title.slice(0, 80)}`)
        const analysis = await analyzeWithAi(aiConfig, item, source, isResearch)
        const qualityScore = Number(analysis?.qualityScore || 0)
        // 日常任务以后会删掉低于 MIN_EXISTING_QUALITY 的条目，补录直接按这个门槛收
        if (analysis?.shouldInclude === false || qualityScore < minExistingQuality) continue
        if (!analysis?.summaryCN || analysis.summaryCN.length < 20) continue
        additions.push({
          title: item.title,
          titleCN: item.title,
          url: item.url,
          date: item.date,
          addedAt: `${item.date}T12:00:00.000Z`,   // 按原发布日期排序，不压在当天的新内容上面
          summaryCN: analysis.summaryCN,
          summaryEN: '',
          whyMattersCN: analysis.whyMattersCN || '',
          whyMattersEN: '',
          tags: tagsFor(analysis.category, analysis.tags),
          quality_score: qualityScore,
          backfilled: true,
          ...(isResearch ? { journal: source } : { source }),
        })
        existing.add(itemId(item.title))
        taken += 1
        log(`Backfilled ${key} ${month}: ${item.title.slice(0, 80)}`)
      } catch (error) {
        if (!/AI request failed/.test(error.message)) aiStats.failed += 1
        log(`AI analysis skipped: ${error.message}`)
      }
    }
    log(`${key} ${month}: +${taken} (of ${candidates.length} candidates)`)
  }
  data[key] = [...(data[key] || []), ...additions]
  aiStats.added += additions.length
}

// ============================================
// 每日速递（2026-10-29）：把同一天收录的新闻与论文写成一篇短综述，要点句末标注引用编号。
// 页面按北京时间日期分组展示；条目的标签不再用于筛选。
// 日常运行补写最近 DIGEST_LOOKBACK_DAYS 天里缺速递的日子；DIGEST_BACKFILL=1 时补写全部缺失日期。
// ============================================
const digestLookbackDays = Number(process.env.DIGEST_LOOKBACK_DAYS || 3)
const digestMaxPerRun = Number(process.env.DIGEST_MAX_PER_RUN || (process.env.DIGEST_BACKFILL ? 400 : 5))

function beijingDate(iso) {
  if (!iso) return ''
  const time = Date.parse(iso)
  if (Number.isNaN(time)) return String(iso).slice(0, 10)
  return new Date(time + 8 * 3600 * 1000).toISOString().slice(0, 10)
}

function itemDay(item) {
  return beijingDate(item.addedAt) || String(item.date || '').slice(0, 10)
}

function groupItemsByDay(data) {
  const days = new Map()
  for (const item of [...(data.news || []), ...(data.research || [])]) {
    const day = itemDay(item)
    if (!day) continue
    if (!days.has(day)) days.set(day, [])
    days.get(day).push(item)
  }
  return days
}

async function writeDigest(aiConfig, day, items) {
  const numbered = items.map((item, i) => {
    const source = item.journal || item.source || ''
    const kind = item.journal ? '论文' : '新闻'
    return `[${i + 1}] ${kind}｜${source}｜${item.title}｜发布于 ${item.date}
摘要：${item.summaryCN}
分析：${item.whyMattersCN || '无'}`
  }).join('\n\n')

  const prompt = `你是 Peng Lab（中国人民大学法学院）法学简报的编辑。下面是 ${day} 收录的 ${items.length} 条法律新闻与法学论文，已编号。请写当天的“每日速递”。

本组的研究方向：量刑与刑罚；法官与司法行为；公众对司法公正的感知；人工智能与法律判断；法律实证研究方法；刑事司法与监狱矫正。

${numbered}

写作要求：
1. 写 ${Math.min(Math.max(items.length, 1), 2)}–${Math.min(items.length, 6)} 条要点，按重要性排序；与本组研究方向相关的排在前面。相近的条目可以合成一条要点。
2. 每条要点 60–130 字：先交代事实或论文的发现，再点出其中的法律问题。只写材料里有的内容，不补充材料以外的事实、数字或评价。
3. 每条要点用 refs 注明依据的条目编号；每个编号至少被引用一次。
4. relevance 默认留空字符串。只有当该条内容本身就落在上述某个研究方向里（例如：量刑或刑罚的数据与规则、法官如何作出判断、公众对判决或司法公正的态度、AI 被用于裁判或法律判断、监狱与矫正、法律实证研究的方法或数据），才用一句话（不超过 40 字）写明它与哪个方向相关、可以提供什么材料。一般的宪法、行政法、民事程序、国际法、律师执业新闻不填。多数日子应当没有或只有一条关联。不要写“可供比较”“可资借鉴”一类泛泛的话。
5. 用平实、书面的中文，不用“重磅”“值得关注”“意义深远”之类套话，不用排比和口号式收尾。美国案件名、机构名可保留英文原名。字段值内不要使用英文双引号。

只返回 JSON，不要 markdown 代码块：
{"points":[{"text":"……","refs":[1],"relevance":""}]}`

  const response = await fetchWithTimeout(aiConfig.url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${aiConfig.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: aiConfig.model || model,
      max_tokens: 2400,
      temperature: 0.3,
      messages: [{ role: 'user', content: prompt }],
      ...(aiConfig.provider === 'ark' || aiConfig.provider === 'kimi' || aiConfig.provider === 'deepseek'
        ? { thinking: { type: 'disabled' } }
        : {}),
    }),
  }, Math.max(aiTimeoutMs, 90000), `Digest request for ${day}`)

  if (!response.ok) {
    aiStats.failed += 1
    throw new Error(`AI request failed: ${response.status} ${(await response.text()).slice(0, 300)}`)
  }
  aiStats.ok += 1
  const payload = await response.json()
  const message = payload.choices?.[0]?.message || {}
  const parsed = JSON.parse(extractJsonText(String(message.content || '').trim()))

  const points = (Array.isArray(parsed?.points) ? parsed.points : [])
    .map((point) => {
      const refs = [...new Set((Array.isArray(point?.refs) ? point.refs : [])
        .map(Number)
        .filter((n) => Number.isInteger(n) && n >= 1 && n <= items.length))]
      return {
        text: String(point?.text || '').trim(),
        refs: refs.map((n) => items[n - 1].url),
        relevance: String(point?.relevance || '').trim(),
      }
    })
    .filter((point) => point.text.length >= 20 && point.refs.length)

  if (!points.length) throw new Error(`Digest for ${day} has no usable points`)
  return {
    date: day,
    generatedAt: new Date().toISOString(),
    model: aiConfig.model || model,
    points,
    items: items.map((item) => item.url),
    usage: payload.usage ? { prompt: payload.usage.prompt_tokens, completion: payload.usage.completion_tokens } : undefined,
  }
}

async function updateDigests(aiConfig, data) {
  data.digests ||= []
  const done = new Set(data.digests.map((digest) => digest.date))
  const days = groupItemsByDay(data)
  const todayBj = beijingDate(new Date().toISOString())
  const earliest = beijingDate(new Date(Date.now() - digestLookbackDays * 86400000).toISOString())
  const pending = [...days.keys()]
    .filter((day) => !done.has(day) && day <= todayBj && (process.env.DIGEST_BACKFILL || day >= earliest))
    .sort()
    .reverse()
    .slice(0, digestMaxPerRun)

  let added = 0
  const tokens = { prompt: 0, completion: 0 }
  for (const day of pending) {
    const items = days.get(day).sort((a, b) => (b.quality_score || 0) - (a.quality_score || 0))
    try {
      log(`Writing digest for ${day} (${items.length} items)`)
      const digest = await writeDigest(aiConfig, day, items)
      tokens.prompt += digest.usage?.prompt || 0
      tokens.completion += digest.usage?.completion || 0
      delete digest.usage
      data.digests.push(digest)
      added += 1
    } catch (error) {
      if (!/AI request failed/.test(error.message)) aiStats.failed += 1
      log(`Digest skipped for ${day}: ${error.message}`)
    }
  }
  data.digests.sort((a, b) => b.date.localeCompare(a.date))
  aiStats.digests = added
  log(`Digests: +${added} of ${pending.length} pending (tokens in ${tokens.prompt}, out ${tokens.completion})`)
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
  log(`Using ${aiConfig.provider} model: ${aiConfig.model || model}`)

  if (process.env.DIGEST_BACKFILL) {
    await updateDigests(aiConfig, data)
    await saveData(data)
    log(`Digest backfill done (AI ok ${aiStats.ok}, failed ${aiStats.failed}, digests ${aiStats.digests})`)
    if (aiStats.ok === 0 && aiStats.failed > 0) process.exitCode = 1
    return
  }

  if (process.env.BACKFILL_FROM) {
    const from = process.env.BACKFILL_FROM
    const to = process.env.BACKFILL_TO || today()
    const maxPages = Number(process.env.BACKFILL_PAGES || 30)
    log(`Backfill ${from} .. ${to}, up to ${maxPages} pages per source`)
    await backfillSection({ aiConfig, data, sources: backfillNewsSources, key: 'news', perMonth: Number(process.env.BACKFILL_NEWS_PER_MONTH || 12), isResearch: false, from, to, maxPages })
    await backfillSection({ aiConfig, data, sources: researchSources, key: 'research', perMonth: Number(process.env.BACKFILL_RESEARCH_PER_MONTH || 4), isResearch: true, from, to, maxPages: Math.min(maxPages, 8) })
    await updateDigests(aiConfig, data)
    await saveData(data)
    log(`Saved ${data.news.length} news and ${data.research.length} research items (AI ok ${aiStats.ok}, failed ${aiStats.failed}, added ${aiStats.added})`)
    if (aiStats.ok === 0 && aiStats.failed > 0) process.exitCode = 1
    return
  }

  await updateSection({ aiConfig, data, sources: newsSources, key: 'news', limit: maxNews, isResearch: false })
  await updateSection({ aiConfig, data, sources: researchSources, key: 'research', limit: maxResearch, isResearch: true })
  await updateDigests(aiConfig, data)
  await saveData(data)
  log(`Saved ${data.news.length} news and ${data.research.length} research items (AI ok ${aiStats.ok}, failed ${aiStats.failed}, added ${aiStats.added})`)
  if (aiStats.ok === 0 && aiStats.failed > 0) {
    // 所有 AI 调用都失败：让这次运行在 GitHub 上显示为失败，不再静默“成功”
    console.error('All AI requests failed; no new items. Check the API key, balance, or network.')
    process.exitCode = 1
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
