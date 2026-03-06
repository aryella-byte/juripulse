import { useState, useEffect, useRef } from 'react'
import { RotateCcw } from 'lucide-react'
import * as d3 from 'd3'
import { 
  ChapterHeader, 
  BeginnerExplanation, 
  FormulaBox, 
  Checkpoint,
  SectionIntro,
  SectionOutro,
  LegalCaseCard,
  ExperimentContainer,
  useResponsiveSVG,
  ChapterNav
} from './components'
import { ScrollReveal } from './components'

const CHAPTER_COLOR = '#8b5cf6'

// ============================================
// 硬币投掷可视化
// ============================================
function CoinFlipVisualization() {
  const [flips, setFlips] = useState<{ result: 'H' | 'T'; cumProb: number }[]>([])
  const [isFlipping, setIsFlipping] = useState(false)
  const svgRef = useRef<SVGSVGElement>(null)
  const { containerRef, dimensions } = useResponsiveSVG(600, 250)

  const flip = async (count: number) => {
    setIsFlipping(true)
    const newFlips = [...flips]
    
    for (let i = 0; i < count; i++) {
      const result = Math.random() < 0.5 ? 'H' : 'T'
      newFlips.push({ result, cumProb: 0 })
      const heads = newFlips.filter(f => f.result === 'H').length
      const prob = heads / newFlips.length
      newFlips[newFlips.length - 1].cumProb = prob
    }
    
    setFlips(newFlips)
    setIsFlipping(false)
  }

  useEffect(() => {
    if (!svgRef.current || flips.length === 0) return
    
    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()
    
    const { width, height } = dimensions
    const margin = { top: 20, right: 30, bottom: 50, left: 60 }
    const chartWidth = width - margin.left - margin.right
    const chartHeight = height - margin.top - margin.bottom
    
    const x = d3.scaleLinear()
      .domain([1, Math.max(100, flips.length)])
      .range([0, chartWidth])
    
    const y = d3.scaleLinear()
      .domain([0, 1])
      .range([chartHeight, 0])
    
    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`)
    
    // 网格线
    g.append('g')
      .attr('class', 'grid')
      .attr('transform', `translate(0,${chartHeight})`)
      .call(d3.axisBottom(x)
        .ticks(5)
        .tickSize(-chartHeight)
        .tickFormat(() => '')
      )
      .selectAll('line')
      .attr('stroke', 'rgba(0,0,0,0.05)')
      .attr('stroke-dasharray', '2,2')
    
    g.append('g')
      .attr('class', 'grid')
      .call(d3.axisLeft(y)
        .ticks(5)
        .tickSize(-chartWidth)
        .tickFormat(() => '')
      )
      .selectAll('line')
      .attr('stroke', 'rgba(0,0,0,0.05)')
      .attr('stroke-dasharray', '2,2')
    
    // X轴
    g.append('g')
      .attr('transform', `translate(0,${chartHeight})`)
      .call(d3.axisBottom(x).ticks(5))
      .selectAll('text')
      .attr('fill', '#6b6b6b')
      .style('font-size', '12px')
    
    g.select('.domain').remove()
    
    // Y轴
    g.append('g')
      .call(d3.axisLeft(y).ticks(5).tickFormat(d => `${(+d * 100).toFixed(0)}%`))
      .selectAll('text')
      .attr('fill', '#6b6b6b')
      .style('font-size', '12px')
    
    g.select('.domain').remove()
    
    // 理论概率线
    g.append('line')
      .attr('x1', 0)
      .attr('x2', chartWidth)
      .attr('y1', y(0.5))
      .attr('y2', y(0.5))
      .attr('stroke', CHAPTER_COLOR)
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '6,4')
      .attr('opacity', 0.5)
    
    // 数据曲线
    const line = d3.line<{ cumProb: number }>()
      .x((_, i) => x(i + 1))
      .y(d => y(d.cumProb))
      .curve(d3.curveMonotoneX)
    
    // 渐变填充
    const area = d3.area<{ cumProb: number }>()
      .x((_, i) => x(i + 1))
      .y0(chartHeight)
      .y1(d => y(d.cumProb))
      .curve(d3.curveMonotoneX)
    
    const gradientId = `gradient-${Math.random().toString(36).substr(2, 9)}`
    const gradient = svg.append('defs')
      .append('linearGradient')
      .attr('id', gradientId)
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%')
    
    gradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', CHAPTER_COLOR)
      .attr('stop-opacity', 0.3)
    
    gradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', CHAPTER_COLOR)
      .attr('stop-opacity', 0.05)
    
    g.append('path')
      .datum(flips)
      .attr('fill', `url(#${gradientId})`)
      .attr('d', area)
    
    // 主线条
    const path = g.append('path')
      .datum(flips)
      .attr('fill', 'none')
      .attr('stroke', CHAPTER_COLOR)
      .attr('stroke-width', 2.5)
      .attr('d', line)
    
    // 线条动画
    const totalLength = path.node()?.getTotalLength() || 0
    path
      .attr('stroke-dasharray', totalLength + ' ' + totalLength)
      .attr('stroke-dashoffset', totalLength)
      .transition()
      .duration(800)
      .ease(d3.easeCubicOut)
      .attr('stroke-dashoffset', 0)
    
    // 最新点
    if (flips.length > 0) {
      const lastPoint = flips[flips.length - 1]
      g.append('circle')
        .attr('cx', x(flips.length))
        .attr('cy', y(lastPoint.cumProb))
        .attr('r', 5)
        .attr('fill', CHAPTER_COLOR)
        .attr('stroke', 'white')
        .attr('stroke-width', 2)
    }
    
    // 轴标签
    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', -45)
      .attr('x', -chartHeight / 2)
      .attr('text-anchor', 'middle')
      .attr('fill', '#9a9a9a')
      .style('font-size', '12px')
      .text('正面频率')
    
    g.append('text')
      .attr('x', chartWidth / 2)
      .attr('y', chartHeight + 40)
      .attr('text-anchor', 'middle')
      .attr('fill', '#9a9a9a')
      .style('font-size', '12px')
      .text('投掷次数')
    
  }, [flips, dimensions])

  const heads = flips.filter(f => f.result === 'H').length
  const currentProb = flips.length > 0 ? (heads / flips.length * 100).toFixed(1) : '0.0'

  return (
    <div ref={containerRef}>
      {/* 控制按钮 */}
      <div className="flex flex-wrap gap-3 mb-6">
        {[1, 10, 100, 1000].map(n => (
          <button
            key={n}
            onClick={() => flip(n)}
            disabled={isFlipping}
            className="px-5 py-2.5 rounded-lg font-medium text-sm transition-all hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none"
            style={{
              background: CHAPTER_COLOR,
              color: '#1a1a1a',
              boxShadow: `0 4px 14px 0 ${CHAPTER_COLOR}50`
            }}
          >
            投掷 {n} 次
          </button>
        ))}
        
        <button 
          onClick={() => setFlips([])}
          className="px-4 py-2.5 rounded-lg font-medium text-sm bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all"
        >
          <RotateCcw size={16} />
        </button>
      </div>
      
      {/* 统计信息 */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: '总次数', value: flips.length.toLocaleString() },
          { label: '正面', value: heads.toLocaleString() },
          { label: '正面比例', value: `${currentProb}%` },
        ].map((stat, i) => (
          <div 
            key={i}
            className="p-4 rounded-lg text-center"
            style={{ background: 'var(--bg-secondary)' }}
          >
            <div className="text-2xl font-semibold text-gray-900 mb-1">{stat.value}</div>
            <div className="text-xs text-gray-500">{stat.label}</div>
          </div>
        ))}
      </div>
      
      {/* 图表 */}
      <div className="bg-white rounded-xl p-4 border border-black/5">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
          style={{ width: '100%', height: 'auto' }}
        />
      </div>
      
      <p className="mt-4 text-sm text-gray-500 text-center">
        虚线表示理论概率 50%，观察实际频率如何随投掷次数趋近理论值
      </p>
    </div>
  )
}

