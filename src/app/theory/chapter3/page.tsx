'use client'

import { useState, useEffect, useRef } from 'react'
import { RotateCcw } from 'lucide-react'
import * as d3 from 'd3'
import {
  ChapterHeader, BeginnerExplanation, FormulaBox, Checkpoint,
  SectionIntro, SectionOutro, LegalCaseCard, ExperimentContainer,
  useResponsiveSVG, ChapterNav, ScrollReveal
} from '@/components/theory-components'

const CHAPTER_COLOR = '#285e61'
const AXIS_COLOR = '#8a8a8a'
const GRID_COLOR = 'rgba(0,0,0,0.04)'

// ============================================
// Helper: log-factorial via Stirling
// ============================================
function logFact(n: number): number {
  if (n <= 1) return 0
  let s = 0
  for (let i = 2; i <= n; i++) s += Math.log(i)
  return s
}

function binomialPMF(k: number, n: number, p: number): number {
  if (k < 0 || k > n) return 0
  return Math.exp(logFact(n) - logFact(k) - logFact(n - k) + k * Math.log(p) + (n - k) * Math.log(1 - p))
}

function poissonPMF(k: number, lambda: number): number {
  if (k < 0) return 0
  return Math.exp(k * Math.log(lambda) - lambda - logFact(k))
}

function normalPDF(x: number, mu: number, sigma: number): number {
  return (1 / (sigma * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * ((x - mu) / sigma) ** 2)
}

function exponentialPDF(x: number, lambda: number): number {
  return x < 0 ? 0 : lambda * Math.exp(-lambda * x)
}

function normalCDF(x: number, mu: number, sigma: number): number {
  const z = (x - mu) / sigma
  const t = 1 / (1 + 0.2316419 * Math.abs(z))
  const d = 0.3989422804014327 * Math.exp(-0.5 * z * z)
  const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.8212560 + t * 1.3302744))))
  return z > 0 ? 1 - p : p
}

function exponentialCDF(x: number, lambda: number): number {
  return x < 0 ? 0 : 1 - Math.exp(-lambda * x)
}

