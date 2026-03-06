import { useEffect, useRef, useState } from 'react'
import { RotateCcw, Calculator } from 'lucide-react'
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
  ChapterNav
} from './components'
import { ScrollReveal } from './components'

const CHAPTER_COLOR = '#10b981'

// ============================================
// 置信区间可视化
// ============================================
function ConfidenceIntervalVisualization() {
  const [sampleSize, setSampleSize] = useState(30)
  const [confidence, setConfidence] = useState(0.95)
  const [samples, setSamples] = useState<{ mean: number; lower: number; upper: number; containsTrue: boolean }[]>([])

  const trueMean = 50
  const trueStd = 10

  const generateSamples = () => {
    const newSamples: { mean: number; lower: number; upper: number; containsTrue: boolean }[] = []
    const zScore = confidence === 0.9 ? 1.645 : confidence === 0.95 ? 1.96 : 2.576

    for (let i = 0; i < 50; i++) {
      let sum = 0
      for (let j = 0; j < sampleSize; j++) {
        // 生成正态分布随机数（Box-Muller变换）
        const u1 = Math.random()
        const u2 = Math.random()
        const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
        sum += trueMean + trueStd * z
      }
      const mean = sum / sampleSize
      const se = trueStd / Math.sqrt(sampleSize)
      const margin = zScore * se

      newSamples.push({
        mean,
        lower: mean - margin,
        upper: mean + margin,
        containsTrue: mean - margin <= trueMean && trueMean <= mean + margin
      })
    }
    setSamples(newSamples)
  }

  useEffect(() => {
    generateSamples()
  }, [sampleSize, confidence])

  const coverage = samples.filter(s => s.containsTrue).length / samples.length * 100

  return (
    <div>
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <div>
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">样本量 n</span>
            <span className="text-sm font-mono bg-gray-100 px-2 py-0.5 rounded">{sampleSize}</span>
          </div>
          <input
            type="range"
            min="5"
            max="100"
            value={sampleSize}
            onChange={(e) => setSampleSize(parseInt(e.target.value))}
            className="custom-slider w-full"
            style={{ '--c1': CHAPTER_COLOR } as React.CSSProperties}
          />
        </div>

        <div>
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">置信水平</span>
            <span className="text-sm font-mono bg-gray-100 px-2 py-0.5 rounded">{(confidence * 100).toFixed(0)}%</span>
          </div>
          <select
            value={confidence}
            onChange={(e) => setConfidence(parseFloat(e.target.value))}
            className="w-full p-2 text-sm border border-gray-200 rounded-lg"
          >
            <option value={0.9}>90%</option>
            <option value={0.95}>95%</option>
            <option value={0.99}>99%</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4">
        <ConfidenceIntervalPlot 
          samples={samples} 
          trueMean={trueMean} 
          color={CHAPTER_COLOR} 
        />
      </div>

      <div className="flex justify-between items-center">
        <div className="text-sm">
          <span className="text-gray-600">覆盖真实均值的比例：</span>
          <span className="font-bold ml-1" style={{ color: CHAPTER_COLOR }}>{coverage.toFixed(1)}%</span>
        </div>
        <button
          onClick={generateSamples}
          className="px-4 py-2 rounded-lg text-sm font-medium text-white transition-all hover:shadow-md"
          style={{ background: CHAPTER_COLOR }}
        >
          重新抽样
        </button>
      </div>

      <p className="mt-4 text-sm text-gray-500">
        每条横线代表一个样本的置信区间。红色线表示未覆盖真实均值（{trueMean}），
        绿色线表示覆盖。增加样本量可以缩小区间宽度。
      </p>
    </div>
  )
}

