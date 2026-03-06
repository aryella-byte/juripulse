'use client'

import { useEffect, useRef, useState } from 'react'
import { RotateCcw } from 'lucide-react'
import * as d3 from 'd3'
import {
  ChapterHeader, BeginnerExplanation, FormulaBox, Checkpoint,
  SectionIntro, SectionOutro, LegalCaseCard, ExperimentContainer,
  ChapterNav, ScrollReveal
} from '@/components/theory-components'

const CHAPTER_COLOR = '#047857'
const AXIS_COLOR = '#8a8a8a'

// ============================================
// 置信区间可视化
// ============================================
function ConfidenceIntervalVisualization() {
  const [sampleSize, setSampleSize] = useState(30)
  const [confidence, setConfidence] = useState(0.95)
  const [samples, setSamples] = useState<{ mean: number; lower: number; upper: number; containsTrue: boolean }[]>([])
  const svgRef = useRef<SVGSVGElement>(null)

  const trueMean = 50
  const trueStd = 10

  const generateSamples = () => {
    const newSamples: typeof samples = []
    const zScore = confidence === 0.9 ? 1.645 : confidence === 0.95 ? 1.96 : 2.576
    for (let i = 0; i < 50; i++) {
      let sum = 0
      for (let j = 0; j < sampleSize; j++) {
        const u1 = Math.random(), u2 = Math.random()
        sum += trueMean + trueStd * Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
      }
      const mean = sum / sampleSize
      const margin = zScore * (trueStd / Math.sqrt(sampleSize))
      newSamples.push({ mean, lower: mean - margin, upper: mean + margin, containsTrue: mean - margin <= trueMean && trueMean <= mean + margin })
    }
    setSamples(newSamples)
  }

  useEffect(() => { generateSamples() }, [sampleSize, confidence])

  useEffect(() => {
    if (!svgRef.current || samples.length === 0) return
    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const margin = { top: 20, right: 30, bottom: 40, left: 60 }
    const width = 600 - margin.left - margin.right
    const height = 400 - margin.top - margin.bottom
    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`)

    const xExtent = d3.extent(samples.flatMap(s => [s.lower, s.upper])) as [number, number]
    const xScale = d3.scaleLinear().domain([Math.max(20, xExtent[0] - 5), Math.min(80, xExtent[1] + 5)]).range([0, width])
    const yScale = d3.scaleLinear().domain([0, samples.length]).range([0, height])

    g.append('line').attr('x1', xScale(trueMean)).attr('x2', xScale(trueMean)).attr('y1', 0).attr('y2', height)
      .attr('stroke', 'var(--text-tertiary)').attr('stroke-width', 2).attr('stroke-dasharray', '5,5')
    g.append('text').attr('x', xScale(trueMean)).attr('y', -5).attr('text-anchor', 'middle').attr('fill', AXIS_COLOR).attr('font-size', '11px').text(`真实均值 = ${trueMean}`)

    samples.forEach((s, i) => {
      g.append('line').attr('x1', xScale(s.lower)).attr('x2', xScale(s.upper)).attr('y1', yScale(i)).attr('y2', yScale(i))
        .attr('stroke', s.containsTrue ? CHAPTER_COLOR : '#ef4444').attr('stroke-width', 1.5).attr('opacity', 0.7)
      g.append('circle').attr('cx', xScale(s.mean)).attr('cy', yScale(i)).attr('r', 2).attr('fill', s.containsTrue ? CHAPTER_COLOR : '#ef4444')
    })

    g.append('g').attr('transform', `translate(0,${height})`).call(d3.axisBottom(xScale))
      .selectAll('text').attr('fill', AXIS_COLOR).style('font-size', '11px')
    g.selectAll('.domain').attr('stroke', '#e8e5de')
  }, [samples])

  const coverage = samples.filter(s => s.containsTrue).length / samples.length * 100

  return (
    <div>
      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <div>
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>样本量 n</span>
            <span className="text-sm font-mono px-2 py-0.5 rounded" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>{sampleSize}</span>
          </div>
          <input type="range" min="5" max="100" value={sampleSize} onChange={e => setSampleSize(+e.target.value)} className="w-full" style={{ accentColor: CHAPTER_COLOR }} />
        </div>
        <div>
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>置信水平</span>
            <span className="text-sm font-mono px-2 py-0.5 rounded" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>{(confidence * 100).toFixed(0)}%</span>
          </div>
          <select value={confidence} onChange={e => setConfidence(+e.target.value)}
            className="w-full p-2 text-sm rounded-lg" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}>
            <option value={0.9}>90%</option>
            <option value={0.95}>95%</option>
            <option value={0.99}>99%</option>
          </select>
        </div>
      </div>

      <div className="rounded-xl p-4 mb-4" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
        <svg ref={svgRef} viewBox="0 0 600 400" style={{ width: '100%', height: 'auto' }} />
      </div>

      <div className="flex justify-between items-center">
        <div className="text-sm">
          <span style={{ color: 'var(--text-secondary)' }}>覆盖真实均值的比例：</span>
          <span className="font-bold ml-1" style={{ color: CHAPTER_COLOR }}>{coverage.toFixed(1)}%</span>
        </div>
        <button onClick={generateSamples} className="px-4 py-2 rounded-lg text-[13px] font-medium text-white" style={{ background: CHAPTER_COLOR }}>重新抽样</button>
      </div>
      <p className="mt-4 text-[12px]" style={{ color: 'var(--text-tertiary)' }}>红色线表示未覆盖真实均值，绿色线表示覆盖。增加样本量可以缩小区间宽度。</p>
    </div>
  )
}

// ============================================
// 假设检验可视化
// ============================================
function normalCDF(x: number): number {
  const sign = x >= 0 ? 1 : -1
  const ax = Math.abs(x)
  const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741, a4 = -1.453152027, a5 = 1.061405429, p = 0.3275911
  const t = 1 / (1 + p * ax)
  const y = 1 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-ax * ax)
  return 0.5 * (1 + sign * y)
}

function HypothesisTestVisualization() {
  const [effectSize, setEffectSize] = useState(0.5)
  const [sampleSize, setSampleSize] = useState(30)
  const alpha = 0.05

  const se = 1 / Math.sqrt(sampleSize)
  const criticalValue = 1.96 * se
  const power = 1 - normalCDF((criticalValue - effectSize) / se)

  return (
    <div>
      <div className="space-y-5 mb-6">
        <div>
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>效应量 (Cohen&apos;s d)</span>
            <span className="text-sm font-mono px-2 py-0.5 rounded" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>{effectSize.toFixed(2)}</span>
          </div>
          <input type="range" min="0.2" max="1.0" step="0.1" value={effectSize} onChange={e => setEffectSize(+e.target.value)} className="w-full" style={{ accentColor: CHAPTER_COLOR }} />
        </div>
        <div>
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>样本量</span>
            <span className="text-sm font-mono px-2 py-0.5 rounded" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>{sampleSize}</span>
          </div>
          <input type="range" min="10" max="100" value={sampleSize} onChange={e => setSampleSize(+e.target.value)} className="w-full" style={{ accentColor: CHAPTER_COLOR }} />
        </div>
      </div>

      <div className="rounded-xl p-6 mb-4" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { v: `${(power * 100).toFixed(1)}%`, l: '检验力' },
            { v: `${(alpha * 100).toFixed(0)}%`, l: '显著性水平 α' },
            { v: String(effectSize), l: '效应量' },
            { v: String(sampleSize), l: '样本量' },
          ].map(s => (
            <div key={s.l} className="text-center p-4 rounded-lg" style={{ background: 'var(--bg-card)' }}>
              <div className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{s.v}</div>
              <div className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="p-4 rounded-lg" style={{ background: `${CHAPTER_COLOR}10`, border: `1px solid ${CHAPTER_COLOR}30` }}>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          <strong style={{ color: 'var(--text-primary)' }}>解释：</strong>检验力 {(power * 100).toFixed(1)}% 表示如果真实效应量为 {effectSize}，
          我们有 {(power * 100).toFixed(1)}% 的概率能检测到显著差异。通常建议至少达到 80%。
        </p>
      </div>
    </div>
  )
}

// ============================================
// Bootstrap 可视化
// ============================================
function BootstrapVisualization() {
  const [originalData] = useState(() => {
    const data: number[] = []
    for (let i = 0; i < 20; i++) {
      const u1 = Math.random(), u2 = Math.random()
      data.push(Math.round((50 + 10 * Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)) * 10) / 10)
    }
    return data
  })
  const [bootstrapMeans, setBootstrapMeans] = useState<number[]>([])
  const svgRef = useRef<SVGSVGElement>(null)

  const runBootstrap = (times: number) => {
    const means: number[] = []
    for (let b = 0; b < times; b++) {
      let sum = 0
      for (let i = 0; i < originalData.length; i++) {
        sum += originalData[Math.floor(Math.random() * originalData.length)]
      }
      means.push(sum / originalData.length)
    }
    setBootstrapMeans(prev => [...prev, ...means])
  }

  useEffect(() => {
    if (!svgRef.current || bootstrapMeans.length === 0) return
    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const margin = { top: 20, right: 30, bottom: 40, left: 50 }
    const width = 500 - margin.left - margin.right
    const height = 250 - margin.top - margin.bottom
    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`)

    const xExtent = d3.extent(bootstrapMeans) as [number, number]
    const bins = d3.bin().domain(xExtent).thresholds(25)(bootstrapMeans)
    const xScale = d3.scaleLinear().domain(xExtent).range([0, width])
    const yScale = d3.scaleLinear().domain([0, d3.max(bins, d => d.length) || 0]).range([height, 0])

    g.selectAll('rect').data(bins).enter().append('rect')
      .attr('x', d => xScale(d.x0 || 0)).attr('y', d => yScale(d.length))
      .attr('width', d => Math.max(0, xScale(d.x1 || 0) - xScale(d.x0 || 0) - 1))
      .attr('height', d => height - yScale(d.length)).attr('fill', CHAPTER_COLOR).attr('rx', 2).attr('opacity', 0.7)

    g.append('g').attr('transform', `translate(0,${height})`).call(d3.axisBottom(xScale).ticks(5))
      .selectAll('text').attr('fill', AXIS_COLOR).style('font-size', '11px')
    g.append('g').call(d3.axisLeft(yScale).ticks(5))
      .selectAll('text').attr('fill', AXIS_COLOR).style('font-size', '11px')
    g.selectAll('.domain').attr('stroke', '#e8e5de')

    const bMean = bootstrapMeans.reduce((a, b) => a + b, 0) / bootstrapMeans.length
    g.append('line').attr('x1', xScale(bMean)).attr('x2', xScale(bMean)).attr('y1', 0).attr('y2', height)
      .attr('stroke', CHAPTER_COLOR).attr('stroke-dasharray', '5,5').attr('stroke-width', 2)
  }, [bootstrapMeans])

  const origMean = (originalData.reduce((a, b) => a + b, 0) / originalData.length).toFixed(2)
  const bMean = bootstrapMeans.length > 0 ? (bootstrapMeans.reduce((a, b) => a + b, 0) / bootstrapMeans.length).toFixed(2) : '—'
  const sorted = [...bootstrapMeans].sort((a, b) => a - b)
  const ci025 = sorted.length > 0 ? sorted[Math.floor(sorted.length * 0.025)]?.toFixed(2) : '—'
  const ci975 = sorted.length > 0 ? sorted[Math.floor(sorted.length * 0.975)]?.toFixed(2) : '—'

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-4">
        <button onClick={() => runBootstrap(100)} className="px-4 py-2 rounded-lg text-[13px] font-medium text-white" style={{ background: CHAPTER_COLOR }}>Bootstrap x100</button>
        <button onClick={() => runBootstrap(1000)} className="px-4 py-2 rounded-lg text-[13px] font-medium text-white" style={{ background: CHAPTER_COLOR }}>Bootstrap x1000</button>
        <button onClick={() => setBootstrapMeans([])} className="px-3 py-2 rounded-lg text-sm" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}><RotateCcw size={15} /></button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        {[
          { v: origMean, l: '原始样本均值' }, { v: String(bootstrapMeans.length), l: 'Bootstrap次数' },
          { v: bMean, l: 'Bootstrap均值' }, { v: `[${ci025}, ${ci975}]`, l: '95% Bootstrap CI' },
        ].map(s => (
          <div key={s.l} className="p-3 rounded-lg text-center" style={{ background: 'var(--bg-secondary)' }}>
            <div className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>{s.v}</div>
            <div className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>{s.l}</div>
          </div>
        ))}
      </div>

      <div className="rounded-xl p-4" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
        <svg ref={svgRef} viewBox="0 0 500 250" style={{ width: '100%', height: 'auto' }} />
      </div>
    </div>
  )
}

