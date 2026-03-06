'use client'

import { useState, useEffect, useRef } from 'react'
import { ChevronDown, ChevronUp, Lightbulb, AlertTriangle, CheckCircle, HelpCircle, Copy, Check, ChevronLeft, ChevronRight } from 'lucide-react'

// ============================================================
// ChapterHeader
// ============================================================
interface ChapterHeaderProps {
  chapterNumber: number
  title: string
  subtitle: string
  description: string
  color: string
  nextChapter?: number
}

export function ChapterHeader({ chapterNumber, title, subtitle, description, color }: ChapterHeaderProps) {
  return (
    <div className="relative px-4 py-16 text-center" style={{ background: 'var(--bg-secondary)' }}>
      <div className="mx-auto max-w-2xl">
        <div className="mb-2 text-[11px] font-medium uppercase tracking-widest" style={{ color }}>
          第 {chapterNumber} 章
        </div>
        <h1 className="font-serif mb-2 text-3xl font-semibold tracking-tight sm:text-4xl" style={{ color: 'var(--text-primary)', letterSpacing: '-0.025em' }}>{title}</h1>
        <p className="mb-4 text-base" style={{ color: 'var(--text-secondary)' }}>{subtitle}</p>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--text-tertiary)' }}>{description}</p>
        <div className="mx-auto mt-6 h-[2px] w-12" style={{ background: 'var(--gold)' }} />
      </div>
    </div>
  )
}

// ============================================================
// BeginnerExplanation
// ============================================================
interface BeginnerExplanationProps {
  title?: string
  children: React.ReactNode
}