// 置信区间图
function ConfidenceIntervalPlot({ 
  samples, 
  trueMean, 
  color 
}: { 
  samples: { mean: number; lower: number; upper: number; containsTrue: boolean }[],
  trueMean: number,
  color: string
}) {
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (!svgRef.current || samples.length === 0) return

    const svg = d3.select(svgRef.current)
    svg.selectAll("*").remove()

    const margin = { top: 20, right: 30, bottom: 40, left: 60 }
    const width = 600 - margin.left - margin.right
    const height = 400 - margin.top - margin.bottom

    const g = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`)

    const xExtent = d3.extent(samples.flatMap(s => [s.lower, s.upper])) as [number, number]
    const xScale = d3.scaleLinear()
      .domain([Math.max(20, xExtent[0] - 5), Math.min(80, xExtent[1] + 5)])
      .range([0, width])

    const yScale = d3.scaleLinear()
      .domain([0, samples.length])
      .range([0, height])

    // 真实均值线
    g.append("line")
      .attr("x1", xScale(trueMean))
      .attr("x2", xScale(trueMean))
      .attr("y1", 0)
      .attr("y2", height)
      .attr("stroke", "#374151")
      .attr("stroke-width", 2)
      .attr("stroke-dasharray", "5,5")

    g.append("text")
      .attr("x", xScale(trueMean))
      .attr("y", -5)
      .attr("text-anchor", "middle")
      .attr("fill", "#374151")
      .attr("font-size", "11px")
      .attr("font-weight", "bold")
      .text(`真实均值 = ${trueMean}`)

    // 置信区间线
    samples.forEach((s, i) => {
      g.append("line")
        .attr("x1", xScale(s.lower))
        .attr("x2", xScale(s.upper))
        .attr("y1", yScale(i))
        .attr("y2", yScale(i))
        .attr("stroke", s.containsTrue ? color : '#ef4444')
        .attr("stroke-width", 1.5)
        .attr("opacity", 0.7)

      // 样本均值点
      g.append("circle")
        .attr("cx", xScale(s.mean))
        .attr("cy", yScale(i))
        .attr("r", 2)
        .attr("fill", s.containsTrue ? color : '#ef4444')
    })

    g.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(xScale))
      .attr("color", "#6B7280")

    g.append("text")
      .attr("x", width / 2)
      .attr("y", height + 35)
      .attr("text-anchor", "middle")
      .attr("fill", "#6B7280")
      .attr("font-size", "12px")
      .text("样本值")

  }, [samples, trueMean, color])

  return <svg ref={svgRef} viewBox="0 0 600 400" style={{ width: '100%', height: 'auto' }} />
}

// ============================================
// 假设检验可视化
// ============================================
function HypothesisTestVisualization() {
  const [effectSize, setEffectSize] = useState(0.5)
  const [sampleSize, setSampleSize] = useState(30)
  const [alpha, _setAlpha] = useState(0.05)

  // 计算检验力
  const se = 1 / Math.sqrt(sampleSize)
  const criticalValue = 1.96 * se
  const power = 1 - normalCDF((criticalValue - effectSize) / se)

  return (
    <div>
      <div className="space-y-5 mb-6">
        <div>
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">效应量 (Cohen's d)</span>
            <span className="text-sm font-mono bg-gray-100 px-2 py-0.5 rounded">{effectSize.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min="0.2"
            max="1.0"
            step="0.1"
            value={effectSize}
            onChange={(e) => setEffectSize(parseFloat(e.target.value))}
            className="custom-slider w-full"
            style={{ '--c1': CHAPTER_COLOR } as React.CSSProperties}
          />
        </div>

        <div>
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">样本量</span>
            <span className="text-sm font-mono bg-gray-100 px-2 py-0.5 rounded">{sampleSize}</span>
          </div>
          <input
            type="range"
            min="10"
            max="100"
            value={sampleSize}
            onChange={(e) => setSampleSize(parseInt(e.target.value))}
            className="custom-slider w-full"
            style={{ '--c1': CHAPTER_COLOR } as React.CSSProperties}
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-6 mb-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 rounded-lg" style={{ background: 'var(--bg-secondary)' }}>
            <div className="text-2xl font-bold text-gray-900">{(power * 100).toFixed(1)}%</div>
            <div className="text-xs text-gray-500">检验力</div>
          </div>
          <div className="text-center p-4 rounded-lg" style={{ background: 'var(--bg-secondary)' }}>
            <div className="text-2xl font-bold text-gray-900">{(alpha * 100).toFixed(0)}%</div>
            <div className="text-xs text-gray-500">显著性水平 α</div>
          </div>
          <div className="text-center p-4 rounded-lg" style={{ background: 'var(--bg-secondary)' }}>
            <div className="text-2xl font-bold text-gray-900">{effectSize}</div>
            <div className="text-xs text-gray-500">效应量</div>
          </div>
          <div className="text-center p-4 rounded-lg" style={{ background: 'var(--bg-secondary)' }}>
            <div className="text-2xl font-bold text-gray-900">{sampleSize}</div>
            <div className="text-xs text-gray-500">样本量</div>
          </div>
        </div>
      </div>

      <div className="p-4 rounded-lg bg-blue-50 border border-blue-100">
        <p className="text-sm text-gray-700">
          <strong>解释：</strong>检验力 {(power * 100).toFixed(1)}% 表示如果真实效应量为 {effectSize}，
          我们有 {(power * 100).toFixed(1)}% 的概率能检测到显著差异。
          通常建议检验力至少达到 80%。
        </p>
      </div>
    </div>
  )
}

// 标准正态CDF
function normalCDF(x: number): number {
  return 0.5 * (1 + erf(x / Math.sqrt(2)))
}

function erf(x: number): number {
  const sign = x >= 0 ? 1 : -1
  x = Math.abs(x)
  const a1 = 0.254829592
  const a2 = -0.284496736
  const a3 = 1.421413741
  const a4 = -1.453152027
  const a5 = 1.061405429
  const p = 0.3275911
  const t = 1 / (1 + p * x)
  const y = 1 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x)
  return sign * y
}

// ============================================
// Bootstrap 可视化
// ============================================
function BootstrapVisualization() {
  const [originalData] = useState(() => {
    const data: number[] = []
    for (let i = 0; i < 20; i++) {
      const u1 = Math.random(), u2 = Math.random()
      const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
      data.push(Math.round((50 + 10 * z) * 10) / 10)
    }
    return data
  })
  const [bootstrapMeans, setBootstrapMeans] = useState<number[]>([])
  const svgRef = useRef<SVGSVGElement>(null)

  const runBootstrap = (times: number) => {
    const means: number[] = []
    for (let b = 0; b < times; b++) {
      let sum = 0
      for (let i = 0; i < originalData.length; i++) {
        sum += originalData[Math.floor(Math.random() * originalData.length)]
      }
      means.push(sum / originalData.length)
    }
    setBootstrapMeans(prev => [...prev, ...means])
  }

  useEffect(() => {
    if (!svgRef.current || bootstrapMeans.length === 0) return
    const svg = d3.select(svgRef.current)
    svg.selectAll("*").remove()

    const margin = { top: 20, right: 30, bottom: 40, left: 50 }
    const width = 500 - margin.left - margin.right
    const height = 250 - margin.top - margin.bottom
    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`)

    const xExtent = d3.extent(bootstrapMeans) as [number, number]
    const histogram = d3.bin().domain(xExtent).thresholds(25)
    const bins = histogram(bootstrapMeans)

    const xScale = d3.scaleLinear().domain(xExtent).range([0, width])
    const yScale = d3.scaleLinear().domain([0, d3.max(bins, d => d.length) || 0]).range([height, 0])

    g.selectAll("rect").data(bins).enter().append("rect")
      .attr("x", d => xScale(d.x0 || 0))
      .attr("y", d => yScale(d.length))
      .attr("width", d => Math.max(0, xScale(d.x1 || 0) - xScale(d.x0 || 0) - 1))
      .attr("height", d => height - yScale(d.length))
      .attr("fill", CHAPTER_COLOR).attr("rx", 2)

    g.append("g").attr("transform", `translate(0,${height})`).call(d3.axisBottom(xScale).ticks(5)).attr("color", "#6B7280")
    g.append("g").call(d3.axisLeft(yScale).ticks(5)).attr("color", "#6B7280")

    const bMean = bootstrapMeans.reduce((a, b) => a + b, 0) / bootstrapMeans.length
    g.append("line").attr("x1", xScale(bMean)).attr("x2", xScale(bMean)).attr("y1", 0).attr("y2", height)
      .attr("stroke", CHAPTER_COLOR).attr("stroke-dasharray", "5,5").attr("stroke-width", 2)

    g.append("text").attr("x", width / 2).attr("y", height + 35).attr("text-anchor", "middle").attr("fill", "#6B7280").attr("font-size", "12px").text("Bootstrap 样本均值")
  }, [bootstrapMeans])

  const origMean = (originalData.reduce((a, b) => a + b, 0) / originalData.length).toFixed(2)
  const bMean = bootstrapMeans.length > 0 ? (bootstrapMeans.reduce((a, b) => a + b, 0) / bootstrapMeans.length).toFixed(2) : '—'
  const sorted = [...bootstrapMeans].sort((a, b) => a - b)
  const ci025 = sorted.length > 0 ? sorted[Math.floor(sorted.length * 0.025)]?.toFixed(2) : '—'
  const ci975 = sorted.length > 0 ? sorted[Math.floor(sorted.length * 0.975)]?.toFixed(2) : '—'

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-4">
        <button onClick={() => runBootstrap(100)}
          className="px-4 py-2 rounded-lg text-sm font-medium text-white transition-all hover:shadow-md"
          style={{ background: CHAPTER_COLOR }}>
          Bootstrap ×100
        </button>
        <button onClick={() => runBootstrap(1000)}
          className="px-4 py-2 rounded-lg text-sm font-medium text-white transition-all hover:shadow-md"
          style={{ background: CHAPTER_COLOR }}>
          Bootstrap ×1000
        </button>
        <button onClick={() => setBootstrapMeans([])}
          className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200">
          <RotateCcw size={16} />
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div className="p-3 rounded-lg text-center" style={{ background: 'var(--bg-secondary)' }}>
          <div className="text-lg font-semibold text-gray-900">{origMean}</div>
          <div className="text-xs text-gray-500">原始样本均值</div>
        </div>
        <div className="p-3 rounded-lg text-center" style={{ background: 'var(--bg-secondary)' }}>
          <div className="text-lg font-semibold text-gray-900">{bootstrapMeans.length}</div>
          <div className="text-xs text-gray-500">Bootstrap次数</div>
        </div>
        <div className="p-3 rounded-lg text-center" style={{ background: 'var(--bg-secondary)' }}>
          <div className="text-lg font-semibold text-gray-900">{bMean}</div>
          <div className="text-xs text-gray-500">Bootstrap均值</div>
        </div>
        <div className="p-3 rounded-lg text-center" style={{ background: CHAPTER_COLOR + '20' }}>
          <div className="text-lg font-semibold" style={{ color: CHAPTER_COLOR }}>[{ci025}, {ci975}]</div>
          <div className="text-xs text-gray-500">95% Bootstrap CI</div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-4">
        <svg ref={svgRef} viewBox="0 0 500 250" style={{ width: '100%', height: 'auto' }} />
      </div>
    </div>
  )
}

