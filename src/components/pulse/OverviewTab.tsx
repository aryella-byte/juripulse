'use client'

import { TopicsData, METHOD_COLORS } from './types'

export function OverviewTab({ data }: { data: TopicsData }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: '论文总数', value: data.summary.total_articles },
          { label: '期刊数', value: data.summary.journal_count },
          { label: '主题聚类', value: data.topics.length },
          { label: '研究方法', value: data.methods.length },
        ].map(s => (
          <div key={s.label} className="rounded-lg p-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
            <div className="font-serif text-2xl font-semibold tracking-tight" style={{ color: 'var(--navy)' }}>{s.value}</div>
            <div className="mt-1 text-[11px] tracking-wide" style={{ color: 'var(--text-tertiary)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div className="rounded-lg p-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
        <h3 className="mb-5 text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>期刊发文量分布</h3>
        <JournalBarChart journals={data.journals} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg p-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
          <h3 className="mb-5 text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>研究方法论</h3>
          <MethodChart methods={data.methods} />
        </div>
        <div className="rounded-lg p-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
          <h3 className="mb-5 text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>期数分布</h3>
          <IssueBarChart issues={data.issues} />
        </div>
      </div>
    </div>
  )
}

function JournalBarChart({ journals }: { journals: TopicsData['journals'] }) {
  const max = Math.max(...journals.map(j => j.count))
  return (
    <div className="space-y-2">
      {journals.map(j => (
        <div key={j.journal} className="flex items-center gap-3">
          <span className="w-28 shrink-0 text-right text-[12px]" style={{ color: 'var(--text-secondary)' }}>{j.journal}</span>
          <div className="relative h-5 flex-1 overflow-hidden rounded" style={{ background: 'var(--bg-surface)' }}>
            <div
              className="h-full rounded transition-all duration-500"
              style={{ width: `${(j.count / max) * 100}%`, background: 'var(--navy)', opacity: 0.75 }}
            />
          </div>
          <span className="w-8 text-right font-mono text-[12px]" style={{ color: 'var(--text-tertiary)' }}>{j.count}</span>
        </div>
      ))}
    </div>
  )
}

function MethodChart({ methods }: { methods: TopicsData['methods'] }) {
  const total = methods.reduce((s, m) => s + m.count, 0)

  return (
    <div className="space-y-4">
      <div className="flex h-3 overflow-hidden rounded-full" style={{ background: 'var(--bg-surface)' }}>
        {methods.map((m, i) => (
          <div key={m.method} className="h-full transition-all" style={{ width: `${(m.count / total) * 100}%`, background: METHOD_COLORS[i % METHOD_COLORS.length] }} />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2">
        {methods.map((m, i) => (
          <div key={m.method} className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full" style={{ background: METHOD_COLORS[i % METHOD_COLORS.length] }} />
            <span className="text-[12px]" style={{ color: 'var(--text-secondary)' }}>{m.method}</span>
            <span className="ml-auto font-mono text-[11px]" style={{ color: 'var(--text-tertiary)' }}>{m.count}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function IssueBarChart({ issues }: { issues: TopicsData['issues'] }) {
  const max = Math.max(...issues.map(i => i.count))
  return (
    <div className="flex items-end justify-between gap-1.5" style={{ height: 140 }}>
      {issues.map(iss => {
        const h = (iss.count / max) * 110
        return (
          <div key={iss.issue} className="flex flex-1 flex-col items-center gap-1">
            <span className="text-[10px] font-mono" style={{ color: 'var(--text-tertiary)' }}>{iss.count}</span>
            <div className="w-full rounded-t transition-all duration-300" style={{ height: h, background: 'var(--navy)', opacity: 0.6 }} />
            <span className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>{iss.issue}</span>
          </div>
        )
      })}
    </div>
  )
}
