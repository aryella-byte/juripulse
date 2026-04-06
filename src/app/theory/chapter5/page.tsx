'use client'

import { useEffect, useRef, useState } from 'react'
import * as d3 from 'd3'
import {
  ChapterHeader, BeginnerExplanation, FormulaBox, Checkpoint,
  SectionIntro, SectionOutro, LegalCaseCard, ExperimentContainer,
  ChapterNav, ScrollReveal
} from '@/components/theory-components'

const CHAPTER_COLOR = '#b45309'
const AXIS_COLOR = '#8a8a8a'

// Stirling's log-gamma approximation
function logGamma(n: number): number {
  if (n < 1) return 0
  return (n - 0.5) * Math.log(n) - n + 0.5 * Math.log(2 * Math.PI)
}

function betaPDF(x: number, alpha: number, beta: number): number {
  if (x <= 0 || x >= 1) return 0
  const B = Math.exp(logGamma(alpha) + logGamma(beta) - logGamma(alpha + beta))
  return Math.pow(x, alpha - 1) * Math.pow(1 - x, beta - 1) / B
}

// ============================================
// Beta分布图
// ============================================
function BetaDistributionPlot({ alphaPrior, betaPrior, alphaPost, betaPost, color }: {
  alphaPrior: number; betaPrior: number; alphaPost: number; betaPost: number; color: string
}) {
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (!svgRef.current) return
    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const margin = { top: 20, right: 30, bottom: 50, left: 60 }
    const width = 500 - margin.left - margin.right
    const height = 250 - margin.top - margin.bottom
    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`)

    const priorData: { x: number; y: number }[] = []
    const postData: { x: number; y: number }[] = []
    for (let x = 0.01; x <= 0.99; x += 0.01) {
      priorData.push({ x, y: betaPDF(x, alphaPrior, betaPrior) })
      postData.push({ x, y: betaPDF(x, alphaPost, betaPost) })
    }

    const maxY = Math.max(d3.max(priorData, d => d.y) || 0, d3.max(postData, d => d.y) || 0)
    const xScale = d3.scaleLinear().domain([0, 1]).range([0, width])
    const yScale = d3.scaleLinear().domain([0, maxY * 1.1]).range([height, 0])

    const line = d3.line<{ x: number; y: number }>().x(d => xScale(d.x)).y(d => yScale(d.y)).curve(d3.curveBasis)
    const area = d3.area<{ x: number; y: number }>().x(d => xScale(d.x)).y0(height).y1(d => yScale(d.y)).curve(d3.curveBasis)

    g.append('path').datum(priorData).attr('fill', 'none').attr('stroke', '#6b6b80').attr('stroke-width', 1.5).attr('stroke-dasharray', '5,5').attr('d', line)
    g.append('path').datum(postData).attr('fill', color + '20').attr('d', area)
    g.append('path').datum(postData).attr('fill', 'none').attr('stroke', color).attr('stroke-width', 2.5).attr('d', line)

    g.append('g').attr('transform', `translate(0,${height})`).call(d3.axisBottom(xScale).ticks(5))
      .selectAll('text').attr('fill', AXIS_COLOR).style('font-size', '11px')
    g.append('g').call(d3.axisLeft(yScale).ticks(5))
      .selectAll('text').attr('fill', AXIS_COLOR).style('font-size', '11px')
    g.selectAll('.domain').attr('stroke', '#e8e5de')

    g.append('text').attr('x', width / 2).attr('y', height + 40).attr('text-anchor', 'middle').attr('fill', AXIS_COLOR).attr('font-size', '11px').text('θ (概率参数)')
    g.append('text').attr('x', width - 10).attr('y', 20).attr('text-anchor', 'end').attr('fill', '#6b6b80').attr('font-size', '11px').text('先验')
    g.append('text').attr('x', width - 10).attr('y', 40).attr('text-anchor', 'end').attr('fill', color).attr('font-size', '11px').attr('font-weight', 'bold').text('后验')
  }, [alphaPrior, betaPrior, alphaPost, betaPost, color])

  return <svg ref={svgRef} viewBox="0 0 500 250" style={{ width: '100%', height: 'auto' }} />
}

// ============================================
// 贝叶斯更新可视化
// ============================================
function BayesianUpdatingVisualization() {
  const [priorMean, setPriorMean] = useState(0.5)
  const [priorStrength, setPriorStrength] = useState(2)
  const [observations, setObservations] = useState<number[]>([])

  const alphaPrior = priorMean * priorStrength
  const betaPrior = (1 - priorMean) * priorStrength
  const successes = observations.filter(x => x === 1).length
  const failures = observations.length - successes
  const alphaPost = alphaPrior + successes
  const betaPost = betaPrior + failures
  const posteriorMean = alphaPost / (alphaPost + betaPost)

  return (
    <div>
      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <div>
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>先验均值</span>
            <span className="text-sm font-mono px-2 py-0.5 rounded" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>{priorMean.toFixed(2)}</span>
          </div>
          <input type="range" min="0.1" max="0.9" step="0.1" value={priorMean} onChange={e => setPriorMean(+e.target.value)} className="w-full" style={{ accentColor: CHAPTER_COLOR }} />
        </div>
        <div>
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>先验强度</span>
            <span className="text-sm font-mono px-2 py-0.5 rounded" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>{priorStrength}</span>
          </div>
          <input type="range" min="1" max="10" value={priorStrength} onChange={e => setPriorStrength(+e.target.value)} className="w-full" style={{ accentColor: CHAPTER_COLOR }} />
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        <button onClick={() => setObservations(p => [...p, 1])} className="px-4 py-2 rounded-lg text-[13px] font-medium text-white" style={{ background: CHAPTER_COLOR }}>添加成功 (+1)</button>
        <button onClick={() => setObservations(p => [...p, 0])} className="px-4 py-2 rounded-lg text-[13px]" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>添加失败 (0)</button>
        <button onClick={() => setObservations([])} className="px-4 py-2 rounded-lg text-[13px]" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>重置</button>
      </div>

      <div className="rounded-xl p-4 mb-4" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
        <BetaDistributionPlot alphaPrior={alphaPrior} betaPrior={betaPrior} alphaPost={alphaPost} betaPost={betaPost} color={CHAPTER_COLOR} />
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { v: observations.length, l: '观测次数' },
          { v: successes, l: '成功次数' },
          { v: posteriorMean.toFixed(3), l: '后验均值' },
        ].map(s => (
          <div key={s.l} className="text-center p-3 rounded-lg" style={{ background: 'var(--bg-secondary)' }}>
            <div className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>{s.v}</div>
            <div className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>{s.l}</div>
          </div>
        ))}
      </div>
    </div>
  )
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
    svg.selectAll('*').remove()

    const margin = { top: 20, right: 30, bottom: 50, left: 60 }
    const width = 500 - margin.left - margin.right
    const height = 250 - margin.top - margin.bottom
    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`)

    const data: { theta: number; likelihood: number }[] = []
    for (let theta = 0.01; theta <= 0.99; theta += 0.01) {
      data.push({ theta, likelihood: Math.pow(theta, kSuccess) * Math.pow(1 - theta, nTrials - kSuccess) })
    }

    const xScale = d3.scaleLinear().domain([0, 1]).range([0, width])
    const yMax = d3.max(data, d => d.likelihood) || 0.01
    const yScale = d3.scaleLinear().domain([0, yMax * 1.1]).range([height, 0])

    const area = d3.area<{ theta: number; likelihood: number }>().x(d => xScale(d.theta)).y0(height).y1(d => yScale(d.likelihood)).curve(d3.curveBasis)
    const line = d3.line<{ theta: number; likelihood: number }>().x(d => xScale(d.theta)).y(d => yScale(d.likelihood)).curve(d3.curveBasis)

    g.append('path').datum(data).attr('fill', CHAPTER_COLOR + '20').attr('d', area)
    g.append('path').datum(data).attr('fill', 'none').attr('stroke', CHAPTER_COLOR).attr('stroke-width', 2.5).attr('d', line)

    const mle = kSuccess / nTrials
    g.append('line').attr('x1', xScale(mle)).attr('x2', xScale(mle)).attr('y1', 0).attr('y2', height).attr('stroke', CHAPTER_COLOR).attr('stroke-dasharray', '5,5')
    g.append('text').attr('x', xScale(mle)).attr('y', -5).attr('text-anchor', 'middle').attr('fill', CHAPTER_COLOR).attr('font-size', '11px').attr('font-weight', 'bold').text(`MLE = ${mle.toFixed(2)}`)

    g.append('g').attr('transform', `translate(0,${height})`).call(d3.axisBottom(xScale).ticks(5))
      .selectAll('text').attr('fill', AXIS_COLOR).style('font-size', '11px')
    g.append('g').call(d3.axisLeft(yScale).ticks(5).tickFormat(d3.format('.4f')))
      .selectAll('text').attr('fill', AXIS_COLOR).style('font-size', '11px')
    g.selectAll('.domain').attr('stroke', '#e8e5de')
    g.append('text').attr('x', width / 2).attr('y', height + 40).attr('text-anchor', 'middle').attr('fill', AXIS_COLOR).attr('font-size', '11px').text('θ（正面概率）')
  }, [nTrials, kSuccess])

  return (
    <div>
      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <div>
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>投掷次数 n</span>
            <span className="text-sm font-mono px-2 py-0.5 rounded" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>{nTrials}</span>
          </div>
          <input type="range" min="5" max="50" value={nTrials} onChange={e => { const v = +e.target.value; setNTrials(v); if (kSuccess > v) setKSuccess(v) }} className="w-full" style={{ accentColor: CHAPTER_COLOR }} />
        </div>
        <div>
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>正面次数 k</span>
            <span className="text-sm font-mono px-2 py-0.5 rounded" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>{kSuccess}</span>
          </div>
          <input type="range" min="0" max={nTrials} value={kSuccess} onChange={e => setKSuccess(+e.target.value)} className="w-full" style={{ accentColor: CHAPTER_COLOR }} />
        </div>
      </div>
      <div className="rounded-xl p-4" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
        <svg ref={svgRef} viewBox="0 0 500 250" style={{ width: '100%', height: 'auto' }} />
      </div>
      <p className="mt-4 text-[12px] text-center" style={{ color: 'var(--text-tertiary)' }}>虚线标记最大似然估计 MLE = k/n = {(kSuccess / nTrials).toFixed(2)}</p>
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
    { name: '有固定住所', pIfLow: 0.8, pIfHigh: 0.4 },
    { name: '有稳定工作', pIfLow: 0.7, pIfHigh: 0.25 },
    { name: '曾有暴力前科', pIfLow: 0.05, pIfHigh: 0.4 },
    { name: '完成矫正项目', pIfLow: 0.6, pIfHigh: 0.15 },
    { name: '有药物滥用史', pIfLow: 0.1, pIfHigh: 0.5 },
  ]

  const riskHistory = [priorRisk]
  let currentRisk = priorRisk
  for (let i = 0; i < evidenceSteps.length; i++) {
    const ev = evidenceList[i]
    const observed = evidenceSteps[i]
    const pEvidenceIfHigh = observed ? ev.pIfHigh : 1 - ev.pIfHigh
    const pEvidenceIfLow = observed ? ev.pIfLow : 1 - ev.pIfLow
    const pEvidence = pEvidenceIfHigh * currentRisk + pEvidenceIfLow * (1 - currentRisk)
    currentRisk = (pEvidenceIfHigh * currentRisk) / pEvidence
    riskHistory.push(currentRisk)
  }

  return (
    <LegalCaseCard title="累犯风险评估中的贝叶斯更新" color={CHAPTER_COLOR}>
      <p className="leading-relaxed mb-4">
        法官在量刑和假释决定中需要评估被告再犯罪的风险。贝叶斯方法帮助法官在获得新信息时理性地更新风险判断。
      </p>

      <div className="rounded-lg p-4 mb-4" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
        <h4 className="font-semibold mb-3 text-sm" style={{ color: 'var(--text-primary)' }}>交互分析：逐步证据更新</h4>
        <div className="mb-4">
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>初始再犯风险</span>
            <span className="text-sm font-mono px-2 py-0.5 rounded" style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}>{(priorRisk * 100).toFixed(0)}%</span>
          </div>
          <input type="range" min="0.05" max="0.8" step="0.05" value={priorRisk} onChange={e => { setPriorRisk(+e.target.value); setEvidenceSteps([]) }} className="w-full" style={{ accentColor: CHAPTER_COLOR }} />
        </div>

        {evidenceSteps.length < evidenceList.length && (
          <div className="rounded p-3 mb-3" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <p className="text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>下一项证据：{evidenceList[evidenceSteps.length].name}</p>
            <div className="flex gap-2">
              <button onClick={() => setEvidenceSteps(p => [...p, true])} className="px-3 py-1.5 text-xs rounded-lg font-medium text-white" style={{ background: CHAPTER_COLOR }}>是</button>
              <button onClick={() => setEvidenceSteps(p => [...p, false])} className="px-3 py-1.5 text-xs rounded-lg" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>否</button>
            </div>
          </div>
        )}

        <div className="space-y-2 text-sm">
          {evidenceSteps.map((present, i) => (
            <div key={i} className="flex justify-between items-center py-1" style={{ borderBottom: '1px solid var(--border)' }}>
              <span style={{ color: 'var(--text-secondary)' }}>{evidenceList[i].name}：<strong>{present ? '是' : '否'}</strong></span>
              <span className="font-mono text-sm" style={{ color: CHAPTER_COLOR }}>→ {(riskHistory[i + 1] * 100).toFixed(1)}%</span>
            </div>
          ))}
        </div>

        {evidenceSteps.length > 0 && (
          <div className="mt-3 flex justify-between items-center pt-3" style={{ borderTop: '1px solid var(--border)' }}>
            <span className="font-medium" style={{ color: 'var(--text-primary)' }}>当前累犯风险评估</span>
            <span className="font-mono text-xl font-bold" style={{ color: CHAPTER_COLOR }}>{(currentRisk * 100).toFixed(1)}%</span>
          </div>
        )}
        <button onClick={() => setEvidenceSteps([])} className="mt-3 px-3 py-1.5 text-xs rounded-lg" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>重置</button>
      </div>

      <div className="p-4 rounded-lg" style={{ background: `${CHAPTER_COLOR}10`, border: `1px solid ${CHAPTER_COLOR}30` }}>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          <strong style={{ color: 'var(--text-primary)' }}>关键洞察：</strong>贝叶斯更新展示了每一项新证据如何改变风险评估。不应被单一因素主导判断。
        </p>
      </div>
    </LegalCaseCard>
  )
}

