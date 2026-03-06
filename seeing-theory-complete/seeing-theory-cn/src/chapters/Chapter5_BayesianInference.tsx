import { useEffect, useRef, useState } from 'react'
import { RotateCcw, Brain } from 'lucide-react'
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

const CHAPTER_COLOR = '#f59e0b'

// ============================================
// 贝叶斯更新可视化
// ============================================
function BayesianUpdatingVisualization() {
  const [priorMean, setPriorMean] = useState(0.5)
  const [priorStrength, setPriorStrength] = useState(2)
  const [observations, setObservations] = useState<number[]>([])

  const addObservation = (success: boolean) => {
    setObservations(prev => [...prev, success ? 1 : 0])
  }

  const reset = () => setObservations([])

  // Beta分布参数
  const alphaPrior = priorMean * priorStrength
  const betaPrior = (1 - priorMean) * priorStrength

  const successes = observations.filter(x => x === 1).length
  const failures = observations.length - successes

  const alphaPost = alphaPrior + successes
  const betaPost = betaPrior + failures

  const posteriorMean = alphaPost / (alphaPost + betaPost)

  return (
    <div>
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <div>
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">先验均值</span>
            <span className="text-sm font-mono bg-gray-100 px-2 py-0.5 rounded">{priorMean.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min="0.1"
            max="0.9"
            step="0.1"
            value={priorMean}
            onChange={(e) => setPriorMean(parseFloat(e.target.value))}
            className="custom-slider w-full"
            style={{ '--c1': CHAPTER_COLOR } as React.CSSProperties}
          />
        </div>

        <div>
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">先验强度</span>
            <span className="text-sm font-mono bg-gray-100 px-2 py-0.5 rounded">{priorStrength}</span>
          </div>
          <input
            type="range"
            min="1"
            max="10"
            value={priorStrength}
            onChange={(e) => setPriorStrength(parseInt(e.target.value))}
            className="custom-slider w-full"
            style={{ '--c1': CHAPTER_COLOR } as React.CSSProperties}
          />
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => addObservation(true)}
          className="px-4 py-2 rounded-lg text-sm font-medium text-white transition-all hover:shadow-md"
          style={{ background: CHAPTER_COLOR }}
        >
          添加成功 (+1)
        </button>
        <button
          onClick={() => addObservation(false)}
          className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all"
        >
          添加失败 (0)
        </button>
        <button
          onClick={reset}
          className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all"
        >
          重置
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4">
        <BetaDistributionPlot 
          alphaPrior={alphaPrior}
          betaPrior={betaPrior}
          alphaPost={alphaPost}
          betaPost={betaPost}
          color={CHAPTER_COLOR}
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="text-center p-3 rounded-lg" style={{ background: 'var(--bg-secondary)' }}>
          <div className="text-lg font-semibold text-gray-900">{observations.length}</div>
          <div className="text-xs text-gray-500">观测次数</div>
        </div>
        <div className="text-center p-3 rounded-lg" style={{ background: 'var(--bg-secondary)' }}>
          <div className="text-lg font-semibold text-gray-900">{successes}</div>
          <div className="text-xs text-gray-500">成功次数</div>
        </div>
        <div className="text-center p-3 rounded-lg" style={{ background: CHAPTER_COLOR + '20' }}>
          <div className="text-lg font-semibold" style={{ color: CHAPTER_COLOR }}>{posteriorMean.toFixed(3)}</div>
          <div className="text-xs text-gray-500">后验均值</div>
        </div>
      </div>
    </div>
  )
}

