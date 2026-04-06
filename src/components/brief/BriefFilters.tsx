'use client'

interface BriefFiltersProps {
  tags: string[]
  sources: string[]
  selectedTag: string
  selectedSource: string
  onTagChange: (tag: string) => void
  onSourceChange: (source: string) => void
  sourceLabel?: string
}

export function BriefFilters({
  tags, sources, selectedTag, selectedSource,
  onTagChange, onSourceChange, sourceLabel = '全部来源'
}: BriefFiltersProps) {
  return (
    <div className="flex flex-col gap-3">
      {/* Source filter — top row */}
      <div className="flex items-center gap-2">
        <select
          value={selectedSource}
          onChange={e => onSourceChange(e.target.value)}
          className="rounded-md px-3 py-1.5 text-[11px] outline-none"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
        >
          <option value="">{sourceLabel}</option>
          {sources.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        {selectedSource && (
          <button
            onClick={() => onSourceChange('')}
            className="text-[11px]"
            style={{ color: 'var(--text-tertiary)' }}
          >
            ✕ 清除
          </button>
        )}
      </div>

      {/* Tag filters — second row */}
      <div className="flex flex-wrap gap-1.5">
        <button
          onClick={() => onTagChange('')}
          className="rounded-md px-2.5 py-1 text-[11px] transition-colors"
          style={{
            background: selectedTag === '' ? 'var(--navy)' : 'var(--bg-surface)',
            color: selectedTag === '' ? '#fff' : 'var(--text-secondary)',
            border: `1px solid ${selectedTag === '' ? 'var(--navy)' : 'var(--border)'}`,
          }}
        >
          全部标签
        </button>
        {tags.map(tag => (
          <button
            key={tag}
            onClick={() => onTagChange(tag)}
            className="rounded-md px-2.5 py-1 text-[11px] transition-colors"
            style={{
              background: selectedTag === tag ? 'var(--navy)' : 'var(--bg-surface)',
              color: selectedTag === tag ? '#fff' : 'var(--text-secondary)',
              border: `1px solid ${selectedTag === tag ? 'var(--navy)' : 'var(--border)'}`,
            }}
          >
            {tag}
          </button>
        ))}
      </div>
    </div>
  )
}
