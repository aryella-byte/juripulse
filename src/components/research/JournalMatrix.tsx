'use client'

import { useEffect, useRef, useMemo } from 'react'
import * as d3 from 'd3'

interface Props {
  data: Record<string, Record<string, number>>
  disciplines: string[]
}

export function JournalMatrix({ data, disciplines }: Props) {
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Convert raw counts to within-journal percentages
  const pctData = useMemo(() => {
    const result: Record<string, Record<string, number>> = {}
    for (const [journal, discs] of Object.entries(data)) {
      const total = Object.values(discs).reduce((a, b) => a + b, 0)
      if (total === 0) continue
      result[journal] = {}
      for (const [d, count] of Object.entries(discs)) {
        result[journal][d] = Math.round((count / total) * 100)
      }
    }
    return result
  }, [data])

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || !disciplines.length) return

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const journals = Object.keys(pctData).sort()
    const margin = { top: 10, right: 20, bottom: 120, left: 160 }
    const cellSize = 28
    const width = margin.left + journals.length * cellSize + margin.right
    const height = margin.top + disciplines.length * cellSize + margin.bottom

    svg.attr('width', Math.max(width, containerRef.current.clientWidth)).attr('height', height)

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`)

    // Color scale: 0% → white, 50%+ → deep navy
    const color = d3.scaleSequential([0, 50], d3.interpolateBlues)

    // Cells
    journals.forEach((j, ji) => {
      disciplines.forEach((d, di) => {
        const pct = pctData[j]?.[d] || 0
        const raw = data[j]?.[d] || 0
        g.append('rect')
          .attr('x', ji * cellSize)
          .attr('y', di * cellSize)
          .attr('width', cellSize - 1)
          .attr('height', cellSize - 1)
          .attr('rx', 2)
          .attr('fill', pct > 0 ? color(pct) : 'var(--bg-surface)')
          .attr('stroke', 'none')
          .append('title')
          .text(`${j} × ${d}: ${pct}%（${raw} 篇）`)
      })
    })

    // Journal labels (bottom, rotated)
    journals.forEach((j, i) => {
      g.append('text')
        .attr('x', i * cellSize + cellSize / 2)
        .attr('y', disciplines.length * cellSize + 8)
        .attr('text-anchor', 'start')
        .attr('transform', `rotate(45, ${i * cellSize + cellSize / 2}, ${disciplines.length * cellSize + 8})`)
        .attr('font-size', '9px')
        .attr('fill', 'var(--text-tertiary)')
        .text(j.length > 8 ? j.slice(0, 8) + '…' : j)
    })

    // Discipline labels (left)
    disciplines.forEach((d, i) => {
      g.append('text')
        .attr('x', -6)
        .attr('y', i * cellSize + cellSize / 2 + 3)
        .attr('text-anchor', 'end')
        .attr('font-size', '11px')
        .attr('fill', 'var(--text-secondary)')
        .text(d)
    })

  }, [pctData, data, disciplines])

  return (
    <div>
      <div ref={containerRef} className="overflow-x-auto">
        <svg ref={svgRef} />
      </div>
      <p className="mt-2 text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
        色深 = 该学科在该期刊中的占比（悬停查看具体百分比和篇数）
      </p>
    </div>
  )
}
