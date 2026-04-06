'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

const chapters = [
  {
    num: 1,
    title: '基础概率',
    subtitle: 'Basic Probability',
    description: '探索概率的本质、大数定律，以及概率思维在证据评价中的法律应用。通过抛硬币实验直观理解频率与概率的关系。',
    color: '#1a365d',
    href: '/theory/chapter1',
  },
  {
    num: 2,
    title: '复合概率',
    subtitle: 'Compound Probability',
    description: '集合运算与条件概率：交互式 Venn 图、贝叶斯定理初步。以毒品检测假阳性为法学案例，理解条件概率的陷阱。',
    color: '#9c4221',
    href: '/theory/chapter2',
  },
  {
    num: 3,
    title: '概率分布',
    subtitle: 'Probability Distributions',
    description: '离散与连续分布：二项分布、正态分布、中心极限定理。以再犯率统计建模为背景，掌握分布理论的法学应用。',
    color: '#285e61',
    href: '/theory/chapter3',
  },
  {
    num: 4,
    title: '频率学派推断',
    subtitle: 'Frequentist Inference',
    description: '从样本到总体的推断方法：置信区间、假设检验与p值。以法学实证研究中的显著性检验为应用场景。',
    color: '#047857',
    href: '/theory/chapter4',
  },
  {
    num: 5,
    title: '贝叶斯推断',
    subtitle: 'Bayesian Inference',
    description: '贝叶斯定理与后验更新：如何根据新证据修正信念。以DNA证据评估和司法鉴定为法学案例。',
    color: '#b45309',
    href: '/theory/chapter5',
  },
  {
    num: 6,
    title: '回归分析',
    subtitle: 'Regression Analysis',
    description: '线性回归与多元回归：交互散点图、拟合线、模型评估。以量刑预测模型与司法判决一致性分析为法学案例。',
    color: '#553c9a',
    href: '/theory/chapter6',
  },
]

export default function TheoryPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <div className="mb-12 text-center">
        <p className="text-[11px] font-medium uppercase tracking-widest" style={{ color: 'var(--gold)' }}>Seeing Theory</p>
        <h1 className="font-serif mt-2 text-3xl font-semibold tracking-tight" style={{ color: 'var(--text-primary)', letterSpacing: '-0.025em' }}>统计可视化教学</h1>
        <p className="mt-3 text-sm" style={{ color: 'var(--text-tertiary)' }}>以法学案例为背景的交互式统计学习</p>
        <div className="mx-auto mt-4 h-[2px] w-12" style={{ background: 'var(--gold)' }} />
        <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          通过交互式D3.js可视化，直观理解概率论与数理统计的核心概念。
          每章包含法律案例分析，帮助法学研究者掌握量化方法。
        </p>
      </div>

      <div className="space-y-4">
        {chapters.map(ch => (
          <Link
            key={ch.num}
            href={ch.href}
            className="card-hover group flex items-start gap-6 rounded-lg p-6"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}
          >
            <div
              className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-md font-serif text-sm font-bold text-white"
              style={{ backgroundColor: ch.color }}
            >
              {ch.num}
            </div>
            <div className="flex-1">
              <h2 className="font-serif text-base font-semibold" style={{ color: 'var(--text-primary)' }}>{ch.title}</h2>
              <p className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>{ch.subtitle}</p>
              <p className="mt-2 text-[13px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{ch.description}</p>
              <div className="mt-3 flex items-center gap-1 text-[13px] font-medium" style={{ color: ch.color }}>
                开始学习 <ArrowRight size={13} className="transition-transform group-hover:translate-x-1" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
