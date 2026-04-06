'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { DebateCard, DebateData } from '@/components/pulse/DebateCard'

const bp = process.env.__NEXT_ROUTER_BASEPATH || ''

interface DebateFile {
  updated: string
  totalPapers: number
  journals: number
  debates: DebateData[]
}

export default function PulsePage() {
  const [data, setData] = useState<DebateFile | null>(null)

  useEffect(() => {
    fetch(`${bp}/data/clsci_debate.json`)
      .then(r => r.json())
      .then(setData)
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
      <div className="mb-12">
        <p className="text-[11px] font-medium uppercase tracking-widest" style={{ color: 'var(--gold)' }}>
          Research Debates
        </p>
        <h1
          className="font-serif mt-2 text-3xl font-semibold tracking-tight"
          style={{ color: 'var(--navy)', letterSpacing: '-0.02em' }}
        >
          学术论争图谱
        </h1>
        <p className="mt-3 max-w-2xl text-[14px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          从 {data.totalPapers.toLocaleString()} 篇 CLSCI 论文中，精准定位当前法学核心争议，系统呈现各派论点、代表学者与核心文献，为研究选题与论证提供全局视野。
        </p>
      </div>

      <div className="space-y-8">
        {data.debates.map((debate, i) => (
          <DebateCard key={debate.id} data={debate} index={i} />
        ))}
      </div>

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

      <div className="mt-16 border-t pt-8" style={{ borderColor: 'var(--border)' }}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="text-[12px]" style={{ color: 'var(--text-tertiary)' }}>
            数据来源：CLSCI 收录期刊全文数据库 · 更新于 {data.updated}
          </p>
          <div className="flex gap-6">
            {[
              { n: data.totalPapers.toLocaleString(), label: '收录论文' },
              { n: String(data.journals), label: 'CLSCI 期刊' },
              { n: String(data.debates.length), label: '核心论争' },
            ].map(s => (
              <div key={s.label} className="text-center">
                <div className="font-serif text-lg font-semibold" style={{ color: 'var(--navy)' }}>{s.n}</div>
                <div className="text-[10px] tracking-wide" style={{ color: 'var(--text-tertiary)' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
