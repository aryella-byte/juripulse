'use client'

import { useState, useEffect } from 'react'
import { Sparkles, TrendingUp, Lightbulb, Target, AlertCircle, Loader2 } from 'lucide-react'
import { Article } from '@/components/pulse/types'

interface AIInsightsProps {
  articles: Article[]
  topics: string[]
  journals: string[]
}

type AnalysisType = 'summary' | 'trends' | 'hotspots' | 'gaps'

interface AnalysisResult {
  type: AnalysisType
  analysis: string
  structured?: {
    overview?: string
    findings?: Array<{ title: string; description: string; significance: string }>
    suggestions?: string[]
    outlook?: string
    trends?: Array<{ name: string; description: string; strength: string; examples: string[] }>
    emerging?: string[]
    traditional?: string[]
    hotspots?: Array<{ topic: string; intensity: string; description: string; keyJournals: string[] }>
    controversies?: string[]
    gaps?: Array<{ area: string; description: string; opportunity: string; priority: string }>
    recommendations?: string[]
  }
  timestamp: string
}

const ANALYSIS_TYPES: { id: AnalysisType; label: string; icon: typeof Sparkles; desc: string }[] = [
  { id: 'summary', label: '综合洞察', icon: Sparkles, desc: 'AI 对整体研究态势的深度解读' },
  { id: 'trends', label: '趋势分析', icon: TrendingUp, desc: '识别新兴趋势与传统议题演变' },
  { id: 'hotspots', label: '研究热点', icon: Target, desc: '发现当前最受关注的学术焦点' },
  { id: 'gaps', label: '研究空白', icon: Lightbulb, desc: '发现被忽视的研究机会' },
]

