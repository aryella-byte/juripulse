'use client'

import { useState, useEffect, useMemo } from 'react'
import { Newspaper, BookOpen, Clock } from 'lucide-react'
import { BriefCard, BriefItem } from '@/components/brief/BriefCard'
import { BriefFilters } from '@/components/brief/BriefFilters'
import { TimelineView } from '@/components/brief/TimelineView'

interface BriefData {
  news: BriefItem[]
  research: BriefItem[]
}

const TABS = [
  { id: 'news', label: '新闻速递', icon: Newspaper },
  { id: 'research', label: '学术研究', icon: BookOpen },
  { id: 'timeline', label: '时间线', icon: Clock },
] as const

type TabId = (typeof TABS)[number]['id']

const byDateDesc = (a: BriefItem, b: BriefItem) => b.date.localeCompare(a.date)

export default function BriefPage() {
  const [data, setData] = useState<BriefData | null>(null)
  const [tab, setTab] = useState<TabId>('news')
  const [selectedTag, setSelectedTag] = useState('')
  const [selectedSource, setSelectedSource] = useState('')

  useEffect(() => {
    fetch(`${process.env.__NEXT_ROUTER_BASEPATH || ''}/data/brief_data.json`)
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

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <div className="mb-10">
        <p className="text-[11px] font-medium uppercase tracking-widest" style={{ color: 'var(--gold)' }}>Legal Brief</p>
        <h1 className="font-serif mt-2 text-2xl font-semibold tracking-tight" style={{ letterSpacing: '-0.02em' }}>法学简报</h1>
        <p className="mt-2 text-[13px]" style={{ color: 'var(--text-tertiary)' }}>
          双语法学新闻简报 · {data.news.length} 条新闻 · {data.research.length} 篇研究 · AI 驱动分析
        </p>
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
