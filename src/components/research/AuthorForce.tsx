'use client'

import { useEffect, useRef } from 'react'
import * as d3 from 'd3'

interface AuthorNode {
  id: string
  papers: number
  cited: number
  discipline: string
}

interface AuthorEdge {
  source: string
  target: string
  weight: number
}

interface SimNode extends d3.SimulationNodeDatum {
  id: string
  papers: number
  cited: number
  discipline: string
}

interface SimLink extends d3.SimulationLinkDatum<SimNode> {
  weight: number
}

// Discipline color mapping
const DISCIPLINE_COLORS: Record<string, string> = {
  '法学理论': '#1a365d',
  '宪法学与行政法学': '#2a4365',
  '刑法学': '#9c4221',
  '民商法学': '#285e61',
  '诉讼法学': '#744210',
  '经济法学': '#553c9a',
  '环境与资源保护法学': '#276749',
  '国际法学': '#702459',
  '刑事诉讼法学': '#975a16',
  '民事诉讼法学': '#9b2c2c',
  '知识产权法学': '#2c5282',
}

const FALLBACK_COLORS = [
  '#1e3a5f', '#78350f', '#064e3b', '#4a1d96', '#831843',
  '#1e40af', '#92400e', '#6b4226', '#22543d', '#7f1d1d',
]

function getDisciplineColor(discipline: string, dynamicMap: Map<string, string>): string {
  if (DISCIPLINE_COLORS[discipline]) return DISCIPLINE_COLORS[discipline]
  if (dynamicMap.has(discipline)) return dynamicMap.get(discipline)!
  const idx = dynamicMap.size % FALLBACK_COLORS.length
  const color = FALLBACK_COLORS[idx]
  dynamicMap.set(discipline, color)
  return color
}

interface AuthorForceProps {
  nodes: AuthorNode[]
  edges: AuthorEdge[]
}

