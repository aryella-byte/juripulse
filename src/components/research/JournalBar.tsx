'use client'

import { useEffect, useRef } from 'react'
import * as d3 from 'd3'

interface JournalItem {
  journal: string
  count: number
}

const MAX_BARS = 22
const BAR_HEIGHT = 26
const BAR_GAP = 4
const LABEL_WIDTH = 140
const COUNT_WIDTH = 48
const PADDING = { top: 8, right: 16, bottom: 8, left: 8 }

export function JournalBar({ data }: { data: JournalItem[] }) {
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || !data.length) return

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const sorted = [...data]
      .sort((a, b) => b.count - a.count)
      .slice(0, MAX_BARS)

    const containerWidth = containerRef.current.clientWidth
    const width = containerWidth - PADDING.left - PADDING.right
    const chartHeight = sorted.length * (BAR_HEIGHT + BAR_GAP)
    const totalHeight = chartHeight + PADDING.top + PADDING.bottom

    svg.attr('width', containerWidth).attr('height', totalHeight)

    const maxCount = d3.max(sorted, d => d.count) || 1
    const barAreaWidth = width - LABEL_WIDTH - COUNT_WIDTH

    const xScale = d3.scaleLinear()
      .domain([0, maxCount])
      .range([0, barAreaWidth])

    const g = svg.append('g')
      .attr('transform', `translate(${PADDING.left},${PADDING.top})`)

    const rows = g.selectAll('g.row')
      .data(sorted)
      .enter()
      .append('g')
      .attr('class', 'row')
      .attr('transform', (_, i) => `translate(0,${i * (BAR_HEIGHT + BAR_GAP)})`)

    // Journal name labels (left-aligned, right-justified)
    rows.append('text')
      .text(d => {
        // Truncate long journal names
        return d.journal.length > 10 ? d.journal.slice(0, 10) + '...' : d.journal
      })
      .attr('x', LABEL_WIDTH - 8)
      .attr('y', BAR_HEIGHT / 2)
      .attr('text-anchor', 'end')
      .attr('dominant-baseline', 'central')
      .attr('font-size', '12px')
      .attr('fill', 'var(--text-secondary)')
      .append('title')
      .text(d => d.journal)

    // Background track
    rows.append('rect')
      .attr('x', LABEL_WIDTH)
      .attr('y', 2)
      .attr('width', barAreaWidth)
      .attr('height', BAR_HEIGHT - 4)
      .attr('rx', 3)
      .attr('fill', 'var(--bg-surface)')

    // Data bars
    rows.append('rect')
      .attr('x', LABEL_WIDTH)
      .attr('y', 2)
      .attr('width', 0)
      .attr('height', BAR_HEIGHT - 4)
      .attr('rx', 3)
      .attr('fill', 'var(--navy)')
      .attr('fill-opacity', 0.75)
      .transition()
      .duration(600)
      .delay((_, i) => i * 30)
      .attr('width', d => Math.max(2, xScale(d.count)))

    // Hover interactions (on the row group)
    rows
      .on('mouseenter', function () {
        d3.select(this).select('rect:nth-child(3)')
          .attr('fill-opacity', 1)
          .attr('fill', 'var(--navy)')
      })
      .on('mouseleave', function () {
        d3.select(this).select('rect:nth-child(3)')
          .attr('fill-opacity', 0.75)
          .attr('fill', 'var(--navy)')
      })
      .style('cursor', 'default')

    // Count labels (right side)
    rows.append('text')
      .text(d => d.count.toString())
      .attr('x', LABEL_WIDTH + barAreaWidth + 10)
      .attr('y', BAR_HEIGHT / 2)
      .attr('text-anchor', 'start')
      .attr('dominant-baseline', 'central')
      .attr('font-size', '12px')
      .attr('font-family', 'var(--font-mono), monospace')
      .attr('fill', 'var(--text-tertiary)')

  }, [data])

  const displayCount = Math.min(data.length, MAX_BARS)
  const computedHeight = displayCount * (BAR_HEIGHT + BAR_GAP) + PADDING.top + PADDING.bottom

  return (
    <div
      ref={containerRef}
      className="w-full overflow-hidden rounded-lg"
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}
    >
      <svg ref={svgRef} className="w-full" style={{ display: 'block', height: computedHeight }} />
    </div>
  )
}