export function AIInsights({ articles, topics, journals }: AIInsightsProps) {
  const [activeType, setActiveType] = useState<AnalysisType>('summary')
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchAnalysis = async (type: AnalysisType) => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          articles,
          topics,
          journals,
        }),
      })

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || '分析请求失败')
      }

      const data = await response.json()
      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : '未知错误')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAnalysis(activeType)
  }, [activeType])

  return (
    <div className="space-y-6">
      {/* 分析类型选择 */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {ANALYSIS_TYPES.map((type) => {
          const Icon = type.icon
          const isActive = activeType === type.id
          return (
            <button
              key={type.id}
              onClick={() => setActiveType(type.id)}
              className={`relative rounded-lg border p-4 text-left transition-all ${
                isActive
                  ? 'border-[var(--gold)] bg-[var(--gold-dim)]'
                  : 'border-[var(--border)] bg-[var(--bg-card)] hover:border-[var(--border-hover)]'
              }`}
              style={{ boxShadow: isActive ? 'var(--shadow-sm)' : 'none' }}
            >
              <div className="flex items-start gap-3">
                <div
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md"
                  style={{
                    background: isActive ? 'var(--gold)' : 'var(--bg-surface)',
                    color: isActive ? 'white' : 'var(--text-secondary)',
                  }}
                >
                  <Icon size={16} />
                </div>
                <div>
                  <div
                    className="text-[13px] font-medium"
                    style={{ color: isActive ? 'var(--navy)' : 'var(--text-primary)' }}
                  >
                    {type.label}
                  </div>
                  <div className="mt-1 text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
                    {type.desc}
                  </div>
                </div>
              </div>
              {isActive && (
                <span className="absolute bottom-0 left-0 right-0 h-[2px] rounded-b-lg" style={{ background: 'var(--gold)' }} />
              )}
            </button>
          )
        })}
      </div>

      {/* 加载状态 */}
      {loading && (
        <div className="flex min-h-[300px] flex-col items-center justify-center rounded-lg border border-dashed" style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}>
          <div className="flex h-12 w-12 items-center justify-center rounded-full" style={{ background: 'var(--gold-dim)' }}>
            <Loader2 size={24} className="animate-spin" style={{ color: 'var(--gold)' }} />
          </div>
          <p className="mt-4 text-[13px]" style={{ color: 'var(--text-secondary)' }}>
            AI 正在分析 {articles.length} 篇论文...
          </p>
          <p className="mt-1 text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
            使用 kimi-k2.5 模型进行深度分析
          </p>
        </div>
      )}

      {/* 错误状态 */}
      {error && !loading && (
        <div className="flex min-h-[200px] flex-col items-center justify-center rounded-lg border" style={{ borderColor: '#fecaca', background: '#fef2f2' }}>
          <AlertCircle size={32} style={{ color: '#dc2626' }} />
          <p className="mt-3 text-[13px] font-medium" style={{ color: '#991b1b' }}>
            分析出错
          </p>
          <p className="mt-1 text-[12px]" style={{ color: '#b91c1c' }}>
            {error}
          </p>
          <button
            onClick={() => fetchAnalysis(activeType)}
            className="mt-4 rounded-md px-4 py-2 text-[12px] font-medium text-white"
            style={{ background: 'var(--navy)' }}
          >
            重试
          </button>
        </div>
      )}

      {/* 分析结果 */}
      {!loading && !error && result && (
        <div className="animate-fade-in space-y-6">
          {activeType === 'summary' && result.structured && (
            <SummaryView data={result.structured} />
          )}
          {activeType === 'trends' && result.structured && (
            <TrendsView data={result.structured} />
          )}
          {activeType === 'hotspots' && result.structured && (
            <HotspotsView data={result.structured} />
          )}
          {activeType === 'gaps' && result.structured && (
            <GapsView data={result.structured} />
          )}

          {/* 原始分析文本 */}
          <div className="rounded-lg border p-5" style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}>
            <h4 className="mb-3 text-[12px] font-semibold uppercase tracking-wide" style={{ color: 'var(--text-tertiary)' }}>
              详细分析
            </h4>
            <div className="prose prose-sm max-w-none" style={{ color: 'var(--text-secondary)' }}>
              <pre className="whitespace-pre-wrap font-sans text-[13px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                {result.analysis}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// 综合洞察视图
function SummaryView({ data }: { data: NonNullable<AnalysisResult['structured']> }) {
  return (
    <div className="space-y-6">
      {/* 概述卡片 */}
      <div className="rounded-lg border p-6" style={{ borderColor: 'var(--gold)', background: 'var(--gold-dim)' }}>
        <div className="flex items-center gap-2 mb-3">
          <Sparkles size={18} style={{ color: 'var(--gold)' }} />
          <span className="text-[12px] font-semibold uppercase tracking-wide" style={{ color: 'var(--gold)' }}>
            AI 洞察
          </span>
        </div>
        <p className="text-[14px] leading-relaxed" style={{ color: 'var(--text-primary)' }}>
          {data.overview || '暂无概述'}
        </p>
      </div>

      {/* 主要发现 */}
      {data.findings && data.findings.length > 0 && (
        <div className="rounded-lg border p-6" style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}>
          <h3 className="mb-4 text-[14px] font-semibold" style={{ color: 'var(--text-primary)' }}>
            主要发现
          </h3>
          <div className="space-y-4">
            {data.findings.map((finding, idx) => (
              <div key={idx} className="flex gap-4">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[12px] font-bold text-white"
                  style={{ background: 'var(--navy)' }}
                >
                  {idx + 1}
                </div>
                <div>
                  <h4 className="text-[13px] font-medium" style={{ color: 'var(--text-primary)' }}>
                    {finding.title}
                  </h4>
                  <p className="mt-1 text-[12px]" style={{ color: 'var(--text-secondary)' }}>
                    {finding.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 建议 */}
      {data.suggestions && data.suggestions.length > 0 && (
        <div className="rounded-lg border p-6" style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}>
          <h3 className="mb-4 text-[14px] font-semibold" style={{ color: 'var(--text-primary)' }}>
            实用建议
          </h3>
          <ul className="space-y-2">
            {data.suggestions.map((suggestion, idx) => (
              <li key={idx} className="flex items-start gap-2 text-[13px]" style={{ color: 'var(--text-secondary)' }}>
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: 'var(--gold)' }} />
                {suggestion}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 展望 */}
      {data.outlook && (
        <div className="rounded-lg border p-6" style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}>
          <h3 className="mb-3 text-[14px] font-semibold" style={{ color: 'var(--text-primary)' }}>
            未来展望
          </h3>
          <p className="text-[13px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            {data.outlook}
          </p>
        </div>
      )}
    </div>
  )
}

// 趋势分析视图
function TrendsView({ data }: { data: NonNullable<AnalysisResult['structured']> }) {
  const strengthColors: Record<string, string> = {
    high: 'var(--navy)',
    medium: 'var(--gold)',
    low: 'var(--text-tertiary)'
  }

  return (
    <div className="space-y-6">
      {data.trends && data.trends.length > 0 && (
        <div className="rounded-lg border p-6" style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}>
          <h3 className="mb-4 text-[14px] font-semibold" style={{ color: 'var(--text-primary)' }}>
            研究趋势
          </h3>
          <div className="space-y-4">
            {data.trends.map((trend, idx) => (
              <div key={idx} className="rounded-lg border p-4" style={{ borderColor: 'var(--border)' }}>
                <div className="flex items-center justify-between">
                  <h4 className="text-[13px] font-medium" style={{ color: 'var(--text-primary)' }}>
                    {trend.name}
                  </h4>
                  <span
                    className="rounded-full px-2 py-0.5 text-[10px] font-medium text-white"
                    style={{ background: strengthColors[trend.strength] || strengthColors.medium }}
                  >
                    {trend.strength === 'high' ? '强' : trend.strength === 'medium' ? '中' : '弱'}
                  </span>
                </div>
                <p className="mt-2 text-[12px]" style={{ color: 'var(--text-secondary)' }}>
                  {trend.description}
                </p>
                {trend.examples && trend.examples.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {trend.examples.map((ex, i) => (
                      <span key={i} className="rounded bg-[var(--bg-surface)] px-2 py-1 text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
                        {ex}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {/* 新兴趋势 */}
        {data.emerging && data.emerging.length > 0 && (
          <div className="rounded-lg border p-5" style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}>
            <h4 className="mb-3 flex items-center gap-2 text-[13px] font-semibold" style={{ color: 'var(--text-primary)' }}>
              <TrendingUp size={14} style={{ color: 'var(--gold)' }} />
              新兴趋势
            </h4>
            <ul className="space-y-2">
              {data.emerging.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2 text-[12px]" style={{ color: 'var(--text-secondary)' }}>
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: 'var(--gold)' }} />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 传统议题 */}
        {data.traditional && data.traditional.length > 0 && (
          <div className="rounded-lg border p-5" style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}>
            <h4 className="mb-3 flex items-center gap-2 text-[13px] font-semibold" style={{ color: 'var(--text-primary)' }}>
              <Target size={14} style={{ color: 'var(--navy)' }} />
              传统议题
            </h4>
            <ul className="space-y-2">
              {data.traditional.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2 text-[12px]" style={{ color: 'var(--text-secondary)' }}>
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: 'var(--navy)' }} />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}

// 研究热点视图
function HotspotsView({ data }: { data: NonNullable<AnalysisResult['structured']> }) {
  const intensityColors: Record<string, string> = {
    high: 'bg-red-500',
    medium: 'bg-orange-400',
    low: 'bg-blue-400'
  }

  return (
    <div className="space-y-6">
      {data.hotspots && data.hotspots.length > 0 && (
        <div className="rounded-lg border p-6" style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}>
          <h3 className="mb-4 text-[14px] font-semibold" style={{ color: 'var(--text-primary)' }}>
            研究热点
          </h3>
          <div className="space-y-4">
            {data.hotspots.map((hotspot, idx) => (
              <div key={idx} className="flex gap-4">
                <div className={`mt-1 h-3 w-3 shrink-0 rounded-full ${intensityColors[hotspot.intensity] || 'bg-gray-400'}`} />
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h4 className="text-[13px] font-medium" style={{ color: 'var(--text-primary)' }}>
                      {hotspot.topic}
                    </h4>
                    <span className="rounded px-1.5 py-0.5 text-[10px]" style={{ background: 'var(--bg-surface)', color: 'var(--text-tertiary)' }}>
                      {hotspot.intensity === 'high' ? '高热' : hotspot.intensity === 'medium' ? '中热' : '低热'}
                    </span>
                  </div>
                  <p className="mt-1 text-[12px]" style={{ color: 'var(--text-secondary)' }}>
                    {hotspot.description}
                  </p>
                  {hotspot.keyJournals && hotspot.keyJournals.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {hotspot.keyJournals.map((journal, i) => (
                        <span key={i} className="rounded bg-[var(--gold-dim)] px-2 py-0.5 text-[10px]" style={{ color: 'var(--gold)' }}>
                          {journal}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 学术争议 */}
      {data.controversies && data.controversies.length > 0 && (
        <div className="rounded-lg border p-6" style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}>
          <h3 className="mb-4 text-[14px] font-semibold" style={{ color: 'var(--text-primary)' }}>
            学术争议焦点
          </h3>
          <div className="space-y-3">
            {data.controversies.map((controversy, idx) => (
              <div key={idx} className="flex items-start gap-3 rounded-lg border p-3" style={{ borderColor: 'var(--border)' }}>
                <AlertCircle size={16} className="mt-0.5 shrink-0" style={{ color: 'var(--gold)' }} />
                <p className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>
                  {controversy}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// 研究空白视图
function GapsView({ data }: { data: NonNullable<AnalysisResult['structured']> }) {
  const priorityColors: Record<string, { bg: string; text: string }> = {
    high: { bg: '#fee2e2', text: '#dc2626' },
    medium: { bg: '#fef3c7', text: '#d97706' },
    low: { bg: '#dbeafe', text: '#2563eb' }
  }

  return (
    <div className="space-y-6">
      {data.gaps && data.gaps.length > 0 && (
        <div className="rounded-lg border p-6" style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}>
          <h3 className="mb-4 text-[14px] font-semibold" style={{ color: 'var(--text-primary)' }}>
            研究空白与机会
          </h3>
          <div className="space-y-4">
            {data.gaps.map((gap, idx) => {
              const colors = priorityColors[gap.priority] || priorityColors.medium
              return (
                <div key={idx} className="rounded-lg border p-4" style={{ borderColor: 'var(--border)' }}>
                  <div className="flex items-start justify-between gap-3">
                    <h4 className="text-[13px] font-medium" style={{ color: 'var(--text-primary)' }}>
                      {gap.area}
                    </h4>
                    <span
                      className="shrink-0 rounded px-2 py-0.5 text-[10px] font-medium"
                      style={{ background: colors.bg, color: colors.text }}
                    >
                      {gap.priority === 'high' ? '高优先级' : gap.priority === 'medium' ? '中优先级' : '低优先级'}
                    </span>
                  </div>
                  <p className="mt-2 text-[12px]" style={{ color: 'var(--text-secondary)' }}>
                    {gap.description}
                  </p>
                  {gap.opportunity && (
                    <div className="mt-3 rounded bg-[var(--bg-surface)] p-3">
                      <span className="text-[10px] font-medium uppercase tracking-wide" style={{ color: 'var(--gold)' }}>
                        研究机会
                      </span>
                      <p className="mt-1 text-[12px]" style={{ color: 'var(--text-secondary)' }}>
                        {gap.opportunity}
                      </p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* 研究建议 */}
      {data.recommendations && data.recommendations.length > 0 && (
        <div className="rounded-lg border p-6" style={{ borderColor: 'var(--gold)', background: 'var(--gold-dim)' }}>
          <h3 className="mb-4 flex items-center gap-2 text-[14px] font-semibold" style={{ color: 'var(--navy)' }}>
            <Lightbulb size={16} style={{ color: 'var(--gold)' }} />
            研究建议
          </h3>
          <ul className="space-y-3">
            {data.recommendations.map((rec, idx) => (
              <li key={idx} className="flex items-start gap-3 text-[13px]" style={{ color: 'var(--text-secondary)' }}>
                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full" style={{ background: 'var(--gold)' }} />
                {rec}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
