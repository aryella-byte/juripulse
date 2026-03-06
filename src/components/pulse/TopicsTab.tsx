'use client'

import { useState } from 'react'
import { TopicsData, TOPIC_COLORS } from './types'

export function TopicsTab({ data }: { data: TopicsData }) {
  const [expanded, setExpanded] = useState<string | null>(null)
  const [selectedTopics, setSelectedTopics] = useState<Set<string>>(new Set())

  const toggleFilter = (topic: string) => {
    const next = new Set(selectedTopics)
    if (next.has(topic)) next.delete(topic)
    else next.add(topic)
    setSelectedTopics(next)
  }

  const displayed = selectedTopics.size > 0
    ? data.topics.filter(t => selectedTopics.has(t.topic))
    : data.topics

  return (
    <div>
      {/* Filter chips */}
      <div className="mb-5 flex flex-wrap gap-1.5">
        {data.topics.map((t, i) => {
          const active = selectedTopics.has(t.topic)
          return (
            <button
              key={t.topic}
              onClick={() => toggleFilter(t.topic)}
              className="rounded-md px-2.5 py-1 text-[11px] transition-colors"
              style={{
                background: active ? TOPIC_COLORS[i % TOPIC_COLORS.length] : 'var(--bg-surface)',
                color: active ? '#fff' : 'var(--text-secondary)',
                border: `1px solid ${active ? TOPIC_COLORS[i % TOPIC_COLORS.length] : 'var(--border)'}`,
              }}
            >
              {t.topic} ({t.count})
            </button>
          )
        })}
        {selectedTopics.size > 0 && (
          <button
            onClick={() => setSelectedTopics(new Set())}
            className="rounded-md px-2.5 py-1 text-[11px]"
            style={{ color: 'var(--text-tertiary)' }}
          >
            清除筛选
          </button>
        )}
      </div>

      <div className="space-y-2">
        {displayed.map((t, idx) => {
          const colorIdx = data.topics.indexOf(t)
          const color = TOPIC_COLORS[colorIdx % TOPIC_COLORS.length]
          return (
            <div key={t.topic} className="rounded-lg transition-colors" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
              <button
                onClick={() => setExpanded(expanded === t.topic ? null : t.topic)}
                className="flex w-full items-center gap-4 px-5 py-4"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-md text-[13px] font-semibold text-white" style={{ background: color }}>
                  {t.count}
                </span>
                <span className="flex-1 text-left text-[13px] font-medium" style={{ color: 'var(--text-primary)' }}>{t.topic}</span>
                <div className="flex items-center gap-3">
                  <div className="h-1.5 w-20 overflow-hidden rounded-full" style={{ background: 'var(--bg-surface)' }}>
                    <div className="h-full rounded-full" style={{ width: `${(t.count / data.summary.total_articles) * 100}%`, background: color }} />
                  </div>
                  <span className="w-10 text-right font-mono text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
                    {((t.count / data.summary.total_articles) * 100).toFixed(1)}%
                  </span>
                </div>
              </button>
              {expanded === t.topic && t.articles.length > 0 && (
                <div className="border-t px-5 py-3" style={{ borderColor: 'var(--border)' }}>
                  {t.articles.map((a, i) => (
                    <div key={i} className="py-1.5 text-[12px]" style={{ color: 'var(--text-secondary)' }}>
                      {a}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
