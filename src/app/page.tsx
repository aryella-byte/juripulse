'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, BarChart3, BookOpen, Newspaper } from 'lucide-react'
import { HeroPulse } from '@/components/home/HeroPulse'
import { AnimatedStats } from '@/components/home/AnimatedStats'
import { TrendingGrid } from '@/components/home/TrendingGrid'
import { Capabilities } from '@/components/home/Capabilities'

interface DashboardStats {
  papers: number
  journals: number
  disciplines: number
  year_range: [number, number]
  hot_keywords: { keyword: string; count: number; growth: number }[]
}

interface ResearchPulse {
  yearly: { year: number; count: number }[]
  latest: { title: string; author: string; journal: string; year: number }[]
}

interface KeywordTrends {
  trends: Record<string, Record<string, number>>
  emerging: { keyword: string; recent: number; earlier: number; growth: number }[]
}

const bp = '/juripulse'

const features = [
  {
    href: '/research',
    icon: BarChart3,
    title: '研究动态',
    subtitle: 'Research Intelligence',
    description: '关键词趋势追踪、学科版图分析、引文网络可视化 — 全面洞察法学研究前沿动态',
    tag: '核心功能',
  },
  {
    href: '/pulse',
    icon: BookOpen,
    title: '研究图景',
    subtitle: 'Research Landscape',
    description: '围绕法学热点话题，系统梳理文献脉络、核心论点与学术争议，呈现完整研究图景',
    tag: '深度分析',
  },
  {
    href: '/brief',
    icon: Newspaper,
    title: '法学简报',
    subtitle: 'Legal Brief',
    description: '追踪国际法学研究前沿，双语 AI 驱动分析，比较法视角解读',
    tag: '每日更新',
  },
]

export default function Home() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [pulse, setPulse] = useState<ResearchPulse | null>(null)
  const [trends, setTrends] = useState<KeywordTrends | null>(null)

  useEffect(() => {
    Promise.all([
      fetch(`${bp}/data/dashboard_stats.json`).then(r => r.json()),
      fetch(`${bp}/data/research_pulse.json`).then(r => r.json()),
      fetch(`${bp}/data/keyword_trends.json`).then(r => r.json()),
    ]).then(([s, p, t]) => {
      setStats(s)
      setPulse(p)
      setTrends(t)
    }).catch(() => {})
  }, [])

  const trendingItems = trends
    ? trends.emerging.slice(0, 6).map((e) => {
        const yearData = trends.trends[e.keyword] || {}
        const years = Object.keys(yearData).map(Number).sort()
        const data = years.map(y => yearData[String(y)] || 0)
        return { keyword: e.keyword, growth: e.growth, data, recent: e.recent }
      })
    : []

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>

      {/* === Hero === */}
      <section className="relative">
        <div className="mx-auto max-w-5xl px-6 pb-16 pt-24">
          <div className="grid items-center gap-10 lg:grid-cols-[1fr,1fr]">
            <div>
              <h1
                className="font-serif text-4xl font-semibold tracking-tight sm:text-5xl"
                style={{ color: 'var(--navy)', lineHeight: '1.12', letterSpacing: '-0.02em' }}
              >
                法脉
                <span className="ml-3 text-3xl sm:text-4xl" style={{ color: 'var(--gold)' }}>
                  JuriPulse
                </span>
              </h1>

              <p className="mt-4 text-lg font-medium" style={{ color: 'var(--text-primary)' }}>
                中国法学核心期刊智能研究引擎
              </p>

              <p className="mt-3 text-[14px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                精准定位研究热点与学术争议，全面覆盖法学核心期刊，为选题与论证提供数据支撑。
              </p>

              <div className="mt-8 flex items-center gap-4">
                <Link
                  href="/research"
                  className="inline-flex items-center gap-2 rounded-md px-6 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
                  style={{ background: 'var(--navy)' }}
                >
                  研究动态 <ArrowRight size={15} />
                </Link>
                <Link
                  href="/pulse"
                  className="inline-flex items-center gap-2 rounded-md px-6 py-2.5 text-sm font-medium transition-colors"
                  style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
                >
                  研究图景
                </Link>
              </div>
            </div>

            <div className="hidden lg:block">
              {pulse ? (
                <HeroPulse data={pulse.yearly} />
              ) : (
                <div className="flex h-[250px] items-center justify-center rounded-lg" style={{ background: 'var(--bg-secondary)' }}>
                  <div className="h-4 w-4 animate-pulse rounded-full" style={{ background: 'var(--navy)' }} />
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* === Stats Bar === */}
      {stats && (
        <AnimatedStats
          stats={[
            { value: stats.papers, label: '篇论文' },
            { value: stats.journals, label: 'CLSCI 期刊' },
          ]}
        />
      )}

      {/* === Trending Topics === */}
      {trendingItems.length > 0 && <TrendingGrid items={trendingItems} />}

      {/* === Feature Cards === */}
      <section className="mx-auto max-w-5xl px-6 py-16">
        <div className="mb-10">
          <p className="text-[11px] font-medium uppercase tracking-widest" style={{ color: 'var(--gold)' }}>Platform</p>
          <h2 className="font-serif mt-2 text-2xl font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            三大核心模块
          </h2>
        </div>

        <div className="grid gap-5 sm:grid-cols-3">
          {features.map((f) => (
            <Link
              key={f.href}
              href={f.href}
              className="group relative flex flex-col rounded-lg p-6 transition-shadow hover:shadow-md"
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                boxShadow: 'var(--shadow-sm)',
                borderLeft: '3px solid var(--gold)',
              }}
            >
              <div className="mb-4 flex items-center justify-between">
                <div className="flex h-9 w-9 items-center justify-center rounded-md" style={{ background: 'var(--accent-glow)', color: 'var(--navy)' }}>
                  <f.icon size={18} strokeWidth={1.5} />
                </div>
                <span className="text-[10px] font-medium uppercase tracking-widest" style={{ color: 'var(--text-tertiary)' }}>{f.tag}</span>
              </div>
              <h3 className="font-serif text-base font-semibold" style={{ color: 'var(--text-primary)' }}>{f.title}</h3>
              <p className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>{f.subtitle}</p>
              <p className="mt-3 flex-1 text-[13px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{f.description}</p>
              <div className="mt-5 flex items-center gap-1 text-[13px] font-medium transition-colors" style={{ color: 'var(--navy)' }}>
                进入 <ArrowRight size={13} className="transition-transform group-hover:translate-x-1" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* === Capabilities === */}
      <Capabilities />
    </div>
  )
}
