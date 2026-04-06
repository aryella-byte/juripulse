'use client'

import { useEffect, useState } from 'react'
import { BarChart3, TrendingUp, Network, Layers } from 'lucide-react'
import { DisciplineTreemap } from '@/components/research/DisciplineTreemap'
import { JournalBar } from '@/components/research/JournalBar'
import { TrendChart } from '@/components/research/TrendChart'
import { EmergingTable } from '@/components/research/EmergingTable'
import { AuthorForce } from '@/components/research/AuthorForce'
import { CitedList } from '@/components/research/CitedList'
import { JournalMatrix } from '@/components/research/JournalMatrix'
import { DisciplineStack } from '@/components/research/DisciplineStack'

const bp = '/juripulse'

const TABS = [
  { id: 'overview', label: '全景概览', icon: BarChart3 },
  { id: 'trends', label: '研究趋势', icon: TrendingUp },
  { id: 'network', label: '学术网络', icon: Network },
  { id: 'disciplines', label: '学科深钻', icon: Layers },
] as const

type TabId = (typeof TABS)[number]['id']

interface DisciplineLandscape {
  disciplines: { name: string; count: number }[]
  year_matrix: Record<string, Record<string, number>>
  journal_matrix: Record<string, Record<string, number>>
}

interface KeywordTrends {
  trends: Record<string, Record<string, number>>
  emerging: { keyword: string; recent: number; earlier: number; growth: number }[]
  declining: { keyword: string; recent: number; earlier: number; growth: number }[]
}

interface TopCited {
  papers: { title: string; author: string; journal: string; year: number; discipline: string; cited_count: number }[]
  recent: { title: string; author: string; journal: string; year: number; discipline: string; cited_count: number }[]
  journal_impact: { journal: string; papers: number; citations: number }[]
}

interface AuthorNetwork {
  nodes: { id: string; papers: number; cited: number; discipline: string }[]
  edges: { source: string; target: string; weight: number }[]
}

interface DashboardStats {
  papers: number
  journals: number
  disciplines: number
}

export default function ResearchPage() {
  const [tab, setTab] = useState<TabId>('overview')
  const [landscape, setLandscape] = useState<DisciplineLandscape | null>(null)
  const [kwTrends, setKwTrends] = useState<KeywordTrends | null>(null)
  const [topCited, setTopCited] = useState<TopCited | null>(null)
  const [authorNet, setAuthorNet] = useState<AuthorNetwork | null>(null)
  const [stats, setStats] = useState<DashboardStats | null>(null)

  useEffect(() => {
    // Load data lazily based on tab
    fetch(`${bp}/data/dashboard_stats.json`).then(r => r.json()).then(setStats).catch(() => {})
    fetch(`${bp}/data/discipline_landscape.json`).then(r => r.json()).then(setLandscape).catch(() => {})
  }, [])

  useEffect(() => {
    if (tab === 'trends' && !kwTrends) {
      fetch(`${bp}/data/keyword_trends.json`).then(r => r.json()).then(setKwTrends).catch(() => {})
    }
    if (tab === 'network' && !topCited) {
      Promise.all([
        fetch(`${bp}/data/top_cited.json`).then(r => r.json()),
        fetch(`${bp}/data/author_network.json`).then(r => r.json()),
      ]).then(([tc, an]) => { setTopCited(tc); setAuthorNet(an) }).catch(() => {})
    }
  }, [tab, kwTrends, topCited])

  const discNames = landscape?.disciplines.map(d => d.name) || []
  const journalData = landscape
    ? Object.entries(landscape.journal_matrix).map(([journal, discs]) => ({
        journal,
        count: Object.values(discs).reduce((a, b) => a + b, 0),
      })).sort((a, b) => b.count - a.count)
    : []

  const Loading = () => (
    <div className="flex min-h-[300px] items-center justify-center">
      <div className="flex items-center gap-3">
        <div className="h-4 w-4 animate-pulse rounded-full" style={{ background: 'var(--navy)' }} />
        <span style={{ color: 'var(--text-tertiary)' }}>加载数据中...</span>
      </div>
    </div>
  )

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      {/* Header */}
      <div className="mb-8">
        <p className="text-[11px] font-medium uppercase tracking-widest" style={{ color: 'var(--gold)' }}>
          Research Intelligence
        </p>
        <h1 className="font-serif mt-2 text-3xl font-semibold tracking-tight" style={{ color: 'var(--navy)', letterSpacing: '-0.02em' }}>
          研究动态
        </h1>
        <p className="mt-2 max-w-2xl text-[14px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          {stats
            ? `基于 ${stats.papers.toLocaleString()} 篇 CLSCI 论文的全景分析 — 覆盖 ${stats.journals} 种核心期刊、${stats.disciplines} 个法学学科`
            : '基于 CLSCI 核心期刊论文的全景分析'}
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

      {/* Tab Content */}
      {tab === 'overview' && (
        <div>
          {!landscape ? <Loading /> : (
            <div className="space-y-10">
              {/* Treemap + Journal */}
              <div className="grid gap-8 lg:grid-cols-[2fr,1fr]">
                <div>
                  <h3 className="font-serif mb-4 text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                    学科版图
                  </h3>
                  <DisciplineTreemap data={landscape.disciplines} />
                </div>
                <div>
                  <h3 className="font-serif mb-4 text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                    期刊排名
                  </h3>
                  <JournalBar data={journalData} />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'trends' && (
        <div>
          {!kwTrends ? <Loading /> : (
            <div className="space-y-10">
              <div>
                <h3 className="font-serif mb-4 text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                  关键词趋势
                </h3>
                <TrendChart data={kwTrends.trends} />
              </div>
              <div>
                <h3 className="font-serif mb-4 text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                  新兴与趋冷议题
                </h3>
                <EmergingTable emerging={kwTrends.emerging} declining={kwTrends.declining} />
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'network' && (
        <div>
          {!authorNet || !topCited ? <Loading /> : (
            <div className="space-y-10">
              <div>
                <h3 className="font-serif mb-4 text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                  作者引文网络
                </h3>
                <p className="mb-4 text-[12px]" style={{ color: 'var(--text-tertiary)' }}>
                  节点大小 = 被引次数 · 颜色 = 学科 · 连线 = 引用关系
                </p>
                <AuthorForce nodes={authorNet.nodes} edges={authorNet.edges} />
              </div>
              <div>
                <h3 className="font-serif mb-4 text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                  高被引论文
                </h3>
                <CitedList papers={topCited.papers} recent={topCited.recent} />
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'disciplines' && (
        <div>
          {!landscape ? <Loading /> : (
            <div className="space-y-10">
              <div>
                <h3 className="font-serif mb-4 text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                  学科演变趋势
                </h3>
                <DisciplineStack data={landscape.year_matrix} disciplines={discNames} />
              </div>
              <div>
                <h3 className="font-serif mb-4 text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                  期刊 × 学科矩阵
                </h3>
                <JournalMatrix data={landscape.journal_matrix} disciplines={discNames} />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
