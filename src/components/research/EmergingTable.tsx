'use client'

interface TopicRow {
  keyword: string
  recent: number
  earlier: number
  growth: number
}

interface EmergingTableProps {
  emerging: TopicRow[]
  declining: TopicRow[]
}

export function EmergingTable({ emerging, declining }: EmergingTableProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Emerging topics */}
      <div className="rounded-lg" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
        <div className="border-b px-5 py-3" style={{ borderColor: 'var(--border)' }}>
          <h3 className="font-serif text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            新兴议题
          </h3>
          <p className="mt-0.5 text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
            近年增长显著的研究关键词
          </p>
        </div>
        <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
          {emerging.length === 0 && (
            <div className="px-5 py-6 text-center text-[13px]" style={{ color: 'var(--text-tertiary)' }}>
              暂无数据
            </div>
          )}
          {emerging.map((row, i) => (
            <div
              key={row.keyword}
              className="flex items-center gap-3 px-5 py-3 transition-colors"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-[10px] font-semibold" style={{ background: 'rgba(39, 103, 73, 0.1)', color: '#276749' }}>
                {i + 1}
              </span>
              <span className="flex-1 truncate text-[13px]" style={{ color: 'var(--text-primary)' }}>
                {row.keyword}
              </span>
              <span className="shrink-0 font-mono text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
                {row.recent}篇
              </span>
              <span
                className="shrink-0 rounded-full px-2 py-0.5 font-mono text-[11px] font-medium"
                style={{
                  background: 'rgba(39, 103, 73, 0.1)',
                  color: '#276749',
                }}
              >
                +{row.growth > 0 ? row.growth.toFixed(0) : row.growth.toFixed(1)}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Declining topics */}
      <div className="rounded-lg" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
        <div className="border-b px-5 py-3" style={{ borderColor: 'var(--border)' }}>
          <h3 className="font-serif text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            趋冷议题
          </h3>
          <p className="mt-0.5 text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
            近年关注度下降的研究关键词
          </p>
        </div>
        <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
          {declining.length === 0 && (
            <div className="px-5 py-6 text-center text-[13px]" style={{ color: 'var(--text-tertiary)' }}>
              暂无数据
            </div>
          )}
          {declining.map((row, i) => (
            <div
              key={row.keyword}
              className="flex items-center gap-3 px-5 py-3 transition-colors"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-[10px] font-semibold" style={{ background: 'rgba(155, 44, 44, 0.1)', color: '#9b2c2c' }}>
                {i + 1}
              </span>
              <span className="flex-1 truncate text-[13px]" style={{ color: 'var(--text-primary)' }}>
                {row.keyword}
              </span>
              <span className="shrink-0 font-mono text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
                {row.recent}篇
              </span>
              <span
                className="shrink-0 rounded-full px-2 py-0.5 font-mono text-[11px] font-medium"
                style={{
                  background: 'rgba(155, 44, 44, 0.1)',
                  color: '#9b2c2c',
                }}
              >
                {row.growth.toFixed(0)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
