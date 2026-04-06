'use client'

import { useEffect, useRef } from 'react'
import * as d3 from 'd3'

interface YearCount {
  year: number
  count: number
}

export function HeroPulse({ data }: { data: YearCount[] }) {
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || !data.length) return

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const width = containerRef.current.clientWidth
    const height = 220
    const margin = { top: 20, right: 20, bottom: 30, left: 40 }
    const innerW = width - margin.left - margin.right
    const innerH = height - margin.top - margin.bottom

    svg.attr('width', width).attr('height', height)

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`)

    const x = d3.scaleLinear()
      .domain(d3.extent(data, d => d.year) as [number, number])
      .range([0, innerW])

    const y = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.count)! * 1.1])
      .range([innerH, 0])

    // Area
    const area = d3.area<YearCount>()
      .x(d => x(d.year))
      .y0(innerH)
      .y1(d => y(d.count))
      .curve(d3.curveMonotoneX)

    // Line
    const line = d3.line<YearCount>()
      .x(d => x(d.year))
      .y(d => y(d.count))
      .curve(d3.curveMonotoneX)

    // Gradient
    const defs = svg.append('defs')
    const gradient = defs.append('linearGradient')
      .attr('id', 'hero-area-grad')
      .attr('x1', '0').attr('y1', '0')
      .attr('x2', '0').attr('y2', '1')
    gradient.append('stop').attr('offset', '0%').attr('stop-color', '#1a365d').attr('stop-opacity', 0.15)
    gradient.append('stop').attr('offset', '100%').attr('stop-color', '#1a365d').attr('stop-opacity', 0.02)

    // Draw area
    const areaPath = g.append('path')
      .datum(data)
      .attr('d', area)
      .attr('fill', 'url(#hero-area-grad)')

    // Draw line
    const linePath = g.append('path')
      .datum(data)
      .attr('d', line)
      .attr('fill', 'none')
      .attr('stroke', '#1a365d')
      .attr('stroke-width', 2)

    // Animate: clip-path reveal left to right
    const clipRect = defs.append('clipPath').attr('id', 'hero-clip')
      .append('rect')
      .attr('x', 0).attr('y', 0)
      .attr('width', 0).attr('height', height)

    g.attr('clip-path', 'url(#hero-clip)')

    clipRect.transition()
      .duration(2000)
      .ease(d3.easeCubicOut)
      .attr('width', innerW + margin.right)

    // X axis (subtle)
    g.append('g')
      .attr('transform', `translate(0,${innerH})`)
      .call(d3.axisBottom(x).ticks(6).tickFormat(d => String(d)))
      .call(g => g.select('.domain').remove())
      .call(g => g.selectAll('.tick line').attr('stroke', 'var(--border)'))
      .call(g => g.selectAll('.tick text').attr('fill', 'var(--text-tertiary)').attr('font-size', '10px'))

    // Y axis (subtle)
    g.append('g')
      .call(d3.axisLeft(y).ticks(4).tickFormat(d => String(d)))
      .call(g => g.select('.domain').remove())
      .call(g => g.selectAll('.tick line').attr('stroke', 'var(--border)').attr('stroke-dasharray', '2,2').attr('x2', innerW))
      .call(g => g.selectAll('.tick text').attr('fill', 'var(--text-tertiary)').attr('font-size', '10px'))

    // Gold dot at latest point
    const last = data[data.length - 1]
    g.append('circle')
      .attr('cx', x(last.year))
      .attr('cy', y(last.count))
      .attr('r', 4)
      .attr('fill', '#c9a962')
      .attr('opacity', 0)
      .transition()
      .delay(1800)
      .duration(400)
      .attr('opacity', 1)

  }, [data])

  return (
    <div ref={containerRef} className="w-full">
      <svg ref={svgRef} />
      <p className="mt-1 text-center text-[10px] tracking-wide" style={{ color: 'var(--text-tertiary)' }}>
        CLSCI 核心期刊年度发文趋势
      </p>
    </div>
  )
}
