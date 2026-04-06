'use client'

import { useState } from 'react'
import { ExternalLink, ChevronDown, ChevronUp } from 'lucide-react'

export interface BriefItem {
  title: string
  titleCN?: string
  url: string
  date: string
  source?: string
  journal?: string
  summaryCN: string
  summaryEN?: string
  whyMattersCN: string
  whyMattersEN?: string
  tags: { name: string; class: string }[]
  quality_score: number
}

const TAG_COLORS: Record<string, { bg: string; text: string }> = {
  constitutional: { bg: 'rgba(26,54,93,0.08)', text: '#1a365d' },
  criminal: { bg: 'rgba(155,44,44,0.08)', text: '#9b2c2c' },
  international: { bg: 'rgba(4,120,87,0.08)', text: '#047857' },
  tech: { bg: 'rgba(85,60,154,0.08)', text: '#553c9a' },
  '': { bg: 'var(--bg-surface)', text: 'var(--text-secondary)' },
}

export function BriefCard({ item }: { item: BriefItem }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="rounded-lg p-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)', borderLeft: '3px solid var(--gold)' }}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-medium uppercase tracking-wide" style={{ color: 'var(--text-tertiary)' }}>
              {item.source || item.journal}
            </span>
            <span className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>·</span>
            <span className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>{item.date}</span>
            {item.quality_score >= 8 && (
              <span className="rounded px-1.5 py-0.5 text-[9px] font-medium" style={{ background: 'rgba(201,169,98,0.15)', color: 'var(--gold)' }}>
                精选
              </span>
            )}
          </div>

          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-start gap-1.5"
          >
            <h3 className="text-[14px] font-medium leading-snug transition-colors" style={{ color: 'var(--text-primary)' }}>
              {item.title}
            </h3>
            <ExternalLink size={12} className="mt-1 shrink-0 opacity-0 transition-opacity group-hover:opacity-60" style={{ color: 'var(--text-tertiary)' }} />
          </a>

          <p className="mt-2 text-[13px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            {item.summaryCN}
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            {item.tags.map((tag, i) => {
              const colors = TAG_COLORS[tag.class] || TAG_COLORS['']
              return (
                <span key={i} className="rounded px-2 py-0.5 text-[10px]" style={{ background: colors.bg, color: colors.text }}>
                  {tag.name}
                </span>
              )
            })}
          </div>
        </div>
      </div>

      {item.whyMattersCN && (
        <div className="mt-3">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-[12px] transition-colors"
            style={{ color: 'var(--navy)' }}
          >
            {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            {expanded ? '收起分析' : '重要性分析'}
          </button>
          {expanded && (
            <div className="mt-2 rounded-md p-3 text-[12px] leading-relaxed" style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>
              {item.whyMattersCN}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
