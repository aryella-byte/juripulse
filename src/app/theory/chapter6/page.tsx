'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { RotateCcw } from 'lucide-react'
import * as d3 from 'd3'
import {
  ChapterHeader, BeginnerExplanation, FormulaBox, Checkpoint,
  SectionIntro, SectionOutro, LegalCaseCard, ExperimentContainer,
  useResponsiveSVG, ChapterNav, ScrollReveal
} from '@/components/theory-components'

const CHAPTER_COLOR = '#553c9a'
const AXIS_COLOR = '#8a8a8a'
const GRID_COLOR = 'rgba(0,0,0,0.04)'

// ============================================
// OLS helpers
// ============================================
function computeOLS(points: { x: number; y: number }[]) {
  const n = points.length
  if (n < 2) return { b0: 0, b1: 0, r2: 0 }
  const xMean = d3.mean(points, d => d.x) || 0
  const yMean = d3.mean(points, d => d.y) || 0
  let num = 0, den = 0, ssTot = 0
  for (const p of points) {
    num += (p.x - xMean) * (p.y - yMean)
    den += (p.x - xMean) ** 2
    ssTot += (p.y - yMean) ** 2
  }
  const b1 = den === 0 ? 0 : num / den
  const b0 = yMean - b1 * xMean
  let ssRes = 0
  for (const p of points) ssRes += (p.y - (b0 + b1 * p.x)) ** 2
  const r2 = ssTot === 0 ? 0 : 1 - ssRes / ssTot
  return { b0, b1, r2 }
}

function generateRandomData(n: number, seed?: number): { x: number; y: number }[] {
  const pts: { x: number; y: number }[] = []
  const baseSlope = 0.6 + Math.random() * 0.8
  const baseIntercept = 10 + Math.random() * 30
  for (let i = 0; i < n; i++) {
    const x = 5 + Math.random() * 90
    const noise = (Math.random() - 0.5) * 30
    const y = baseIntercept + baseSlope * x + noise
    pts.push({ x, y: Math.max(0, Math.min(100, y)) })
  }
  return pts
}

