'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import * as d3 from 'd3'

interface YearHeatmapProps {
  /** Record<discipline, Record<year, count>> */
  data: Record<string, Record<string, number>>
  disciplines: string[]
}

const CELL_SIZE = 32
const CELL_GAP = 2
const LABEL_WIDTH = 100
const YEAR_LABEL_HEIGHT = 28
const PADDING = { top: 8, right: 16, bottom: 8, left: 8 }

export function YearHeatmap({ data, disciplines }: YearHeatmapProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const [, setTooltipContent] = useState('')

  const hideTooltip = useCallback(() => {
    if (tooltipRef.current) {
      tooltipRef.current.style.display = 'none'
    }
  }, [])

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || !disciplines.length) return

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    // Collect all years across all disciplines
    const yearSet = new Set<string>()
    Object.values(data).forEach(yearMap => {
      Object.keys(yearMap).forEach(y => yearSet.add(y))
    })
    const years = [...yearSet].sort()

    if (!years.length) return

    // Find max for color scale
    let maxCount = 0
    disciplines.forEach(d => {
      years.forEach(y => {
        const v = data[d]?.[y] || 0
        if (v > maxCount) maxCount = v
      })
    })
    maxCount = maxCount || 1

    // Color scale: white to navy
    const colorScale = d3.scaleLinear<string>()
      .domain([0, maxCount])
      .range(['#f5f5f0', '#0f2340'])

    const chartWidth = LABEL_WIDTH + years.length * (CELL_SIZE + CELL_GAP)
    const chartHeight = YEAR_LABEL_HEIGHT + disciplines.length * (CELL_SIZE + CELL_GAP)
    const totalWidth = Math.max(chartWidth + PADDING.left + PADDING.right, containerRef.current.clientWidth)
    const totalHeight = chartHeight + PADDING.top + PADDING.bottom

    svg.attr('width', totalWidth).attr('height', totalHeight)

    const g = svg.append('g')
      .attr('transform', `translate(${PADDING.left},${PADDING.top})`)

    // Discipline labels on left (Y axis)
    disciplines.forEach((disc, i) => {
      g.append('text')
        .text(disc.length > 7 ? disc.slice(0, 7) + '...' : disc)
        .attr('x', LABEL_WIDTH - 6)
        .attr('y', YEAR_LABEL_HEIGHT + i * (CELL_SIZE + CELL_GAP) + CELL_SIZE / 2)
        .attr('text-anchor', 'end')
        .attr('dominant-baseline', 'central')
        .attr('font-size', '11px')
        .attr('fill', 'var(--text-secondary)')
        .append('title')
        .text(disc)
    })

    // Year labels on bottom (X axis)
    years.forEach((year, j) => {
      g.append('text')
        .text(year.length === 4 ? year : year)
        .attr('x', LABEL_WIDTH + j * (CELL_SIZE + CELL_GAP) + CELL_SIZE / 2)
        .attr('y', YEAR_LABEL_HEIGHT - 6)
        .attr('text-anchor', 'middle')
        .attr('font-size', '10px')
        .attr('fill', 'var(--text-tertiary)')
        .attr('transform', `rotate(-45, ${LABEL_WIDTH + j * (CELL_SIZE + CELL_GAP) + CELL_SIZE / 2}, ${YEAR_LABEL_HEIGHT - 6})`)
    })

    // Heatmap cells
    disciplines.forEach((disc, i) => {
      years.forEach((year, j) => {
        const count = data[disc]?.[year] || 0
        const x = LABEL_WIDTH + j * (CELL_SIZE + CELL_GAP)
        const y = YEAR_LABEL_HEIGHT + i * (CELL_SIZE + CELL_GAP)

        g.append('rect')
          .attr('x', x)
          .attr('y', y)
          .attr('width', CELL_SIZE)
          .attr('height', CELL_SIZE)
          .attr('rx', 3)
          .attr('fill', count > 0 ? colorScale(count) : 'var(--bg-surface)')
          .attr('stroke', 'none')
          .style('cursor', 'default')
          .on('mouseenter', function (event) {
            d3.select(this)
              .attr('stroke', 'var(--gold)')
              .attr('stroke-width', 2)

            if (tooltipRef.current) {
              const content = `${disc} · ${year}年：${count} 篇`
              setTooltipContent(content)
              tooltipRef.current.innerHTML = content
              tooltipRef.current.style.display = 'block'
              tooltipRef.current.style.left = `${event.offsetX + 14}px`
              tooltipRef.current.style.top = `${event.offsetY - 8}px`
            }
          })
          .on('mousemove', function (event) {
            if (tooltipRef.current) {
              tooltipRef.current.style.left = `${event.offsetX + 14}px`
              tooltipRef.current.style.top = `${event.offsetY - 8}px`
            }
          })
          .on('mouseleave', function () {
            d3.select(this).attr('stroke', 'none')
            hideTooltip()
          })

        // Show count inside cell if > 0 and cell is large enough
        if (count > 0) {
          g.append('text')
            .text(count)
            .attr('x', x + CELL_SIZE / 2)
            .attr('y', y + CELL_SIZE / 2)
            .attr('text-anchor', 'middle')
            .attr('dominant-baseline', 'central')
            .attr('font-size', '10px')
            .attr('font-family', 'var(--font-mono), monospace')
            .attr('fill', () => {
              const normalized = count / maxCount
              return normalized > 0.35 ? '#ffffff' : 'var(--text-tertiary)'
            })
            .style('pointer-events', 'none')
        }
      })
    })

  }, [data, disciplines, hideTooltip])

  // Compute rendered height
  const yearSet = new Set<string>()
  Object.values(data).forEach(yearMap => {
    Object.keys(yearMap).forEach(y => yearSet.add(y))
  })
  const computedHeight = YEAR_LABEL_HEIGHT + disciplines.length * (CELL_SIZE + CELL_GAP) + PADDING.top + PADDING.bottom

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-x-auto rounded-lg"
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}
    >
      <svg ref={svgRef} style={{ display: 'block', minHeight: computedHeight }} />
      <div
        ref={tooltipRef}
        className="tooltip absolute hidden"
        style={{ position: 'absolute', zIndex: 10, display: 'none' }}
      />
    </div>
  )
}
