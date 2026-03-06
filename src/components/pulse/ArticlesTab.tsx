'use client'

import { useState, useMemo } from 'react'
import { Search, Download } from 'lucide-react'
import { Article } from './types'

export function ArticlesTab({ articles }: { articles: Article[] }) {
  const [query, setQuery] = useState('')
  const [journalFilter, setJournalFilter] = useState('')
  const [issueFilter, setIssueFilter] = useState('')
  const [sortBy, setSortBy] = useState<'default' | 'journal' | 'issue'>('default')
  const [page, setPage] = useState(1)
  const pageSize = 30

  const journals = useMemo(() => [...new Set(articles.map(a => a.journal))].sort(), [articles])
  const issues = useMemo(() => [...new Set(articles.map(a => a.issue))].sort((a, b) => {
    const na = parseInt(a), nb = parseInt(b)
    if (!isNaN(na) && !isNaN(nb)) return na - nb
    return a.localeCompare(b)
  }), [articles])

  const filtered = useMemo(() => {
    let result = articles.filter(a => {
      if (query && !a.title.includes(query) && !a.journal.includes(query)) return false
      if (journalFilter && a.journal !== journalFilter) return false
      if (issueFilter && a.issue !== issueFilter) return false
      return true
    })
    if (sortBy === 'journal') result.sort((a, b) => a.journal.localeCompare(b.journal))
    if (sortBy === 'issue') result.sort((a, b) => (parseInt(a.issue) || 0) - (parseInt(b.issue) || 0))
    return result
  }, [articles, query, journalFilter, issueFilter, sortBy])

  const totalPages = Math.ceil(filtered.length / pageSize)
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize)

  const exportCSV = () => {
    const header = 'title,journal,year,issue,page\n'
    const rows = filtered.map(a => `"${a.title}","${a.journal}","${a.year}","${a.issue}","${a.page}"`).join('\n')
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'clsci_articles.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-tertiary)' }} />
          <input
            type="text"
            placeholder="搜索标题或期刊..."
            value={query}
            onChange={e => { setQuery(e.target.value); setPage(1) }}
            className="w-full rounded-md py-2.5 pl-9 pr-3 text-[13px] outline-none transition-colors focus:ring-1"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
          />
        </div>
        <select
          value={journalFilter}
          onChange={e => { setJournalFilter(e.target.value); setPage(1) }}
          className="rounded-md px-3 py-2.5 text-[13px] outline-none"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
        >
          <option value="">全部期刊</option>
          {journals.map(j => <option key={j} value={j}>{j}</option>)}
        </select>
        <select
          value={issueFilter}
          onChange={e => { setIssueFilter(e.target.value); setPage(1) }}
          className="rounded-md px-3 py-2.5 text-[13px] outline-none"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
        >
          <option value="">全部期数</option>
          {issues.map(i => <option key={i} value={i}>第{i}期</option>)}
        </select>
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value as 'default' | 'journal' | 'issue')}
          className="rounded-md px-3 py-2.5 text-[13px] outline-none"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
        >
          <option value="default">默认排序</option>
          <option value="journal">按期刊</option>
          <option value="issue">按期数</option>
        </select>
        <button
          onClick={exportCSV}
          className="flex items-center gap-1.5 rounded-md px-3 py-2.5 text-[13px] transition-colors"
          style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
        >
          <Download size={13} /> CSV
        </button>
      </div>

      <p className="mb-3 text-[11px] tracking-wide" style={{ color: 'var(--text-tertiary)' }}>共 {filtered.length} 篇</p>

      <div className="space-y-1">
        {paged.map((a, i) => (
          <div
            key={`${a.title}-${i}`}
            className="flex items-start justify-between rounded-md px-4 py-3 transition-colors"
            style={{ border: '1px solid transparent' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-card)'; e.currentTarget.style.borderColor = 'var(--border)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent' }}
          >
            <div>
              <div className="text-[13px] font-medium" style={{ color: 'var(--text-primary)' }}>{a.title}</div>
              <div className="mt-1 text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
                {a.journal} · {a.year}年第{a.issue}期 · P.{a.page}
              </div>
              {a.topics && a.topics.length > 0 && (
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {a.topics.map(t => (
                    <span key={t} className="rounded px-1.5 py-0.5 text-[10px]" style={{ background: 'var(--accent-glow)', color: 'var(--navy)' }}>{t}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="rounded-md px-3 py-1.5 text-[12px] disabled:opacity-30"
            style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
          >
            上一页
          </button>
          <span className="text-[12px]" style={{ color: 'var(--text-tertiary)' }}>{page} / {totalPages}</span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="rounded-md px-3 py-1.5 text-[12px] disabled:opacity-30"
            style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
          >
            下一页
          </button>
        </div>
      )}
    </div>
  )
}
