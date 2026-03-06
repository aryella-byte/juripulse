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

export default function BriefPage() {
  const [data, setData] = useState<BriefData | null>(null)
  const [tab, setTab] = useState<TabId>('news')
  const [selectedTag, setSelectedTag] = useState('')
  const [selectedSource, setSelectedSource] = useState('')

  useEffect(() => {
    fetch('/data/brief_data.json')
      .then(r => r.json())
      .then(d => setData(d))
      .catch(() => setData({ news: [], research: [] }))
  }, [])

  const allTags = useMemo(() => {
    if (!data) return []
    const tagSet = new Set<string>()
    ;[...data.news, ...data.research].forEach(item => {
      item.tags?.forEach(t => tagSet.add(t.name))
    })
    return [...tagSet].sort()
  }, [data])

  const allSources = useMemo(() => {
    if (!data) return []
    const sourceSet = new Set<string>()
    data.news.forEach(n => n.source && sourceSet.add(n.source))
    data.research.forEach(r => r.journal && sourceSet.add(r.journal))
    return [...sourceSet].sort()
  }, [data])

  const filterItems = (items: BriefItem[]) => {
    return items.filter(item => {
      if (selectedTag && !item.tags?.some(t => t.name === selectedTag)) return false
      if (selectedSource && item.source !== selectedSource && item.journal !== selectedSource) return false
      return true
    })
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
  const allFiltered = [...filteredNews, ...filteredResearch].sort((a, b) => b.date.localeCompare(a.date))

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
            onClick={() => setTab(t.id)}
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

      {/* Filters */}
      <div className="mb-6">
        <BriefFilters
          tags={allTags}
          sources={allSources}
          selectedTag={selectedTag}
          selectedSource={selectedSource}
          onTagChange={setSelectedTag}
          onSourceChange={setSelectedSource}
        />
      </div>

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
            filteredResearch.map((item, i) => <BriefCard key={i} item={{ ...item, source: item.journal }} />)
          )}
        </div>
      )}

      {tab === 'timeline' && <TimelineView items={allFiltered} />}
    </div>
  )
}
