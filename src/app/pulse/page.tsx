'use client'

import { useState, useEffect } from 'react'
import { BarChart3, Network, PieChart, List, TrendingUp } from 'lucide-react'
import { TopicsData, NetworkData, Article } from '@/components/pulse/types'
import { OverviewTab } from '@/components/pulse/OverviewTab'
import { TopicsTab } from '@/components/pulse/TopicsTab'
import { NetworkTab } from '@/components/pulse/NetworkTab'
import { ArticlesTab } from '@/components/pulse/ArticlesTab'
import { TemporalTab } from '@/components/pulse/TemporalTab'

const TABS = [
  { id: 'overview', label: '总览', icon: BarChart3 },
  { id: 'topics', label: '主题分布', icon: PieChart },
  { id: 'network', label: '共现网络', icon: Network },
  { id: 'temporal', label: '时序分析', icon: TrendingUp },
  { id: 'articles', label: '文章列表', icon: List },
] as const

type TabId = (typeof TABS)[number]['id']

export default function PulsePage() {
  const [topics, setTopics] = useState<TopicsData | null>(null)
  const [network, setNetwork] = useState<NetworkData | null>(null)
  const [articles, setArticles] = useState<Article[]>([])
  const [tab, setTab] = useState<TabId>('overview')

  useEffect(() => {
    Promise.all([
      fetch('/data/clsci_topics.json').then(r => r.json()),
      fetch('/data/clsci_network.json').then(r => r.json()),
      fetch('/data/clsci_articles.json').then(r => r.json()),
    ]).then(([t, n, a]) => { setTopics(t); setNetwork(n); setArticles(a) })
  }, [])

  if (!topics) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="h-4 w-4 animate-pulse rounded-full" style={{ background: 'var(--navy)' }} />
          <span style={{ color: 'var(--text-tertiary)' }}>加载数据中...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-10">
        <p className="text-[11px] font-medium uppercase tracking-widest" style={{ color: 'var(--gold)' }}>Research Pulse</p>
        <h1 className="font-serif mt-2 text-2xl font-semibold tracking-tight" style={{ letterSpacing: '-0.02em' }}>CLSCI 研究态势</h1>
        <p className="mt-2 text-[13px]" style={{ color: 'var(--text-tertiary)' }}>
          {topics.summary.year}年 · {topics.summary.journal_count} 种期刊 · {topics.summary.total_articles} 篇泛刑法论文 · NLP 驱动分析
        </p>
      </div>

      {/* Tabs */}
      <div className="mb-8 flex gap-1 border-b" style={{ borderColor: 'var(--border)' }}>
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

      {tab === 'overview' && <OverviewTab data={topics} />}
      {tab === 'topics' && <TopicsTab data={topics} />}
      {tab === 'network' && network && <NetworkTab data={network} />}
      {tab === 'temporal' && <TemporalTab data={topics} articles={articles} />}
      {tab === 'articles' && <ArticlesTab articles={articles} />}
    </div>
  )
}