// ============================================
// 主页面
// ============================================
export default function Chapter4Page() {
  return (
    <div className="min-h-screen">
      <ChapterHeader chapterNumber={4} title="频率派推断" subtitle="Frequentist Inference"
        description="掌握置信区间与假设检验，学会从样本推断总体特征" color={CHAPTER_COLOR} />

      <div className="max-w-4xl mx-auto px-4 md:px-6 py-12 md:py-16">
        <SectionIntro chapterColor={CHAPTER_COLOR}
          prerequisites={['概率分布', '抽样理论', '正态分布']}
          learningGoals={['理解点估计与区间估计的区别', '掌握置信区间的计算与解释', '理解假设检验的基本逻辑', '理解p值的含义与局限性']}
          overview={<><p className="mb-3">本章介绍<strong>频率派统计推断</strong>的核心方法。</p><p>这些方法在法律实证研究中广泛应用。</p></>} />

        <BeginnerExplanation title="初学者指南">
          <div className="space-y-4">
            <p><strong>置信区间</strong>像"射箭的靶子范围"。95%置信区间意味着如果射100箭，约95箭会落在这个范围内。</p>
            <p><strong>p值</strong>像"巧合的可能性"。p=0.05意味着只有5%的可能性是巧合。</p>
            <p><strong>假设检验</strong>像"法庭上的无罪推定"。先假设无罪，再看证据是否足够推翻。</p>
          </div>
        </BeginnerExplanation>

        <ScrollReveal>
          <h2 className="text-2xl font-bold mb-6 pt-4" style={{ color: 'var(--text-primary)' }}>点估计与区间估计</h2>
          <p className="leading-relaxed mb-6" style={{ color: 'var(--text-secondary)' }}>统计推断的目标是从样本数据推断总体参数。</p>
        </ScrollReveal>

        <FormulaBox title="样本均值的置信区间" latex="x̄ ± z(α/2) · σ/√n"
          explanation={<ul className="space-y-1"><li>x̄ = 样本均值</li><li>z = 标准正态分位数（95%时为1.96）</li><li>σ = 总体标准差</li><li>n = 样本量</li></ul>} />

        <ExperimentContainer title="交互演示：置信区间" description="从同一总体中反复抽样，观察置信区间的覆盖情况">
          <ConfidenceIntervalVisualization />
        </ExperimentContainer>

        <Checkpoint type="mistake">
          <div className="space-y-3">
            <p className="font-medium">常见误区：置信区间的错误解释</p>
            <p>错误："95%置信区间表示真实参数有95%的概率落在这个区间内。"</p>
            <p>正确："如果重复抽样100次，大约有95次计算出的区间会包含真实参数。"</p>
          </div>
        </Checkpoint>

        <ScrollReveal>
          <h2 className="text-2xl font-bold mb-6 pt-4" style={{ color: 'var(--text-primary)' }}>假设检验</h2>
          <p className="leading-relaxed mb-6" style={{ color: 'var(--text-secondary)' }}>假设检验用于判断样本数据是否提供了足够的证据来拒绝某个假设。</p>
        </ScrollReveal>

        <FormulaBox title="Z检验统计量" latex="z = (x̄ - μ₀) / (σ / √n)"
          explanation={<ol className="list-decimal list-inside space-y-1"><li>建立原假设 H0 和备择假设 H1</li><li>选择显著性水平 α</li><li>计算检验统计量</li><li>比较统计量与临界值</li><li>做出统计决策</li></ol>} />

        <ExperimentContainer title="交互演示：假设检验与检验力" description="调整效应量和样本量，观察检验力的变化">
          <HypothesisTestVisualization />
        </ExperimentContainer>

        <Checkpoint type="think">
          <p>在刑事审判中，第一类错误（冤枉好人）和第二类错误（放走坏人）哪种更严重？这与"宁可错放，不可错判"有什么联系？</p>
        </Checkpoint>

        <ScrollReveal>
          <h2 className="text-2xl font-bold mb-6 pt-4" style={{ color: 'var(--text-primary)' }}>自助法（Bootstrap）</h2>
          <p className="leading-relaxed mb-6" style={{ color: 'var(--text-secondary)' }}>当理论分布难以确定时，Bootstrap通过有放回重抽样来估计统计量的分布。</p>
        </ScrollReveal>

        <ExperimentContainer title="交互演示：Bootstrap 重抽样" description="从样本数据中进行 Bootstrap 重抽样">
          <BootstrapVisualization />
        </ExperimentContainer>

        <LegalCaseCard title="量刑公正性的统计检验" color={CHAPTER_COLOR}>
          <p className="leading-relaxed mb-4">
            某研究调查200起相似盗窃案，发现平均刑期18个月（标准差6个月）。
            假设标准为15个月。量刑是否显著偏高？
          </p>
          <div className="rounded-lg p-4 mb-4" style={{ background: 'var(--bg-secondary)' }}>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>z = (18-15)/(6/√200) ≈ 7.07，远大于1.96，p &lt; 0.001</p>
            <p className="font-bold text-sm" style={{ color: CHAPTER_COLOR }}>拒绝原假设：量刑显著偏高。</p>
          </div>
        </LegalCaseCard>

        <SectionOutro
          keyPoints={['点估计给出单一数值，区间估计给出可能范围', '置信区间的正确解释涉及重复抽样频率', 'p值不是原假设为真的概率', '检验力受效应量和样本量影响']}
          question="120名法官对某改革平均支持度6.5分（标准差2分），是否显著高于中立值5分？"
          hint="z = (6.5-5)/(2/√120) ≈ 8.22 > 1.96，拒绝原假设。"
          nextChapter={{ title: '贝叶斯推断', description: '根据新证据修正信念', link: '/theory/chapter5' }}
        />

        <ChapterNav currentChapter={4} />
      </div>
    </div>
  )
}