// ============================================
// 主页面
// ============================================
export default function Chapter4() {
  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <ChapterHeader
        chapterNumber={4}
        title="频率派推断"
        subtitle="Frequentist Inference"
        description="掌握置信区间与假设检验，学会从样本推断总体特征"
        color={CHAPTER_COLOR}
        prevChapter={3}
        nextChapter={5}
      />

      <main className="max-w-4xl mx-auto px-4 md:px-6 py-12 md:py-16">
        <SectionIntro
          chapterColor={CHAPTER_COLOR}
          prerequisites={['概率分布', '抽样理论', '正态分布']}
          learningGoals={[
            '理解点估计与区间估计的区别',
            '掌握置信区间的计算方法与解释',
            '理解假设检验的基本逻辑',
            '理解p值的含义与局限性',
            '能够进行法律数据的统计推断'
          ]}
          overview={
            <>
              <p className="mb-3">
                本章介绍<strong>频率派统计推断</strong>的核心方法：
                置信区间给出估计的不确定性范围，假设检验帮助我们判断数据是否支持某个假设。
              </p>
              <p>
                这些方法在法律实证研究中广泛应用，例如评估判决的一致性、
                分析政策效果等。
              </p>
            </>
          }
        />

        <BeginnerExplanation title="🤔 初学者指南">
          <div className="space-y-4">
            <p>
              <strong>置信区间</strong>像"射箭的靶子范围"。
              95%置信区间意味着：如果你射100箭，大约有95箭会落在这个范围内。
            </p>

            <p>
              <strong>p值</strong>像"巧合的可能性"。
              p=0.05意味着只有5%的可能性是巧合。如果p值很小，说明"这事不太可能是偶然发生的"。
            </p>

            <p>
              <strong>假设检验</strong>像"法庭上的无罪推定"。
              先假设无罪（原假设），再看证据是否足够推翻这个假设。
            </p>
          </div>
        </BeginnerExplanation>

        <ScrollReveal>
          <div className="pt-4">
            <h2 className="text-2xl font-bold mb-6 text-gray-900">点估计与区间估计</h2>

            <p className="text-gray-600 leading-relaxed mb-6">
              统计推断的目标是从样本数据推断总体参数。
              点估计给出一个具体数值，而区间估计给出可能范围及置信程度。
            </p>
          </div>
        </ScrollReveal>

        <FormulaBox
          title="样本均值的置信区间"
          latex={"\\bar{x} \\pm z_{\\alpha/2} \\cdot \\frac{\\sigma}{\\sqrt{n}}"}
          number="4.1"
        >
          <div className="space-y-2 text-gray-700">
            <p>其中：</p>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li>x̄ = 样本均值</li>
              <li>z_&#123;α/2&#125; = 标准正态分布的分位数（95%置信度时为1.96）</li>
              <li>σ = 总体标准差（通常用样本标准差s估计）</li>
              <li>n = 样本量</li>
            </ul>
          </div>
        </FormulaBox>

        <ExperimentContainer title="交互演示：置信区间" icon="📊">
          <p className="text-gray-600 leading-relaxed mb-6">
            从同一总体中反复抽样，观察置信区间的覆盖情况。
            理论上，95%的置信区间应该包含真实均值。
          </p>

          <ConfidenceIntervalVisualization />
        </ExperimentContainer>

        <Checkpoint type="mistake">
          <div className="space-y-3">
            <p className="font-medium">常见误区：置信区间的错误解释</p>
            <p>
              错误："95%置信区间表示真实参数有95%的概率落在这个区间内。"
            </p>
            <p>
              正确："95%置信区间表示如果我们重复抽样100次，大约有95次计算出的区间会包含真实参数。"
              对于已计算出的具体区间，真实参数要么在其中，要么不在——概率只能是0或1。
            </p>
          </div>
        </Checkpoint>

        <ScrollReveal>
          <div className="pt-4">
            <h2 className="text-2xl font-bold mb-6 text-gray-900">假设检验</h2>

            <p className="text-gray-600 leading-relaxed mb-6">
              假设检验是一种统计决策方法，用于判断样本数据是否提供了足够的证据来拒绝某个假设。
            </p>
          </div>
        </ScrollReveal>

        <FormulaBox
          title="Z检验统计量"
          latex={"z = \\frac{\\bar{x} - \\mu_0}{\\sigma / \\sqrt{n}}"}
          number="4.2"
        >
          <div className="space-y-2 text-gray-700">
            <p>检验步骤：</p>
            <ol className="list-decimal list-inside space-y-1 pl-2">
              <li>建立原假设 H₀: μ = μ₀ 和备择假设 H₁</li>
              <li>选择显著性水平 α（通常为0.05）</li>
              <li>计算检验统计量</li>
              <li>比较统计量与临界值，或计算p值</li>
              <li>做出统计决策</li>
            </ol>
          </div>
        </FormulaBox>

        <ExperimentContainer title="交互演示：假设检验与检验力" icon="🎯">
          <p className="text-gray-600 leading-relaxed mb-6">
            调整效应量、样本量和显著性水平，观察检验力的变化。
            检验力表示当备择假设为真时，正确拒绝原假设的概率。
          </p>

          <HypothesisTestVisualization />
        </ExperimentContainer>

        <Checkpoint type="think">
          <div className="space-y-3">
            <p className="font-medium">思考题</p>
            <p>
              在法律研究中，假设检验可能犯两类错误：
              第一类错误（拒真）和第二类错误（纳伪）。
              在刑事审判中，哪种错误更为严重？为什么？
              这与"宁可错放，不可错判"的原则有什么联系？
            </p>
          </div>
        </Checkpoint>

        <ScrollReveal>
          <div className="pt-4">
            <h2 className="text-2xl font-bold mb-6 text-gray-900">自助法（Bootstrap）</h2>
            <p className="text-gray-600 leading-relaxed mb-6">
              当理论分布难以确定时，Bootstrap 方法通过从样本中有放回地重复抽样，
              用计算机模拟来估计统计量的分布。这是现代统计推断的核心工具之一。
            </p>
          </div>
        </ScrollReveal>

        <FormulaBox
          title="Bootstrap 原理"
          latex={"\\hat{\\theta}^* = s(X_1^*, X_2^*, \\ldots, X_n^*) \\quad X_i^* \\sim \\hat{F}_n"}
          number="4.3"
        >
          <div className="space-y-2 text-gray-700">
            <p>步骤：</p>
            <ol className="list-decimal list-inside space-y-1 pl-2">
              <li>从原始样本（n个观测）中有放回地抽取 n 个样本</li>
              <li>计算该 Bootstrap 样本的统计量（如均值）</li>
              <li>重复 B 次（通常 B ≥ 1000）</li>
              <li>用 B 个统计量的分布估计标准误和置信区间</li>
            </ol>
          </div>
        </FormulaBox>

        <ExperimentContainer title="交互演示：Bootstrap 重抽样" icon="🔄">
          <p className="text-gray-600 leading-relaxed mb-6">
            从一组样本数据中进行 Bootstrap 重抽样，观察均值的 Bootstrap 分布。
          </p>
          <BootstrapVisualization />
        </ExperimentContainer>

        <div className="pt-4">
          <LegalCaseCard title="量刑公正性的统计检验" type="criminal" color={CHAPTER_COLOR}>
            <p className="text-gray-600 leading-relaxed mb-4">
              某研究调查了200起相似盗窃案的量刑情况，发现平均刑期为18个月（标准差6个月）。
              法律学者假设该地区的量刑标准应为15个月（H₀: μ = 15）。
              量刑是否显著偏高？
            </p>
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <h4 className="font-semibold text-gray-800 mb-3">假设检验</h4>
              <div className="space-y-2 text-sm text-gray-700">
                <p>z = (18 - 15) / (6/√200) = 3 / 0.424 ≈ 7.07</p>
                <p className="font-bold" style={{ color: CHAPTER_COLOR }}>
                  z = 7.07 远大于临界值 1.96，p &lt; 0.001，拒绝 H₀。
                </p>
                <p>95%置信区间：[17.17, 18.83] 个月，不包含15。</p>
              </div>
            </div>
            <div className="p-4 rounded-lg bg-yellow-50 border border-yellow-100">
              <p className="text-sm text-gray-700">
                <strong>法律意义：</strong>
                统计证据表明该地区量刑显著偏高。但统计显著不等于实际显著——
                3个月的差异在法律上是否有实质意义，需要结合法律背景进一步分析。
                Bootstrap方法可以在不假设正态分布的条件下验证这一结论。
              </p>
            </div>
          </LegalCaseCard>
        </div>

        <div className="pt-4">
          <SectionOutro
            keyPoints={[
              '点估计给出单一数值，区间估计给出可能范围',
              '置信区间的正确解释涉及重复抽样频率',
              '假设检验基于反证法思想：先假设原假设成立，再看证据是否充分矛盾',
              'p值是观察到当前或更极端数据的概率，不是原假设为真的概率',
              '检验力受效应量、样本量和显著性水平影响'
            ]}
            question="某调查显示120名法官对某项改革的平均支持度为6.5分（满分10分），标准差为2分。计算95%置信区间，并判断平均支持度是否显著高于中立值5分（α=0.05）。"
            hint="置信区间 = 6.5 ± 1.96×(2/√120) = [6.14, 6.86]。检验统计量 z = (6.5-5)/(2/√120) = 8.22 > 1.96，拒绝原假设。"
          />
        </div>

        <ChapterNav 
          prevChapter={{ number: 3, title: '概率分布' }}
          nextChapter={{ number: 5, title: '贝叶斯推断' }}
        />
      </main>
    </div>
  )
}