// ============================================
// Simple Linear Regression Visualization
// ============================================
function SimpleRegressionViz() {
  const [points, setPoints] = useState<{ x: number; y: number }[]>(() => generateRandomData(20))
  const [showResiduals, setShowResiduals] = useState(false)
  const [dragIdx, setDragIdx] = useState<number | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const { containerRef, dimensions } = useResponsiveSVG(600, 400)

  const { b0, b1, r2 } = computeOLS(points)

  const margin = { top: 20, right: 30, bottom: 50, left: 60 }

  const draw = useCallback(() => {
    if (!svgRef.current) return
    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const width = dimensions.width - margin.left - margin.right
    const height = dimensions.height - margin.top - margin.bottom
    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`)

    const xScale = d3.scaleLinear().domain([0, 100]).range([0, width])
    const yScale = d3.scaleLinear().domain([0, 100]).range([height, 0])

    // Grid lines
    g.selectAll('.gridX').data(xScale.ticks(10)).enter().append('line')
      .attr('x1', d => xScale(d)).attr('x2', d => xScale(d)).attr('y1', 0).attr('y2', height)
      .attr('stroke', GRID_COLOR)
    g.selectAll('.gridY').data(yScale.ticks(10)).enter().append('line')
      .attr('x1', 0).attr('x2', width).attr('y1', d => yScale(d)).attr('y2', d => yScale(d))
      .attr('stroke', GRID_COLOR)

    // Residual lines
    if (showResiduals) {
      points.forEach(p => {
        const predicted = b0 + b1 * p.x
        g.append('line')
          .attr('x1', xScale(p.x)).attr('x2', xScale(p.x))
          .attr('y1', yScale(p.y)).attr('y2', yScale(predicted))
          .attr('stroke', '#ef4444').attr('stroke-width', 1).attr('stroke-dasharray', '3,3').attr('opacity', 0.6)
      })
    }

    // Regression line
    const x0 = 0, x1End = 100
    g.append('line')
      .attr('x1', xScale(x0)).attr('y1', yScale(b0 + b1 * x0))
      .attr('x2', xScale(x1End)).attr('y2', yScale(b0 + b1 * x1End))
      .attr('stroke', 'var(--navy)').attr('stroke-width', 2.5)

    // Points
    points.forEach((p, i) => {
      g.append('circle')
        .attr('cx', xScale(p.x)).attr('cy', yScale(p.y)).attr('r', 6)
        .attr('fill', CHAPTER_COLOR).attr('stroke', '#fff').attr('stroke-width', 1.5)
        .attr('cursor', 'grab').attr('opacity', 0.85)
    })

    // Axes
    g.append('g').attr('transform', `translate(0,${height})`).call(d3.axisBottom(xScale).ticks(10))
      .selectAll('text').attr('fill', AXIS_COLOR).style('font-size', '11px')
    g.append('g').call(d3.axisLeft(yScale).ticks(10))
      .selectAll('text').attr('fill', AXIS_COLOR).style('font-size', '11px')
    g.selectAll('.domain').attr('stroke', AXIS_COLOR)

    g.append('text').attr('x', width / 2).attr('y', height + 40).attr('text-anchor', 'middle')
      .attr('fill', AXIS_COLOR).attr('font-size', '11px').text('X')
    g.append('text').attr('x', -height / 2).attr('y', -45).attr('text-anchor', 'middle')
      .attr('transform', 'rotate(-90)').attr('fill', AXIS_COLOR).attr('font-size', '11px').text('Y')
  }, [points, showResiduals, dimensions, b0, b1])

  useEffect(() => { draw() }, [draw])

  const handleSvgClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return
    const rect = svgRef.current.getBoundingClientRect()
    const width = dimensions.width - margin.left - margin.right
    const height = dimensions.height - margin.top - margin.bottom
    const mx = e.clientX - rect.left - margin.left
    const my = e.clientY - rect.top - margin.top
    const xScale = d3.scaleLinear().domain([0, 100]).range([0, width])
    const yScale = d3.scaleLinear().domain([0, 100]).range([height, 0])
    const x = xScale.invert(mx)
    const y = yScale.invert(my)
    if (x >= 0 && x <= 100 && y >= 0 && y <= 100) {
      setPoints(prev => [...prev, { x, y }])
    }
  }

  const handleSvgMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return
    const rect = svgRef.current.getBoundingClientRect()
    const width = dimensions.width - margin.left - margin.right
    const height = dimensions.height - margin.top - margin.bottom
    const mx = e.clientX - rect.left - margin.left
    const my = e.clientY - rect.top - margin.top
    const xScale = d3.scaleLinear().domain([0, 100]).range([0, width])
    const yScale = d3.scaleLinear().domain([0, 100]).range([height, 0])

    let closestIdx = -1, closestDist = Infinity
    points.forEach((p, i) => {
      const dist = Math.sqrt((xScale(p.x) - mx) ** 2 + (yScale(p.y) - my) ** 2)
      if (dist < closestDist) { closestDist = dist; closestIdx = i }
    })
    if (closestDist < 15) {
      e.preventDefault()
      setDragIdx(closestIdx)
    }
  }

  const handleSvgMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (dragIdx === null || !svgRef.current) return
    const rect = svgRef.current.getBoundingClientRect()
    const width = dimensions.width - margin.left - margin.right
    const height = dimensions.height - margin.top - margin.bottom
    const mx = e.clientX - rect.left - margin.left
    const my = e.clientY - rect.top - margin.top
    const xScale = d3.scaleLinear().domain([0, 100]).range([0, width])
    const yScale = d3.scaleLinear().domain([0, 100]).range([height, 0])
    const x = Math.max(0, Math.min(100, xScale.invert(mx)))
    const y = Math.max(0, Math.min(100, yScale.invert(my)))
    setPoints(prev => prev.map((p, i) => i === dragIdx ? { x, y } : p))
  }

  const handleSvgMouseUp = () => { setDragIdx(null) }

  return (
    <div>
      <div ref={containerRef} className="rounded-lg mb-4" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
        <svg ref={svgRef} width={dimensions.width} height={dimensions.height}
          onClick={dragIdx === null ? handleSvgClick : undefined}
          onMouseDown={handleSvgMouseDown}
          onMouseMove={handleSvgMouseMove}
          onMouseUp={handleSvgMouseUp}
          onMouseLeave={handleSvgMouseUp}
          style={{ cursor: dragIdx !== null ? 'grabbing' : 'crosshair' }} />
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <button onClick={() => setShowResiduals(!showResiduals)}
          style={showResiduals
            ? { background: CHAPTER_COLOR, color: '#fff' }
            : { background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
          className="px-4 py-2 rounded-lg text-[13px] font-medium">
          {showResiduals ? '隐藏残差' : '显示残差'}
        </button>
        <button onClick={() => setPoints(generateRandomData(20))}
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
          className="px-4 py-2 rounded-lg text-[13px] font-medium flex items-center gap-1">
          <RotateCcw size={14} /> 生成新数据
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { v: b1.toFixed(3), l: '斜率 (β₁)' },
          { v: b0.toFixed(2), l: '截距 (β₀)' },
          { v: r2.toFixed(4), l: 'R²' },
        ].map(s => (
          <div key={s.l} className="text-center p-3 rounded-lg" style={{ background: 'var(--bg-secondary)' }}>
            <div className="text-base font-semibold font-mono" style={{ color: 'var(--text-primary)' }}>{s.v}</div>
            <div className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>{s.l}</div>
          </div>
        ))}
      </div>
      <p className="mt-3 text-[12px] text-center" style={{ color: 'var(--text-tertiary)' }}>
        点击空白区域添加点 | 拖拽已有点观察回归线实时变化 | 共 {points.length} 个数据点
      </p>
    </div>
  )
}

// ============================================
// Residual Analysis Visualization
// ============================================
function ResidualAnalysisViz() {
  type PatternKey = 'random' | 'funnel' | 'curve'
  const [pattern, setPattern] = useState<PatternKey>('random')
  const svgRef = useRef<SVGSVGElement>(null)
  const histRef = useRef<SVGSVGElement>(null)
  const { containerRef, dimensions } = useResponsiveSVG(600, 300)

  const generatePattern = useCallback((pat: PatternKey) => {
    const pts: { x: number; fitted: number; residual: number }[] = []
    for (let i = 0; i < 40; i++) {
      const x = 5 + Math.random() * 90
      const fitted = 20 + 0.6 * x
      let residual: number
      if (pat === 'random') {
        residual = (Math.random() - 0.5) * 20
      } else if (pat === 'funnel') {
        residual = (Math.random() - 0.5) * (x * 0.4)
      } else {
        residual = 0.005 * (x - 50) ** 2 - 5 + (Math.random() - 0.5) * 6
      }
      pts.push({ x, fitted, residual })
    }
    return pts
  }, [])

  const [data, setData] = useState(() => generatePattern('random'))

  useEffect(() => {
    setData(generatePattern(pattern))
  }, [pattern, generatePattern])

  useEffect(() => {
    if (!svgRef.current) return
    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const margin = { top: 20, right: 30, bottom: 50, left: 60 }
    const width = dimensions.width - margin.left - margin.right
    const height = dimensions.height - margin.top - margin.bottom
    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`)

    const xExtent = d3.extent(data, d => d.fitted) as [number, number]
    const yMax = d3.max(data, d => Math.abs(d.residual)) || 10
    const xScale = d3.scaleLinear().domain([xExtent[0] - 5, xExtent[1] + 5]).range([0, width])
    const yScale = d3.scaleLinear().domain([-yMax * 1.3, yMax * 1.3]).range([height, 0])

    // Grid
    g.selectAll('.gridY').data(yScale.ticks(8)).enter().append('line')
      .attr('x1', 0).attr('x2', width).attr('y1', d => yScale(d)).attr('y2', d => yScale(d))
      .attr('stroke', GRID_COLOR)

    // Zero line
    g.append('line').attr('x1', 0).attr('x2', width).attr('y1', yScale(0)).attr('y2', yScale(0))
      .attr('stroke', AXIS_COLOR).attr('stroke-dasharray', '5,5').attr('opacity', 0.6)

    // Points
    data.forEach(d => {
      g.append('circle').attr('cx', xScale(d.fitted)).attr('cy', yScale(d.residual))
        .attr('r', 5).attr('fill', CHAPTER_COLOR).attr('opacity', 0.7).attr('stroke', '#fff').attr('stroke-width', 1)
    })

    // Axes
    g.append('g').attr('transform', `translate(0,${height})`).call(d3.axisBottom(xScale).ticks(8))
      .selectAll('text').attr('fill', AXIS_COLOR).style('font-size', '11px')
    g.append('g').call(d3.axisLeft(yScale).ticks(8))
      .selectAll('text').attr('fill', AXIS_COLOR).style('font-size', '11px')
    g.selectAll('.domain').attr('stroke', AXIS_COLOR)

    g.append('text').attr('x', width / 2).attr('y', height + 40).attr('text-anchor', 'middle')
      .attr('fill', AXIS_COLOR).attr('font-size', '11px').text('拟合值 (ŷ)')
    g.append('text').attr('x', -height / 2).attr('y', -45).attr('text-anchor', 'middle')
      .attr('transform', 'rotate(-90)').attr('fill', AXIS_COLOR).attr('font-size', '11px').text('残差 (e)')
  }, [data, dimensions])

  // Histogram
  useEffect(() => {
    if (!histRef.current) return
    const svg = d3.select(histRef.current)
    svg.selectAll('*').remove()

    const margin = { top: 15, right: 20, bottom: 40, left: 50 }
    const width = 280 - margin.left - margin.right
    const height = 200 - margin.top - margin.bottom
    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`)

    const residuals = data.map(d => d.residual)
    const xExtent = d3.extent(residuals) as [number, number]
    const xScale = d3.scaleLinear().domain([xExtent[0] - 2, xExtent[1] + 2]).range([0, width])
    const bins = d3.bin().domain(xScale.domain() as [number, number]).thresholds(12)(residuals)
    const yScale = d3.scaleLinear().domain([0, d3.max(bins, d => d.length) || 1]).range([height, 0])

    bins.forEach(bin => {
      g.append('rect')
        .attr('x', xScale(bin.x0!)).attr('y', yScale(bin.length))
        .attr('width', Math.max(0, xScale(bin.x1!) - xScale(bin.x0!) - 1))
        .attr('height', height - yScale(bin.length))
        .attr('fill', CHAPTER_COLOR).attr('opacity', 0.6).attr('rx', 2)
    })

    g.append('g').attr('transform', `translate(0,${height})`).call(d3.axisBottom(xScale).ticks(5))
      .selectAll('text').attr('fill', AXIS_COLOR).style('font-size', '10px')
    g.append('g').call(d3.axisLeft(yScale).ticks(4))
      .selectAll('text').attr('fill', AXIS_COLOR).style('font-size', '10px')
    g.selectAll('.domain').attr('stroke', AXIS_COLOR)
    g.append('text').attr('x', width / 2).attr('y', height + 32).attr('text-anchor', 'middle')
      .attr('fill', AXIS_COLOR).attr('font-size', '10px').text('残差值')
  }, [data])

  const patternLabels: Record<PatternKey, { label: string; desc: string }> = {
    random: { label: '随机分布', desc: '残差随机分散，模型拟合良好' },
    funnel: { label: '漏斗形', desc: '异方差性 — 方差随拟合值增大' },
    curve: { label: '曲线形', desc: '非线性关系 — 需要高次项或变换' },
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-4">
        {(Object.keys(patternLabels) as PatternKey[]).map(key => (
          <button key={key} onClick={() => setPattern(key)}
            style={pattern === key
              ? { background: CHAPTER_COLOR, color: '#fff' }
              : { background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
            className="px-4 py-2 rounded-lg text-[13px] font-medium">
            {patternLabels[key].label}
          </button>
        ))}
      </div>

      <div className="rounded-lg p-3 mb-3" style={{ background: `${CHAPTER_COLOR}10`, border: `1px solid ${CHAPTER_COLOR}30` }}>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          <strong style={{ color: 'var(--text-primary)' }}>{patternLabels[pattern].label}：</strong>
          {patternLabels[pattern].desc}
        </p>
      </div>

      <div className="grid md:grid-cols-[1fr_280px] gap-4">
        <div ref={containerRef} className="rounded-lg" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
          <svg ref={svgRef} width={dimensions.width} height={dimensions.height} />
        </div>
        <div className="rounded-lg p-2" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
          <p className="text-[11px] text-center mb-1" style={{ color: 'var(--text-tertiary)' }}>残差直方图</p>
          <svg ref={histRef} viewBox="0 0 280 200" style={{ width: '100%', height: 'auto' }} />
        </div>
      </div>
    </div>
  )
}

// ============================================
// Multiple Regression Heatmap
// ============================================
function MultipleRegressionViz() {
  const [coefX1, setCoefX1] = useState(3.0)
  const [coefX2, setCoefX2] = useState(2.0)
  const [intercept] = useState(10)
  const svgRef = useRef<SVGSVGElement>(null)
  const { containerRef, dimensions } = useResponsiveSVG(500, 400)

  const r2Base = 0.72
  const r2 = Math.min(0.99, r2Base + Math.abs(coefX1 - 3) * 0.02 + Math.abs(coefX2 - 2) * 0.03)

  useEffect(() => {
    if (!svgRef.current) return
    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const margin = { top: 20, right: 80, bottom: 50, left: 60 }
    const width = dimensions.width - margin.left - margin.right
    const height = dimensions.height - margin.top - margin.bottom
    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`)

    const gridSize = 30
    const xScale = d3.scaleLinear().domain([0, 10]).range([0, width])
    const yScale = d3.scaleLinear().domain([0, 10]).range([height, 0])

    const vals: number[] = []
    for (let xi = 0; xi <= 10; xi += 10 / gridSize) {
      for (let yi = 0; yi <= 10; yi += 10 / gridSize) {
        vals.push(intercept + coefX1 * xi + coefX2 * yi)
      }
    }
    const vMin = d3.min(vals) || 0
    const vMax = d3.max(vals) || 1
    const colorScale = d3.scaleSequential(d3.interpolateViridis).domain([vMin, vMax])

    const cellW = width / gridSize
    const cellH = height / gridSize

    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        const xi = (i / gridSize) * 10
        const yi = (j / gridSize) * 10
        const val = intercept + coefX1 * xi + coefX2 * yi
        g.append('rect')
          .attr('x', xScale(xi)).attr('y', yScale(yi + 10 / gridSize))
          .attr('width', cellW + 1).attr('height', cellH + 1)
          .attr('fill', colorScale(val))
      }
    }

    // Contour lines
    const levels = d3.range(vMin, vMax, (vMax - vMin) / 8)
    levels.forEach(level => {
      if (Math.abs(coefX2) < 0.01) return
      const x2AtLevel = (lvl: number, x1: number) => (lvl - intercept - coefX1 * x1) / coefX2
      const lineData: [number, number][] = []
      for (let x1 = 0; x1 <= 10; x1 += 0.2) {
        const x2 = x2AtLevel(level, x1)
        if (x2 >= 0 && x2 <= 10) lineData.push([x1, x2])
      }
      if (lineData.length > 1) {
        g.append('path')
          .datum(lineData)
          .attr('d', d3.line().x(d => xScale(d[0])).y(d => yScale(d[1])))
          .attr('fill', 'none').attr('stroke', 'rgba(255,255,255,0.4)').attr('stroke-width', 1)
      }
    })

    // Axes
    g.append('g').attr('transform', `translate(0,${height})`).call(d3.axisBottom(xScale).ticks(5))
      .selectAll('text').attr('fill', AXIS_COLOR).style('font-size', '11px')
    g.append('g').call(d3.axisLeft(yScale).ticks(5))
      .selectAll('text').attr('fill', AXIS_COLOR).style('font-size', '11px')
    g.selectAll('.domain').attr('stroke', AXIS_COLOR)

    g.append('text').attr('x', width / 2).attr('y', height + 40).attr('text-anchor', 'middle')
      .attr('fill', AXIS_COLOR).attr('font-size', '11px').text('X₁ (变量1)')
    g.append('text').attr('x', -height / 2).attr('y', -45).attr('text-anchor', 'middle')
      .attr('transform', 'rotate(-90)').attr('fill', AXIS_COLOR).attr('font-size', '11px').text('X₂ (变量2)')

    // Color legend
    const legendH = height * 0.6
    const legendW = 12
    const legendX = width + 15
    const legendY = (height - legendH) / 2
    const legendScale = d3.scaleLinear().domain([vMin, vMax]).range([legendH, 0])
    const defs = svg.append('defs')
    const grad = defs.append('linearGradient').attr('id', 'heatLegend').attr('x1', '0').attr('y1', '1').attr('x2', '0').attr('y2', '0')
    for (let t = 0; t <= 1; t += 0.1) {
      grad.append('stop').attr('offset', `${t * 100}%`).attr('stop-color', colorScale(vMin + t * (vMax - vMin)))
    }
    g.append('rect').attr('x', legendX).attr('y', legendY).attr('width', legendW).attr('height', legendH)
      .attr('fill', 'url(#heatLegend)').attr('rx', 2)
    g.append('g').attr('transform', `translate(${legendX + legendW},${legendY})`)
      .call(d3.axisRight(legendScale).ticks(5).tickSize(4))
      .selectAll('text').attr('fill', AXIS_COLOR).style('font-size', '9px')
    g.select('.domain').remove()
  }, [coefX1, coefX2, intercept, dimensions])

  return (
    <div>
      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <div>
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>X₁ 系数 (β₁)</span>
            <span className="text-sm font-mono px-2 py-0.5 rounded" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>{coefX1.toFixed(1)}</span>
          </div>
          <input type="range" min="0" max="6" step="0.2" value={coefX1} onChange={e => setCoefX1(+e.target.value)} className="w-full" style={{ accentColor: CHAPTER_COLOR }} />
        </div>
        <div>
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>X₂ 系数 (β₂)</span>
            <span className="text-sm font-mono px-2 py-0.5 rounded" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>{coefX2.toFixed(1)}</span>
          </div>
          <input type="range" min="0" max="6" step="0.2" value={coefX2} onChange={e => setCoefX2(+e.target.value)} className="w-full" style={{ accentColor: CHAPTER_COLOR }} />
        </div>
      </div>

      <div ref={containerRef} className="rounded-lg mb-4" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
        <svg ref={svgRef} width={dimensions.width} height={dimensions.height} />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="text-center p-3 rounded-lg" style={{ background: 'var(--bg-secondary)' }}>
          <div className="text-base font-semibold font-mono" style={{ color: 'var(--text-primary)' }}>ŷ = {intercept} + {coefX1.toFixed(1)}X₁ + {coefX2.toFixed(1)}X₂</div>
          <div className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>回归方程</div>
        </div>
        <div className="text-center p-3 rounded-lg" style={{ background: 'var(--bg-secondary)' }}>
          <div className="text-base font-semibold font-mono" style={{ color: 'var(--text-primary)' }}>{r2.toFixed(3)}</div>
          <div className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>R²</div>
        </div>
        <div className="text-center p-3 rounded-lg" style={{ background: 'var(--bg-secondary)' }}>
          <div className="text-base font-semibold font-mono" style={{ color: 'var(--text-primary)' }}>{(r2 - 0.01 > 0 ? r2 - 0.01 : r2).toFixed(3)}</div>
          <div className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>调整后R²</div>
        </div>
      </div>
      <p className="mt-3 text-[12px] text-center" style={{ color: 'var(--text-tertiary)' }}>
        颜色表示预测值大小 | 白色等高线表示相同预测值
      </p>
    </div>
  )
}

