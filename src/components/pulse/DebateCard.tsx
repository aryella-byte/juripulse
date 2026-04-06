'use client'

export interface DebatePaper {
  author: string
  title: string
  journal: string
  year: number
}

export interface DebateCamp {
  label: string
  desc: string
  papers: DebatePaper[]
}

export interface DebateData {
  id: string
  title: string
  titleEn: string
  question: string
  description: string
  paperCount: number
  yearRange: string
  camps: DebateCamp[]
}

const CAMP_ACCENTS = [
  { border: 'var(--navy)', bg: 'rgba(15,30,68,0.04)', badge: 'var(--navy)', text: '#fff' },
  { border: 'var(--gold)', bg: 'rgba(183,140,72,0.06)', badge: 'var(--gold)', text: '#fff' },
  { border: '#6b7280', bg: 'rgba(107,114,128,0.05)', badge: '#6b7280', text: '#fff' },
]

export function DebateCard({ data, index }: { data: DebateData; index: number }) {
  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      {/* Header */}
      <div
        className="px-7 py-6 border-b"
        style={{ borderColor: 'var(--border)', borderLeft: '3px solid var(--gold)' }}
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span
                className="text-[10px] font-medium uppercase tracking-widest"
                style={{ color: 'var(--gold)' }}
              >
                Debate {String(index + 1).padStart(2, '0')}
              </span>
            </div>
            <h2
              className="font-serif text-xl font-semibold tracking-tight"
              style={{ color: 'var(--text-primary)', letterSpacing: '-0.01em' }}
            >
              {data.title}
            </h2>
            <p className="mt-0.5 text-[12px]" style={{ color: 'var(--text-tertiary)' }}>
              {data.titleEn}
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <span
              className="rounded-full px-3 py-1 text-[11px] font-medium"
              style={{ background: 'var(--accent-glow)', color: 'var(--navy)' }}
            >
              {data.paperCount} 篇相关文献
            </span>
            <span className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
              {data.yearRange}
            </span>
          </div>
        </div>

        {/* Core question */}
        <p
          className="mt-4 text-[13px] font-medium"
          style={{ color: 'var(--text-primary)' }}
        >
          {data.question}
        </p>
        <p
          className="mt-2 text-[13px] leading-relaxed"
          style={{ color: 'var(--text-secondary)' }}
        >
          {data.description}
        </p>
      </div>

      {/* Camps */}
      <div className="grid gap-0 divide-x" style={{ gridTemplateColumns: `repeat(${data.camps.length}, 1fr)`, borderColor: 'var(--border)' }}>
        {data.camps.map((camp, i) => {
          const accent = CAMP_ACCENTS[i % CAMP_ACCENTS.length]
          return (
            <div
              key={camp.label}
              className="p-5"
              style={{ background: accent.bg, borderTop: `2px solid ${accent.border}` }}
            >
              {/* Camp label */}
              <div className="mb-3">
                <span
                  className="inline-block rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
                  style={{ background: accent.border, color: accent.text }}
                >
                  {camp.label}
                </span>
              </div>

              {/* Camp description */}
              <p
                className="mb-4 text-[12px] leading-relaxed"
                style={{ color: 'var(--text-secondary)' }}
              >
                {camp.desc}
              </p>

              {/* Papers */}
              <div className="space-y-3">
                {camp.papers.map((paper, pi) => (
                  <div
                    key={pi}
                    className="rounded-md p-3"
                    style={{
                      background: 'var(--bg-primary)',
                      border: '1px solid var(--border)',
                    }}
                  >
                    <p
                      className="text-[12px] font-medium leading-snug"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {paper.title}
                    </p>
                    <p
                      className="mt-1.5 text-[11px]"
                      style={{ color: 'var(--text-tertiary)' }}
                    >
                      <span style={{ color: 'var(--text-secondary)' }}>{paper.author}</span>
                      <span className="mx-1">·</span>
                      {paper.journal}
                      <span className="mx-1">·</span>
                      {paper.year}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
