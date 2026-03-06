'use client'

import { useMemo } from 'react'
import { TopicsData, Article, TOPIC_COLORS } from './types'

export function TemporalTab({ data, articles }: { data: TopicsData; articles: Article[] }) {
  // Build temporal data from articles if not provided
  const temporal = useMemo(() => {
    if (data.temporal) return data.temporal

    // Build from articles grouped by issue
    const issueSet = new Set<string>()
    const topicIssueCount: Record<string, Record<string, number>> = {}

    articles.forEach(a => {
      issueSet.add(a.issue)
      if (a.topics) {
        a.topics.forEach(t => {
          if (!topicIssueCount[t]) topicIssueCount[t] = {}
          topicIssueCount[t][a.issue] = (topicIssueCount[t][a.issue] || 0) + 1
        })
      }
    })

    const issues = [...issueSet].sort((a, b) => (parseInt(a) || 0) - (parseInt(b) || 0))
    const topic_trends: Record<string, number[]> = {}
    Object.entries(topicIssueCount).forEach(([topic, issueCounts]) => {
      topic_trends[topic] = issues.map(iss => issueCounts[iss] || 0)
    })

    return { issues, topic_trends }
  }, [data.temporal, articles])

  // Issue volume trend
  const issueVolume = useMemo(() => {
    const counts: Record<string, number> = {}
    articles.forEach(a => {
      counts[a.issue] = (counts[a.issue] || 0) + 1
    })
    return data.issues.map(iss => ({ issue: iss.issue, count: iss.count }))
  }, [articles, data.issues])

  // Journal × Issue matrix
  const matrix = useMemo(() => {
    if (data.journal_topic_matrix) return null // Use different data

    const journalIssue: Record<string, Record<string, number>> = {}
    articles.forEach(a => {
      if (!journalIssue[a.journal]) journalIssue[a.journal] = {}
      journalIssue[a.journal][a.issue] = (journalIssue[a.journal][a.issue] || 0) + 1
    })

    const issues = data.issues.map(i => i.issue)
    const journals = data.journals.slice(0, 10).map(j => j.journal) // Top 10
    const maxVal = Math.max(...journals.flatMap(j =>
      issues.map(i => journalIssue[j]?.[i] || 0)
    ), 1)

    return { journals, issues, data: journalIssue, maxVal }
  }, [articles, data])

  return (
    <div className="space-y-6">
      {/* Issue volume trend */}
      <div className="rounded-lg p-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
        <h3 className="mb-5 text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>各期发文量趋势</h3>
        <div className="flex items-end justify-between gap-2" style={{ height: 160 }}>
          {issueVolume.map(iss => {
            const max = Math.max(...issueVolume.map(i => i.count))
            const h = (iss.count / max) * 130
            return (
              <div key={iss.issue} className="flex flex-1 flex-col items-center gap-1">
                <span className="text-[10px] font-mono" style={{ color: 'var(--text-tertiary)' }}>{iss.count}</span>
                <div
                  className="w-full rounded-t transition-all duration-300"
                  style={{ height: h, background: 'var(--navy)', opacity: 0.7 }}
                />
                <span className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>第{iss.issue}期</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Topic trends (stacked representation) */}
      {Object.keys(temporal.topic_trends).length > 0 && (
        <div className="rounded-lg p-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
          <h3 className="mb-5 text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>主题随期号变化</h3>
          <div className="space-y-2">
            {Object.entries(temporal.topic_trends).slice(0, 8).map(([topic, values], idx) => {
              const max = Math.max(...values, 1)
              return (
                <div key={topic} className="flex items-center gap-3">
                  <span className="w-24 shrink-0 truncate text-right text-[11px]" style={{ color: 'var(--text-secondary)' }}>{topic}</span>
                  <div className="flex flex-1 items-center gap-0.5">
                    {values.map((v, i) => (
                      <div
                        key={i}
                        className="flex-1 rounded-sm transition-all"
                        style={{
                          height: Math.max(4, (v / max) * 28),
                          background: TOPIC_COLORS[idx % TOPIC_COLORS.length],
                          opacity: v > 0 ? 0.3 + (v / max) * 0.7 : 0.05,
                        }}
                        title={`第${temporal.issues[i]}期: ${v}篇`}
                      />
                    ))}
                  </div>
                </div>
              )
            })}
            <div className="mt-2 flex gap-0.5 pl-[calc(6rem+12px)]">
              {temporal.issues.map(iss => (
                <div key={iss} className="flex-1 text-center text-[9px]" style={{ color: 'var(--text-tertiary)' }}>{iss}</div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Journal × Issue heatmap */}
      {matrix && (
        <div className="rounded-lg p-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
          <h3 className="mb-5 text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>期刊 × 期号 热力矩阵（前10期刊）</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-[11px]">
              <thead>
                <tr>
                  <th className="pb-2 pr-3 text-right font-normal" style={{ color: 'var(--text-tertiary)' }}>期刊 \ 期号</th>
                  {matrix.issues.map(iss => (
                    <th key={iss} className="pb-2 text-center font-normal" style={{ color: 'var(--text-tertiary)', minWidth: 32 }}>{iss}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {matrix.journals.map(j => (
                  <tr key={j}>
                    <td className="py-0.5 pr-3 text-right" style={{ color: 'var(--text-secondary)' }}>{j}</td>
                    {matrix.issues.map(iss => {
                      const val = matrix.data[j]?.[iss] || 0
                      const opacity = val > 0 ? 0.15 + (val / matrix.maxVal) * 0.85 : 0
                      return (
                        <td key={iss} className="p-0.5 text-center">
                          <div
                            className="mx-auto flex h-6 w-6 items-center justify-center rounded-sm text-[9px]"
                            style={{
                              background: val > 0 ? `rgba(26,54,93,${opacity})` : 'var(--bg-surface)',
                              color: opacity > 0.5 ? '#fff' : 'var(--text-tertiary)',
                            }}
                          >
                            {val > 0 ? val : ''}
                          </div>
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
