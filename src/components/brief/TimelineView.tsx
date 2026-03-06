'use client'

import { BriefItem } from './BriefCard'
import { ExternalLink } from 'lucide-react'

interface TimelineViewProps {
  items: BriefItem[]
}

export function TimelineView({ items }: TimelineViewProps) {
  // Group by date
  const grouped: Record<string, BriefItem[]> = {}
  items.forEach(item => {
    const date = item.date || 'Unknown'
    if (!grouped[date]) grouped[date] = []
    grouped[date].push(item)
  })

  const dates = Object.keys(grouped).sort((a, b) => b.localeCompare(a))

  if (dates.length === 0) {
    return (
      <div className="py-12 text-center text-[13px]" style={{ color: 'var(--text-tertiary)' }}>
        暂无内容
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {dates.map(date => (
        <div key={date} className="relative pl-6" style={{ borderLeft: '2px solid var(--gold)' }}>
          <div className="absolute -left-[5px] top-0 h-2 w-2 rounded-full" style={{ background: 'var(--gold)' }} />
          <div className="mb-3 font-serif text-sm font-medium" style={{ color: 'var(--navy)' }}>
            {date}
          </div>
          <div className="space-y-2">
            {grouped[date].map((item, i) => (
              <div key={i} className="rounded-md p-3" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                <div className="mb-1 flex items-center gap-2">
                  <span className="rounded px-1.5 py-0.5 text-[9px] font-medium uppercase" style={{
                    background: item.journal ? 'rgba(4,120,87,0.08)' : 'rgba(26,54,93,0.08)',
                    color: item.journal ? '#047857' : '#1a365d'
                  }}>
                    {item.journal ? '研究' : '新闻'}
                  </span>
                  <span className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
                    {item.source || item.journal}
                  </span>
                </div>
                <a href={item.url} target="_blank" rel="noopener noreferrer" className="group inline-flex items-start gap-1">
                  <span className="text-[13px] font-medium" style={{ color: 'var(--text-primary)' }}>{item.title}</span>
                  <ExternalLink size={10} className="mt-1 shrink-0 opacity-0 transition-opacity group-hover:opacity-60" style={{ color: 'var(--text-tertiary)' }} />
                </a>
                <p className="mt-1 text-[11px] leading-relaxed" style={{ color: 'var(--text-tertiary)' }}>
                  {item.summaryCN.slice(0, 80)}...
                </p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