export function BeginnerExplanation({ title = '初学者指南', children }: BeginnerExplanationProps) {
  const [expanded, setExpanded] = useState(true)

  return (
    <div className="my-6 rounded-lg p-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between text-left"
      >
        <span className="font-medium" style={{ color: 'var(--navy)' }}>{title}</span>
        {expanded ? <ChevronUp size={18} style={{ color: 'var(--text-tertiary)' }} /> : <ChevronDown size={18} style={{ color: 'var(--text-tertiary)' }} />}
      </button>
      {expanded && <div className="mt-3 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{children}</div>}
    </div>
  )
}

// ============================================================
// FormulaBox
// ============================================================
interface FormulaBoxProps {
  title: string
  latex: string
  explanation?: React.ReactNode
  color?: string
}

export function FormulaBox({ title, latex, explanation }: FormulaBoxProps) {
  const [copied, setCopied] = useState(false)

  const copy = () => {
    navigator.clipboard.writeText(latex)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="my-6 rounded-lg p-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
      <div className="mb-3 flex items-center justify-between">
        <h4 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{title}</h4>
        <button onClick={copy} style={{ color: 'var(--text-tertiary)' }}>
          {copied ? <Check size={14} /> : <Copy size={14} />}
        </button>
      </div>
      <div className="overflow-x-auto rounded-md px-4 py-3 font-mono text-sm" style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>
        {latex}
      </div>
      {explanation && (
        <div className="mt-3 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{explanation}</div>
      )}
    </div>
  )
}

// ============================================================
// Checkpoint
// ============================================================
export type CheckpointType = 'think' | 'mistake' | 'try'

interface CheckpointProps {
  type: CheckpointType
  title?: string
  children: React.ReactNode
}

export function Checkpoint({ type, title, children }: CheckpointProps) {
  const [isExpanded, setIsExpanded] = useState(true)

  const config = {
    think: { icon: Lightbulb, accent: 'var(--navy)', bg: 'rgba(26,54,93,0.06)', border: 'rgba(26,54,93,0.15)', defaultTitle: '暂停思考' },
    mistake: { icon: AlertTriangle, accent: '#b45309', bg: 'rgba(180,83,9,0.06)', border: 'rgba(180,83,9,0.15)', defaultTitle: '常见误区' },
    try: { icon: CheckCircle, accent: '#047857', bg: 'rgba(4,120,87,0.06)', border: 'rgba(4,120,87,0.15)', defaultTitle: '试一试' },
  }

  const { icon: Icon, accent, bg, border, defaultTitle } = config[type]

  return (
    <div className="my-6 rounded-lg p-4" style={{ background: bg, border: `1px solid ${border}` }}>
      <button onClick={() => setIsExpanded(!isExpanded)} className="flex w-full items-center justify-between text-left">
        <div className="flex items-center gap-2">
          <Icon size={18} style={{ color: accent }} />
          <span className="font-medium" style={{ color: accent }}>{title || defaultTitle}</span>
        </div>
        {isExpanded ? <ChevronUp size={18} style={{ color: 'var(--text-tertiary)' }} /> : <ChevronDown size={18} style={{ color: 'var(--text-tertiary)' }} />}
      </button>
      {isExpanded && <div className="mt-3 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{children}</div>}
    </div>
  )
}

// ============================================================
// SectionIntro
// ============================================================
interface SectionIntroProps {
  prerequisites: string[]
  learningGoals: string[]
  overview: React.ReactNode
  chapterColor?: string
}

export function SectionIntro({ prerequisites, learningGoals, overview, chapterColor = 'var(--navy)' }: SectionIntroProps) {
  return (
    <div className="mb-8 rounded-lg p-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
      <div className="mb-6">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
          前置知识
        </h3>
        <ul className="space-y-2">
          {prerequisites.map((item, idx) => (
            <li key={idx} className="flex items-start gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
              <span className="mt-0.5" style={{ color: 'var(--text-tertiary)' }}>·</span> {item}
            </li>
          ))}
        </ul>
      </div>
      <div className="mb-6">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
          学习目标
        </h3>
        <ul className="space-y-2">
          {learningGoals.map((goal, idx) => (
            <li key={idx} className="flex items-start gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
              <span className="mt-0.5" style={{ color: '#047857' }}>✓</span> {goal}
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
          本章概览
        </h3>
        <div className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{overview}</div>
      </div>
      <div className="mt-6 flex items-center gap-2 pt-4 text-[12px]" style={{ borderTop: '1px solid var(--border)', color: chapterColor }}>
        <HelpCircle size={14} />
        <span>建议学习时间：30-45分钟 | 包含交互实验和法律案例</span>
      </div>
    </div>
  )
}

// ============================================================
// SectionOutro
// ============================================================
interface SectionOutroProps {
  keyPoints: string[]
  nextChapter?: { title: string; description: string; link: string }
  question: string
  hint?: string
}

export function SectionOutro({ keyPoints, nextChapter, question, hint }: SectionOutroProps) {
  const [showHint, setShowHint] = useState(false)

  return (
    <div className="mt-12 rounded-lg p-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
      <div className="mb-8">
        <h3 className="mb-4 text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
          核心要点
        </h3>
        <ul className="space-y-3">
          {keyPoints.map((point, idx) => (
            <li key={idx} className="flex items-start gap-3">
              <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-medium" style={{ background: 'rgba(4,120,87,0.1)', color: '#047857' }}>
                {idx + 1}
              </span>
              <span className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{point}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="mb-8 rounded-lg p-5" style={{ background: 'rgba(26,54,93,0.05)', border: '1px solid rgba(26,54,93,0.12)' }}>
        <h3 className="mb-3 text-sm font-semibold" style={{ color: 'var(--navy)' }}>
          思考题
        </h3>
        <p className="mb-3 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{question}</p>
        {hint && (
          <div>
            <button onClick={() => setShowHint(!showHint)} className="text-xs underline" style={{ color: 'var(--navy)' }}>
              {showHint ? '隐藏提示' : '查看提示'}
            </button>
            {showHint && <p className="mt-2 rounded-md p-3 text-xs" style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>{hint}</p>}
          </div>
        )}
      </div>
      {nextChapter && (
        <div className="flex items-start gap-4 rounded-lg p-4" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
          <div className="flex-1">
            <p className="mb-1 text-[11px]" style={{ color: 'var(--text-tertiary)' }}>下章预告</p>
            <h4 className="font-serif mb-1 font-medium" style={{ color: 'var(--text-primary)' }}>{nextChapter.title}</h4>
            <p className="mb-3 text-sm" style={{ color: 'var(--text-secondary)' }}>{nextChapter.description}</p>
            <a href={nextChapter.link} className="inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90" style={{ background: 'var(--navy)' }}>
              继续学习 →
            </a>
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================================
// LegalCaseCard
// ============================================================
interface LegalCaseCardProps {
  title: string
  description?: string
  children: React.ReactNode
  color?: string
}

export function LegalCaseCard({ title, children, color = 'var(--gold)' }: LegalCaseCardProps) {
  return (
    <div className="my-6 rounded-lg p-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderLeft: `3px solid ${color}`, boxShadow: 'var(--shadow-sm)' }}>
      <h4 className="font-serif mb-3 text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
        {title}
      </h4>
      <div className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{children}</div>
    </div>
  )
}

// ============================================================
// ExperimentContainer
// ============================================================
interface ExperimentContainerProps {
  title: string
  description?: string
  children: React.ReactNode
  color?: string
}

export function ExperimentContainer({ title, description, children }: ExperimentContainerProps) {
  return (
    <div className="my-8 overflow-hidden rounded-lg" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
      <div className="px-6 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
        <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{title}</h3>
        {description && <p className="mt-1 text-[12px]" style={{ color: 'var(--text-tertiary)' }}>{description}</p>}
      </div>
      <div className="p-6">{children}</div>
    </div>
  )
}

// ============================================================
// useResponsiveSVG
// ============================================================
export function useResponsiveSVG(defaultWidth: number, defaultHeight: number) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [dimensions, setDimensions] = useState({ width: defaultWidth, height: defaultHeight })

  useEffect(() => {
    const update = () => {
      if (containerRef.current) {
        const w = containerRef.current.clientWidth
        const scale = w / defaultWidth
        setDimensions({ width: w, height: Math.round(defaultHeight * Math.min(scale, 1)) })
      }
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [defaultWidth, defaultHeight])

  return { containerRef, dimensions }
}

// ============================================================
// ChapterNav
// ============================================================
interface ChapterNavProps {
  currentChapter: number
  totalChapters?: number
}

export function ChapterNav({ currentChapter }: ChapterNavProps) {
  const chapters = [
    { num: 1, title: '基础概率', path: '/theory/chapter1' },
    { num: 2, title: '复合概率', path: '/theory/chapter2' },
    { num: 3, title: '概率分布', path: '/theory/chapter3' },
    { num: 4, title: '频率学派推断', path: '/theory/chapter4' },
    { num: 5, title: '贝叶斯推断', path: '/theory/chapter5' },
    { num: 6, title: '回归分析', path: '/theory/chapter6' },
  ]

  const idx = chapters.findIndex(c => c.num === currentChapter)
  const prev = idx > 0 ? chapters[idx - 1] : null
  const next = idx < chapters.length - 1 ? chapters[idx + 1] : null

  return (
    <div className="flex items-center justify-between px-4 py-4" style={{ borderTop: '1px solid var(--border)' }}>
      {prev ? (
        <a href={prev.path} className="flex items-center gap-1 text-sm transition-colors" style={{ color: 'var(--text-tertiary)' }}>
          <ChevronLeft size={16} /> 第{prev.num}章 {prev.title}
        </a>
      ) : <div />}
      {next ? (
        <a href={next.path} className="flex items-center gap-1 text-sm transition-colors" style={{ color: 'var(--text-tertiary)' }}>
          第{next.num}章 {next.title} <ChevronRight size={16} />
        </a>
      ) : <div />}
    </div>
  )
}

// ============================================================
// ScrollReveal
// ============================================================
export function ScrollReveal({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true) },
      { threshold: 0.1, rootMargin: '50px' }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={`transition-all duration-500 ${visible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}
    >
      {children}
    </div>
  )
}
