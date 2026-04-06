'use client'

import { useState, useMemo } from 'react'

interface CitedPaper {
  title: string
  author: string
  journal: string
  year: number
  discipline: string
  cited_count: number
}

interface CitedListProps {
  papers: CitedPaper[]
  recent?: CitedPaper[]
}

const MAX_ITEMS = 50

export function CitedList({ papers, recent }: CitedListProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'recent'>('all')

  const sortedAll = useMemo(
    () => [...papers].sort((a, b) => b.cited_count - a.cited_count).slice(0, MAX_ITEMS),
    [papers]
  )

  const sortedRecent = useMemo(
    () => recent
      ? [...recent].sort((a, b) => b.cited_count - a.cited_count).slice(0, MAX_ITEMS)
      : [],
    [recent]
  )

  const items = activeTab === 'all' ? sortedAll : sortedRecent
  const hasRecent = recent && recent.length > 0

  return (
    <div
      className="overflow-hidden rounded-lg"
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}
    >
      {/* Tab bar */}
      <div
        className="flex items-center gap-0 border-b"
        style={{ borderColor: 'var(--border)' }}
      >
        <button
          onClick={() => setActiveTab('all')}
          className="relative px-5 py-3 text-[13px] font-medium transition-colors"
          style={{
            color: activeTab === 'all' ? 'var(--navy)' : 'var(--text-tertiary)',
            background: 'transparent',
          }}
        >
          全部
          {activeTab === 'all' && (
            <span
              className="absolute bottom-0 left-0 right-0 h-[2px]"
              style={{ background: 'var(--navy)' }}
            />
          )}
        </button>
        {hasRecent && (
          <button
            onClick={() => setActiveTab('recent')}
            className="relative px-5 py-3 text-[13px] font-medium transition-colors"
            style={{
              color: activeTab === 'recent' ? 'var(--navy)' : 'var(--text-tertiary)',
              background: 'transparent',
            }}
          >
            近三年
            {activeTab === 'recent' && (
              <span
                className="absolute bottom-0 left-0 right-0 h-[2px]"
                style={{ background: 'var(--navy)' }}
              />
            )}
          </button>
        )}
        <span
          className="ml-auto mr-4 text-[11px] tracking-wide"
          style={{ color: 'var(--text-tertiary)' }}
        >
          共 {items.length} 篇
        </span>
      </div>

      {/* Table */}
      {items.length === 0 ? (
        <div
          className="flex items-center justify-center py-16 text-[13px]"
          style={{ color: 'var(--text-tertiary)' }}
        >
          暂无数据
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]" style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr
                style={{
                  background: 'var(--bg-surface)',
                  borderBottom: '1px solid var(--border)',
                }}
              >
                <th
                  className="w-[52px] whitespace-nowrap px-4 py-2.5 text-center font-medium"
                  style={{ color: 'var(--text-tertiary)', fontSize: '11px', letterSpacing: '0.05em' }}
                >
                  排名
                </th>
                <th
                  className="px-4 py-2.5 text-left font-medium"
                  style={{ color: 'var(--text-tertiary)', fontSize: '11px', letterSpacing: '0.05em' }}
                >
                  标题
                </th>
                <th
                  className="hidden whitespace-nowrap px-4 py-2.5 text-left font-medium sm:table-cell"
                  style={{ color: 'var(--text-tertiary)', fontSize: '11px', letterSpacing: '0.05em' }}
                >
                  作者
                </th>
                <th
                  className="hidden whitespace-nowrap px-4 py-2.5 text-left font-medium md:table-cell"
                  style={{ color: 'var(--text-tertiary)', fontSize: '11px', letterSpacing: '0.05em' }}
                >
                  期刊
                </th>
                <th
                  className="hidden whitespace-nowrap px-4 py-2.5 text-center font-medium lg:table-cell"
                  style={{ color: 'var(--text-tertiary)', fontSize: '11px', letterSpacing: '0.05em' }}
                >
                  年份
                </th>
                <th
                  className="w-[80px] whitespace-nowrap px-4 py-2.5 text-center font-medium"
                  style={{ color: 'var(--text-tertiary)', fontSize: '11px', letterSpacing: '0.05em' }}
                >
                  被引
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((paper, i) => {
                const rank = i + 1
                const isEven = rank % 2 === 0
                return (
                  <tr
                    key={`${paper.title}-${paper.author}-${i}`}
                    className="transition-colors"
                    style={{
                      background: isEven ? 'var(--bg-secondary)' : 'transparent',
                      borderBottom: '1px solid var(--border)',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = 'var(--accent-glow)'
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = isEven ? 'var(--bg-secondary)' : 'transparent'
                    }}
                  >
                    {/* Rank */}
                    <td className="px-4 py-3 text-center">
                      <span
                        className="inline-flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold"
                        style={{
                          background: rank <= 3 ? 'var(--navy)' : 'var(--bg-surface)',
                          color: rank <= 3 ? '#fff' : 'var(--navy)',
                        }}
                      >
                        {rank}
                      </span>
                    </td>

                    {/* Title */}
                    <td className="max-w-[320px] px-4 py-3">
                      <div
                        className="truncate font-medium"
                        style={{ color: 'var(--text-primary)' }}
                        title={paper.title}
                      >
                        {paper.title}
                      </div>
                      {/* Mobile: show author + journal inline */}
                      <div
                        className="mt-0.5 truncate text-[11px] sm:hidden"
                        style={{ color: 'var(--text-tertiary)' }}
                      >
                        {paper.author} &middot; {paper.journal} &middot; {paper.year}
                      </div>
                    </td>

                    {/* Author */}
                    <td
                      className="hidden whitespace-nowrap px-4 py-3 sm:table-cell"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      {paper.author}
                    </td>

                    {/* Journal */}
                    <td
                      className="hidden whitespace-nowrap px-4 py-3 md:table-cell"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      {paper.journal}
                    </td>

                    {/* Year */}
                    <td
                      className="hidden whitespace-nowrap px-4 py-3 text-center lg:table-cell"
                      style={{ color: 'var(--text-tertiary)' }}
                    >
                      {paper.year}
                    </td>

                    {/* Cited count badge */}
                    <td className="px-4 py-3 text-center">
                      <span
                        className="inline-block min-w-[40px] rounded-md px-2 py-1 text-[12px] font-semibold"
                        style={{
                          background: 'rgba(26, 54, 93, 0.08)',
                          color: 'var(--navy)',
                        }}
                      >
                        {paper.cited_count.toLocaleString()}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