export function AuthorForce({ nodes, edges }: AuthorForceProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return
    if (!nodes.length) return

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const width = containerRef.current.clientWidth
    const height = 500
    svg.attr('width', width).attr('height', height)

    // Dynamic color map for disciplines not in the static map
    const dynamicColorMap = new Map<string, string>()

    // Collect all disciplines for the legend
    const disciplines = [...new Set(nodes.map(n => n.discipline))]

    // Size scale: sqrt of cited count, clamped [5, 25]
    const citedExtent = d3.extent(nodes, d => d.cited) as [number, number]
    const radiusScale = d3.scaleSqrt()
      .domain([citedExtent[0] || 0, citedExtent[1] || 1])
      .range([5, 25])

    // Edge weight extent for opacity
    const weightExtent = d3.extent(edges, d => d.weight) as [number, number]
    const opacityScale = d3.scaleLinear()
      .domain([weightExtent[0] || 0, weightExtent[1] || 1])
      .range([0.15, 0.7])

    // Prepare simulation data
    const nodeIds = new Set(nodes.map(d => d.id))
    const simNodes: SimNode[] = nodes.map(d => ({ ...d }))
    const simLinks: SimLink[] = edges
      .filter(d => nodeIds.has(d.source) && nodeIds.has(d.target))
      .map(d => ({ source: d.source, target: d.target, weight: d.weight }))

    // Force simulation
    const simulation = d3.forceSimulation<SimNode>(simNodes)
      .force('link', d3.forceLink<SimNode, SimLink>(simLinks)
        .id(d => d.id)
        .distance(80)
        .strength(d => Math.min(1, d.weight * 0.1))
      )
      .force('charge', d3.forceManyBody().strength(-200))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collide', d3.forceCollide<SimNode>().radius(d => radiusScale(d.cited) + 3))

    const g = svg.append('g')

    // Zoom
    svg.call(
      d3.zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.3, 4])
        .on('zoom', (event) => g.attr('transform', event.transform))
    )

    // Edges
    const linkSel = g.append('g')
      .selectAll('line')
      .data(simLinks)
      .enter()
      .append('line')
      .attr('stroke', '#d5d0c6')
      .attr('stroke-opacity', d => opacityScale(d.weight))
      .attr('stroke-width', d => Math.max(0.5, Math.min(3, d.weight * 0.5)))

    // Nodes
    const nodeSel = g.append('g')
      .selectAll('circle')
      .data(simNodes)
      .enter()
      .append('circle')
      .attr('r', d => radiusScale(d.cited))
      .attr('fill', d => getDisciplineColor(d.discipline, dynamicColorMap))
      .attr('fill-opacity', 0.75)
      .attr('stroke', '#fff')
      .attr('stroke-width', 1.5)
      .style('cursor', 'grab')

    // Hover interactions
    nodeSel
      .on('mouseenter', function (event, d) {
        d3.select(this)
          .attr('fill-opacity', 1)
          .attr('stroke-width', 2.5)
          .attr('stroke', 'var(--gold)')

        // Highlight connected edges
        linkSel
          .attr('stroke-opacity', l => {
            const s = (l.source as SimNode).id
            const t = (l.target as SimNode).id
            return s === d.id || t === d.id ? 0.9 : 0.06
          })
          .attr('stroke', l => {
            const s = (l.source as SimNode).id
            const t = (l.target as SimNode).id
            return s === d.id || t === d.id ? 'var(--gold)' : '#d5d0c6'
          })

        // Dim unconnected nodes
        const connectedIds = new Set<string>()
        connectedIds.add(d.id)
        simLinks.forEach(l => {
          const s = (l.source as SimNode).id
          const t = (l.target as SimNode).id
          if (s === d.id) connectedIds.add(t)
          if (t === d.id) connectedIds.add(s)
        })
        nodeSel.attr('fill-opacity', n => connectedIds.has(n.id) ? 0.9 : 0.15)

        // Tooltip
        if (tooltipRef.current) {
          tooltipRef.current.style.display = 'block'
          tooltipRef.current.style.left = `${event.offsetX + 14}px`
          tooltipRef.current.style.top = `${event.offsetY - 12}px`
          tooltipRef.current.innerHTML = [
            `<strong>${d.id}</strong>`,
            `<span style="color:rgba(255,255,255,0.7)">`,
            `发文: ${d.papers} &middot; 被引: ${d.cited}`,
            `<br/>${d.discipline}`,
            `</span>`,
          ].join('')
        }
      })
      .on('mousemove', function (event) {
        if (tooltipRef.current) {
          tooltipRef.current.style.left = `${event.offsetX + 14}px`
          tooltipRef.current.style.top = `${event.offsetY - 12}px`
        }
      })
      .on('mouseleave', function () {
        d3.select(this)
          .attr('fill-opacity', 0.75)
          .attr('stroke-width', 1.5)
          .attr('stroke', '#fff')

        linkSel
          .attr('stroke-opacity', d => opacityScale(d.weight))
          .attr('stroke', '#d5d0c6')

        nodeSel.attr('fill-opacity', 0.75)

        if (tooltipRef.current) tooltipRef.current.style.display = 'none'
      })

    // Drag
    const drag = d3.drag<SVGCircleElement, SimNode>()
      .on('start', (event, d) => {
        if (!event.active) simulation.alphaTarget(0.3).restart()
        d.fx = d.x; d.fy = d.y
      })
      .on('drag', (event, d) => {
        d.fx = event.x; d.fy = event.y
      })
      .on('end', (event, d) => {
        if (!event.active) simulation.alphaTarget(0)
        d.fx = null; d.fy = null
      })

    nodeSel.call(drag)

    // Labels (show for higher-cited authors)
    const citedThreshold = d3.quantile(nodes.map(n => n.cited).sort(d3.ascending), 0.7) || 0
    const labelSel = g.append('g')
      .selectAll('text')
      .data(simNodes.filter(d => d.cited >= citedThreshold))
      .enter()
      .append('text')
      .text(d => d.id)
      .attr('font-size', '10px')
      .attr('fill', 'var(--text-secondary)')
      .attr('text-anchor', 'middle')
      .attr('dy', d => -(radiusScale(d.cited) + 4))
      .style('pointer-events', 'none')
      .style('user-select', 'none')

    // Legend
    const legendG = svg.append('g')
      .attr('transform', `translate(12, ${height - disciplines.length * 18 - 8})`)

    disciplines.forEach((disc, i) => {
      const row = legendG.append('g')
        .attr('transform', `translate(0, ${i * 18})`)

      row.append('circle')
        .attr('cx', 6)
        .attr('cy', 6)
        .attr('r', 5)
        .attr('fill', getDisciplineColor(disc, dynamicColorMap))
        .attr('fill-opacity', 0.8)

      row.append('text')
        .attr('x', 16)
        .attr('y', 10)
        .text(disc)
        .attr('font-size', '10px')
        .attr('fill', 'var(--text-tertiary)')
    })

    // Tick
    simulation.on('tick', () => {
      linkSel
        .attr('x1', d => (d.source as SimNode).x!)
        .attr('y1', d => (d.source as SimNode).y!)
        .attr('x2', d => (d.target as SimNode).x!)
        .attr('y2', d => (d.target as SimNode).y!)

      nodeSel
        .attr('cx', d => d.x!)
        .attr('cy', d => d.y!)

      labelSel
        .attr('x', d => d.x!)
        .attr('y', d => d.y!)
    })

    return () => { simulation.stop() }
  }, [nodes, edges])

  if (!nodes.length) {
    return (
      <div
        className="flex items-center justify-center rounded-lg py-20 text-[13px]"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-tertiary)' }}
      >
        暂无作者网络数据
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="relative overflow-hidden rounded-lg"
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}
    >
      <div
        className="border-b px-5 py-3 text-[11px] tracking-wide"
        style={{ borderColor: 'var(--border)', color: 'var(--text-tertiary)' }}
      >
        作者引证网络 &middot; 节点大小 = 被引次数 &middot; 颜色 = 学科 &middot; 拖拽节点 &middot; 滚轮缩放
      </div>
      <svg ref={svgRef} className="w-full" />
      <div
        ref={tooltipRef}
        className="tooltip absolute hidden"
        style={{ position: 'absolute', zIndex: 10, display: 'none' }}
      />
    </div>
  )
}