// ============================================
// Legal Case: Sentencing Prediction
// ============================================
function SentencingPredictionCase() {
  const [severity, setSeverity] = useState(5)
  const [priors, setPriors] = useState(1)
  const [age, setAge] = useState(30)
  const [plea, setPlea] = useState(0)

  // Regression coefficients (fictional model)
  const b0 = 6.0
  const bSeverity = 4.2
  const bPriors = 3.5
  const bAge = -0.15
  const bPlea = -8.0

  const predicted = Math.max(0, b0 + bSeverity * severity + bPriors * priors + bAge * age + bPlea * plea)

  const sliders: { label: string; value: number; min: number; max: number; step: number; set: (v: number) => void; coef: string }[] = [
    { label: '犯罪严重程度', value: severity, min: 1, max: 10, step: 1, set: setSeverity, coef: `β = ${bSeverity}` },
    { label: '前科次数', value: priors, min: 0, max: 5, step: 1, set: setPriors, coef: `β = ${bPriors}` },
    { label: '年龄', value: age, min: 18, max: 65, step: 1, set: setAge, coef: `β = ${bAge}` },
    { label: '认罪协议', value: plea, min: 0, max: 1, step: 1, set: setPlea, coef: `β = ${bPlea}` },
  ]

  return (
    <LegalCaseCard title="量刑预测回归模型" color={CHAPTER_COLOR}>
      <p className="leading-relaxed mb-4">
        假设检察院建立了一个回归模型，基于历史判决数据来预测量刑长度（月）。该模型使用犯罪严重程度、前科次数、年龄和认罪协议作为预测变量。
      </p>

      <div className="rounded-lg p-4 mb-4" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
        <h4 className="font-semibold mb-4 text-sm" style={{ color: 'var(--text-primary)' }}>调整变量，观察预测量刑</h4>

        {sliders.map(s => (
          <div key={s.label} className="mb-4">
            <div className="flex justify-between mb-1">
              <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>{s.label}</span>
              <div className="flex gap-2">
                <span className="text-[11px] px-1.5 py-0.5 rounded" style={{ background: `${CHAPTER_COLOR}15`, color: CHAPTER_COLOR }}>{s.coef}</span>
                <span className="text-sm font-mono px-2 py-0.5 rounded" style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}>{s.value}</span>
              </div>
            </div>
            <input type="range" min={s.min} max={s.max} step={s.step} value={s.value}
              onChange={e => s.set(+e.target.value)} className="w-full" style={{ accentColor: CHAPTER_COLOR }} />
          </div>
        ))}

        <div className="mt-4 pt-4 text-center" style={{ borderTop: '1px solid var(--border)' }}>
          <p className="text-[11px] mb-1" style={{ color: 'var(--text-tertiary)' }}>预测量刑</p>
          <p className="font-mono text-3xl font-bold" style={{ color: CHAPTER_COLOR }}>{predicted.toFixed(1)}<span className="text-base font-normal ml-1">个月</span></p>
          <p className="text-[11px] mt-1" style={{ color: 'var(--text-tertiary)' }}>
            = {b0} + {bSeverity}×{severity} + {bPriors}×{priors} + ({bAge})×{age} + ({bPlea})×{plea}
          </p>
        </div>
      </div>

      <div className="p-4 rounded-lg" style={{ background: `${CHAPTER_COLOR}10`, border: `1px solid ${CHAPTER_COLOR}30` }}>
        <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>
          <strong style={{ color: 'var(--text-primary)' }}>关键洞察：统计预测与司法正义</strong>
        </p>
        <ul className="space-y-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
          <li>1. <strong>模型局限性</strong>：回归模型只能捕捉线性关系，而量刑涉及复杂的法律与人文考量</li>
          <li>2. <strong>公平性问题</strong>：如果训练数据中存在系统性偏见（如种族、地域差异），模型会继承并强化这些偏见</li>
          <li>3. <strong>算法偏见</strong>：年龄系数为负意味着模型"认为"年轻人应判更重，但这可能反映的是历史歧视</li>
          <li>4. <strong>个案正义</strong>：每个案件都有独特情况，不应完全依赖统计模型替代法官的自由裁量</li>
        </ul>
      </div>
    </LegalCaseCard>
  )
}

