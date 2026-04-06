'use client'

import { useEffect, useRef, useState } from 'react'
import * as d3 from 'd3'
import { NetworkData, TOPIC_COLORS } from './types'

interface SimNode extends d3.SimulationNodeDatum {
  id: string
  count: number
  topic?: string
}

interface SimLink extends d3.SimulationLinkDatum<SimNode> {
  weight: number
}

export function NetworkTab({ data }: { data: NetworkData }) {
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const [highlightNode, setHighlightNode] = useState<string | null>(null)

  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const width = containerRef.current.clientWidth
    const height = 560
    svg.attr('width', width).attr('height', height)

    const maxCount = d3.max(data.nodes, d => d.count) || 1

    const nodes: SimNode[] = data.nodes.map(d => ({ ...d }))
    const nodeIds = new Set(data.nodes.map(d => d.id))
    const links: SimLink[] = data.edges
      .filter(d => nodeIds.has(d.source) && nodeIds.has(d.target))
      .map(d => ({ source: d.source, target: d.target, weight: d.weight }))

    // Compute degree for each node
    const degreeMap = new Map<string, number>()
    links.forEach(l => {
      const s = typeof l.source === 'string' ? l.source : (l.source as SimNode).id
      const t = typeof l.target === 'string' ? l.target : (l.target as SimNode).id
      degreeMap.set(s, (degreeMap.get(s) || 0) + 1)
      degreeMap.set(t, (degreeMap.get(t) || 0) + 1)
    })

    // Cluster coloring
    const clusterColors = data.clusters
      ? (() => {
          const colorMap = new Map<string, string>()
          Object.entries(data.clusters).forEach(([cluster, nodeIds], i) => {
            nodeIds.forEach(id => colorMap.set(id, TOPIC_COLORS[i % TOPIC_COLORS.length]))
          })
          return colorMap
        })()
      : null

    const getNodeColor = (d: SimNode) => {
      if (clusterColors && clusterColors.has(d.id)) return clusterColors.get(d.id)!
      return 'var(--navy)'
    }

    const simulation = d3.forceSimulation<SimNode>(nodes)
      .force('link', d3.forceLink<SimNode, SimLink>(links).id(d => d.id).distance(100))
      .force('charge', d3.forceManyBody().strength(-250))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide<SimNode>().radius(d => 12 + (d.count / maxCount) * 25))

    const g = svg.append('g')

    svg.call(
      d3.zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.3, 3])
        .on('zoom', (event) => g.attr('transform', event.transform))
    )

    // Edges
    const linkSel = g.append('g')
      .selectAll('line')
      .data(links)
      .enter()
      .append('line')
      .attr('stroke', '#d5d0c6')
      .attr('stroke-opacity', 0.5)
      .attr('stroke-width', d => Math.max(0.8, d.weight * 0.7))

    // Nodes
    const nodeSel = g.append('g')
      .selectAll('circle')
      .data(nodes)
      .enter()
      .append('circle')
      .attr('r', d => 6 + (d.count / maxCount) * 20)
      .attr('fill', d => getNodeColor(d))
      .attr('fill-opacity', 0.7)
      .attr('stroke', '#fff')
      .attr('stroke-width', 1.5)
      .style('cursor', 'grab')

    // Hover highlight
    nodeSel
      .on('mouseenter', function (event, d) {
        setHighlightNode(d.id)
        d3.select(this).attr('fill-opacity', 1).attr('stroke-width', 2.5)

        // Highlight connected links
        linkSel.attr('stroke-opacity', l => {
          const s = (l.source as SimNode).id
          const t = (l.target as SimNode).id
          return s === d.id || t === d.id ? 0.9 : 0.1
        }).attr('stroke', l => {
          const s = (l.source as SimNode).id
          const t = (l.target as SimNode).id
          return s === d.id || t === d.id ? 'var(--gold)' : '#d5d0c6'
        })

        // Tooltip
        if (tooltipRef.current) {
          const degree = degreeMap.get(d.id) || 0
          tooltipRef.current.style.display = 'block'
          tooltipRef.current.style.left = `${event.offsetX + 12}px`
          tooltipRef.current.style.top = `${event.offsetY - 10}px`
          tooltipRef.current.innerHTML = `<strong>${d.id}</strong><br/>频次: ${d.count} · 连接: ${degree}`
        }
      })
      .on('mouseleave', function () {
        setHighlightNode(null)
        d3.select(this).attr('fill-opacity', 0.7).attr('stroke-width', 1.5)
        linkSel.attr('stroke-opacity', 0.5).attr('stroke', '#d5d0c6')
        if (tooltipRef.current) tooltipRef.current.style.display = 'none'
      })

    // Drag
    const drag = d3.drag<SVGCircleElement, SimNode>()
      .on('start', (event, d) => {
        if (!event.active) simulation.alphaTarget(0.3).restart()
        d.fx = d.x; d.fy = d.y
      })
      .on('drag', (event, d) => { d.fx = event.x; d.fy = event.y })
      .on('end', (event, d) => {
        if (!event.active) simulation.alphaTarget(0)
        d.fx = null; d.fy = null
      })

    nodeSel.call(drag)

    // Labels
    const labelSel = g.append('g')
      .selectAll('text')
      .data(nodes)
      .enter()
      .append('text')
      .text(d => d.id)
      .attr('font-size', d => `${Math.max(9, 9 + (d.count / maxCount) * 4)}px`)
      .attr('fill', 'var(--text-secondary)')
      .attr('text-anchor', 'middle')
      .attr('dy', d => -(10 + (d.count / maxCount) * 20))
      .style('pointer-events', 'none')

    simulation.on('tick', () => {
      linkSel
        .attr('x1', d => (d.source as SimNode).x!)
        .attr('y1', d => (d.source as SimNode).y!)
        .attr('x2', d => (d.target as SimNode).x!)
        .attr('y2', d => (d.target as SimNode).y!)
      nodeSel.attr('cx', d => d.x!).attr('cy', d => d.y!)
      labelSel.attr('x', d => d.x!).attr('y', d => d.y!)
    })

    return () => { simulation.stop() }
  }, [data])

  return (
    <div ref={containerRef} className="relative overflow-hidden rounded-lg" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
      <div className="border-b px-5 py-3 text-[11px] tracking-wide" style={{ borderColor: 'var(--border)', color: 'var(--text-tertiary)' }}>
        拖拽节点 · 滚轮缩放 · 悬停查看详情 · 节点大小 = 频次 · 边粗细 = 共现强度
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
