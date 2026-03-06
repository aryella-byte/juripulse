'use client'

interface BriefFiltersProps {
  tags: string[]
  sources: string[]
  selectedTag: string
  selectedSource: string
  onTagChange: (tag: string) => void
  onSourceChange: (source: string) => void
}

export function BriefFilters({ tags, sources, selectedTag, selectedSource, onTagChange, onSourceChange }: BriefFiltersProps) {
  return (
    <div className="flex flex-wrap gap-3">
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
      <select
        value={selectedSource}
        onChange={e => onSourceChange(e.target.value)}
        className="rounded-md px-3 py-1 text-[11px] outline-none"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
      >
        <option value="">全部来源</option>
        {sources.map(s => <option key={s} value={s}>{s}</option>)}
      </select>
    </div>
  )
}
