'use client'

import { useState } from 'react'
import { Search, ChevronDown, ChevronUp, Star } from 'lucide-react'

interface Paper {
  author: string
  title: string
  journal: string
  year: number
  star?: boolean
}

interface Block {
  id: number
  title: string
  angle: string
  papers: Paper[]
}

interface DemoData {
  query: string
  total_results: number
  summary: string
  blocks: Block[]
}

export function ResearchDemo({ data }: { data: DemoData }) {
  const [expandedBlock, setExpandedBlock] = useState<number | null>(1)

  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}
    >
      {/* Header */}
      <div className="px-7 py-6" style={{ borderBottom: '1px solid var(--border)', borderLeft: '3px solid var(--navy)' }}>
        <div className="flex items-center gap-2 mb-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md" style={{ background: 'var(--accent-glow)', color: 'var(--navy)' }}>
            <Search size={14} />
          </div>
          <span className="text-[10px] font-medium uppercase tracking-widest" style={{ color: 'var(--navy)' }}>
            研究检索 Demo
          </span>
        </div>
        <h2 className="font-serif text-xl font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>
          检索：{data.query}
        </h2>
        <p className="mt-2 text-[13px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          {data.summary}
        </p>
        <div className="mt-3 flex items-center gap-4">
          <span className="rounded-full px-3 py-1 text-[11px] font-medium" style={{ background: 'var(--accent-glow)', color: 'var(--navy)' }}>
            命中 {data.total_results} 篇
          </span>
          <span className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
            {data.blocks.length} 个主题板块 · {data.blocks.reduce((n, b) => n + b.papers.length, 0)} 篇核心文献
          </span>
        </div>
      </div>

      {/* Blocks */}
      <div>
        {data.blocks.map((block) => {
          const isOpen = expandedBlock === block.id
          return (
            <div key={block.id} style={{ borderBottom: '1px solid var(--border)' }}>
              <button
                onClick={() => setExpandedBlock(isOpen ? null : block.id)}
                className="flex w-full items-center justify-between px-7 py-4 text-left transition-colors"
                style={{ background: isOpen ? 'var(--bg-secondary)' : 'transparent' }}
              >
                <div className="flex items-center gap-3">
                  <span
                    className="flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold"
                    style={{ background: 'var(--navy)', color: '#fff' }}
                  >
                    {block.id}
                  </span>
                  <span className="text-[14px] font-medium" style={{ color: 'var(--text-primary)' }}>
                    {block.title}
                  </span>
                  <span className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
                    {block.papers.length} 篇
                  </span>
                </div>
                {isOpen ? <ChevronUp size={16} style={{ color: 'var(--text-tertiary)' }} /> : <ChevronDown size={16} style={{ color: 'var(--text-tertiary)' }} />}
              </button>

              {isOpen && (
                <div className="px-7 pb-5">
                  {/* Angle */}
                  <p className="mb-4 text-[13px] leading-relaxed" style={{ color: 'var(--text-secondary)', borderLeft: '2px solid var(--gold)', paddingLeft: '12px' }}>
                    {block.angle}
                  </p>

                  {/* Papers */}
                  <div className="space-y-2">
                    {block.papers.map((paper, pi) => (
                      <div
                        key={pi}
                        className="flex items-start gap-2 rounded-md p-2.5"
                        style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)' }}
                      >
                        {paper.star && (
                          <Star size={12} fill="#c9a962" stroke="#c9a962" className="mt-0.5 flex-shrink-0" />
                        )}
                        <div className="min-w-0">
                          <p className="text-[12px] font-medium leading-snug" style={{ color: 'var(--text-primary)' }}>
                            {paper.title}
                          </p>
                          <p className="mt-1 text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>{paper.author}</span>
                            <span className="mx-1">·</span>
                            {paper.journal}
                            <span className="mx-1">·</span>
                            {paper.year}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