// Beta分布图
function BetaDistributionPlot({ 
  alphaPrior, 
  betaPrior, 
  alphaPost, 
  betaPost, 
  color 
}: { 
  alphaPrior: number
  betaPrior: number
  alphaPost: number
  betaPost: number
  color: string
}) {
  const svgRef = useRef<SVGSVGElement>(null)

  const betaPDF = (x: number, alpha: number, beta: number) => {
    if (x <= 0 || x >= 1) return 0
    const B = (a: number, b: number) => {
      // 简化的Beta函数近似
      return Math.exp(logGamma(a) + logGamma(b) - logGamma(a + b))
    }
    return Math.pow(x, alpha - 1) * Math.pow(1 - x, beta - 1) / B(alpha, beta)
  }

  useEffect(() => {
    if (!svgRef.current) return

    const svg = d3.select(svgRef.current)
    svg.selectAll("*").remove()

    const margin = { top: 20, right: 30, bottom: 50, left: 60 }
    const width = 500 - margin.left - margin.right
    const height = 250 - margin.top - margin.bottom

    const g = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`)

    const xScale = d3.scaleLinear()
      .domain([0, 1])
      .range([0, width])

    // 生成先验和后验数据
    const priorData = []
    const postData = []
    for (let x = 0.01; x <= 0.99; x += 0.01) {
      priorData.push({ x, y: betaPDF(x, alphaPrior, betaPrior) })
      postData.push({ x, y: betaPDF(x, alphaPost, betaPost) })
    }

    const maxY = Math.max(
      d3.max(priorData, d => d.y) || 0,
      d3.max(postData, d => d.y) || 0
    )

    const yScale = d3.scaleLinear()
      .domain([0, maxY * 1.1])
      .range([height, 0])

    // 先验分布（虚线）
    const priorLine = d3.line<{ x: number; y: number }>()
      .x(d => xScale(d.x))
      .y(d => yScale(d.y))
      .curve(d3.curveBasis)

    g.append("path")
      .datum(priorData)
      .attr("fill", "none")
      .attr("stroke", "#9CA3AF")
      .attr("stroke-width", 2)
      .attr("stroke-dasharray", "5,5")
      .attr("d", priorLine)

    // 后验分布（实线）
    const postLine = d3.line<{ x: number; y: number }>()
      .x(d => xScale(d.x))
      .y(d => yScale(d.y))
      .curve(d3.curveBasis)

    g.append("path")
      .datum(postData)
      .attr("fill", "none")
      .attr("stroke", color)
      .attr("stroke-width", 2.5)
      .attr("d", postLine)

    // 面积填充
    const area = d3.area<{ x: number; y: number }>()
      .x(d => xScale(d.x))
      .y0(height)
      .y1(d => yScale(d.y))
      .curve(d3.curveBasis)

    g.append("path")
      .datum(postData)
      .attr("fill", color + '30')
      .attr("d", area)

    g.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(xScale).ticks(5))
      .attr("color", "#6B7280")

    g.append("g")
      .call(d3.axisLeft(yScale).ticks(5))
      .attr("color", "#6B7280")

    g.append("text")
      .attr("x", width / 2)
      .attr("y", height + 40)
      .attr("text-anchor", "middle")
      .attr("fill", "#6B7280")
      .attr("font-size", "12px")
      .text("θ (概率参数)")

    // 图例
    g.append("text")
      .attr("x", width - 10)
      .attr("y", 20)
      .attr("text-anchor", "end")
      .attr("fill", "#9CA3AF")
      .attr("font-size", "11px")
      .text("先验")

    g.append("text")
      .attr("x", width - 10)
      .attr("y", 40)
      .attr("text-anchor", "end")
      .attr("fill", color)
      .attr("font-size", "11px")
      .attr("font-weight", "bold")
      .text("后验")

  }, [alphaPrior, betaPrior, alphaPost, betaPost, color])

  return <svg ref={svgRef} viewBox="0 0 500 250" style={{ width: '100%', height: 'auto' }} />
}

// 简化的logGamma函数
function logGamma(n: number): number {
  // Stirling近似
  if (n < 1) return 0
  return (n - 0.5) * Math.log(n) - n + 0.5 * Math.log(2 * Math.PI)
}

// ============================================
// 似然函数可视化
// ============================================
function LikelihoodVisualization() {
  const svgRef = useRef<SVGSVGElement>(null)
  const [nTrials, setNTrials] = useState(10)
  const [kSuccess, setKSuccess] = useState(7)

  useEffect(() => {
    if (!svgRef.current) return
    const svg = d3.select(svgRef.current)
    svg.selectAll("*").remove()

    const margin = { top: 20, right: 30, bottom: 50, left: 60 }
    const width = 500 - margin.left - margin.right
    const height = 250 - margin.top - margin.bottom
    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`)

    // 计算似然函数 L(θ) = C(n,k) * θ^k * (1-θ)^(n-k)
    const data: { theta: number; likelihood: number }[] = []
    for (let theta = 0.01; theta <= 0.99; theta += 0.01) {
      const l = Math.pow(theta, kSuccess) * Math.pow(1 - theta, nTrials - kSuccess)
      data.push({ theta, likelihood: l })
    }

    const xScale = d3.scaleLinear().domain([0, 1]).range([0, width])
    const yMax = d3.max(data, d => d.likelihood) || 0.01
    const yScale = d3.scaleLinear().domain([0, yMax * 1.1]).range([height, 0])

    // Area fill
    const area = d3.area<{ theta: number; likelihood: number }>()
      .x(d => xScale(d.theta)).y0(height).y1(d => yScale(d.likelihood)).curve(d3.curveBasis)
    g.append("path").datum(data).attr("fill", CHAPTER_COLOR + '30').attr("d", area)

    // Line
    const line = d3.line<{ theta: number; likelihood: number }>()
      .x(d => xScale(d.theta)).y(d => yScale(d.likelihood)).curve(d3.curveBasis)
    g.append("path").datum(data).attr("fill", "none").attr("stroke", CHAPTER_COLOR).attr("stroke-width", 2.5).attr("d", line)

    // MLE marker
    const mle = kSuccess / nTrials
    g.append("line").attr("x1", xScale(mle)).attr("x2", xScale(mle)).attr("y1", 0).attr("y2", height)
      .attr("stroke", CHAPTER_COLOR).attr("stroke-dasharray", "5,5")
    g.append("text").attr("x", xScale(mle)).attr("y", -5).attr("text-anchor", "middle")
      .attr("fill", CHAPTER_COLOR).attr("font-size", "11px").attr("font-weight", "bold")
      .text(`MLE = ${mle.toFixed(2)}`)

    g.append("g").attr("transform", `translate(0,${height})`).call(d3.axisBottom(xScale).ticks(5)).attr("color", "#6B7280")
    g.append("g").call(d3.axisLeft(yScale).ticks(5).tickFormat(d3.format(".4f"))).attr("color", "#6B7280")
    g.append("text").attr("x", width / 2).attr("y", height + 40).attr("text-anchor", "middle").attr("fill", "#6B7280").attr("font-size", "12px").text("θ（正面概率）")
    g.append("text").attr("transform", "rotate(-90)").attr("x", -height / 2).attr("y", -45).attr("text-anchor", "middle").attr("fill", "#6B7280").attr("font-size", "12px").text("L(θ)")
  }, [nTrials, kSuccess])

  return (
    <div>
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <div>
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">投掷次数 n</span>
            <span className="text-sm font-mono bg-gray-100 px-2 py-0.5 rounded">{nTrials}</span>
          </div>
          <input type="range" min="5" max="50" value={nTrials}
            onChange={e => { const v = +e.target.value; setNTrials(v); if (kSuccess > v) setKSuccess(v) }}
            className="custom-slider w-full" style={{ '--c1': CHAPTER_COLOR } as React.CSSProperties} />
        </div>
        <div>
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">正面次数 k</span>
            <span className="text-sm font-mono bg-gray-100 px-2 py-0.5 rounded">{kSuccess}</span>
          </div>
          <input type="range" min="0" max={nTrials} value={kSuccess} onChange={e => setKSuccess(+e.target.value)}
            className="custom-slider w-full" style={{ '--c1': CHAPTER_COLOR } as React.CSSProperties} />
        </div>
      </div>
      <div className="bg-white rounded-xl border border-gray-100 p-4">
        <svg ref={svgRef} viewBox="0 0 500 250" style={{ width: '100%', height: 'auto' }} />
      </div>
      <p className="mt-4 text-sm text-gray-500 text-center">
        虚线标记最大似然估计 MLE = k/n = {(kSuccess / nTrials).toFixed(2)}
      </p>
    </div>
  )
}