// ============================================
// 期望值可视化（骰子）
// ============================================
function ExpectationVisualization() {
  const [rolls, setRolls] = useState<number[]>([])
  const [isRolling, setIsRolling] = useState(false)
  const svgRef = useRef<SVGSVGElement>(null)
  const { containerRef, dimensions } = useResponsiveSVG(600, 250)

  const roll = (count: number) => {
    setIsRolling(true)
    const newRolls = [...rolls]
    for (let i = 0; i < count; i++) {
      newRolls.push(Math.floor(Math.random() * 6) + 1)
    }
    setRolls(newRolls)
    setIsRolling(false)
  }

  useEffect(() => {
    if (!svgRef.current || rolls.length === 0) return
    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const { width, height } = dimensions
    const margin = { top: 20, right: 30, bottom: 50, left: 60 }
    const cw = width - margin.left - margin.right
    const ch = height - margin.top - margin.bottom
    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`)

    // 计算滚动均值
    const runningMean = rolls.map((_, i) => {
      const slice = rolls.slice(0, i + 1)
      return slice.reduce((a, b) => a + b, 0) / slice.length
    })

    const x = d3.scaleLinear().domain([1, Math.max(100, rolls.length)]).range([0, cw])
    const y = d3.scaleLinear().domain([1, 6]).range([ch, 0])

    g.append('g').attr('transform', `translate(0,${ch})`).call(d3.axisBottom(x).ticks(5))
      .selectAll('text').attr('fill', '#6b6b6b').style('font-size', '12px')
    g.append('g').call(d3.axisLeft(y).ticks(5))
      .selectAll('text').attr('fill', '#6b6b6b').style('font-size', '12px')

    // 理论期望线 3.5
    g.append('line').attr('x1', 0).attr('x2', cw).attr('y1', y(3.5)).attr('y2', y(3.5))
      .attr('stroke', CHAPTER_COLOR).attr('stroke-width', 2).attr('stroke-dasharray', '6,4').attr('opacity', 0.5)

    const line = d3.line<number>().x((_, i) => x(i + 1)).y(d => y(d)).curve(d3.curveMonotoneX)
    const area = d3.area<number>().x((_, i) => x(i + 1)).y0(ch).y1(d => y(d)).curve(d3.curveMonotoneX)

    g.append('path').datum(runningMean).attr('fill', CHAPTER_COLOR + '20').attr('d', area)
    g.append('path').datum(runningMean).attr('fill', 'none').attr('stroke', CHAPTER_COLOR).attr('stroke-width', 2.5).attr('d', line)

    if (runningMean.length > 0) {
      g.append('circle').attr('cx', x(rolls.length)).attr('cy', y(runningMean[runningMean.length - 1]))
        .attr('r', 5).attr('fill', CHAPTER_COLOR).attr('stroke', 'white').attr('stroke-width', 2)
    }

    g.append('text').attr('transform', 'rotate(-90)').attr('y', -45).attr('x', -ch / 2)
      .attr('text-anchor', 'middle').attr('fill', '#9a9a9a').style('font-size', '12px').text('样本均值')
    g.append('text').attr('x', cw / 2).attr('y', ch + 40)
      .attr('text-anchor', 'middle').attr('fill', '#9a9a9a').style('font-size', '12px').text('投掷次数')
  }, [rolls, dimensions])

  const currentMean = rolls.length > 0 ? (rolls.reduce((a, b) => a + b, 0) / rolls.length).toFixed(3) : '—'

  return (
    <div ref={containerRef}>
      <div className="flex flex-wrap gap-3 mb-6">
        {[1, 10, 100, 1000].map(n => (
          <button key={n} onClick={() => roll(n)} disabled={isRolling}
            className="px-5 py-2.5 rounded-lg font-medium text-sm transition-all hover:shadow-md disabled:opacity-50"
            style={{ background: CHAPTER_COLOR, color: '#1a1a1a', boxShadow: `0 4px 14px 0 ${CHAPTER_COLOR}50` }}>
            投掷 {n} 次
          </button>
        ))}
        <button onClick={() => setRolls([])}
          className="px-4 py-2.5 rounded-lg font-medium text-sm bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 transition-all">
          <RotateCcw size={16} />
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: '总次数', value: rolls.length.toLocaleString() },
          { label: '当前样本均值', value: currentMean },
          { label: '理论期望值', value: '3.500' },
        ].map((s, i) => (
          <div key={i} className="p-4 rounded-lg text-center" style={{ background: 'var(--bg-secondary)' }}>
            <div className="text-2xl font-semibold text-gray-900 mb-1">{s.value}</div>
            <div className="text-xs text-gray-500">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl p-4 border border-black/5">
        <svg ref={svgRef} viewBox={`0 0 ${dimensions.width} ${dimensions.height}`} style={{ width: '100%', height: 'auto' }} />
      </div>
      <p className="mt-4 text-sm text-gray-500 text-center">虚线表示理论期望值 E(X) = 3.5</p>
    </div>
  )
}

// ============================================
// 方差可视化
// ============================================
function VarianceVisualization() {
  const [dist, setDist] = useState<'uniform' | 'bimodal' | 'concentrated'>('uniform')
  const [samples, setSamples] = useState<number[]>([])

  const generate = (type: typeof dist) => {
    const arr: number[] = []
    for (let i = 0; i < 500; i++) {
      if (type === 'uniform') {
        arr.push(Math.floor(Math.random() * 6) + 1)
      } else if (type === 'bimodal') {
        arr.push(Math.random() < 0.5 ? (Math.random() < 0.8 ? 1 : 2) : (Math.random() < 0.8 ? 6 : 5))
      } else {
        const r = Math.random()
        if (r < 0.1) arr.push(2)
        else if (r < 0.2) arr.push(4)
        else if (r < 0.8) arr.push(3)
        else if (r < 0.9) arr.push(4)
        else arr.push(5)
      }
    }
    setSamples(arr)
    setDist(type)
  }

  useEffect(() => { generate('uniform') }, [])

  const mean = samples.length > 0 ? samples.reduce((a, b) => a + b, 0) / samples.length : 0
  const variance = samples.length > 0 ? samples.reduce((a, b) => a + (b - mean) ** 2, 0) / samples.length : 0

  // Count frequencies
  const counts = [1, 2, 3, 4, 5, 6].map(v => samples.filter(s => s === v).length)

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-6">
        {[
          { key: 'uniform' as const, label: '均匀骰子（高方差）' },
          { key: 'concentrated' as const, label: '集中分布（低方差）' },
          { key: 'bimodal' as const, label: '两极分布（最高方差）' },
        ].map(d => (
          <button key={d.key} onClick={() => generate(d.key)}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
            style={{ background: dist === d.key ? CHAPTER_COLOR : '#f3f4f6', color: dist === d.key ? '#1a1a1a' : '#6b7280' }}>
            {d.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="p-4 rounded-lg text-center" style={{ background: 'var(--bg-secondary)' }}>
          <div className="text-2xl font-semibold text-gray-900 mb-1">{mean.toFixed(2)}</div>
          <div className="text-xs text-gray-500">均值 E(X)</div>
        </div>
        <div className="p-4 rounded-lg text-center" style={{ background: CHAPTER_COLOR + '20' }}>
          <div className="text-2xl font-semibold mb-1" style={{ color: CHAPTER_COLOR }}>{variance.toFixed(2)}</div>
          <div className="text-xs text-gray-500">方差 Var(X)</div>
        </div>
        <div className="p-4 rounded-lg text-center" style={{ background: 'var(--bg-secondary)' }}>
          <div className="text-2xl font-semibold text-gray-900 mb-1">{Math.sqrt(variance).toFixed(2)}</div>
          <div className="text-xs text-gray-500">标准差 σ</div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-4 border border-black/5">
        <div className="flex items-end justify-center gap-2" style={{ height: 150 }}>
          {[1, 2, 3, 4, 5, 6].map((v, i) => {
            const maxCount = Math.max(...counts, 1)
            const h = (counts[i] / maxCount) * 120
            return (
              <div key={v} className="flex flex-col items-center gap-1">
                <span className="text-xs text-gray-500">{counts[i]}</span>
                <div className="w-10 rounded-t-md transition-all duration-300" style={{ height: h, background: CHAPTER_COLOR, opacity: 0.7 }} />
                <span className="text-sm font-medium text-gray-700">{v}</span>
              </div>
            )
          })}
        </div>
      </div>
      <p className="mt-4 text-sm text-gray-500 text-center">比较不同分布的方差大小。方差越大，数据越分散。</p>
    </div>
  )
}

// ============================================
// DNA证据案例
// ============================================
function DNAEvidenceCase() {
  const [databaseSize, setDatabaseSize] = useState(1000000)
  const [logMatchProb, setLogMatchProb] = useState(6) // 10^(-6) = 百万分之一

  const randomMatchProb = Math.pow(10, -logMatchProb)

  // 一个案件只有一个真凶
  // 在数据库中搜索时，任一特定人是真凶的先验概率 = 1/N
  const prior = 1 / databaseSize
  // P(DNA匹配|真凶) = 1，P(DNA匹配|无辜) = randomMatchProb
  const pMatch = 1 * prior + randomMatchProb * (1 - prior)
  const posteriorProb = pMatch > 0 ? (1 * prior) / pMatch : 0
  // 预期无辜匹配人数
  const expectedFalseMatches = (databaseSize - 1) * randomMatchProb

  const sliders = [
    {
      label: 'DNA数据库人数',
      value: databaseSize,
      set: setDatabaseSize,
      min: 10000,
      max: 10000000,
      step: 10000,
      fmt: (v: number) => `${(v/10000).toFixed(0)}万`
    },
    {
      label: 'DNA随机匹配概率',
      value: logMatchProb,
      set: setLogMatchProb,
      min: 3,
      max: 9,
      step: 1,
      fmt: (v: number) => `1/${Math.pow(10, v).toLocaleString()}`
    }
  ]

  return (
    <LegalCaseCard title="DNA数据库搜索与检察官谬误" type="criminal" color={CHAPTER_COLOR}>
      <p className="text-gray-600 leading-relaxed mb-6">
        某市发生一起命案，警方提取了犯罪现场的DNA样本，随后在DNA数据库中进行比对搜索，
        发现一人的DNA与现场样本匹配。检察官称："随机匹配概率仅为百万分之一，
        因此被告几乎必然有罪。"这一推理正确吗？
      </p>

      <div className="space-y-5 mb-8">
        {sliders.map(p => {
          const percentage = ((p.value - p.min) / (p.max - p.min)) * 100

          return (
            <div key={p.label}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">{p.label}</span>
                <span className="text-sm font-mono text-gray-900 bg-gray-100 px-2 py-0.5 rounded">
                  {p.fmt(p.value)}
                </span>
              </div>

              <input
                type="range"
                min={p.min}
                max={p.max}
                step={p.step}
                value={p.value}
                onChange={e => p.set(+e.target.value)}
                className="custom-slider w-full"
                style={{ '--value': `${percentage}%`, '--c1': CHAPTER_COLOR } as React.CSSProperties}
              />
            </div>
          )
        })}
      </div>

      <div
        className="p-6 rounded-xl mb-6"
        style={{ background: 'var(--bg-secondary)' }}
      >
        <h4 className="font-semibold text-gray-800 mb-4">贝叶斯分析</h4>

        <div className="space-y-3 text-sm">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">先验概率 P(此人是真凶)</span>
            <span className="font-mono font-medium">1/{databaseSize.toLocaleString()}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-gray-600">预期无辜匹配人数</span>
            <span className="font-mono font-medium">{expectedFalseMatches.toFixed(1)} 人</span>
          </div>

          <div className="h-px bg-gray-200 my-3" />

          <div className="flex justify-between items-center">
            <span className="font-medium text-gray-800">该匹配者是真凶的概率</span>
            <span
              className="font-mono text-xl font-bold"
              style={{ color: CHAPTER_COLOR }}
            >
              {(posteriorProb * 100).toFixed(2)}%
            </span>
          </div>
        </div>
      </div>

      <div
        className="p-4 rounded-xl flex items-start gap-3"
        style={{ background: 'rgba(245, 243, 0, 0.1)', border: '1px solid rgba(245, 243, 0, 0.2)' }}
      >
        <span className="text-xl">💡</span>
        <div>
          <strong className="text-gray-800">检察官谬误：</strong>
          <span className="text-gray-600">
            检察官将"随机匹配概率"P(匹配|无辜)直接等同于"无辜概率"P(无辜|匹配)，
            忽略了数据库搜索中的多重比较。在{(databaseSize/10000).toFixed(0)}万人的数据库中搜索，
            即使随机匹配概率仅{`1/${Math.pow(10, logMatchProb).toLocaleString()}`}，
            也预期有约{expectedFalseMatches.toFixed(1)}名无辜者被错误匹配。
            DNA证据必须结合其他证据综合判断。
          </span>
        </div>
      </div>
    </LegalCaseCard>
  )
}

// ============================================
// 懒加载可视化包装器
// ============================================
function LazyVisualization({ children }: { children: React.ReactNode }) {
  const [loaded, setLoaded] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setLoaded(true)
        observer.disconnect()
      }
    }, { threshold: 0.1, rootMargin: '100px' })
    
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])
  
  return (
    <div ref={ref} style={{ minHeight: 200 }}>
      {loaded ? children : (
        <div 
          className="h-48 flex items-center justify-center rounded-xl"
          style={{ background: 'var(--bg-secondary)' }}
        >
          <div className="flex items-center gap-3 text-gray-400">
            <div 
              className="w-5 h-5 rounded-full animate-pulse"
              style={{ background: CHAPTER_COLOR }}
            />
            <span>加载可视化...</span>
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================
// 主页面
// ============================================
export default function Chapter1() {
  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <ChapterHeader
        chapterNumber={1}
        title="基础概率"
        subtitle="Basic Probability"
        description="探索概率的本质、大数定律，以及概率思维在证据评价中的法律应用"
        color={CHAPTER_COLOR}
        nextChapter={2}
      />

      <main className="max-w-4xl mx-auto px-4 md:px-6 py-12 md:py-16">
        <SectionIntro
          chapterColor={CHAPTER_COLOR}
          prerequisites={['无（本章为学习起点）']}
          learningGoals={[
            '理解概率的本质和基本性质（柯尔莫哥洛夫公理）',
            '掌握大数定律的直观含义和数学表达',
            '通过交互实验验证大数定律',
            '理解概率思维在法律证据评价中的重要性',
            '识别并避免基础概率谬误'
          ]}
          overview={
            <>
              <p className="mb-3">
                本章从<strong>抛硬币实验</strong>开始，通过交互式可视化让你直观感受概率和大数定律。
              </p>
              <p>
                随后，我们将通过一个<strong>DNA证据案例</strong>，揭示为什么高准确率的检测在司法实践中仍可能导致误判，
                引出概率思维在法律中的核心作用。
              </p>
            </>
          }
        />

        <BeginnerExplanation title="🤔 初学者指南">
          <div className="space-y-4">
            <p>
              <strong>概率</strong>是事件发生可能性的数值度量，取值范围在 0（不可能）到 1（必然）之间。
              例如，抛硬币正面朝上的概率是 0.5。
            </p>
            
            <p>
              <strong>大数定律</strong>告诉我们：试验次数越多，实际结果越接近理论预期。
              抛10次硬币可能7次正面，但抛10000次，正面比例会非常接近50%。
            </p>
            
            <p>
              <strong>基础概率（先验概率）</strong>是在看到任何证据之前，事件发生的概率。
              忽略它会导致严重的误判——这正是"检察官谬误"的根源。
            </p>
          </div>
        </BeginnerExplanation>

        <ScrollReveal>
          <div className="pt-4">
            <h2 className="text-2xl font-bold mb-6 text-gray-900">什么是概率？</h2>
            
            <p className="text-gray-600 leading-relaxed mb-6">
              概率是衡量某个事件发生可能性的数值，取值范围在 0（不可能）到 1（必然）之间。
              在法学中，概率思维对于证据评价至关重要——它帮助我们量化不确定性，避免直觉判断的偏差。
            </p>
          </div>
        </ScrollReveal>

        <FormulaBox 
          title="概率的基本性质（柯尔莫哥洛夫公理）" 
          latex={"P(A) \\geq 0, P(\\Omega)=1"}
          number="1.1"
        >
          <ul className="space-y-2 text-gray-700">
            <li className="flex items-start gap-2">
              <span className="font-semibold" style={{ color: CHAPTER_COLOR }}>非负性：</span>
              <span>对于任意事件 A，P(A) ≥ 0</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-semibold" style={{ color: CHAPTER_COLOR }}>规范性：</span>
              <span>必然事件的概率 P(Ω) = 1</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-semibold" style={{ color: CHAPTER_COLOR }}>可列可加性：</span>
              <span>互斥事件的并集概率等于概率之和</span>
            </li>
          </ul>
        </FormulaBox>

        <FormulaBox 
          title="大数定律（Law of Large Numbers）" 
          latex={"\\lim_{n \\to \\infty} P(|S_n/n - \\mu| < \\epsilon) = 1"}
          number="1.2"
        >
          <p className="text-gray-700">
            随着独立重复试验次数的增加，事件发生的频率会趋近于其理论概率。
            这是统计推断的理论基础，也是司法统计中抽样调查的数学依据。
          </p>
        </FormulaBox>

        <ExperimentContainer title="交互实验：投掷硬币与大数定律" icon="🎲">
          <p className="text-gray-600 leading-relaxed mb-6">
            点击下方按钮进行硬币投掷实验。观察：随着投掷次数增加，正面出现的频率如何变化？
            尝试投掷 1000 次，看看结果是否趋近于 50%。
          </p>
          
          <LazyVisualization>
            <CoinFlipVisualization />
          </LazyVisualization>
          
          <div className="mt-6">
            <Checkpoint type="try">
              <div className="space-y-3">
                <p className="font-medium">实验任务：</p>
                <ol className="list-decimal list-inside space-y-2 pl-2">
                  <li>先投掷10次，记录正面比例</li>
                  <li>再投掷100次，观察正面比例的变化</li>
                  <li>最后投掷1000次，看正面比例是否接近50%</li>
                  <li>思考：为什么大数定律对法律抽样调查很重要？</li>
                </ol>
              </div>
            </Checkpoint>
          </div>
        </ExperimentContainer>

        <ScrollReveal>
          <div className="pt-4">
            <h2 className="text-2xl font-bold mb-6 text-gray-900">期望值</h2>
            <p className="text-gray-600 leading-relaxed mb-6">
              期望值（数学期望）是随机变量所有可能值的概率加权平均，反映分布的"中心位置"。
              对于公平骰子，期望值 E(X) = (1+2+3+4+5+6)/6 = 3.5。
            </p>
          </div>
        </ScrollReveal>

        <FormulaBox
          title="离散随机变量的期望值"
          latex={"E(X) = \\sum_{i} x_i \\cdot P(X = x_i)"}
          number="1.3"
        >
          <p className="text-gray-700">
            期望值是所有可能结果的概率加权平均。投掷公平骰子的理论期望为 3.5。
            随着试验次数增加，样本均值趋近于理论期望值。
          </p>
        </FormulaBox>

        <ExperimentContainer title="交互实验：骰子期望值" icon="🎲">
          <p className="text-gray-600 leading-relaxed mb-6">
            重复投掷骰子，观察样本均值如何逐渐趋近理论期望值 3.5。
          </p>
          <LazyVisualization>
            <ExpectationVisualization />
          </LazyVisualization>
        </ExperimentContainer>

        <ScrollReveal>
          <div className="pt-4">
            <h2 className="text-2xl font-bold mb-6 text-gray-900">方差</h2>
            <p className="text-gray-600 leading-relaxed mb-6">
              方差衡量随机变量偏离期望值的离散程度。
              方差越大，数据越分散；方差越小，数据越集中在均值附近。
            </p>
          </div>
        </ScrollReveal>

        <FormulaBox
          title="方差"
          latex={"\\text{Var}(X) = E[(X - \\mu)^2] = \\sum_{i} (x_i - \\mu)^2 \\cdot P(X = x_i)"}
          number="1.4"
        >
          <p className="text-gray-700">
            方差是随机变量与期望值之差的平方的期望。标准差 σ 是方差的平方根，
            与原始数据具有相同量纲，更便于解释。
          </p>
        </FormulaBox>

        <ExperimentContainer title="交互实验：方差比较" icon="📊">
          <p className="text-gray-600 leading-relaxed mb-6">
            选择不同的概率分布，观察方差的变化。注意方差如何反映数据的离散程度。
          </p>
          <LazyVisualization>
            <VarianceVisualization />
          </LazyVisualization>
        </ExperimentContainer>

        <div className="pt-4">
          <LazyVisualization>
            <DNAEvidenceCase />
          </LazyVisualization>
        </div>

        <Checkpoint type="think">
          <div className="space-y-3">
            <p className="font-medium">思考问题：</p>
            <p>如果你是陪审团成员，听到"DNA检测准确率99.9%"的证据，你会如何评估？</p>
            <p>你会追问哪些问题来确保正确理解这一证据的证明力？</p>
          </div>
        </Checkpoint>

        <div className="pt-4">
          <SectionOutro
            keyPoints={[
              '概率量化不确定性，取值范围为 [0, 1]，遵循柯尔莫哥洛夫公理',
              '大数定律表明：频率随试验次数增加趋近于理论概率',
              '期望值是分布的"中心"，方差衡量数据的离散程度',
              '法律应用：证据评价不能仅凭直觉，需要考虑基础概率（先验概率）',
              '检察官谬误：混淆 P(证据|有罪) 与 P(有罪|证据)，DNA证据需结合其他证据综合判断'
            ]}
            question="警方在一个DNA数据库（100万人）中搜索到一个匹配，随机匹配概率为百万分之一。检察官声称'被告几乎必然有罪'。请用贝叶斯定理计算该匹配者真正是罪犯的概率。"
            hint="先验概率 P(真凶) = 1/1,000,000。P(匹配|真凶) = 1，P(匹配|无辜) = 1/1,000,000。用贝叶斯定理：P(真凶|匹配) ≈ 50%，远非'几乎必然有罪'！"
          />
        </div>

        <ChapterNav 
          nextChapter={{ number: 2, title: '复合概率' }}
        />
      </main>
    </div>
  )
}