// ============================================
// 主页面
// ============================================
export default function Chapter5Page() {
  return (
    <div className="min-h-screen">
      <ChapterHeader chapterNumber={5} title="贝叶斯推断" subtitle="Bayesian Inference"
        description="深入理解先验与后验概率，运用贝叶斯方法进行证据更新" color={CHAPTER_COLOR} />

      <div className="max-w-4xl mx-auto px-4 md:px-6 py-12 md:py-16">
        <SectionIntro chapterColor={CHAPTER_COLOR}
          prerequisites={['条件概率', '概率分布', '贝叶斯定理']}
          learningGoals={['理解先验与后验概率', '掌握共轭先验', '贝叶斯参数估计', '贝叶斯 vs 频率派', '法律证据分析']}
          overview={<><p className="mb-3">本章深入探讨<strong>贝叶斯推断</strong>——将先验知识与数据相结合的概率推理方法。</p><p>在法律证据评价中，贝叶斯思维帮助我们理性地更新对案件事实的判断。</p></>} />

        <BeginnerExplanation title="初学者指南">
          <div className="space-y-4">
            <p><strong>先验概率</strong>像"第一印象"。</p>
            <p><strong>后验概率</strong>像"了解更多信息后的新印象"。</p>
            <p><strong>贝叶斯更新</strong>像"侦探根据新证据调整嫌疑人名单"。</p>
          </div>
        </BeginnerExplanation>

        <ScrollReveal>
          <h2 className="text-2xl font-bold mb-6 pt-4" style={{ color: 'var(--text-primary)' }}>贝叶斯更新</h2>
          <p className="leading-relaxed mb-6" style={{ color: 'var(--text-secondary)' }}>贝叶斯推断的核心是结合先验分布和观测数据，得到后验分布。</p>
        </ScrollReveal>

        <FormulaBox title="贝叶斯推断基本公式" latex="p(θ|D) = p(D|θ) · p(θ) / p(D)"
          explanation={<ul className="space-y-1"><li><strong>p(θ|D)</strong>：后验分布</li><li><strong>p(D|θ)</strong>：似然函数</li><li><strong>p(θ)</strong>：先验分布</li><li><strong>p(D)</strong>：边缘似然</li></ul>} />

        <ExperimentContainer title="交互演示：贝叶斯更新" description="使用Beta-Binomial共轭先验模型">
          <BayesianUpdatingVisualization />
        </ExperimentContainer>

        <FormulaBox title="Beta-Binomial 共轭先验" latex="θ|X ~ Beta(α + k, β + n - k)"
          explanation={<p>先验 θ ~ Beta(α, β)，数据 X ~ Bin(n, θ)，后验分布只需将观测结果加到先验参数上。</p>} />

        <ScrollReveal>
          <h2 className="text-2xl font-bold mb-6 pt-4" style={{ color: 'var(--text-primary)' }}>似然函数</h2>
          <p className="leading-relaxed mb-6" style={{ color: 'var(--text-secondary)' }}>似然函数度量在参数 θ 下观察到数据的可能性。MLE选择使似然最大的参数值。</p>
        </ScrollReveal>

        <ExperimentContainer title="交互演示：似然函数" description="拖动滑块查看不同参数下的似然值">
          <LikelihoodVisualization />
        </ExperimentContainer>

        <LegalBayesCase />

        <Checkpoint type="think">
          <div className="space-y-3">
            <p className="font-medium">贝叶斯 vs 频率派</p>
            <p>在法律实践中，哪种方法更符合法官/陪审团的思维过程？当证据有限时，先验知识的重要性如何体现？</p>
          </div>
        </Checkpoint>

        <SectionOutro
          keyPoints={['贝叶斯推断将先验知识与观测数据相结合', '共轭先验使计算简便', '贝叶斯方法直接给出参数的概率分布', '在法律证据分析中有助于理性更新判断']}
          question="某法官先验认为有罪概率50%。证据出现概率：有罪必然出现，无罪20%出现。求后验概率。"
          hint="P(有罪|证据) = 1×0.5 / (1×0.5 + 0.2×0.5) = 83.3%"
          nextChapter={{ title: '回归分析', description: '线性回归、模型评估与量刑预测', link: '/theory/chapter6' }}
        />

        <ChapterNav currentChapter={5} />
      </div>
    </div>
  )
}
