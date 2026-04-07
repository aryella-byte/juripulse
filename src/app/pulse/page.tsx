'use client'

import { useEffect, useState } from 'react'
import { LiteratureReview, ReviewData } from '@/components/pulse/LiteratureReview'

const bp = '/juripulse'

const REVIEWS = [
  { id: 'ai-tort', label: 'AI侵权责任分配', file: 'review_ai_tort.json' },
  { id: 'data-sovereignty', label: '数据主权与跨境流通', file: 'review_data_sovereignty.json' },
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
    <div>
      {/* Tab bar */}
      <div
        className="sticky top-0 z-10"
        style={{
          background: 'var(--bg-primary)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div className="mx-auto max-w-[960px] flex gap-1 px-6 pt-3">
          {REVIEWS.map((r) => (
            <button
              key={r.id}
              onClick={() => setActive(r.id)}
              className="px-5 py-2.5 text-[13px] font-medium transition-colors"
              style={{
                color:
                  active === r.id
                    ? 'var(--navy)'
                    : 'var(--text-tertiary)',
                borderBottom:
                  active === r.id
                    ? '2px solid var(--navy)'
                    : '2px solid transparent',
              }}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Review content */}
      {current && <LiteratureReview data={current} />}
    </div>
  )
}