// ============================================
// 法律案例：累犯预测中的贝叶斯更新
// ============================================
function LegalBayesCase() {
  const [priorRisk, setPriorRisk] = useState(0.3)
  const [evidenceSteps, setEvidenceSteps] = useState<boolean[]>([])

  const evidenceList = [
    { name: '有固定住所', pIfLow: 0.8, pIfHigh: 0.4, isPositive: false },
    { name: '有稳定工作', pIfLow: 0.7, pIfHigh: 0.25, isPositive: false },
    { name: '曾有暴力前科', pIfLow: 0.05, pIfHigh: 0.4, isPositive: true },
    { name: '完成矫正项目', pIfLow: 0.6, pIfHigh: 0.15, isPositive: false },
    { name: '有药物滥用史', pIfLow: 0.1, pIfHigh: 0.5, isPositive: true },
  ]

  // 逐步贝叶斯更新
  const riskHistory = [priorRisk]
  let currentRisk = priorRisk
  for (let i = 0; i < evidenceSteps.length; i++) {
    const ev = evidenceList[i]
    const observed = evidenceSteps[i] // true = 该因素存在

    // P(证据|高风险) - 在高风险累犯中该证据出现的概率
    // P(证据|低风险) - 在低风险累犯中该证据出现的概率
    let pEvidenceIfHigh: number
    let pEvidenceIfLow: number

    if (observed) {
      // 证据存在（选择"是"）
      pEvidenceIfHigh = ev.pIfHigh  // 直接使用高风险下该证据出现的概率
      pEvidenceIfLow = ev.pIfLow    // 直接使用低风险下该证据出现的概率
    } else {
      // 证据不存在（选择"否"）
      pEvidenceIfHigh = 1 - ev.pIfHigh  // 高风险下该证据不出现的概率
      pEvidenceIfLow = 1 - ev.pIfLow    // 低风险下该证据不出现的概率
    }

    // 贝叶斯更新: P(高风险|证据) = P(证据|高风险) * P(高风险) / P(证据)
    const pEvidence = pEvidenceIfHigh * currentRisk + pEvidenceIfLow * (1 - currentRisk)
    currentRisk = (pEvidenceIfHigh * currentRisk) / pEvidence
    riskHistory.push(currentRisk)
  }

  const addEvidence = (present: boolean) => {
    if (evidenceSteps.length < evidenceList.length) {
      setEvidenceSteps(prev => [...prev, present])
    }
  }

  const reset = () => setEvidenceSteps([])

  return (
    <LegalCaseCard title="累犯风险评估中的贝叶斯更新" type="criminal" color={CHAPTER_COLOR}>
      <p className="text-gray-600 leading-relaxed mb-4">
        法官在量刑和假释决定中需要评估被告再犯罪的风险。
        贝叶斯方法可以帮助法官在获得新信息时理性地更新风险判断，
        而非仅依赖直觉或单一因素。
      </p>

      <div className="bg-gray-50 rounded-lg p-4 mb-4">
        <h4 className="font-semibold text-gray-800 mb-3">交互分析：逐步证据更新</h4>

        <div className="mb-4">
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">初始再犯风险（基础率）</span>
            <span className="text-sm font-mono bg-gray-100 px-2 py-0.5 rounded">{(priorRisk * 100).toFixed(0)}%</span>
          </div>
          <input type="range" min="0.05" max="0.8" step="0.05" value={priorRisk}
            onChange={e => { setPriorRisk(+e.target.value); setEvidenceSteps([]) }}
            className="custom-slider w-full" style={{ '--c1': CHAPTER_COLOR } as React.CSSProperties} />
        </div>

        {evidenceSteps.length < evidenceList.length && (
          <div className="bg-white rounded p-3 mb-3">
            <p className="text-sm font-medium text-gray-800 mb-2">
              下一项证据：{evidenceList[evidenceSteps.length].name}
            </p>
            <div className="flex gap-2">
              <button onClick={() => addEvidence(true)}
                className="px-3 py-1.5 text-xs rounded-lg font-medium text-white transition-all"
                style={{ background: CHAPTER_COLOR }}>
                是
              </button>
              <button onClick={() => addEvidence(false)}
                className="px-3 py-1.5 text-xs rounded-lg font-medium bg-gray-200 text-gray-700 hover:bg-gray-300 transition-all">
                否
              </button>
            </div>
          </div>
        )}

        <div className="space-y-2 text-sm">
          {evidenceSteps.map((present, i) => (
            <div key={i} className="flex justify-between items-center py-1 border-b border-gray-100">
              <span className="text-gray-600">
                {evidenceList[i].name}：<strong>{present ? '是' : '否'}</strong>
              </span>
              <span className="font-mono text-sm" style={{ color: CHAPTER_COLOR }}>
                → {(riskHistory[i + 1] * 100).toFixed(1)}%
              </span>
            </div>
          ))}
        </div>

        {evidenceSteps.length > 0 && (
          <div className="mt-3 flex justify-between items-center pt-3 border-t border-gray-200">
            <span className="font-medium text-gray-800">当前累犯风险评估</span>
            <span className="font-mono text-xl font-bold" style={{ color: CHAPTER_COLOR }}>
              {(currentRisk * 100).toFixed(1)}%
            </span>
          </div>
        )}

        <button onClick={reset}
          className="mt-3 px-3 py-1.5 text-xs rounded-lg font-medium bg-gray-200 text-gray-700 hover:bg-gray-300 transition-all">
          重置
        </button>
      </div>

      <div className="p-4 rounded-lg bg-blue-50 border border-blue-100">
        <p className="text-sm text-gray-700">
          <strong>关键洞察：</strong>
          贝叶斯更新展示了每一项新证据如何改变我们的风险评估。
          仅凭"有暴力前科"就判定高风险是不合理的——需要综合考虑所有因素。
          同样，法官不应被单一风险因素所主导，而应系统性地评估多维度信息。
          这一框架也提示我们警惕算法化风险评估工具的局限性：先验的选择和证据的独立性假设都会影响最终结论。
        </p>
      </div>
    </LegalCaseCard>
  )
}

