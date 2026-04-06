'use client'

import { Sparkline } from './Sparkline'
import { TrendingUp } from 'lucide-react'

interface TrendItem {
  keyword: string
  growth: number   // percentage, e.g. 450 = +450%
  data: number[]   // yearly counts for sparkline
  recent: number   // recent paper count
}

export function TrendingGrid({ items }: { items: TrendItem[] }) {
  return (
    <section className="mx-auto max-w-5xl px-6 py-16">
      <div className="mb-8">
        <p className="text-[11px] font-medium uppercase tracking-widest" style={{ color: 'var(--gold)' }}>
          Trending
        </p>
        <h2 className="font-serif mt-2 text-2xl font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>
          研究热点趋势
        </h2>
        <p className="mt-1 text-[13px]" style={{ color: 'var(--text-tertiary)' }}>
          近三年增长最快的法学研究关键词
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <div
            key={item.keyword}
            className="group flex items-center gap-4 rounded-lg p-4 transition-shadow hover:shadow-md"
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
            }}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-[14px] font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                  {item.keyword}
                </h3>
                {item.growth > 0 && (
                  <span
                    className="inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-semibold whitespace-nowrap"
                    style={{ background: 'rgba(22,163,74,0.08)', color: '#16a34a' }}
                  >
                    <TrendingUp size={10} />
                    +{item.growth}%
                  </span>
                )}
              </div>
              <p className="mt-1 text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
                近三年 {item.recent} 篇
              </p>
            </div>
            <Sparkline data={item.data} width={72} height={28} color="var(--navy)" />
          </div>
        ))}
      </div>
    </section>
  )
}