// ============================================
// Lazy wrapper
// ============================================
function LazyVisualization({ children }: { children: React.ReactNode }) {
  const [loaded, setLoaded] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setLoaded(true); observer.disconnect() }
    }, { threshold: 0.1, rootMargin: '100px' })
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={ref} style={{ minHeight: 200 }}>
      {loaded ? children : (
        <div className="h-48 flex items-center justify-center rounded-xl" style={{ background: 'var(--bg-secondary)' }}>
          <div className="flex items-center gap-3" style={{ color: 'var(--text-tertiary)' }}>
            <div className="w-4 h-4 rounded-full animate-pulse" style={{ background: CHAPTER_COLOR }} />
            <span className="text-sm">加载可视化...</span>
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================
// 1. Discrete Distributions
// ============================================
function DiscreteDistributionViz() {
  const [mode, setMode] = useState<'binomial' | 'poisson'>('binomial')
  const [n, setN] = useState(20)
  const [p, setP] = useState(0.5)
  const [lambda, setLambda] = useState(5)
  const svgRef = useRef<SVGSVGElement>(null)
  const { containerRef, dimensions } = useResponsiveSVG(600, 280)

  useEffect(() => {
    if (!svgRef.current) return
    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const { width, height } = dimensions
    const margin = { top: 20, right: 30, bottom: 50, left: 60 }
    const cw = width - margin.left - margin.right
    const ch = height - margin.top - margin.bottom
    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`)

    let data: { k: number; prob: number }[] = []
    if (mode === 'binomial') {
      for (let k = 0; k <= n; k++) data.push({ k, prob: binomialPMF(k, n, p) })
    } else {
      const maxK = Math.max(20, Math.ceil(lambda * 3))
      for (let k = 0; k <= maxK; k++) data.push({ k, prob: poissonPMF(k, lambda) })
    }

    const xScale = d3.scaleBand<number>().domain(data.map(d => d.k)).range([0, cw]).padding(0.2)
    const yMax = d3.max(data, d => d.prob) || 0.5
    const yScale = d3.scaleLinear().domain([0, yMax * 1.15]).range([ch, 0])

    // Grid
    g.append('g').call(d3.axisLeft(yScale).ticks(5).tickSize(-cw).tickFormat(() => ''))
      .selectAll('line').attr('stroke', GRID_COLOR).attr('stroke-dasharray', '2,2')

    // Axes
    const xTicks = data.filter((_, i) => data.length <= 25 || i % Math.ceil(data.length / 15) === 0).map(d => d.k)
    g.append('g').attr('transform', `translate(0,${ch})`).call(d3.axisBottom(xScale).tickValues(xTicks))
      .selectAll('text').attr('fill', AXIS_COLOR).style('font-size', '11px')
    g.append('g').call(d3.axisLeft(yScale).ticks(5).tickFormat(d => (+d).toFixed(2)))
      .selectAll('text').attr('fill', AXIS_COLOR).style('font-size', '11px')
    g.selectAll('.domain').attr('stroke', 'var(--border)')

    // Bars
    g.selectAll('.bar').data(data).enter().append('rect')
      .attr('x', d => xScale(d.k) || 0)
      .attr('y', ch)
      .attr('width', xScale.bandwidth())
      .attr('height', 0)
      .attr('fill', CHAPTER_COLOR)
      .attr('rx', 2)
      .attr('opacity', 0.8)
      .transition().duration(500).ease(d3.easeCubicOut)
      .attr('y', d => yScale(d.prob))
      .attr('height', d => ch - yScale(d.prob))

    // Labels
    g.append('text').attr('x', cw / 2).attr('y', ch + 40)
      .attr('text-anchor', 'middle').attr('fill', AXIS_COLOR).style('font-size', '11px').text('k')
    g.append('text').attr('transform', 'rotate(-90)').attr('y', -45).attr('x', -ch / 2)
      .attr('text-anchor', 'middle').attr('fill', AXIS_COLOR).style('font-size', '11px').text('P(X = k)')
  }, [mode, n, p, lambda, dimensions])

  const mean = mode === 'binomial' ? n * p : lambda
  const variance = mode === 'binomial' ? n * p * (1 - p) : lambda

  return (
    <div ref={containerRef}>
      <div className="flex flex-wrap gap-2 mb-6">
        {(['binomial', 'poisson'] as const).map(m => (
          <button key={m} onClick={() => setMode(m)}
            className="px-4 py-2 rounded-lg text-[13px] font-medium transition-all"
            style={{ background: mode === m ? CHAPTER_COLOR : 'var(--bg-surface)', color: mode === m ? '#fff' : 'var(--text-primary)', border: `1px solid ${mode === m ? CHAPTER_COLOR : 'var(--border)'}` }}>
            {m === 'binomial' ? '二项分布 Binomial' : '泊松分布 Poisson'}
          </button>
        ))}
      </div>

      {mode === 'binomial' ? (
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>试验次数 n</span>
              <span className="text-sm font-mono px-2 py-0.5 rounded" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>{n}</span>
            </div>
            <input type="range" min="1" max="50" value={n} onChange={e => setN(+e.target.value)} className="w-full" style={{ accentColor: CHAPTER_COLOR }} />
          </div>
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>成功概率 p</span>
              <span className="text-sm font-mono px-2 py-0.5 rounded" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>{p.toFixed(2)}</span>
            </div>
            <input type="range" min="0.01" max="0.99" step="0.01" value={p} onChange={e => setP(+e.target.value)} className="w-full" style={{ accentColor: CHAPTER_COLOR }} />
          </div>
        </div>
      ) : (
        <div className="mb-6">
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>期望事件数 λ</span>
            <span className="text-sm font-mono px-2 py-0.5 rounded" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>{lambda.toFixed(1)}</span>
          </div>
          <input type="range" min="0.5" max="15" step="0.5" value={lambda} onChange={e => setLambda(+e.target.value)} className="w-full" style={{ accentColor: CHAPTER_COLOR }} />
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="p-4 rounded-lg text-center" style={{ background: 'var(--bg-secondary)' }}>
          <div className="text-xl font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>{mean.toFixed(2)}</div>
          <div className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>均值 E(X){mode === 'binomial' ? ' = np' : ' = λ'}</div>
        </div>
        <div className="p-4 rounded-lg text-center" style={{ background: CHAPTER_COLOR + '15' }}>
          <div className="text-xl font-semibold mb-1" style={{ color: CHAPTER_COLOR }}>{variance.toFixed(2)}</div>
          <div className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>方差 Var(X){mode === 'binomial' ? ' = np(1-p)' : ' = λ'}</div>
        </div>
      </div>

      <div className="rounded-xl p-4" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
        <svg ref={svgRef} viewBox={`0 0 ${dimensions.width} ${dimensions.height}`} style={{ width: '100%', height: 'auto' }} />
      </div>
      <p className="mt-4 text-[12px] text-center" style={{ color: 'var(--text-tertiary)' }}>
        {mode === 'binomial' ? '调整 n 和 p 观察二项分布形态的变化' : '调整 λ 观察泊松分布的形态变化'}
      </p>
    </div>
  )
}

// ============================================
// 2. Continuous Distributions
// ============================================
function ContinuousDistributionViz() {
  const [mode, setMode] = useState<'normal' | 'exponential'>('normal')
  const [mu, setMu] = useState(0)
  const [sigma, setSigma] = useState(1)
  const [expLambda, setExpLambda] = useState(1)
  const [showCDF, setShowCDF] = useState(false)
  const [rangeA, setRangeA] = useState(-1)
  const [rangeB, setRangeB] = useState(1)
  const svgRef = useRef<SVGSVGElement>(null)
  const { containerRef, dimensions } = useResponsiveSVG(600, 300)

  useEffect(() => {
    if (!svgRef.current) return
    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const { width, height } = dimensions
    const margin = { top: 20, right: 30, bottom: 50, left: 60 }
    const cw = width - margin.left - margin.right
    const ch = height - margin.top - margin.bottom
    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`)

    const xMin = mode === 'normal' ? mu - 4 * sigma : 0
    const xMax = mode === 'normal' ? mu + 4 * sigma : Math.max(5, 5 / expLambda)
    const step = (xMax - xMin) / 200

    const pdfData: { x: number; y: number }[] = []
    const cdfData: { x: number; y: number }[] = []
    for (let x = xMin; x <= xMax; x += step) {
      const pdfVal = mode === 'normal' ? normalPDF(x, mu, sigma) : exponentialPDF(x, expLambda)
      const cdfVal = mode === 'normal' ? normalCDF(x, mu, sigma) : exponentialCDF(x, expLambda)
      pdfData.push({ x, y: pdfVal })
      cdfData.push({ x, y: cdfVal })
    }

    const xScale = d3.scaleLinear().domain([xMin, xMax]).range([0, cw])
    const yMaxPDF = d3.max(pdfData, d => d.y) || 1
    const yMax = showCDF ? Math.max(yMaxPDF * 1.1, 1.1) : yMaxPDF * 1.15
    const yScale = d3.scaleLinear().domain([0, yMax]).range([ch, 0])

    // Grid
    g.append('g').call(d3.axisLeft(yScale).ticks(5).tickSize(-cw).tickFormat(() => ''))
      .selectAll('line').attr('stroke', GRID_COLOR).attr('stroke-dasharray', '2,2')

    // Axes
    g.append('g').attr('transform', `translate(0,${ch})`).call(d3.axisBottom(xScale).ticks(8))
      .selectAll('text').attr('fill', AXIS_COLOR).style('font-size', '11px')
    g.append('g').call(d3.axisLeft(yScale).ticks(5).tickFormat(d => (+d).toFixed(2)))
      .selectAll('text').attr('fill', AXIS_COLOR).style('font-size', '11px')
    g.selectAll('.domain').attr('stroke', 'var(--border)')

    // Shaded area for range
    if (mode === 'normal') {
      const areaData = pdfData.filter(d => d.x >= rangeA && d.x <= rangeB)
      if (areaData.length > 0) {
        const areaGen = d3.area<{ x: number; y: number }>().x(d => xScale(d.x)).y0(ch).y1(d => yScale(d.y)).curve(d3.curveBasis)
        g.append('path').datum(areaData).attr('fill', CHAPTER_COLOR).attr('opacity', 0.2).attr('d', areaGen)
      }
    }

    // PDF curve
    const line = d3.line<{ x: number; y: number }>().x(d => xScale(d.x)).y(d => yScale(d.y)).curve(d3.curveBasis)
    g.append('path').datum(pdfData).attr('fill', 'none').attr('stroke', CHAPTER_COLOR).attr('stroke-width', 2.5).attr('d', line)

    // CDF overlay
    if (showCDF) {
      const cdfLine = d3.line<{ x: number; y: number }>().x(d => xScale(d.x)).y(d => yScale(d.y)).curve(d3.curveBasis)
      g.append('path').datum(cdfData).attr('fill', 'none').attr('stroke', '#c9a962').attr('stroke-width', 2).attr('stroke-dasharray', '6,3').attr('d', cdfLine)
      g.append('text').attr('x', cw - 10).attr('y', 20).attr('text-anchor', 'end').attr('fill', '#c9a962').attr('font-size', '11px').attr('font-weight', 'bold').text('CDF')
    }

    // Labels
    g.append('text').attr('x', cw / 2).attr('y', ch + 40)
      .attr('text-anchor', 'middle').attr('fill', AXIS_COLOR).style('font-size', '11px').text('x')
    g.append('text').attr('transform', 'rotate(-90)').attr('y', -45).attr('x', -ch / 2)
      .attr('text-anchor', 'middle').attr('fill', AXIS_COLOR).style('font-size', '11px').text(showCDF ? 'f(x) / F(x)' : 'f(x)')
    g.append('text').attr('x', cw - 10).attr('y', showCDF ? 40 : 20).attr('text-anchor', 'end').attr('fill', CHAPTER_COLOR).attr('font-size', '11px').attr('font-weight', 'bold').text('PDF')
  }, [mode, mu, sigma, expLambda, showCDF, rangeA, rangeB, dimensions])

  const prob = mode === 'normal'
    ? normalCDF(rangeB, mu, sigma) - normalCDF(rangeA, mu, sigma)
    : exponentialCDF(rangeB, expLambda) - exponentialCDF(Math.max(0, rangeA), expLambda)

  return (
    <div ref={containerRef}>
      <div className="flex flex-wrap gap-2 mb-6">
        {(['normal', 'exponential'] as const).map(m => (
          <button key={m} onClick={() => setMode(m)}
            className="px-4 py-2 rounded-lg text-[13px] font-medium transition-all"
            style={{ background: mode === m ? CHAPTER_COLOR : 'var(--bg-surface)', color: mode === m ? '#fff' : 'var(--text-primary)', border: `1px solid ${mode === m ? CHAPTER_COLOR : 'var(--border)'}` }}>
            {m === 'normal' ? '正态分布 Normal' : '指数分布 Exponential'}
          </button>
        ))}
        <button onClick={() => setShowCDF(!showCDF)}
          className="px-4 py-2 rounded-lg text-[13px] font-medium transition-all"
          style={{ background: showCDF ? '#c9a962' : 'var(--bg-surface)', color: showCDF ? '#fff' : 'var(--text-primary)', border: `1px solid ${showCDF ? '#c9a962' : 'var(--border)'}` }}>
          {showCDF ? 'CDF 开启' : 'CDF 关闭'}
        </button>
      </div>

      {mode === 'normal' ? (
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>均值 μ</span>
              <span className="text-sm font-mono px-2 py-0.5 rounded" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>{mu.toFixed(1)}</span>
            </div>
            <input type="range" min="-3" max="3" step="0.1" value={mu} onChange={e => setMu(+e.target.value)} className="w-full" style={{ accentColor: CHAPTER_COLOR }} />
          </div>
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>标准差 σ</span>
              <span className="text-sm font-mono px-2 py-0.5 rounded" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>{sigma.toFixed(1)}</span>
            </div>
            <input type="range" min="0.5" max="3" step="0.1" value={sigma} onChange={e => setSigma(+e.target.value)} className="w-full" style={{ accentColor: CHAPTER_COLOR }} />
          </div>
        </div>
      ) : (
        <div className="mb-6">
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>速率参数 λ</span>
            <span className="text-sm font-mono px-2 py-0.5 rounded" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>{expLambda.toFixed(1)}</span>
          </div>
          <input type="range" min="0.5" max="5" step="0.1" value={expLambda} onChange={e => setExpLambda(+e.target.value)} className="w-full" style={{ accentColor: CHAPTER_COLOR }} />
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <div>
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>区间下限 a</span>
            <span className="text-sm font-mono px-2 py-0.5 rounded" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>{rangeA.toFixed(1)}</span>
          </div>
          <input type="range" min={mode === 'normal' ? mu - 4 * sigma : 0} max={mode === 'normal' ? mu + 4 * sigma : 5 / expLambda} step="0.1" value={rangeA} onChange={e => setRangeA(+e.target.value)} className="w-full" style={{ accentColor: CHAPTER_COLOR }} />
        </div>
        <div>
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>区间上限 b</span>
            <span className="text-sm font-mono px-2 py-0.5 rounded" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>{rangeB.toFixed(1)}</span>
          </div>
          <input type="range" min={mode === 'normal' ? mu - 4 * sigma : 0} max={mode === 'normal' ? mu + 4 * sigma : 5 / expLambda} step="0.1" value={rangeB} onChange={e => setRangeB(+e.target.value)} className="w-full" style={{ accentColor: CHAPTER_COLOR }} />
        </div>
      </div>

      <div className="p-4 rounded-lg text-center mb-6" style={{ background: CHAPTER_COLOR + '15' }}>
        <div className="text-xl font-semibold mb-1" style={{ color: CHAPTER_COLOR }}>P({rangeA.toFixed(1)} &le; X &le; {rangeB.toFixed(1)}) = {(prob * 100).toFixed(2)}%</div>
        <div className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>阴影面积对应的概率值</div>
      </div>

      <div className="rounded-xl p-4" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
        <svg ref={svgRef} viewBox={`0 0 ${dimensions.width} ${dimensions.height}`} style={{ width: '100%', height: 'auto' }} />
      </div>
      <p className="mt-4 text-[12px] text-center" style={{ color: 'var(--text-tertiary)' }}>
        拖动 a、b 滑块选择区间，阴影面积即为该区间的概率
      </p>
    </div>
  )
}

// ============================================
// 3. Central Limit Theorem
// ============================================
function CLTVisualization() {
  const [sourceDist, setSourceDist] = useState<'uniform' | 'exponential' | 'bimodal'>('uniform')
  const [sampleSize, setSampleSize] = useState(30)
  const [means, setMeans] = useState<number[]>([])
  const svgRef = useRef<SVGSVGElement>(null)
  const { containerRef, dimensions } = useResponsiveSVG(600, 300)

  const drawOneSample = (): number => {
    let vals: number[] = []
    for (let i = 0; i < sampleSize; i++) {
      if (sourceDist === 'uniform') vals.push(Math.random() * 10)
      else if (sourceDist === 'exponential') vals.push(-Math.log(Math.random()) * 2)
      else vals.push(Math.random() < 0.5 ? 2 + Math.random() * 1.5 : 7 + Math.random() * 1.5)
    }
    return vals.reduce((a, b) => a + b, 0) / vals.length
  }

  const drawSamples = (count: number) => {
    const newMeans = [...means]
    for (let i = 0; i < count; i++) newMeans.push(drawOneSample())
    setMeans(newMeans)
  }

  useEffect(() => {
    if (!svgRef.current) return
    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const { width, height } = dimensions
    const margin = { top: 20, right: 30, bottom: 50, left: 60 }
    const cw = width - margin.left - margin.right
    const ch = height - margin.top - margin.bottom
    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`)

    if (means.length === 0) {
      g.append('text').attr('x', cw / 2).attr('y', ch / 2)
        .attr('text-anchor', 'middle').attr('fill', AXIS_COLOR).style('font-size', '13px')
        .text('点击按钮开始抽样')
      return
    }

    const popMean = sourceDist === 'uniform' ? 5 : sourceDist === 'exponential' ? 2 : 4.75
    const popVar = sourceDist === 'uniform' ? 100 / 12 : sourceDist === 'exponential' ? 4 : 7.5
    const theoMean = popMean
    const theoSD = Math.sqrt(popVar / sampleSize)

    const extent = d3.extent(means) as [number, number]
    const pad = (extent[1] - extent[0]) * 0.15 || 1
    const xMin = Math.min(extent[0] - pad, theoMean - 4 * theoSD)
    const xMax = Math.max(extent[1] + pad, theoMean + 4 * theoSD)

    const xScale = d3.scaleLinear().domain([xMin, xMax]).range([0, cw])
    const numBins = Math.min(40, Math.max(10, Math.ceil(Math.sqrt(means.length))))
    const bins = d3.bin().domain([xMin, xMax]).thresholds(numBins)(means)
    const yMax = d3.max(bins, b => b.length) || 1
    const yScale = d3.scaleLinear().domain([0, yMax * 1.2]).range([ch, 0])

    // Grid
    g.append('g').call(d3.axisLeft(yScale).ticks(5).tickSize(-cw).tickFormat(() => ''))
      .selectAll('line').attr('stroke', GRID_COLOR).attr('stroke-dasharray', '2,2')

    // Axes
    g.append('g').attr('transform', `translate(0,${ch})`).call(d3.axisBottom(xScale).ticks(8))
      .selectAll('text').attr('fill', AXIS_COLOR).style('font-size', '11px')
    g.append('g').call(d3.axisLeft(yScale).ticks(5))
      .selectAll('text').attr('fill', AXIS_COLOR).style('font-size', '11px')
    g.selectAll('.domain').attr('stroke', 'var(--border)')

    // Histogram bars
    g.selectAll('.bar').data(bins).enter().append('rect')
      .attr('x', d => xScale(d.x0 ?? 0))
      .attr('y', d => yScale(d.length))
      .attr('width', d => Math.max(0, xScale(d.x1 ?? 0) - xScale(d.x0 ?? 0) - 1))
      .attr('height', d => ch - yScale(d.length))
      .attr('fill', CHAPTER_COLOR)
      .attr('opacity', 0.6)
      .attr('rx', 1)

    // Theoretical normal curve overlay
    if (means.length >= 10) {
      const binWidth = (xMax - xMin) / numBins
      const normalData: { x: number; y: number }[] = []
      for (let x = xMin; x <= xMax; x += (xMax - xMin) / 200) {
        const density = normalPDF(x, theoMean, theoSD) * means.length * binWidth
        normalData.push({ x, y: density })
      }
      const line = d3.line<{ x: number; y: number }>().x(d => xScale(d.x)).y(d => yScale(d.y)).curve(d3.curveBasis)
      g.append('path').datum(normalData).attr('fill', 'none').attr('stroke', '#c9a962').attr('stroke-width', 2.5).attr('stroke-dasharray', '6,3').attr('d', line)
    }

    g.append('text').attr('x', cw / 2).attr('y', ch + 40)
      .attr('text-anchor', 'middle').attr('fill', AXIS_COLOR).style('font-size', '11px').text('样本均值')
    g.append('text').attr('transform', 'rotate(-90)').attr('y', -45).attr('x', -ch / 2)
      .attr('text-anchor', 'middle').attr('fill', AXIS_COLOR).style('font-size', '11px').text('频数')
  }, [means, dimensions, sourceDist, sampleSize])

  const sampleMean = means.length > 0 ? (means.reduce((a, b) => a + b, 0) / means.length).toFixed(3) : '--'
  const sampleSD = means.length > 1
    ? Math.sqrt(means.reduce((a, b) => a + (b - means.reduce((s, v) => s + v, 0) / means.length) ** 2, 0) / (means.length - 1)).toFixed(3)
    : '--'

  return (
    <div ref={containerRef}>
      <div className="flex flex-wrap gap-2 mb-4">
        {(['uniform', 'exponential', 'bimodal'] as const).map(d => (
          <button key={d} onClick={() => { setSourceDist(d); setMeans([]) }}
            className="px-4 py-2 rounded-lg text-[13px] font-medium transition-all"
            style={{ background: sourceDist === d ? CHAPTER_COLOR : 'var(--bg-surface)', color: sourceDist === d ? '#fff' : 'var(--text-primary)', border: `1px solid ${sourceDist === d ? CHAPTER_COLOR : 'var(--border)'}` }}>
            {d === 'uniform' ? '均匀分布' : d === 'exponential' ? '指数分布' : '双峰分布'}
          </button>
        ))}
      </div>

      <div className="mb-6">
        <div className="flex justify-between mb-2">
          <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>每次样本量 n</span>
          <span className="text-sm font-mono px-2 py-0.5 rounded" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>{sampleSize}</span>
        </div>
        <input type="range" min="1" max="100" value={sampleSize}
          onChange={e => { setSampleSize(+e.target.value); setMeans([]) }}
          className="w-full" style={{ accentColor: CHAPTER_COLOR }} />
        <div className="flex justify-between text-[11px] mt-1" style={{ color: 'var(--text-tertiary)' }}>
          <span>1</span><span>5</span><span>10</span><span>30</span><span>100</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <button onClick={() => drawSamples(1)}
          className="px-5 py-2 rounded-lg font-medium text-[13px] transition-all hover:brightness-110 text-white"
          style={{ background: CHAPTER_COLOR }}>
          抽 1 次
        </button>
        <button onClick={() => drawSamples(100)}
          className="px-5 py-2 rounded-lg font-medium text-[13px] transition-all hover:brightness-110 text-white"
          style={{ background: CHAPTER_COLOR }}>
          抽 100 次
        </button>
        <button onClick={() => drawSamples(1000)}
          className="px-5 py-2 rounded-lg font-medium text-[13px] transition-all hover:brightness-110 text-white"
          style={{ background: CHAPTER_COLOR }}>
          抽 1000 次
        </button>
        <button onClick={() => setMeans([])}
          className="px-3 py-2 rounded-lg text-sm transition-all"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
          <RotateCcw size={15} />
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: '抽样次数', value: means.length.toLocaleString() },
          { label: '样本均值的均值', value: sampleMean },
          { label: '样本均值的标准差', value: sampleSD },
        ].map((s, i) => (
          <div key={i} className="p-4 rounded-lg text-center" style={{ background: 'var(--bg-secondary)' }}>
            <div className="text-xl font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>{s.value}</div>
            <div className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div className="rounded-xl p-4" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
        <svg ref={svgRef} viewBox={`0 0 ${dimensions.width} ${dimensions.height}`} style={{ width: '100%', height: 'auto' }} />
      </div>
      <p className="mt-4 text-[12px] text-center" style={{ color: 'var(--text-tertiary)' }}>
        金色虚线为理论正态曲线。增大样本量 n 或抽样次数，观察直方图向正态分布收敛。
      </p>
    </div>
  )
}

// ============================================
// 4. Legal Case: Recidivism
// ============================================
function RecidivismCase() {
  const [lambda, setLambda] = useState(1.5)

  const p0 = poissonPMF(0, lambda)
  const p1 = poissonPMF(1, lambda)
  const pGe2 = 1 - p0 - p1

  return (
    <LegalCaseCard title="法学案例：再犯率统计建模" color={CHAPTER_COLOR}>
      <p className="leading-relaxed mb-6" style={{ color: 'var(--text-secondary)' }}>
        假释委员会需要评估罪犯释放后的再犯风险。研究表明，某类犯罪人群每年再犯事件数近似服从泊松分布。
        通过调整参数 λ（预期年均再犯次数），可以估算不同再犯情况的概率。
      </p>

      <div className="mb-6">
        <div className="flex justify-between mb-2">
          <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>预期年均再犯次数 λ</span>
          <span className="text-sm font-mono px-2 py-0.5 rounded" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>{lambda.toFixed(1)}</span>
        </div>
        <input type="range" min="0.1" max="5" step="0.1" value={lambda} onChange={e => setLambda(+e.target.value)} className="w-full" style={{ accentColor: CHAPTER_COLOR }} />
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="p-4 rounded-lg text-center" style={{ background: 'var(--bg-secondary)' }}>
          <div className="text-xl font-semibold mb-1" style={{ color: '#047857' }}>{(p0 * 100).toFixed(1)}%</div>
          <div className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>P(X=0) 无再犯</div>
        </div>
        <div className="p-4 rounded-lg text-center" style={{ background: 'var(--bg-secondary)' }}>
          <div className="text-xl font-semibold mb-1" style={{ color: '#b45309' }}>{(p1 * 100).toFixed(1)}%</div>
          <div className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>P(X=1) 再犯1次</div>
        </div>
        <div className="p-4 rounded-lg text-center" style={{ background: CHAPTER_COLOR + '15' }}>
          <div className="text-xl font-semibold mb-1" style={{ color: '#dc2626' }}>{(pGe2 * 100).toFixed(1)}%</div>
          <div className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>P(X&ge;2) 多次再犯</div>
        </div>
      </div>

      <div className="p-5 rounded-xl mb-6" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
        <h4 className="font-semibold mb-3 text-sm" style={{ color: 'var(--text-primary)' }}>模型的意义与局限</h4>
        <div className="space-y-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
          <p>
            <strong>对假释决策的启示：</strong>当 λ = {lambda.toFixed(1)} 时，该群体中约 {(p0 * 100).toFixed(0)}% 的人在一年内不会再犯。
            这意味着即使群体整体风险较高，仍有相当比例的个体不会再犯。
          </p>
          <p>
            <strong>量刑指南的参考：</strong>泊松模型可帮助量化不同犯罪类型的再犯风险，
            为比例原则提供定量依据。
          </p>
        </div>
      </div>

      <div className="p-4 rounded-xl flex items-start gap-3" style={{ background: `${CHAPTER_COLOR}10`, border: `1px solid ${CHAPTER_COLOR}30` }}>
        <div>
          <strong style={{ color: 'var(--text-primary)' }}>核心洞察 -- 个体预测与群体建模的鸿沟：</strong>
          <span style={{ color: 'var(--text-secondary)' }}>
            泊松模型描述的是<em>群体层面</em>的统计规律，而非对特定个体的精确预测。
            将群体再犯率直接应用于个体假释决策，可能导致对低风险个体的过度惩罚，
            或对高风险个体的低估。概率分布告诉我们"平均如何"，但每个人的命运不是一个统计量。
          </span>
        </div>
      </div>
    </LegalCaseCard>
  )
}

// ============================================
// Main page
// ============================================
export default function Chapter3Page() {
  return (
    <div className="min-h-screen">
      <ChapterHeader
        chapterNumber={3}
        title="概率分布"
        subtitle="Probability Distributions"
        description="从离散到连续，从特殊到一般 -- 理解数据背后的概率模型，以及中心极限定理为何奠定统计推断的基础"
        color={CHAPTER_COLOR}
      />

      <div className="max-w-4xl mx-auto px-4 md:px-6 py-12 md:py-16">
        <SectionIntro
          chapterColor={CHAPTER_COLOR}
          prerequisites={['第1-2章概率基础（样本空间、条件概率、随机变量）']}
          learningGoals={[
            '理解离散分布（二项分布、泊松分布）的概率质量函数',
            '掌握连续分布（正态分布、指数分布）的概率密度函数',
            '通过交互实验验证中心极限定理',
            '了解概率分布在法律实证研究中的应用',
          ]}
          overview={
            <>
              <p className="mb-3">本章系统介绍最常用的概率分布模型。我们从<strong>离散分布</strong>开始，学习二项分布和泊松分布；然后过渡到<strong>连续分布</strong>，掌握正态分布和指数分布。</p>
              <p>最后，我们通过交互实验深入理解<strong>中心极限定理</strong> -- 这一定理解释了为何正态分布在统计学中无处不在。</p>
            </>
          }
        />

        <BeginnerExplanation title="初学者指南">
          <div className="space-y-4">
            <p><strong>概率分布</strong>描述了随机变量所有可能取值及其对应概率的完整图景。</p>
            <p><strong>离散分布</strong>用于计数型数据（如犯罪次数、投票人数），每个值有确定的概率。</p>
            <p><strong>连续分布</strong>用于度量型数据（如时间、温度），概率用密度函数和面积表示。</p>
            <p><strong>中心极限定理</strong>告诉我们：无论原始数据服从什么分布，样本均值的分布在样本量足够大时都近似正态分布。</p>
          </div>
        </BeginnerExplanation>

        <ScrollReveal>
          <h2 className="text-2xl font-bold mb-6 pt-4" style={{ color: 'var(--text-primary)' }}>离散概率分布</h2>
          <p className="leading-relaxed mb-6" style={{ color: 'var(--text-secondary)' }}>
            离散随机变量的概率质量函数（PMF）给出每个取值的概率。二项分布描述固定次数独立试验中成功的次数，
            泊松分布描述单位时间或空间内稀有事件的发生次数。
          </p>
        </ScrollReveal>

        <FormulaBox
          title="二项分布 PMF"
          latex="P(X = k) = C(n, k) * p^k * (1 - p)^(n - k)"
          explanation={<p>n 次独立试验中恰好成功 k 次的概率。均值 = np，方差 = np(1-p)。</p>}
        />

        <ExperimentContainer title="交互实验：离散分布" description="切换分布类型，调整参数，观察概率质量函数的变化">
          <LazyVisualization><DiscreteDistributionViz /></LazyVisualization>
        </ExperimentContainer>

        <ScrollReveal>
          <h2 className="text-2xl font-bold mb-6 pt-4" style={{ color: 'var(--text-primary)' }}>连续概率分布</h2>
          <p className="leading-relaxed mb-6" style={{ color: 'var(--text-secondary)' }}>
            连续随机变量的概率密度函数（PDF）描述取值的相对可能性。
            概率由密度曲线下的面积给出，而非单个点的值。正态分布（钟形曲线）是最重要的连续分布。
          </p>
        </ScrollReveal>

        <FormulaBox
          title="正态分布 PDF"
          latex="f(x) = (1 / sqrt(2 * pi * sigma^2)) * exp(-(x - mu)^2 / (2 * sigma^2))"
          explanation={<p>正态分布由均值 μ 和标准差 σ 两个参数完全确定。约 68% 的数据落在 μ ± σ 内，95% 在 μ ± 2σ 内。</p>}
        />

        <ExperimentContainer title="交互实验：连续分布" description="调整参数，选择区间计算概率，可叠加 CDF 曲线">
          <LazyVisualization><ContinuousDistributionViz /></LazyVisualization>
        </ExperimentContainer>

        <ScrollReveal>
          <h2 className="text-2xl font-bold mb-6 pt-4" style={{ color: 'var(--text-primary)' }}>中心极限定理</h2>
          <p className="leading-relaxed mb-6" style={{ color: 'var(--text-secondary)' }}>
            中心极限定理（CLT）是统计学的基石：无论总体分布是什么形状，
            当样本量 n 足够大时，样本均值的分布都近似于正态分布。
            这解释了为什么正态分布在实践中如此普遍，也为统计推断提供了理论基础。
          </p>
        </ScrollReveal>

        <FormulaBox
          title="中心极限定理"
          latex="sqrt(n) * (X_bar - mu) / sigma  -->  N(0, 1)  (n -> infinity)"
          explanation={
            <p>
              设 X₁, X₂, ..., Xₙ 是独立同分布的随机变量，均值 μ，方差 σ²。
              当 n 足够大时，样本均值的标准化量近似服从标准正态分布 N(0,1)。
            </p>
          }
        />

        <ExperimentContainer title="交互实验：中心极限定理" description="选择不同的源分布，调整样本量，观察样本均值的分布如何收敛到正态">
          <LazyVisualization><CLTVisualization /></LazyVisualization>
          <div className="mt-6">
            <Checkpoint type="try">
              <div className="space-y-3">
                <p className="font-medium">实验任务：</p>
                <ol className="list-decimal list-inside space-y-2 pl-2">
                  <li>选择"指数分布"（明显偏态），样本量设为 1，抽 1000 次 -- 观察直方图形状</li>
                  <li>将样本量改为 30，再抽 1000 次 -- 观察直方图是否变得更对称</li>
                  <li>切换到"双峰分布"，重复上述步骤，验证 CLT 的普适性</li>
                </ol>
              </div>
            </Checkpoint>
          </div>
        </ExperimentContainer>

        <LazyVisualization><RecidivismCase /></LazyVisualization>

        <Checkpoint type="think">
          <div className="space-y-3">
            <p className="font-medium">思考问题：</p>
            <p>中心极限定理为什么对统计推断如此重要？如果没有 CLT，我们在进行假设检验或构建置信区间时会面临什么困难？</p>
            <p className="text-[12px]" style={{ color: 'var(--text-tertiary)' }}>
              提示：想想我们在不知道总体分布形态的情况下，如何能对总体均值做出推断。
            </p>
          </div>
        </Checkpoint>

        <SectionOutro
          keyPoints={[
            '二项分布描述 n 次独立试验中的成功次数，泊松分布描述稀有事件的发生次数',
            '正态分布由 μ 和 σ 完全确定，是最重要的连续分布',
            '连续分布的概率由密度曲线下的面积（积分）给出，而非单点的值',
            '中心极限定理：样本均值的分布在 n 足够大时近似正态，与总体分布形态无关',
          ]}
          question="某社区每年发生的盗窃案件数近似服从泊松分布，λ = 3。请计算一年内发生 5 起或更多盗窃案件的概率。"
          hint="P(X >= 5) = 1 - P(X=0) - P(X=1) - P(X=2) - P(X=3) - P(X=4) ≈ 1 - 0.0498 - 0.1494 - 0.2240 - 0.2240 - 0.1680 = 0.1848，约 18.5%。"
          nextChapter={{ title: '频率学派推断', description: '从样本到总体：假设检验与置信区间', link: '/theory/chapter4' }}
        />

        <ChapterNav currentChapter={3} />
      </div>
    </div>
  )
}
