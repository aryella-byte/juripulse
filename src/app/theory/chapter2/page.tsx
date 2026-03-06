'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { RotateCcw } from 'lucide-react'
import * as d3 from 'd3'
import {
  ChapterHeader, BeginnerExplanation, FormulaBox, Checkpoint,
  SectionIntro, SectionOutro, LegalCaseCard, ExperimentContainer,
  useResponsiveSVG, ChapterNav, ScrollReveal
} from '@/components/theory-components'

const CHAPTER_COLOR = '#9c4221'
const AXIS_COLOR = '#8a8a8a'
const GRID_COLOR = 'rgba(0,0,0,0.04)'
const NAVY = '#1a365d'
const GREEN = '#047857'

// ============================================
// Venn Diagram Visualization
// ============================================
type SetOp = 'intersection' | 'union' | 'complementA' | 'difference'

function VennDiagramVisualization() {
  const svgRef = useRef<SVGSVGElement>(null)
  const { containerRef, dimensions } = useResponsiveSVG(600, 380)
  const [operation, setOperation] = useState<SetOp>('intersection')
  const [posA, setPosA] = useState({ x: 210, y: 190 })
  const [posB, setPosB] = useState({ x: 340, y: 190 })
  const dragging = useRef<'A' | 'B' | null>(null)
  const R = 120

  const handlePointerDown = useCallback((circle: 'A' | 'B') => {
    dragging.current = circle
  }, [])

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging.current || !svgRef.current) return
    const svg = svgRef.current
    const pt = svg.createSVGPoint()
    pt.x = e.clientX; pt.y = e.clientY
    const ctm = svg.getScreenCTM()
    if (!ctm) return
    const svgPt = pt.matrixTransform(ctm.inverse())
    const pos = { x: Math.max(R, Math.min(dimensions.width - R, svgPt.x)), y: Math.max(R, Math.min(dimensions.height - R, svgPt.y)) }
    if (dragging.current === 'A') setPosA(pos)
    else setPosB(pos)
  }, [dimensions])

  const handlePointerUp = useCallback(() => { dragging.current = null }, [])

  // Compute overlap area
  const dist = Math.sqrt((posA.x - posB.x) ** 2 + (posA.y - posB.y) ** 2)
  const areaCircle = Math.PI * R * R
  const totalArea = dimensions.width * dimensions.height

  let overlapArea = 0
  if (dist >= 2 * R) {
    overlapArea = 0
  } else if (dist <= 0) {
    overlapArea = areaCircle
  } else {
    const d = dist
    overlapArea = 2 * R * R * Math.acos(d / (2 * R)) - (d / 2) * Math.sqrt(4 * R * R - d * d)
  }

  const pA = +(areaCircle / totalArea).toFixed(4)
  const pB = +(areaCircle / totalArea).toFixed(4)
  const pIntersection = +(overlapArea / totalArea).toFixed(4)
  const pUnion = +(2 * areaCircle - overlapArea).toFixed(4) / totalArea

  const ops: { key: SetOp; label: string }[] = [
    { key: 'intersection', label: 'A \u2229 B' },
    { key: 'union', label: 'A \u222A B' },
    { key: 'complementA', label: "A'" },
    { key: 'difference', label: 'A - B' },
  ]

  const getClipPath = (op: SetOp) => {
    switch (op) {
      case 'intersection': return 'intersection'
      case 'union': return 'union'
      case 'complementA': return 'complementA'
      case 'difference': return 'difference'
    }
  }

  return (
    <div ref={containerRef}>
      <div className="flex flex-wrap gap-2 mb-4">
        {ops.map(o => (
          <button key={o.key} onClick={() => setOperation(o.key)}
            className="px-4 py-2 rounded-lg text-[13px] font-medium transition-all"
            style={operation === o.key
              ? { background: CHAPTER_COLOR, color: '#fff' }
              : { background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }
            }>
            {o.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-4 gap-3 mb-4">
        {[
          { label: 'P(A)', value: pA.toFixed(3) },
          { label: 'P(B)', value: pB.toFixed(3) },
          { label: 'P(A\u2229B)', value: pIntersection.toFixed(3) },
          { label: 'P(A\u222AB)', value: pUnion.toFixed(3) },
        ].map((s, i) => (
          <div key={i} className="p-3 rounded-lg text-center" style={{ background: 'var(--bg-secondary)' }}>
            <div className="text-lg font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>{s.value}</div>
            <div className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div className="rounded-xl p-4" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
        <svg ref={svgRef}
          viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
          style={{ width: '100%', height: 'auto', cursor: dragging.current ? 'grabbing' : 'default', touchAction: 'none' }}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}>
          <defs>
            <clipPath id="clipA"><circle cx={posA.x} cy={posA.y} r={R} /></clipPath>
            <clipPath id="clipB"><circle cx={posB.x} cy={posB.y} r={R} /></clipPath>
          </defs>

          {/* Universal set background */}
          <rect width={dimensions.width} height={dimensions.height} fill="transparent" />

          {/* Highlight based on operation */}
          {operation === 'intersection' && (
            <circle cx={posB.x} cy={posB.y} r={R} fill={CHAPTER_COLOR} opacity={0.35} clipPath="url(#clipA)" />
          )}
          {operation === 'union' && (
            <>
              <circle cx={posA.x} cy={posA.y} r={R} fill={CHAPTER_COLOR} opacity={0.25} />
              <circle cx={posB.x} cy={posB.y} r={R} fill={CHAPTER_COLOR} opacity={0.25} />
            </>
          )}
          {operation === 'complementA' && (
            <>
              <rect width={dimensions.width} height={dimensions.height} fill={CHAPTER_COLOR} opacity={0.15} />
              <circle cx={posA.x} cy={posA.y} r={R} fill="var(--bg-secondary)" />
            </>
          )}
          {operation === 'difference' && (
            <>
              <circle cx={posA.x} cy={posA.y} r={R} fill={CHAPTER_COLOR} opacity={0.3} />
              <circle cx={posB.x} cy={posB.y} r={R} fill="var(--bg-secondary)" clipPath="url(#clipA)" />
            </>
          )}

          {/* Circle outlines */}
          <circle cx={posA.x} cy={posA.y} r={R} fill="none" stroke={NAVY} strokeWidth={2.5}
            style={{ cursor: 'grab' }} onPointerDown={() => handlePointerDown('A')} />
          <circle cx={posB.x} cy={posB.y} r={R} fill="none" stroke={GREEN} strokeWidth={2.5}
            style={{ cursor: 'grab' }} onPointerDown={() => handlePointerDown('B')} />

          {/* Labels */}
          <text x={posA.x - R * 0.5} y={posA.y - R - 10} textAnchor="middle" fill={NAVY} fontSize={14} fontWeight={600}>A</text>
          <text x={posB.x + R * 0.5} y={posB.y - R - 10} textAnchor="middle" fill={GREEN} fontSize={14} fontWeight={600}>B</text>
        </svg>
      </div>
      <p className="mt-3 text-[12px] text-center" style={{ color: 'var(--text-tertiary)' }}>
        拖拽圆圈调整重叠区域，点击按钮切换集合运算
      </p>
    </div>
  )
}

// ============================================
// Conditional Probability Tree
// ============================================
function ConditionalProbTree() {
  const svgRef = useRef<SVGSVGElement>(null)
  const { containerRef, dimensions } = useResponsiveSVG(600, 360)
  const [pB, setPB] = useState(0.3)
  const [pA_givenB, setPA_givenB] = useState(0.8)
  const [pA_givenNotB, setPA_givenNotB] = useState(0.1)
  const [highlight, setHighlight] = useState<'AB' | 'AnotB' | 'notAB' | 'notAnotB' | null>(null)

  const pNotB = 1 - pB
  const pNotA_givenB = 1 - pA_givenB
  const pNotA_givenNotB = 1 - pA_givenNotB
  const pAB = pB * pA_givenB
  const pANotB = pNotB * pA_givenNotB
  const pA = pAB + pANotB
  const pB_givenA = pA > 0 ? pAB / pA : 0

  useEffect(() => {
    if (!svgRef.current) return
    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()
    const { width, height } = dimensions
    const g = svg.append('g')

    const rootX = 60, rootY = height / 2
    const mid1X = width * 0.35, mid1Y_top = 90, mid1Y_bot = height - 90
    const endX = width * 0.7
    const endYs = [40, mid1Y_top + 60, mid1Y_bot - 60, height - 40]

    const branches: { from: [number, number]; to: [number, number]; label: string; prob: number; path: string }[] = [
      { from: [rootX, rootY], to: [mid1X, mid1Y_top], label: 'B', prob: pB, path: 'B' },
      { from: [rootX, rootY], to: [mid1X, mid1Y_bot], label: "B'", prob: pNotB, path: 'notB' },
      { from: [mid1X, mid1Y_top], to: [endX, endYs[0]], label: 'A|B', prob: pA_givenB, path: 'AB' },
      { from: [mid1X, mid1Y_top], to: [endX, endYs[1]], label: "A'|B", prob: pNotA_givenB, path: 'notAB' },
      { from: [mid1X, mid1Y_bot], to: [endX, endYs[2]], label: "A|B'", prob: pA_givenNotB, path: 'AnotB' },
      { from: [mid1X, mid1Y_bot], to: [endX, endYs[3]], label: "A'|B'", prob: pNotA_givenNotB, path: 'notAnotB' },
    ]

    const outcomes: { x: number; y: number; label: string; prob: number; key: string }[] = [
      { x: endX, y: endYs[0], label: 'A \u2229 B', prob: pAB, key: 'AB' },
      { x: endX, y: endYs[1], label: "A' \u2229 B", prob: pB * pNotA_givenB, key: 'notAB' },
      { x: endX, y: endYs[2], label: "A \u2229 B'", prob: pANotB, key: 'AnotB' },
      { x: endX, y: endYs[3], label: "A' \u2229 B'", prob: pNotB * pNotA_givenNotB, key: 'notAnotB' },
    ]

    const isHighlighted = (path: string) => {
      if (!highlight) return true
      if (highlight === 'AB') return path === 'B' || path === 'AB'
      if (highlight === 'notAB') return path === 'B' || path === 'notAB'
      if (highlight === 'AnotB') return path === 'notB' || path === 'AnotB'
      if (highlight === 'notAnotB') return path === 'notB' || path === 'notAnotB'
      return false
    }

    // Draw branches
    branches.forEach(b => {
      const hl = isHighlighted(b.path)
      g.append('line')
        .attr('x1', b.from[0]).attr('y1', b.from[1])
        .attr('x2', b.to[0]).attr('y2', b.to[1])
        .attr('stroke', hl ? CHAPTER_COLOR : '#d0d0d0')
        .attr('stroke-width', hl ? 2.5 : 1.5)
        .attr('opacity', hl ? 1 : 0.3)

      const mx = (b.from[0] + b.to[0]) / 2, my = (b.from[1] + b.to[1]) / 2
      g.append('text')
        .attr('x', mx - 10).attr('y', my - 6)
        .attr('text-anchor', 'middle')
        .attr('fill', hl ? '#4a4a4a' : '#bbb')
        .attr('font-size', 11)
        .text(`${b.label} = ${b.prob.toFixed(2)}`)
    })

    // Draw nodes
    g.append('circle').attr('cx', rootX).attr('cy', rootY).attr('r', 6).attr('fill', NAVY)
    g.append('circle').attr('cx', mid1X).attr('cy', mid1Y_top).attr('r', 5).attr('fill', CHAPTER_COLOR)
    g.append('circle').attr('cx', mid1X).attr('cy', mid1Y_bot).attr('r', 5).attr('fill', AXIS_COLOR)

    // Draw outcomes
    outcomes.forEach(o => {
      const hl = highlight === o.key || !highlight
      g.append('rect')
        .attr('x', o.x + 8).attr('y', o.y - 14)
        .attr('width', 120).attr('height', 28)
        .attr('rx', 6).attr('fill', hl ? `${CHAPTER_COLOR}18` : 'transparent')
        .attr('stroke', hl ? CHAPTER_COLOR : '#d0d0d0')
        .attr('stroke-width', hl ? 1.5 : 0.5)
        .style('cursor', 'pointer')
        .on('click', () => setHighlight(h => h === o.key ? null : o.key as typeof highlight))

      g.append('text')
        .attr('x', o.x + 68).attr('y', o.y + 1)
        .attr('text-anchor', 'middle')
        .attr('fill', hl ? '#4a4a4a' : '#bbb')
        .attr('font-size', 11)
        .attr('font-weight', 500)
        .text(`${o.label}: ${o.prob.toFixed(3)}`)
        .style('pointer-events', 'none')
    })

  }, [pB, pA_givenB, pA_givenNotB, highlight, dimensions])

  const sliders = [
    { label: 'P(B)', value: pB, set: setPB, min: 0.05, max: 0.95, step: 0.01 },
    { label: 'P(A|B)', value: pA_givenB, set: setPA_givenB, min: 0.01, max: 0.99, step: 0.01 },
    { label: "P(A|B')", value: pA_givenNotB, set: setPA_givenNotB, min: 0.01, max: 0.99, step: 0.01 },
  ]

  return (
    <div ref={containerRef}>
      <div className="space-y-4 mb-6">
        {sliders.map(s => (
          <div key={s.label}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>{s.label}</span>
              <span className="text-sm font-mono px-2 py-0.5 rounded" style={{ color: 'var(--text-primary)', background: 'var(--bg-secondary)' }}>{s.value.toFixed(2)}</span>
            </div>
            <input type="range" min={s.min} max={s.max} step={s.step} value={s.value}
              onChange={e => s.set(+e.target.value)} className="w-full" style={{ accentColor: CHAPTER_COLOR }} />
          </div>
        ))}
      </div>

      <div className="rounded-xl p-4" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
        <svg ref={svgRef} viewBox={`0 0 ${dimensions.width} ${dimensions.height}`} style={{ width: '100%', height: 'auto' }} />
      </div>

      <div className="mt-4 p-4 rounded-xl" style={{ background: `${NAVY}08`, border: `1px solid ${NAVY}20` }}>
        <h4 className="text-sm font-semibold mb-2" style={{ color: NAVY }}>Bayes 定理计算</h4>
        <div className="text-sm font-mono space-y-1" style={{ color: 'var(--text-secondary)' }}>
          <div>P(B|A) = P(A|B) * P(B) / P(A)</div>
          <div style={{ paddingLeft: 48 }}>= {pA_givenB.toFixed(2)} * {pB.toFixed(2)} / {pA.toFixed(4)}</div>
          <div style={{ paddingLeft: 48 }}>= <strong style={{ color: CHAPTER_COLOR, fontSize: 16 }}>{pB_givenA.toFixed(4)}</strong></div>
        </div>
      </div>
      <p className="mt-3 text-[12px] text-center" style={{ color: 'var(--text-tertiary)' }}>
        点击右侧结果框高亮对应路径，调整滑块观察贝叶斯定理的动态变化
      </p>
    </div>
  )
}

// ============================================
// Multiplication Rule Demo (Urn Drawing)
// ============================================
function MultiplicationRuleDemo() {
  const svgRef = useRef<SVGSVGElement>(null)
  const { containerRef, dimensions } = useResponsiveSVG(600, 280)
  const [mode, setMode] = useState<'with' | 'without'>('without')
  const [totalRed, setTotalRed] = useState(4)
  const [totalBlue, setTotalBlue] = useState(6)
  const [draws, setDraws] = useState<('red' | 'blue')[]>([])
  const [animating, setAnimating] = useState(false)

  const total = totalRed + totalBlue

  const draw = () => {
    if (animating) return
    setAnimating(true)
    const remaining = { red: totalRed, blue: totalBlue }

    // Account for previous draws in "without replacement" mode
    if (mode === 'without') {
      draws.forEach(d => { remaining[d]-- })
      if (remaining.red + remaining.blue <= 0) { setAnimating(false); return }
    }

    const totalRemaining = remaining.red + remaining.blue
    const result: 'red' | 'blue' = Math.random() < remaining.red / totalRemaining ? 'red' : 'blue'
    setTimeout(() => {
      setDraws(prev => [...prev, result])
      setAnimating(false)
    }, 400)
  }

  const reset = () => { setDraws([]); setAnimating(false) }

  useEffect(() => {
    if (!svgRef.current) return
    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()
    const { width, height } = dimensions

    // Draw urn
    const urnX = 80, urnY = height / 2, urnW = 100, urnH = 140
    const g = svg.append('g')

    // Urn outline
    g.append('rect')
      .attr('x', urnX - urnW / 2).attr('y', urnY - urnH / 2)
      .attr('width', urnW).attr('height', urnH)
      .attr('rx', 12).attr('fill', '#f0f0eb').attr('stroke', '#8a8a8a').attr('stroke-width', 2)

    // Balls in urn
    const remaining = { red: totalRed, blue: totalBlue }
    if (mode === 'without') draws.forEach(d => { remaining[d]-- })
    const balls: string[] = [
      ...Array(Math.max(0, remaining.red)).fill('#c0392b'),
      ...Array(Math.max(0, remaining.blue)).fill(NAVY),
    ]
    const cols = 3
    balls.forEach((color, i) => {
      const col = i % cols, row = Math.floor(i / cols)
      g.append('circle')
        .attr('cx', urnX - 25 + col * 25)
        .attr('cy', urnY + urnH / 2 - 25 - row * 25)
        .attr('r', 9).attr('fill', color).attr('opacity', 0.85)
    })

    // Label
    g.append('text').attr('x', urnX).attr('y', urnY - urnH / 2 - 10)
      .attr('text-anchor', 'middle').attr('fill', '#4a4a4a').attr('font-size', 12).attr('font-weight', 600)
      .text('Urn')

    // Drawn balls
    if (draws.length > 0) {
      g.append('text').attr('x', 220).attr('y', 25)
        .attr('fill', '#4a4a4a').attr('font-size', 12).attr('font-weight', 600)
        .text('Draws:')

      draws.forEach((d, i) => {
        const cx = 220 + (i % 8) * 35, cy = 55 + Math.floor(i / 8) * 35
        g.append('circle')
          .attr('cx', cx).attr('cy', cy).attr('r', 12)
          .attr('fill', d === 'red' ? '#c0392b' : NAVY)
          .attr('opacity', 0)
          .transition().duration(300).attr('opacity', 0.85)
        g.append('text').attr('x', cx).attr('y', cy + 30)
          .attr('text-anchor', 'middle').attr('fill', AXIS_COLOR).attr('font-size', 9)
          .text(`#${i + 1}`)
      })
    }

    // Calculation
    if (draws.length >= 2) {
      const calcY = height - 30
      let calcText = ''
      if (mode === 'without') {
        const p1 = draws[0] === 'red' ? totalRed / total : totalBlue / total
        const rem = total - 1
        const remTarget = draws[1] === draws[0]
          ? (draws[0] === 'red' ? totalRed - 1 : totalBlue - 1)
          : (draws[1] === 'red' ? totalRed : totalBlue)
        const p2 = remTarget / rem
        calcText = `P = ${p1.toFixed(3)} x ${p2.toFixed(3)} = ${(p1 * p2).toFixed(4)}`
      } else {
        const p1 = draws[0] === 'red' ? totalRed / total : totalBlue / total
        const p2 = draws[1] === 'red' ? totalRed / total : totalBlue / total
        calcText = `P = ${p1.toFixed(3)} x ${p2.toFixed(3)} = ${(p1 * p2).toFixed(4)}`
      }
      g.append('text').attr('x', 220).attr('y', calcY)
        .attr('fill', CHAPTER_COLOR).attr('font-size', 12).attr('font-weight', 600).attr('font-family', 'monospace')
        .text(calcText)
    }
  }, [draws, mode, totalRed, totalBlue, dimensions, total])

  const remainingCount = mode === 'without'
    ? total - draws.length
    : total

  return (
    <div ref={containerRef}>
      <div className="flex flex-wrap gap-2 mb-4">
        {(['without', 'with'] as const).map(m => (
          <button key={m} onClick={() => { setMode(m); setDraws([]) }}
            className="px-4 py-2 rounded-lg text-[13px] font-medium transition-all"
            style={mode === m
              ? { background: CHAPTER_COLOR, color: '#fff' }
              : { background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }
            }>
            {m === 'without' ? '不放回抽取' : '放回抽取'}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-3 mb-4">
        <div className="flex items-center gap-2">
          <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Red:</span>
          <input type="range" min={1} max={8} value={totalRed}
            onChange={e => { setTotalRed(+e.target.value); setDraws([]) }} style={{ accentColor: '#c0392b', width: 80 }} />
          <span className="text-sm font-mono" style={{ color: 'var(--text-primary)' }}>{totalRed}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Blue:</span>
          <input type="range" min={1} max={8} value={totalBlue}
            onChange={e => { setTotalBlue(+e.target.value); setDraws([]) }} style={{ accentColor: NAVY, width: 80 }} />
          <span className="text-sm font-mono" style={{ color: 'var(--text-primary)' }}>{totalBlue}</span>
        </div>
      </div>

      <div className="flex gap-3 mb-4">
        <button onClick={draw} disabled={animating || (mode === 'without' && remainingCount <= 0)}
          className="px-5 py-2 rounded-lg font-medium text-[13px] transition-all hover:brightness-110 disabled:opacity-50 text-white"
          style={{ background: CHAPTER_COLOR }}>
          {animating ? '...' : '抽一个球'}
        </button>
        <button onClick={reset}
          className="px-3 py-2 rounded-lg text-sm transition-all"
          style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
          <RotateCcw size={15} />
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        {[
          { label: '总球数', value: total },
          { label: '已抽取', value: draws.length },
          { label: mode === 'without' ? '剩余球数' : '每次总数', value: remainingCount },
        ].map((s, i) => (
          <div key={i} className="p-3 rounded-lg text-center" style={{ background: 'var(--bg-secondary)' }}>
            <div className="text-lg font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>{s.value}</div>
            <div className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div className="rounded-xl p-4" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
        <svg ref={svgRef} viewBox={`0 0 ${dimensions.width} ${dimensions.height}`} style={{ width: '100%', height: 'auto' }} />
      </div>
      <p className="mt-3 text-[12px] text-center" style={{ color: 'var(--text-tertiary)' }}>
        {mode === 'without'
          ? 'P(A\u2229B) = P(A) \u00D7 P(B|A) -- 不放回时，后续概率随前次结果变化'
          : 'P(A\u2229B) = P(A) \u00D7 P(B) -- 放回时，事件相互独立'}
      </p>
    </div>
  )
}

// ============================================
// Drug Test False Positive Case
// ============================================
function DrugTestCase() {
  const [prevalence, setPrevalence] = useState(1)
  const [sensitivity, setSensitivity] = useState(99)
  const [specificity, setSpecificity] = useState(99)

  const prev = prevalence / 100
  const sens = sensitivity / 100
  const spec = specificity / 100

  const pPositive = sens * prev + (1 - spec) * (1 - prev)
  const ppv = pPositive > 0 ? (sens * prev) / pPositive : 0
  const npv = (1 - prev) > 0 ? (spec * (1 - prev)) / (spec * (1 - prev) + (1 - sens) * prev) : 0

  // For 1000 people illustration
  const pop = 10000
  const actualUsers = Math.round(pop * prev)
  const nonUsers = pop - actualUsers
  const truePositives = Math.round(actualUsers * sens)
  const falsePositives = Math.round(nonUsers * (1 - spec))
  const totalPositives = truePositives + falsePositives

  const sliders = [
    { label: '吸毒率 (prevalence)', value: prevalence, set: setPrevalence, min: 0.1, max: 10, step: 0.1, fmt: (v: number) => `${v.toFixed(1)}%` },
    { label: '灵敏度 (sensitivity)', value: sensitivity, set: setSensitivity, min: 90, max: 99.9, step: 0.1, fmt: (v: number) => `${v.toFixed(1)}%` },
    { label: '特异度 (specificity)', value: specificity, set: setSpecificity, min: 90, max: 99.9, step: 0.1, fmt: (v: number) => `${v.toFixed(1)}%` },
  ]

  return (
    <LegalCaseCard title="毒品检测假阳性与贝叶斯推理" color={CHAPTER_COLOR}>
      <p className="leading-relaxed mb-6" style={{ color: 'var(--text-secondary)' }}>
        某公司对所有员工进行毒品检测。检测的灵敏度（真阳性率）和特异度（真阴性率）都很高。
        如果一名员工检测呈阳性，他/她实际吸毒的概率是多少？
        直觉上，99%准确率的检测应该意味着阳性结果几乎可以确认吸毒——但事实并非如此。
      </p>

      <div className="space-y-5 mb-8">
        {sliders.map(s => (
          <div key={s.label}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>{s.label}</span>
              <span className="text-sm font-mono px-2 py-0.5 rounded" style={{ color: 'var(--text-primary)', background: 'var(--bg-secondary)' }}>{s.fmt(s.value)}</span>
            </div>
            <input type="range" min={s.min} max={s.max} step={s.step} value={s.value}
              onChange={e => s.set(+e.target.value)} className="w-full" style={{ accentColor: CHAPTER_COLOR }} />
          </div>
        ))}
      </div>

      <div className="p-5 rounded-xl mb-6" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
        <h4 className="font-semibold mb-4 text-sm" style={{ color: 'var(--text-primary)' }}>
          在 {pop.toLocaleString()} 人中的分析
        </h4>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between"><span style={{ color: 'var(--text-secondary)' }}>实际吸毒人数</span><span className="font-mono font-medium" style={{ color: 'var(--text-primary)' }}>{actualUsers}</span></div>
          <div className="flex justify-between"><span style={{ color: 'var(--text-secondary)' }}>真阳性 (correctly detected)</span><span className="font-mono font-medium" style={{ color: GREEN }}>{truePositives}</span></div>
          <div className="flex justify-between"><span style={{ color: 'var(--text-secondary)' }}>假阳性 (false alarm)</span><span className="font-mono font-medium" style={{ color: '#c0392b' }}>{falsePositives}</span></div>
          <div className="flex justify-between"><span style={{ color: 'var(--text-secondary)' }}>阳性总数</span><span className="font-mono font-medium" style={{ color: 'var(--text-primary)' }}>{totalPositives}</span></div>
          <div className="my-3" style={{ height: 1, background: 'var(--border)' }} />
          <div className="flex justify-between items-center">
            <span className="font-medium" style={{ color: 'var(--text-primary)' }}>阳性预测值 PPV = P(吸毒|阳性)</span>
            <span className="font-mono text-xl font-bold" style={{ color: CHAPTER_COLOR }}>{(ppv * 100).toFixed(1)}%</span>
          </div>
        </div>
      </div>

      {/* Visual bar */}
      <div className="mb-6">
        <div className="text-[12px] mb-2" style={{ color: 'var(--text-tertiary)' }}>阳性结果构成</div>
        <div className="flex h-8 rounded-lg overflow-hidden" style={{ border: '1px solid var(--border)' }}>
          <div style={{ width: `${ppv * 100}%`, background: GREEN, transition: 'width 0.3s' }}
            className="flex items-center justify-center text-white text-[11px] font-medium">
            {ppv > 0.1 ? '真阳性' : ''}
          </div>
          <div style={{ width: `${(1 - ppv) * 100}%`, background: '#c0392b', transition: 'width 0.3s' }}
            className="flex items-center justify-center text-white text-[11px] font-medium">
            {(1 - ppv) > 0.1 ? '假阳性' : ''}
          </div>
        </div>
      </div>

      <div className="p-4 rounded-xl flex items-start gap-3" style={{ background: `${CHAPTER_COLOR}10`, border: `1px solid ${CHAPTER_COLOR}30` }}>
        <div>
          <strong style={{ color: 'var(--text-primary)' }}>核心洞察：P(吸毒|阳性) \u2260 P(阳性|吸毒)</strong>
          <p className="mt-1" style={{ color: 'var(--text-secondary)' }}>
            即使检测准确率高达 {sensitivity.toFixed(1)}%，当吸毒率仅为 {prevalence.toFixed(1)}% 时，
            阳性结果中真正吸毒者只占 {(ppv * 100).toFixed(1)}%。
            在低患病率群体中，大量假阳性会淹没真阳性。这就是为什么不能直接用检测准确率来判定个案。
          </p>
        </div>
      </div>
    </LegalCaseCard>
  )
}

// ============================================
// Lazy Load Wrapper
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
            <span className="text-sm">Loading...</span>
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================
// Main Page
// ============================================
export default function Chapter2Page() {
  return (
    <div className="min-h-screen">
      <ChapterHeader
        chapterNumber={2}
        title="复合概率"
        subtitle="Compound Probability"
        description="理解集合运算、条件概率、贝叶斯定理，以及它们在法律推理中的核心作用"
        color={CHAPTER_COLOR}
      />

      <div className="max-w-4xl mx-auto px-4 md:px-6 py-12 md:py-16">
        <SectionIntro
          chapterColor={CHAPTER_COLOR}
          prerequisites={['第1章基础概率', '集合概念（交集、并集、补集）']}
          learningGoals={[
            '理解集合运算与概率的关系',
            '掌握条件概率的定义与计算',
            '理解乘法规则及独立性概念',
            '掌握贝叶斯定理及其应用',
            '识别"检察官谬误"与"辩护律师谬误"'
          ]}
          overview={
            <>
              <p className="mb-3">本章从<strong>Venn图</strong>出发，直观理解集合运算如何对应概率计算。</p>
              <p className="mb-3">接着通过<strong>条件概率树</strong>和<strong>抽球实验</strong>，掌握乘法规则和贝叶斯定理。</p>
              <p>最后通过一个<strong>毒品检测案例</strong>，揭示高准确率检测为何仍会产生大量假阳性。</p>
            </>
          }
        />

        <BeginnerExplanation title="初学者指南">
          <div className="space-y-4">
            <p><strong>复合概率</strong>研究两个或多个事件组合发生的概率。例如"既下雨又堵车"的概率是多少？</p>
            <p><strong>条件概率</strong> P(A|B) 表示"已知B发生的情况下A发生的概率"，这是贝叶斯推理的基础。</p>
            <p><strong>贝叶斯定理</strong>告诉我们如何从 P(B|A) 反推 P(A|B)，这在法律推理中至关重要。</p>
          </div>
        </BeginnerExplanation>

        {/* Section 1: Set Operations */}
        <ScrollReveal>
          <h2 className="text-2xl font-bold mb-6 pt-4" style={{ color: 'var(--text-primary)' }}>集合运算与概率</h2>
          <p className="leading-relaxed mb-6" style={{ color: 'var(--text-secondary)' }}>
            概率论建立在集合论之上。事件可以像集合一样进行交、并、补运算，
            对应的概率遵循加法规则。理解这些运算是掌握复合概率的第一步。
          </p>
        </ScrollReveal>

        <FormulaBox title="加法规则 (Addition Rule)" latex="P(A \u222A B) = P(A) + P(B) - P(A \u2229 B)"
          explanation={
            <p>两个事件并集的概率等于各自概率之和减去交集概率，避免重复计算。当 A、B 互斥时，P(A \u2229 B) = 0。</p>
          }
        />

        <ExperimentContainer title="交互实验：Venn图集合运算" description="拖拽圆圈调整重叠，切换运算类型观察概率变化">
          <LazyVisualization><VennDiagramVisualization /></LazyVisualization>
        </ExperimentContainer>

        <Checkpoint type="try">
          <div className="space-y-3">
            <p className="font-medium">实验任务：</p>
            <ol className="list-decimal list-inside space-y-2 pl-2">
              <li>将两个圆完全重叠，观察 P(A \u2229 B) 和 P(A \u222A B) 的值</li>
              <li>将两个圆完全分开，验证 P(A \u222A B) = P(A) + P(B)</li>
              <li>切换到 A - B 模式，理解差集的含义</li>
            </ol>
          </div>
        </Checkpoint>

        {/* Section 2: Conditional Probability */}
        <ScrollReveal>
          <h2 className="text-2xl font-bold mb-6 pt-8" style={{ color: 'var(--text-primary)' }}>条件概率与贝叶斯定理</h2>
          <p className="leading-relaxed mb-6" style={{ color: 'var(--text-secondary)' }}>
            条件概率是概率论中最重要的概念之一。它回答的问题是：当我们已经知道某个事件发生后，
            另一个事件发生的概率会如何变化？贝叶斯定理则提供了"反转"条件概率的方法。
          </p>
        </ScrollReveal>

        <FormulaBox title="条件概率 (Conditional Probability)" latex="P(A|B) = P(A \u2229 B) / P(B)"
          explanation={
            <p>在B已经发生的前提下，A发生的概率等于A和B同时发生的概率除以B发生的概率。注意：P(A|B) 通常不等于 P(B|A)。</p>
          }
        />

        <FormulaBox title="贝叶斯定理 (Bayes' Theorem)" latex="P(A|B) = P(B|A) \u00D7 P(A) / P(B)"
          explanation={
            <ul className="space-y-2">
              <li><span className="font-semibold" style={{ color: CHAPTER_COLOR }}>P(A)：</span>先验概率，在看到证据B之前对A的信念</li>
              <li><span className="font-semibold" style={{ color: CHAPTER_COLOR }}>P(B|A)：</span>似然性，如果A为真，观察到B的概率</li>
              <li><span className="font-semibold" style={{ color: CHAPTER_COLOR }}>P(A|B)：</span>后验概率，看到证据B之后对A的更新信念</li>
            </ul>
          }
        />

        <ExperimentContainer title="交互实验：条件概率树形图" description="调整概率参数，观察贝叶斯定理如何反转条件概率">
          <LazyVisualization><ConditionalProbTree /></LazyVisualization>
        </ExperimentContainer>

        <Checkpoint type="think">
          <div className="space-y-3">
            <p className="font-medium">思考：</p>
            <p>设 P(B) = 0.01，P(A|B) = 0.99，P(A|B') = 0.05。计算 P(B|A)。</p>
            <p>提示：先用全概率公式求 P(A)，再用贝叶斯定理。你会发现即使 P(A|B) 很高，P(B|A) 可能很低。</p>
          </div>
        </Checkpoint>

        {/* Section 3: Multiplication Rule */}
        <ScrollReveal>
          <h2 className="text-2xl font-bold mb-6 pt-8" style={{ color: 'var(--text-primary)' }}>乘法规则</h2>
          <p className="leading-relaxed mb-6" style={{ color: 'var(--text-secondary)' }}>
            乘法规则告诉我们如何计算两个事件同时发生的概率。关键区别在于：
            事件是否独立？如果不独立（如不放回抽样），后续概率会随前面的结果而变化。
          </p>
        </ScrollReveal>

        <FormulaBox title="乘法规则 (Multiplication Rule)" latex="P(A \u2229 B) = P(A) \u00D7 P(B|A)"
          explanation={
            <ul className="space-y-2">
              <li><span className="font-semibold" style={{ color: CHAPTER_COLOR }}>一般情况：</span>P(A \u2229 B) = P(A) \u00D7 P(B|A)</li>
              <li><span className="font-semibold" style={{ color: CHAPTER_COLOR }}>独立事件：</span>若 A、B 独立，则 P(B|A) = P(B)，因此 P(A \u2229 B) = P(A) \u00D7 P(B)</li>
            </ul>
          }
        />

        <ExperimentContainer title="交互实验：抽球与乘法规则" description="比较放回与不放回抽样，观察概率如何变化">
          <LazyVisualization><MultiplicationRuleDemo /></LazyVisualization>
        </ExperimentContainer>

        <Checkpoint type="mistake">
          <div className="space-y-3">
            <p className="font-medium">常见错误：</p>
            <p>在不放回抽样中直接将两次抽取的概率相乘（如同独立事件），忽略了第一次抽取对第二次概率的影响。</p>
            <p>例如：从10球（4红6蓝）中不放回抽2个，连续抽到红球的概率是 4/10 x 3/9 = 2/15，而不是 4/10 x 4/10 = 4/25。</p>
          </div>
        </Checkpoint>

        {/* Section 4: Legal Case */}
        <ScrollReveal>
          <h2 className="text-2xl font-bold mb-6 pt-8" style={{ color: 'var(--text-primary)' }}>法学应用：检测与证据评价</h2>
          <p className="leading-relaxed mb-6" style={{ color: 'var(--text-secondary)' }}>
            条件概率和贝叶斯定理在法学中有极其重要的应用。很多司法误判源于混淆
            P(证据|假设) 和 P(假设|证据)。下面的毒品检测案例将揭示这一关键区别。
          </p>
        </ScrollReveal>

        <LazyVisualization><DrugTestCase /></LazyVisualization>

        <Checkpoint type="think">
          <div className="space-y-3">
            <p className="font-medium">法律思考：</p>
            <p>
              如果你是法官，收到一份"准确率99%"的毒品检测阳性报告，
              你会如何指导陪审团理解这份证据？你认为是否需要额外的证据来支持指控？
            </p>
          </div>
        </Checkpoint>

        <SectionOutro
          keyPoints={[
            '加法规则：P(A \u222A B) = P(A) + P(B) - P(A \u2229 B)，处理"或"的概率',
            '条件概率：P(A|B) = P(A \u2229 B) / P(B)，已知B发生时A的概率',
            '贝叶斯定理：P(A|B) = P(B|A)P(A)/P(B)，从似然性推导后验概率',
            '乘法规则：P(A \u2229 B) = P(A) \u00D7 P(B|A)，独立时简化为 P(A) \u00D7 P(B)',
            '检察官谬误：混淆 P(证据|无辜) 与 P(无辜|证据)，低基率下高准确率检测仍会产生大量假阳性'
          ]}
          question="某城市吸毒率为2%，检测灵敏度95%，特异度95%。一人检测阳性，求其实际吸毒的概率。"
          hint="P(吸毒|阳性) = (0.95 x 0.02) / (0.95 x 0.02 + 0.05 x 0.98) = 0.019 / 0.068 = 27.9%，远低于95%！"
          nextChapter={{ title: '概率分布', description: '从离散到连续分布，理解数据的形状', link: '/theory/chapter3' }}
        />

        <ChapterNav currentChapter={2} />
      </div>
    </div>
  )
}
