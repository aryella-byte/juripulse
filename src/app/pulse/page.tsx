'use client'

import { useEffect, useState } from 'react'
import { ArrowRight, Database, FileSearch, ListChecks, Sparkles } from 'lucide-react'
import { LiteratureReview, ReviewData } from '@/components/pulse/LiteratureReview'

const bp = '/juripulse'

const REVIEWS = [
  { id: 'ai-tort', label: 'AI侵权责任分配', file: 'review_ai_tort.json' },
  { id: 'data-sovereignty', label: '数据主权与跨境流通', file: 'review_data_sovereignty.json' },
]

const WORKFLOW = [
  { icon: Database, title: '数据库检索', text: '从 CLSCI 核心期刊论文库中按主题、关键词、作者和年份召回候选文献。' },
  { icon: FileSearch, title: '论点抽取', text: '识别文献中的定义、主张、批判和方法论线索，形成可追溯的观点清单。' },
  { icon: ListChecks, title: '综述生成', text: '按研究问题组织主题板块，生成可用于选题判断和文献综述起草的 demo。' },
]

export default function PulsePage() {
  const [reviews, setReviews] = useState<Record<string, ReviewData>>({})
  const [active, setActive] = useState(REVIEWS[0].id)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all(
      REVIEWS.map((r) =>
        fetch(`${bp}/data/${r.file}`).then((res) => res.json()),
      ),
    )
      .then((results) => {
        const map: Record<string, ReviewData> = {}
        results.forEach((data, i) => {
          map[REVIEWS[i].id] = data
        })
        setReviews(map)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex items-center gap-3">
          <div
            className="h-4 w-4 animate-pulse rounded-full"
            style={{ background: 'var(--navy)' }}
          />
          <span style={{ color: 'var(--text-tertiary)' }}>加载数据中...</span>
        </div>
      </div>
    )
  }

  const current = reviews[active]

  return (
    <div className="pb-12">
      <section className="border-b" style={{ borderColor: 'var(--border)', background: 'var(--bg-primary)' }}>
        <div className="mx-auto max-w-[1080px] px-6 pb-10 pt-12">
          <div className="grid gap-8 lg:grid-cols-[1fr,360px] lg:items-end">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-md px-2.5 py-1 text-[11px] font-medium uppercase tracking-widest" style={{ background: 'var(--accent-glow)', color: 'var(--navy)' }}>
                <Sparkles size={12} />
                On-request Database Demo
              </div>
              <h1 className="font-serif text-3xl font-semibold tracking-tight sm:text-4xl" style={{ color: 'var(--text-primary)' }}>
                研究图景
              </h1>
              <p className="mt-4 max-w-2xl text-[14px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                这是一个按需生成的数据库演示：用户提出研究问题后，系统基于法学核心期刊数据库进行检索、聚类和论点抽取，输出专题文献图景。当前页面展示两个预生成 demo，用于说明最终交付形态。
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                <span className="rounded-md px-2.5 py-1 text-[11px]" style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>基于数据库</span>
                <span className="rounded-md px-2.5 py-1 text-[11px]" style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>按题生成</span>
                <span className="rounded-md px-2.5 py-1 text-[11px]" style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>可追溯文献</span>
              </div>
            </div>

            <div className="rounded-lg p-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
              <div className="text-[11px] font-medium uppercase tracking-widest" style={{ color: 'var(--gold)' }}>Demo Scope</div>
              <div className="mt-3 space-y-3 text-[13px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                <p>本页不是固定专题栏目，而是展示“按需检索 + 综述生成”的样例结果。</p>
                <p>正式使用时，可围绕具体论文选题、研究争议或法学概念，请求生成新的研究图景。</p>
              </div>
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {WORKFLOW.map((step) => (
              <div key={step.title} className="rounded-md p-4" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-md" style={{ background: 'var(--accent-glow)', color: 'var(--navy)' }}>
                  <step.icon size={18} strokeWidth={1.6} />
                </div>
                <h2 className="text-[14px] font-semibold" style={{ color: 'var(--text-primary)' }}>{step.title}</h2>
                <p className="mt-2 text-[12px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="sticky top-14 z-10 border-b" style={{ background: 'var(--bg-primary)', borderColor: 'var(--border)' }}>
        <div className="mx-auto flex max-w-[1080px] flex-col gap-3 px-6 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-2 text-[12px]" style={{ color: 'var(--text-tertiary)' }}>
            <Database size={14} />
            选择一个预生成样例查看输出格式
          </div>
          <div className="flex gap-1 overflow-x-auto">
            {REVIEWS.map((r) => (
              <button
                key={r.id}
                onClick={() => setActive(r.id)}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-md px-4 py-2 text-[13px] font-medium transition-colors"
                style={{
                  color: active === r.id ? '#fff' : 'var(--text-secondary)',
                  background: active === r.id ? 'var(--navy)' : 'var(--bg-card)',
                  border: `1px solid ${active === r.id ? 'var(--navy)' : 'var(--border)'}`,
                }}
              >
                {r.label}
                {active === r.id && <ArrowRight size={13} />}
              </button>
            ))}
          </div>
        </div>
      </section>

      {current && <LiteratureReview data={current} />}
    </div>
  )
}
