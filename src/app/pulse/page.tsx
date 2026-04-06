'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { DebateCard, DebateData } from '@/components/pulse/DebateCard'
import { ResearchDemo } from '@/components/pulse/ResearchDemo'

const bp = '/juripulse'

interface DebateFile {
  updated: string
  totalPapers: number
  journals: number
  debates: DebateData[]
}

interface DemoResearch {
  query: string
  total_results: number
  summary: string
  blocks: { id: number; title: string; angle: string; papers: { author: string; title: string; journal: string; year: number; star?: boolean }[] }[]
}

export default function PulsePage() {
  const [data, setData] = useState<DebateFile | null>(null)
  const [demo, setDemo] = useState<DemoResearch | null>(null)

  useEffect(() => {
    fetch(`${bp}/data/clsci_debate.json`).then(r => r.json()).then(setData).catch(() => {})
    fetch(`${bp}/data/demo_research.json`).then(r => r.json()).then(setDemo).catch(() => {})
  }, [])

  if (!data) {
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
    <div className="mx-auto max-w-5xl px-6 py-10">
      {/* Header with Demo badge */}
      <div className="mb-12">
        <div className="flex items-center gap-3">
          <p className="text-[11px] font-medium uppercase tracking-widest" style={{ color: 'var(--gold)' }}>
            Research Debates
          </p>
          <span
            className="rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
            style={{ background: 'var(--accent-glow)', color: 'var(--navy)', border: '1px solid var(--navy)' }}
          >
            Demo
          </span>
        </div>
        <h1
          className="font-serif mt-2 text-3xl font-semibold tracking-tight"
          style={{ color: 'var(--navy)', letterSpacing: '-0.02em' }}
        >
          学术论争图谱
        </h1>
        <p className="mt-3 max-w-2xl text-[14px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          从 CLSCI 核心期刊论文中，精准定位当前法学核心争议，系统呈现各派论点、代表学者与核心文献。以下为部分论争的展示示例。
        </p>
      </div>

      {/* Debate Cards */}
      <div className="space-y-8">
        {data.debates.map((debate, i) => (
          <DebateCard key={debate.id} data={debate} index={i} />
        ))}
      </div>

      {/* Research Summary Demo */}
      {demo && (
        <div className="mt-12">
          <div className="mb-6">
            <p className="text-[11px] font-medium uppercase tracking-widest" style={{ color: 'var(--gold)' }}>
              Research Summary
            </p>
            <h2 className="font-serif mt-2 text-xl font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>
              研究检索小结
            </h2>
            <p className="mt-1 text-[13px]" style={{ color: 'var(--text-tertiary)' }}>
              基于论争图谱自动生成的结构化文献梳理，按主题板块组织核心文献与综述角度
            </p>
          </div>
          <ResearchDemo data={demo} />
        </div>
      )}

      {/* CTA */}
      <div
        className="mt-12 flex items-center justify-between rounded-lg px-7 py-5"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}
      >
        <div>
          <p className="text-[14px] font-medium" style={{ color: 'var(--text-primary)' }}>
            想了解更多学科趋势与引文网络？
          </p>
          <p className="mt-1 text-[12px]" style={{ color: 'var(--text-tertiary)' }}>
            研究动态页提供关键词趋势、学科版图、作者引文网络等全景分析
          </p>
        </div>
        <Link
          href="/research"
          className="inline-flex items-center gap-2 rounded-md px-5 py-2 text-[13px] font-medium text-white transition-opacity hover:opacity-90"
          style={{ background: 'var(--navy)' }}
        >
          研究动态 <ArrowRight size={14} />
        </Link>
      </div>

      {/* Footer */}
      <div className="mt-16 border-t pt-8" style={{ borderColor: 'var(--border)' }}>
        <p className="text-[12px]" style={{ color: 'var(--text-tertiary)' }}>
          数据更新截至 2026 年 2 月
        </p>
      </div>
    </div>
  )
}