// ============================================
// 主页面
// ============================================
export default function Chapter5() {
  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <ChapterHeader
        chapterNumber={5}
        title="贝叶斯推断"
        subtitle="Bayesian Inference"
        description="深入理解先验与后验概率，运用贝叶斯方法进行证据更新"
        color={CHAPTER_COLOR}
        prevChapter={4}
        nextChapter={6}
      />

      <main className="max-w-4xl mx-auto px-4 md:px-6 py-12 md:py-16">
        <SectionIntro
          chapterColor={CHAPTER_COLOR}
          prerequisites={['条件概率', '概率分布', '贝叶斯定理']}
          learningGoals={[
            '理解先验概率与后验概率的概念',
            '掌握共轭先验的使用方法',
            '能够进行贝叶斯参数估计',
            '理解贝叶斯方法与频率派方法的区别',
            '应用贝叶斯思维分析法律证据'
          ]}
          overview={
            <>
              <p className="mb-3">
                本章深入探讨<strong>贝叶斯推断</strong>——一种将先验知识与观测数据相结合的概率推理方法。
                与频率派方法不同，贝叶斯方法把参数视为随机变量，可以直接计算参数的概率分布。
              </p>
              <p>
                在法律证据评价中，贝叶斯思维帮助我们理性地更新对案件事实的判断。
              </p>
            </>
          }
        />

        <BeginnerExplanation title="🤔 初学者指南">
          <div className="space-y-4">
            <p>
              <strong>先验概率</strong>像"第一印象"。
              你第一次见到某人，根据穿着打扮形成初步印象。
            </p>

            <p>
              <strong>后验概率</strong>像"了解更多信息后的新印象"。
              和他聊天后发现他谈吐不凡，于是更新了你对他的看法。
            </p>

            <p>
              <strong>贝叶斯更新</strong>像"侦探根据新证据调整嫌疑人名单"。
              随着线索增加，不断缩小或改变怀疑范围。
            </p>
          </div>
        </BeginnerExplanation>

        <ScrollReveal>
          <div className="pt-4">
            <h2 className="text-2xl font-bold mb-6 text-gray-900">贝叶斯更新</h2>

            <p className="text-gray-600 leading-relaxed mb-6">
              贝叶斯推断的核心是结合先验分布和观测数据，得到后验分布。
              先验代表我们在观测前的信念，后验代表在观测后的更新信念。
            </p>
          </div>
        </ScrollReveal>

        <FormulaBox
          title="贝叶斯推断基本公式"
          latex={"p(\\theta | \\mathcal{D}) = \\frac{p(\\mathcal{D} | \\theta) \\cdot p(\\theta)}{p(\\mathcal{D})}"}
          number="5.1"
        >
          <div className="space-y-2 text-gray-700">
            <p>其中：</p>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li><strong>p(θ|𝒟)</strong>：后验分布，给定数据后参数的分布</li>
              <li><strong>p(𝒟|θ)</strong>：似然函数，参数为θ时观察到数据的概率</li>
              <li><strong>p(θ)</strong>：先验分布，观测前对参数的信念</li>
              <li><strong>p(𝒟)</strong>：边缘似然（证据），用于归一化</li>
            </ul>
          </div>
        </FormulaBox>

        <ExperimentContainer title="交互演示：贝叶斯更新" icon="🔄">
          <p className="text-gray-600 leading-relaxed mb-6">
            使用Beta-Binomial共轭先验模型。调整先验参数，然后添加观测数据，
            观察后验分布如何更新。Beta分布是二项分布的共轭先验，便于计算。
          </p>

          <BayesianUpdatingVisualization />
        </ExperimentContainer>

        <FormulaBox
          title="Beta-Binomial 共轭先验"
          latex={"\\theta | X \\sim \\text{Beta}(\\alpha + k, \\, \\beta + n - k)"}
          number="5.2"
        >
          <div className="space-y-2 text-gray-700">
            <p>如果先验 θ ~ Beta(α, β)，数据 X ~ Bin(n, θ)，则后验分布为：</p>
            <p className="font-mono bg-gray-50 p-2 rounded">
              θ | X ~ Beta(α + k, β + n - k)
            </p>
            <p className="text-sm">其中 k 是成功次数，n 是总试验次数。
            这种共轭关系使得贝叶斯更新非常简单：只需将观测结果加到先验参数上。</p>
          </div>
        </FormulaBox>

        <ScrollReveal>
          <div className="pt-4">
            <h2 className="text-2xl font-bold mb-6 text-gray-900">似然函数</h2>
            <p className="text-gray-600 leading-relaxed mb-6">
              似然函数 L(θ|x) 度量在参数 θ 下观察到数据 x 的可能性。
              与概率不同，似然函数是参数的函数而非数据的函数。
              最大似然估计（MLE）选择使似然函数最大的参数值。
            </p>
          </div>
        </ScrollReveal>

        <FormulaBox
          title="似然函数"
          latex={"L(\\theta \\mid x) = P(x \\mid \\theta) = \\prod_{i=1}^{n} P(x_i \\mid \\theta)"}
          number="5.3"
        >
          <div className="space-y-2 text-gray-700">
            <p>关键概念：</p>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li><strong>似然 ≠ 概率</strong>：似然是固定数据、变化参数的函数</li>
              <li><strong>最大似然估计</strong>：θ̂_MLE = argmax L(θ|x)</li>
              <li><strong>对数似然</strong>：ℓ(θ) = log L(θ)，将乘积转为求和，便于计算</li>
              <li>在贝叶斯推断中：后验 ∝ 似然 × 先验</li>
            </ul>
          </div>
        </FormulaBox>

        <ExperimentContainer title="交互演示：似然函数" icon="📐">
          <p className="text-gray-600 leading-relaxed mb-6">
            假设一枚硬币投掷 n 次，观察到 k 次正面。拖动滑块查看不同参数 θ（正面概率）下的似然值。
          </p>
          <LikelihoodVisualization />
        </ExperimentContainer>

        <div className="pt-4">
          <LegalBayesCase />
        </div>

        <Checkpoint type="think">
          <div className="space-y-3">
            <p className="font-medium">贝叶斯 vs 频率派</p>
            <p>
              频率派方法认为参数是固定的未知常数，通过重复抽样来评估估计的不确定性。
              贝叶斯方法则认为参数是随机变量，可以直接谈论"参数为某个值的概率"。
            </p>
            <p>
              <strong>思考题：</strong>在法律实践中，哪种方法更符合法官/陪审团的思维过程？
              当证据有限时，先验知识的重要性如何体现？
            </p>
          </div>
        </Checkpoint>

        <div className="pt-4">
          <SectionOutro
            keyPoints={[
              '贝叶斯推断将先验知识与观测数据相结合',
              '先验分布反映观测前的信念，后验分布反映更新后的信念',
              '共轭先验使得贝叶斯更新计算简便',
              '贝叶斯方法可以直接给出参数的概率分布',
              '在法律证据分析中，贝叶斯思维有助于理性更新判断'
            ]}
            question="某法官对被告有罪的先验概率为50%。第一份证据出现，如果被告有罪则必然出现，如果无罪则有20%概率出现。计算看到证据后的后验概率。"
            hint="P(有罪|证据) = P(证据|有罪)×P(有罪) / [P(证据|有罪)×P(有罪) + P(证据|无罪)×P(无罪)] = 1×0.5 / (1×0.5 + 0.2×0.5) = 0.833"
          />
        </div>

        <ChapterNav 
          prevChapter={{ number: 4, title: '频率派推断' }}
          nextChapter={{ number: 6, title: '回归分析' }}
        />
      </main>
    </div>
  )
}
