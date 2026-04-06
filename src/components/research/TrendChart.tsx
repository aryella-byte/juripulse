'use client'

import { useEffect, useRef, useState, useMemo } from 'react'
import * as d3 from 'd3'

interface TrendChartProps {
  /** Record<keyword, Record<year, count>> */
  data: Record<string, Record<string, number>>
  initialKeywords?: string[]
}

const YEAR_START = 2007
const YEAR_END = 2026
const MARGIN = { top: 24, right: 24, bottom: 36, left: 44 }

// Distinct color palette for lines
const LINE_COLORS = [
  '#1a365d', '#c9a962', '#9c4221', '#285e61', '#553c9a',
  '#9b2c2c', '#276749', '#744210', '#702459', '#2c5282',
  '#975a16', '#6b4226', '#22543d', '#4c1d95', '#831843',
  '#1e40af', '#92400e', '#064e3b', '#7f1d1d', '#4a1d96',
]

export function TrendChart({ data, initialKeywords }: TrendChartProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)

  const allKeywords = useMemo(() => Object.keys(data), [data])

  const [activeKeywords, setActiveKeywords] = useState<Set<string>>(() => {
    if (initialKeywords?.length) return new Set(initialKeywords)
    return new Set(allKeywords.slice(0, 5))
  })

  const years = useMemo(() => {
    const result: number[] = []
    for (let y = YEAR_START; y <= YEAR_END; y++) result.push(y)
    return result
  }, [])

  const toggleKeyword = (kw: string) => {
    setActiveKeywords(prev => {
      const next = new Set(prev)
      if (next.has(kw)) next.delete(kw)
      else next.add(kw)
      return next
    })
  }

  // Color map for consistent keyword coloring
  const colorMap = useMemo(() => {
    const map = new Map<string, string>()
    allKeywords.forEach((kw, i) => {
      map.set(kw, LINE_COLORS[i % LINE_COLORS.length])
    })
    return map
  }, [allKeywords])

  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const width = containerRef.current.clientWidth
    const height = 360
    svg.attr('width', width).attr('height', height)

    const chartWidth = width - MARGIN.left - MARGIN.right
    const chartHeight = height - MARGIN.top - MARGIN.bottom

    // Scales
    const xScale = d3.scaleLinear()
      .domain([YEAR_START, YEAR_END])
      .range([0, chartWidth])

    // Compute y domain from active keywords only
    let yMax = 0
    activeKeywords.forEach(kw => {
      years.forEach(y => {
        const v = data[kw]?.[y.toString()] || 0
        if (v > yMax) yMax = v
      })
    })
    yMax = Math.max(yMax, 1)

    const yScale = d3.scaleLinear()
      .domain([0, yMax * 1.1])
      .range([chartHeight, 0])
      .nice()

    const g = svg.append('g')
      .attr('transform', `translate(${MARGIN.left},${MARGIN.top})`)

    // Grid lines
    const yTicks = yScale.ticks(5)
    g.selectAll('.grid-line')
      .data(yTicks)
      .enter()
      .append('line')
      .attr('x1', 0)
      .attr('x2', chartWidth)
      .attr('y1', d => yScale(d))
      .attr('y2', d => yScale(d))
      .attr('stroke', 'var(--border)')
      .attr('stroke-dasharray', '3,3')
      .attr('stroke-opacity', 0.6)

    // X axis
    const xAxis = d3.axisBottom(xScale)
      .tickValues(years.filter(y => y % 2 === 0))
      .tickFormat(d => d.toString())
      .tickSize(0)

    g.append('g')
      .attr('transform', `translate(0,${chartHeight})`)
      .call(xAxis)
      .call(g => g.select('.domain').attr('stroke', 'var(--border)'))
      .selectAll('text')
      .attr('fill', 'var(--text-tertiary)')
      .attr('font-size', '10px')
      .attr('dy', '12')

    // Y axis
    const yAxis = d3.axisLeft(yScale)
      .ticks(5)
      .tickSize(0)
      .tickFormat(d => d.valueOf().toString())

    g.append('g')
      .call(yAxis)
      .call(g => g.select('.domain').attr('stroke', 'var(--border)'))
      .selectAll('text')
      .attr('fill', 'var(--text-tertiary)')
      .attr('font-size', '10px')

    // Line generator
    const lineGen = d3.line<{ year: number; count: number }>()
      .x(d => xScale(d.year))
      .y(d => yScale(d.count))
      .curve(d3.curveMonotoneX)

    // Draw lines for active keywords
    const activeArr = [...activeKeywords]
    activeArr.forEach(kw => {
      const points = years.map(y => ({
        year: y,
        count: data[kw]?.[y.toString()] || 0,
      }))

      const color = colorMap.get(kw) || 'var(--navy)'

      // Line
      g.append('path')
        .datum(points)
        .attr('d', lineGen)
        .attr('fill', 'none')
        .attr('stroke', color)
        .attr('stroke-width', 2)
        .attr('stroke-opacity', 0.85)
        .attr('stroke-linecap', 'round')

      // Dots
      g.selectAll(`.dot-${kw.replace(/\W/g, '_')}`)
        .data(points)
        .enter()
        .append('circle')
        .attr('cx', d => xScale(d.year))
        .attr('cy', d => yScale(d.count))
        .attr('r', 3)
        .attr('fill', color)
        .attr('fill-opacity', 0)
        .attr('stroke', 'none')
        .on('mouseenter', function (event, d) {
          d3.select(this).attr('fill-opacity', 1).attr('r', 5)
          if (tooltipRef.current) {
            tooltipRef.current.style.display = 'block'
            tooltipRef.current.style.left = `${event.offsetX + 14}px`
            tooltipRef.current.style.top = `${event.offsetY - 10}px`
            tooltipRef.current.innerHTML = `<strong>${kw}</strong><br/>${d.year}年：${d.count} 篇`
          }
        })
        .on('mouseleave', function () {
          d3.select(this).attr('fill-opacity', 0).attr('r', 3)
          if (tooltipRef.current) tooltipRef.current.style.display = 'none'
        })
    })

    // Y axis label
    svg.append('text')
      .text('篇数')
      .attr('x', 8)
      .attr('y', MARGIN.top - 8)
      .attr('font-size', '10px')
      .attr('fill', 'var(--text-tertiary)')

  }, [data, activeKeywords, years, colorMap])

  return (
    <div className="rounded-lg" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
      {/* Keyword toggles */}
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 border-b px-5 py-3" style={{ borderColor: 'var(--border)' }}>
        {allKeywords.map(kw => {
          const color = colorMap.get(kw) || 'var(--navy)'
          const active = activeKeywords.has(kw)
          return (
            <label key={kw} className="flex items-center gap-1.5 text-[12px]" style={{ cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={active}
                onChange={() => toggleKeyword(kw)}
                className="h-3 w-3 rounded border"
                style={{
                  accentColor: color,
                  borderColor: 'var(--border)',
                }}
              />
              <span
                className="h-1.5 w-4 rounded-full"
                style={{ background: color, opacity: active ? 1 : 0.25 }}
              />
              <span style={{ color: active ? 'var(--text-primary)' : 'var(--text-tertiary)' }}>
                {kw}
              </span>
            </label>
          )
        })}
      </div>

      {/* Chart area */}
      <div ref={containerRef} className="relative overflow-hidden px-2 py-2">
        <svg ref={svgRef} className="w-full" style={{ display: 'block' }} />
        <div
          ref={tooltipRef}
          className="tooltip absolute hidden"
          style={{ position: 'absolute', zIndex: 10, display: 'none' }}
        />
      </div>
    </div>
  )
}
