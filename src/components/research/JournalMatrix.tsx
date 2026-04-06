'use client'

import { useEffect, useRef } from 'react'
import * as d3 from 'd3'

interface Props {
  data: Record<string, Record<string, number>>
  disciplines: string[]
}

export function JournalMatrix({ data, disciplines }: Props) {
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || !disciplines.length) return

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const journals = Object.keys(data).sort()
    const margin = { top: 10, right: 20, bottom: 120, left: 160 }
    const cellSize = 28
    const width = margin.left + journals.length * cellSize + margin.right
    const height = margin.top + disciplines.length * cellSize + margin.bottom

    svg.attr('width', Math.max(width, containerRef.current.clientWidth)).attr('height', height)

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`)

    const allValues = journals.flatMap(j => disciplines.map(d => data[j]?.[d] || 0)).filter(v => v > 0)
    const maxVal = d3.max(allValues) || 1

    const color = d3.scaleSequential([0, maxVal], d3.interpolateBlues)

    // Cells
    journals.forEach((j, ji) => {
      disciplines.forEach((d, di) => {
        const val = data[j]?.[d] || 0
        g.append('rect')
          .attr('x', ji * cellSize)
          .attr('y', di * cellSize)
          .attr('width', cellSize - 1)
          .attr('height', cellSize - 1)
          .attr('rx', 2)
          .attr('fill', val > 0 ? color(val) : 'var(--bg-surface)')
          .attr('stroke', 'none')
          .append('title')
          .text(`${j} × ${d}: ${val}`)
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

  }, [data, disciplines])

  return (
    <div ref={containerRef} className="overflow-x-auto">
      <svg ref={svgRef} />
    </div>
  )
}
