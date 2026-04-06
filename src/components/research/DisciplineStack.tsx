'use client'

import { useEffect, useRef } from 'react'
import * as d3 from 'd3'

const DISC_COLORS: Record<string, string> = {
  '民商法学': '#1a365d',
  '宪法学与行政法学': '#2563eb',
  '刑法学': '#dc2626',
  '法学理论': '#7c3aed',
  '经济法学': '#059669',
  '民事诉讼法学': '#d97706',
  '国际法学': '#0891b2',
  '刑事诉讼法学': '#be185d',
  '法史学': '#92400e',
  '社会法学': '#4f46e5',
  '环境与资源保护法学': '#16a34a',
}

interface Props {
  data: Record<string, Record<string, number>>
  disciplines: string[]
}

export function DisciplineStack({ data, disciplines }: Props) {
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || !disciplines.length) return

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const width = containerRef.current.clientWidth
    const height = 360
    const margin = { top: 20, right: 20, bottom: 30, left: 50 }
    const innerW = width - margin.left - margin.right
    const innerH = height - margin.top - margin.bottom

    svg.attr('width', width).attr('height', height)
    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`)

    const years = Object.keys(data).map(Number).sort()
    // Build stack data
    const stackData = years.map(y => {
      const row: Record<string, number> = { year: y }
      disciplines.forEach(d => { row[d] = data[String(y)]?.[d] || 0 })
      return row
    })

    const stack = d3.stack<Record<string, number>>()
      .keys(disciplines)
      .order(d3.stackOrderNone)

    const series = stack(stackData)

    const x = d3.scaleLinear()
      .domain(d3.extent(years) as [number, number])
      .range([0, innerW])

    const yMax = d3.max(series, s => d3.max(s, d => d[1])) || 1
    const y = d3.scaleLinear().domain([0, yMax]).range([innerH, 0])

    const area = d3.area<d3.SeriesPoint<Record<string, number>>>()
      .x((d) => x(d.data.year as number))
      .y0(d => y(d[0]))
      .y1(d => y(d[1]))
      .curve(d3.curveMonotoneX)

    series.forEach((s) => {
      g.append('path')
        .datum(s)
        .attr('d', area)
        .attr('fill', DISC_COLORS[s.key] || '#6b7280')
        .attr('opacity', 0.8)
        .append('title')
        .text(s.key)
    })

    // Axes
    g.append('g')
      .attr('transform', `translate(0,${innerH})`)
      .call(d3.axisBottom(x).ticks(8).tickFormat(d => String(d)))
      .call(g => g.select('.domain').remove())
      .call(g => g.selectAll('.tick text').attr('fill', 'var(--text-tertiary)').attr('font-size', '10px'))

    g.append('g')
      .call(d3.axisLeft(y).ticks(5))
      .call(g => g.select('.domain').remove())
      .call(g => g.selectAll('.tick text').attr('fill', 'var(--text-tertiary)').attr('font-size', '10px'))
      .call(g => g.selectAll('.tick line').attr('stroke', 'var(--border)').attr('stroke-dasharray', '2,2').attr('x2', innerW))

  }, [data, disciplines])

  // Legend
  return (
    <div>
      <div ref={containerRef}>
        <svg ref={svgRef} />
      </div>
      <div className="mt-3 flex flex-wrap gap-3 px-2">
        {disciplines.map(d => (
          <div key={d} className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-sm" style={{ background: DISC_COLORS[d] || '#6b7280' }} />
            <span className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>{d}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
