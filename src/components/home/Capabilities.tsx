'use client'

import Link from 'next/link'
import { Database, Search, TrendingUp, Newspaper, BookOpen, ArrowRight } from 'lucide-react'

const capabilities = [
  {
    icon: Database,
    title: '全面覆盖',
    desc: 'CLSCI 核心期刊全量收录，覆盖法学全部一级学科，持续更新',
    highlights: ['核心期刊', '法学全学科', '持续更新'],
    accent: '#1a365d',
  },
  {
    icon: Search,
    title: '深度分析',
    desc: '围绕热点话题生成结构化文献综述，系统梳理论点、争议与研究脉络',
    highlights: ['研究图景', '论点挖掘', '文献综述'],
    accent: '#234681',
  },
  {
    icon: TrendingUp,
    title: '趋势洞察',
    desc: '实时监测研究热点变化，发现新兴议题，预判学术走向',
    highlights: ['关键词趋势', '新兴议题', '学科演变'],
    accent: '#0f2340',
  },
  {
    icon: Newspaper,
    title: '全球视野',
    desc: '追踪国际顶级法学期刊，双语 AI 分析，比较法视角解读',
    highlights: ['13 种国际期刊', 'AI 驱动', '比较法'],
    accent: '#c9a962',
  },
]

export function Capabilities() {
  return (
    <section style={{ background: 'var(--bg-secondary)' }}>
      <div className="mx-auto max-w-5xl px-6 py-20">
        <div className="mb-12 text-center">
          <p className="text-[11px] font-medium uppercase tracking-widest" style={{ color: 'var(--gold)' }}>
            Capabilities
          </p>
          <h2 className="font-serif mt-2 text-2xl font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            平台能力
          </h2>
          <p className="mx-auto mt-2 max-w-md text-[13px]" style={{ color: 'var(--text-tertiary)' }}>
            从数据收录到趋势洞察，为法学研究者提供全链路智能支持
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          {capabilities.map((cap) => (
            <div
              key={cap.title}
              className="rounded-lg p-6 transition-shadow hover:shadow-md"
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderLeft: `3px solid ${cap.accent}`,
              }}
            >
              <div className="mb-3 flex items-center gap-3">
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-md"
                  style={{ background: `${cap.accent}10`, color: cap.accent }}
                >
                  <cap.icon size={18} strokeWidth={1.5} />
                </div>
                <h3 className="font-serif text-[15px] font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {cap.title}
                </h3>
              </div>

              <p className="text-[13px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                {cap.desc}
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                {cap.highlights.map((h) => (
                  <span
                    key={h}
                    className="rounded-full px-2.5 py-0.5 text-[11px] font-medium"
                    style={{ background: `${cap.accent}08`, color: cap.accent, border: `1px solid ${cap.accent}20` }}
                  >
                    {h}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* 统计学习工具 — 融入 Capabilities 区域底部 */}
        <Link
          href="/theory"
          className="group mt-8 flex items-center justify-between rounded-lg px-6 py-4 transition-shadow hover:shadow-md"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
        >
          <div className="flex items-center gap-3">
            <BookOpen size={16} strokeWidth={1.5} style={{ color: 'var(--text-tertiary)' }} />
            <div>
              <span className="text-[13px] font-medium" style={{ color: 'var(--text-primary)' }}>
                量化方法训练
              </span>
              <span className="ml-2 text-[12px]" style={{ color: 'var(--text-tertiary)' }}>
                交互式概率论与统计推断 · 法学案例驱动
              </span>
            </div>
          </div>
          <ArrowRight size={14} style={{ color: 'var(--text-tertiary)' }} className="transition-transform group-hover:translate-x-1" />
        </Link>
      </div>
    </section>
  )
}
