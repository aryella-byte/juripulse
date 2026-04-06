'use client'

import { useEffect, useRef } from 'react'
import * as d3 from 'd3'

interface DisciplineItem {
  name: string
  count: number
}

export function DisciplineTreemap({ data }: { data: DisciplineItem[] }) {
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || !data.length) return

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const width = containerRef.current.clientWidth
    const height = 380
    svg.attr('width', width).attr('height', height)

    const maxCount = d3.max(data, d => d.count) || 1
    const minCount = d3.min(data, d => d.count) || 0

    // Sequential navy palette: light to dark based on count
    const colorScale = d3.scaleLinear<string>()
      .domain([minCount, maxCount])
      .range(['#c7d4e5', '#0f2340'])

    // Build hierarchy for treemap
    type TreeNode = { children?: DisciplineItem[] } & Partial<DisciplineItem>
    const root = d3.hierarchy<TreeNode>({ children: data })
      .sum(d => d.count || 0)
      .sort((a, b) => (b.value || 0) - (a.value || 0))

    const treemapLayout = d3.treemap<TreeNode>()
      .size([width, height])
      .padding(2)
      .round(true)

    treemapLayout(root)

    const leaves = root.leaves() as d3.HierarchyRectangularNode<TreeNode>[]

    // Groups for each cell
    const cell = svg.selectAll('g')
      .data(leaves)
      .enter()
      .append('g')
      .attr('transform', d => `translate(${d.x0},${d.y0})`)

    // Rectangles
    cell.append('rect')
      .attr('width', d => Math.max(0, d.x1 - d.x0))
      .attr('height', d => Math.max(0, d.y1 - d.y0))
      .attr('rx', 3)
      .attr('fill', d => {
        const item = d.data as DisciplineItem
        return colorScale(item.count)
      })
      .attr('fill-opacity', 0.88)
      .style('cursor', 'default')
      .on('mouseenter', function () {
        d3.select(this).attr('fill-opacity', 1).attr('stroke', 'var(--gold)').attr('stroke-width', 2)
      })
      .on('mouseleave', function () {
        d3.select(this).attr('fill-opacity', 0.88).attr('stroke', 'none')
      })

    // Labels: discipline name
    cell.append('text')
      .attr('x', 6)
      .attr('y', 18)
      .text(d => {
        const item = d.data as DisciplineItem
        const cellWidth = d.x1 - d.x0
        // Truncate if cell is too narrow
        if (cellWidth < 50) return ''
        if (cellWidth < 80) return item.name.slice(0, 3) + '...'
        return item.name
      })
      .attr('font-size', d => {
        const cellWidth = d.x1 - d.x0
        const cellHeight = d.y1 - d.y0
        if (cellWidth < 60 || cellHeight < 32) return '10px'
        if (cellWidth < 100) return '11px'
        return '13px'
      })
      .attr('fill', d => {
        const item = d.data as DisciplineItem
        // White text on dark cells, dark text on light cells
        const normalized = (item.count - minCount) / (maxCount - minCount || 1)
        return normalized > 0.4 ? '#ffffff' : 'var(--text-primary)'
      })
      .attr('font-family', "'Noto Serif SC', Georgia, serif")
      .style('pointer-events', 'none')

    // Labels: count
    cell.append('text')
      .attr('x', 6)
      .attr('y', 34)
      .text(d => {
        const item = d.data as DisciplineItem
        const cellWidth = d.x1 - d.x0
        const cellHeight = d.y1 - d.y0
        if (cellWidth < 50 || cellHeight < 40) return ''
        return `${item.count} 篇`
      })
      .attr('font-size', '11px')
      .attr('fill', d => {
        const item = d.data as DisciplineItem
        const normalized = (item.count - minCount) / (maxCount - minCount || 1)
        return normalized > 0.4 ? 'rgba(255,255,255,0.8)' : 'var(--text-tertiary)'
      })
      .attr('font-family', "var(--font-mono), monospace")
      .style('pointer-events', 'none')

  }, [data])

  return (
    <div
      ref={containerRef}
      className="w-full overflow-hidden rounded-lg"
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}
    >
      <svg ref={svgRef} className="w-full" style={{ display: 'block' }} />
    </div>
  )
}
