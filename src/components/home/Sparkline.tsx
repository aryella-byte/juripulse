'use client'

/**
 * Minimal SVG sparkline — shows a trend line with optional area fill.
 */
export function Sparkline({
  data,
  width = 80,
  height = 28,
  color = 'var(--navy)',
  fillOpacity = 0.08,
}: {
  data: number[]
  width?: number
  height?: number
  color?: string
  fillOpacity?: number
}) {
  if (!data.length) return null

  const max = Math.max(...data, 1)
  const min = Math.min(...data, 0)
  const range = max - min || 1
  const pad = 2

  const points = data.map((v, i) => ({
    x: pad + (i / Math.max(data.length - 1, 1)) * (width - pad * 2),
    y: pad + (1 - (v - min) / range) * (height - pad * 2),
  }))

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ')
  const areaPath = `${linePath} L${points[points.length - 1].x},${height - pad} L${points[0].x},${height - pad} Z`

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <path d={areaPath} fill={color} opacity={fillOpacity} />
      <path d={linePath} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      {/* End dot */}
      <circle cx={points[points.length - 1].x} cy={points[points.length - 1].y} r={2} fill={color} />
    </svg>
  )
}
