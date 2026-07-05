'use client'

import { useState, useEffect, useMemo } from 'react'
import { Newspaper, BookOpen, Clock, CalendarDays, RefreshCw } from 'lucide-react'
import { BriefCard, BriefItem } from '@/components/brief/BriefCard'
import { BriefFilters } from '@/components/brief/BriefFilters'
import { TimelineView } from '@/components/brief/TimelineView'

interface BriefData {
  news: BriefItem[]
  research: BriefItem[]
  meta?: {
    updatedAt?: string
  }
}

const TABS = [
  { id: 'news', label: '新闻速递', icon: Newspaper },
  { id: 'research', label: '学术研究', icon: BookOpen },
  { id: 'timeline', label: '时间线', icon: Clock },
] as const

type TabId = (typeof TABS)[number]['id']

const sortKey = (item: BriefItem) => item.addedAt || item.date
const byDateDesc = (a: BriefItem, b: BriefItem) => sortKey(b).localeCompare(sortKey(a))

const formatDate = (date: string) => {
  if (!date) return '待更新'
  return date.replaceAll('-', '.')
}

export default function BriefPage() {
  const [data, setData] = useState<BriefData | null>(null)
  const [tab, setTab] = useState<TabId>('news')
  const [selectedTag, setSelectedTag] = useState('')
  const [selectedSource, setSelectedSource] = useState('')

  useEffect(() => {
    fetch(`/juripulse/data/brief_data.json?v=${Date.now()}`, { cache: 'no-store' })
      .then(r => r.json())
      .then(d => setData(d))
      .catch(() => setData({ news: [], research: [] }))
  }, [])

  const newsTags = useMemo(() => {
    if (!data) return []
    const s = new Set<string>()
    data.news.forEach(item => item.tags?.forEach(t => s.add(t.name)))
    return [...s].sort()
  }, [data])

  const newsSources = useMemo(() => {
    if (!data) return []
    const s = new Set<string>()
    data.news.forEach(n => n.source && s.add(n.source))
    return [...s].sort()
  }, [data])

  const researchTags = useMemo(() => {
    if (!data) return []
    const s = new Set<string>()
    data.research.forEach(item => item.tags?.forEach(t => s.add(t.name)))
    return [...s].sort()
  }, [data])

  const researchSources = useMemo(() => {
    if (!data) return []
    const s = new Set<string>()
    data.research.forEach(r => (r.journal || r.source) && s.add((r.journal || r.source)!))
    return [...s].sort()
  }, [data])

  const handleTabChange = (newTab: TabId) => {
    setTab(newTab)
    setSelectedTag('')
    setSelectedSource('')
  }

  const filterItems = (items: BriefItem[]) => {
    return items
      .filter(item => {
        if (selectedTag && !item.tags?.some(t => t.name === selectedTag)) return false
        if (selectedSource && item.source !== selectedSource && item.journal !== selectedSource) return false
        return true
      })
      .sort(byDateDesc)
  }

  if (!data) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="h-4 w-4 animate-pulse rounded-full" style={{ background: 'var(--navy)' }} />
          <span style={{ color: 'var(--text-tertiary)' }}>加载简报数据...</span>
        </div>
      </div>
    )
  }

  const filteredNews = filterItems(data.news)
  const filteredResearch = filterItems(data.research)
  const allFiltered = [...data.news, ...data.research].sort(byDateDesc)
  const latestDate = data.meta?.updatedAt?.slice(0, 10) || allFiltered[0]?.date || ''

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <div className="mb-10 border-b pb-8" style={{ borderColor: 'var(--border)' }}>
        <div className="mb-4 inline-flex items-center gap-2 rounded-md px-2.5 py-1 text-[11px] font-medium uppercase tracking-widest" style={{ background: 'var(--accent-glow)', color: 'var(--navy)' }}>
          <RefreshCw size={12} />
          AI Daily Legal Brief
        </div>
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <h1 className="font-serif text-3xl font-semibold tracking-tight" style={{ letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>法学简报</h1>
            <p className="mt-3 max-w-2xl text-[14px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              由 AI 每日检索、筛选并生成的双语法学新闻与学术研究简报，聚合国际法学动态、重要判例、政策变化和最新论文，并提供中文解读。
            </p>
          </div>
          <div className="rounded-md px-4 py-3 text-sm" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <div className="flex items-center gap-2 text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
              <CalendarDays size={13} />
              最新更新
            </div>
            <div className="mt-1 font-serif text-xl font-semibold" style={{ color: 'var(--navy)' }}>{formatDate(latestDate)}</div>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {[
            { label: '新闻速递', value: data.news.length },
            { label: '学术研究', value: data.research.length },
            { label: '生成方式', value: 'AI每日' },
          ].map((item) => (
            <div key={item.label} className="rounded-md px-4 py-3" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
              <div className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>{item.label}</div>
              <div className="mt-1 text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>{item.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-1 border-b" style={{ borderColor: 'var(--border)' }}>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => handleTabChange(t.id)}
            className="relative flex items-center gap-1.5 whitespace-nowrap px-4 py-3 text-[13px] transition-colors"
            style={{
              color: tab === t.id ? 'var(--text-primary)' : 'var(--text-tertiary)',
              fontWeight: tab === t.id ? 500 : 400,
            }}
          >
            <t.icon size={14} />
            {t.label}
            {tab === t.id && (
              <span className="absolute bottom-0 left-2 right-2 h-[2px]" style={{ background: 'var(--gold)' }} />
            )}
          </button>
        ))}
      </div>

      {/* Filters — hidden on timeline tab */}
      {tab !== 'timeline' && (
        <div className="mb-6">
          <BriefFilters
            tags={tab === 'news' ? newsTags : researchTags}
            sources={tab === 'news' ? newsSources : researchSources}
            selectedTag={selectedTag}
            selectedSource={selectedSource}
            onTagChange={setSelectedTag}
            onSourceChange={setSelectedSource}
            sourceLabel={tab === 'news' ? '全部来源' : '全部期刊'}
          />
        </div>
      )}

      {/* Content */}
      {tab === 'news' && (
        <div className="space-y-3">
          {filteredNews.length === 0 ? (
            <p className="py-12 text-center text-[13px]" style={{ color: 'var(--text-tertiary)' }}>暂无匹配的新闻</p>
          ) : (
            filteredNews.map((item, i) => <BriefCard key={i} item={item} />)
          )}
        </div>
      )}

      {tab === 'research' && (
        <div className="space-y-3">
          {filteredResearch.length === 0 ? (
            <p className="py-12 text-center text-[13px]" style={{ color: 'var(--text-tertiary)' }}>暂无匹配的研究</p>
          ) : (
            filteredResearch.map((item, i) => <BriefCard key={i} item={{ ...item, source: item.journal || item.source }} />)
          )}
        </div>
      )}

      {tab === 'timeline' && <TimelineView items={allFiltered} />}
    </div>
  )
}
