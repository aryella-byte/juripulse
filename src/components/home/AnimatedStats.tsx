'use client'

import { useEffect, useRef, useState } from 'react'

function AnimatedNumber({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [value, setValue] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  const started = useRef(false)

  useEffect(() => {
    if (!ref.current) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true
          const duration = 1500
          const start = performance.now()
          const step = (now: number) => {
            const t = Math.min((now - start) / duration, 1)
            const ease = 1 - Math.pow(1 - t, 3) // ease-out cubic
            setValue(Math.round(ease * target))
            if (t < 1) requestAnimationFrame(step)
          }
          requestAnimationFrame(step)
        }
      },
      { threshold: 0.3 },
    )
    observer.observe(ref.current)
    return () => observer.disconnect()
  }, [target])

  return (
    <div ref={ref} className="font-serif text-3xl font-semibold tracking-tight" style={{ color: 'var(--navy)' }}>
      {value.toLocaleString()}{suffix}
    </div>
  )
}

interface Stat {
  value: number
  suffix?: string
  label: string
}

export function AnimatedStats({ stats }: { stats: Stat[] }) {
  return (
    <section className="border-y" style={{ borderColor: 'var(--border)' }}>
      <div className="mx-auto grid max-w-5xl" style={{ gridTemplateColumns: `repeat(${stats.length}, 1fr)` }}>
        {stats.map((s, i) => (
          <div
            key={s.label}
            className="px-6 py-6 text-center"
            style={{ borderRight: i < stats.length - 1 ? '1px solid var(--border)' : 'none' }}
          >
            <AnimatedNumber target={s.value} suffix={s.suffix} />
            <div className="mt-1.5 text-[11px] tracking-wide" style={{ color: 'var(--text-tertiary)' }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