// ============================================
// Main Page
// ============================================
export default function Chapter6Page() {
  return (
    <div className="min-h-screen">
      <ChapterHeader chapterNumber={6} title="回归分析" subtitle="Regression Analysis"
        description="理解回归建模、最小二乘法与模型评估，探讨统计预测在法律实践中的应用与局限" color={CHAPTER_COLOR} />

      <div className="max-w-4xl mx-auto px-4 md:px-6 py-12 md:py-16">
        <SectionIntro chapterColor={CHAPTER_COLOR}
          prerequisites={['前5章统计基础', '基本代数运算', '相关性概念']}
          learningGoals={['理解简单线性回归与最小二乘法', '掌握残差分析与模型诊断', '了解多元回归基本概念', '评估回归模型在法律预测中的应用与风险']}
          overview={<><p className="mb-3">本章介绍<strong>回归分析</strong>——统计学中最常用的预测建模方法。我们将从简单线性回归出发，通过最小二乘法拟合数据，评估模型质量。</p><p>在法律实践中，回归模型被用于量刑预测、损害赔偿评估等领域，但也引发了关于公平性与算法偏见的深刻讨论。</p></>} />

        <BeginnerExplanation title="初学者指南">
          <div className="space-y-4">
            <p><strong>回归</strong>就像画一条"最佳拟合线"穿过散点图中的数据点。</p>
            <p><strong>最小二乘法</strong>像"找到一条线，使所有点到这条线的距离总和最小"。</p>
            <p><strong>R²</strong>像"成绩单"——告诉你模型能解释多少数据的变化，越接近1越好。</p>
          </div>
        </BeginnerExplanation>

        {/* Section 1: Simple Linear Regression */}
        <ScrollReveal>
          <h2 className="text-2xl font-bold mb-6 pt-4" style={{ color: 'var(--text-primary)' }}>简单线性回归</h2>
          <p className="leading-relaxed mb-6" style={{ color: 'var(--text-secondary)' }}>
            简单线性回归通过一条直线来描述自变量 X 与因变量 Y 之间的关系。最小二乘法（OLS）通过最小化残差平方和来确定最佳拟合线。
          </p>
        </ScrollReveal>

        <FormulaBox title="简单线性回归方程" latex="ŷ = β₀ + β₁x"
          explanation={<ul className="space-y-1"><li><strong>ŷ</strong>：预测值</li><li><strong>β₀</strong>：截距（x=0时的y值）</li><li><strong>β₁</strong>：斜率（x每增加1，y的变化量）</li></ul>} />

        <ExperimentContainer title="交互演示：简单线性回归" description="点击添加点 | 拖拽移动点 | 观察回归线实时变化">
          <SimpleRegressionViz />
        </ExperimentContainer>

        <FormulaBox title="最小二乘法 (OLS)" latex="β₁ = Σ(xᵢ - x̄)(yᵢ - ȳ) / Σ(xᵢ - x̄)²"
          explanation={<p>OLS 通过最小化残差平方和 Σ(yᵢ - ŷᵢ)² 来求解回归系数。斜率等于 X 与 Y 的协方差除以 X 的方差。</p>} />

        {/* Section 2: Residual Analysis */}
        <ScrollReveal>
          <h2 className="text-2xl font-bold mb-6 pt-8" style={{ color: 'var(--text-primary)' }}>残差分析</h2>
          <p className="leading-relaxed mb-6" style={{ color: 'var(--text-secondary)' }}>
            残差 e = y - ŷ 是实际值与预测值的差异。通过残差图可以诊断模型假设是否成立：残差应随机分布、无系统模式。
          </p>
        </ScrollReveal>

        <ExperimentContainer title="交互演示：残差分析" description="选择不同的残差模式，理解模型诊断">
          <ResidualAnalysisViz />
        </ExperimentContainer>

        <FormulaBox title="决定系数 (R²)" latex="R² = 1 - SS_res / SS_tot = 1 - Σ(yᵢ - ŷᵢ)² / Σ(yᵢ - ȳ)²"
          explanation={<ul className="space-y-1"><li><strong>SS_res</strong>：残差平方和（模型未解释的变异）</li><li><strong>SS_tot</strong>：总平方和（数据的总变异）</li><li><strong>R² ∈ [0, 1]</strong>：越接近1表示拟合越好</li></ul>} />

        {/* Section 3: Multiple Regression */}
        <ScrollReveal>
          <h2 className="text-2xl font-bold mb-6 pt-8" style={{ color: 'var(--text-primary)' }}>多元回归概念</h2>
          <p className="leading-relaxed mb-6" style={{ color: 'var(--text-secondary)' }}>
            当多个自变量影响因变量时，使用多元回归。回归方程从一条线扩展为一个超平面。下方热力图展示了两个预测变量下的回归平面。
          </p>
        </ScrollReveal>

        <ExperimentContainer title="交互演示：多元回归平面" description="调整系数查看回归平面的变化">
          <MultipleRegressionViz />
        </ExperimentContainer>

        {/* Section 4: Legal Case */}
        <ScrollReveal>
          <h2 className="text-2xl font-bold mb-6 pt-8" style={{ color: 'var(--text-primary)' }}>法学案例</h2>
        </ScrollReveal>

        <SentencingPredictionCase />

        <Checkpoint type="think" title="回归模型的法律局限">
          <div className="space-y-3">
            <p className="font-medium">当统计模型进入法庭</p>
            <p>回归模型假设变量间存在线性关系，但法律判断往往涉及难以量化的因素（如悔罪态度、社会危害性的主观评估）。思考以下问题：</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>如果模型基于历史数据训练，而历史判决存在种族偏见，模型是否会"继承"这种不公正？</li>
              <li>R² = 0.7 的量刑模型意味着30%的变异无法解释——这对个案正义意味着什么？</li>
              <li>如何平衡量刑一致性（模型优势）与个案灵活性（法官裁量）？</li>
            </ul>
          </div>
        </Checkpoint>

        <Checkpoint type="try" title="动手实践">
          <div className="space-y-3">
            <p>回到简单线性回归交互图，尝试以下操作：</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>添加一个离群点（远离其他点的位置），观察回归线和 R² 的变化</li>
              <li>将所有点拖到一条水平线上，R² 变为多少？斜率是什么？</li>
              <li>只保留2个点，R² 是多少？这说明了什么问题？</li>
            </ul>
          </div>
        </Checkpoint>

        <SectionOutro
          keyPoints={[
            '简单线性回归用 ŷ = β₀ + β₁x 描述两个变量的线性关系',
            '最小二乘法通过最小化残差平方和来估计回归系数',
            'R² 衡量模型解释力，但高 R² 不等于因果关系',
            '残差分析是模型诊断的关键工具，帮助发现违反假设的情况',
            '多元回归可纳入多个预测变量，但需警惕多重共线性',
            '回归模型在法律中应用广泛但需审慎——模型可能编码社会偏见',
          ]}
          question="某研究发现，一个地区的冰淇淋销量与犯罪率之间 R² = 0.85。能否据此建议通过限制冰淇淋销售来降低犯罪？为什么？"
          hint="相关不等于因果。两者可能都受温度（混淆变量）影响。R² 再高也只反映统计关联，不能证明因果。这也是法律实证研究中必须注意的陷阱。"
        />

        <ChapterNav currentChapter={6} />
      </div>
    </div>
  )
}
