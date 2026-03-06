'use client'

import Link from "next/link";
import { ArrowRight, BarChart3, BookOpen, Newspaper } from "lucide-react";

const features = [
  {
    href: "/pulse",
    icon: BarChart3,
    title: "研究态势",
    subtitle: "CLSCI Pulse",
    description: "基于NLP文本挖掘的CLSCI期刊泛刑法研究动态 — 主题建模、关键词共现网络、期刊分布与方法论检测",
    tag: "核心功能",
  },
  {
    href: "/theory",
    icon: BookOpen,
    title: "统计可视化",
    subtitle: "Seeing Theory",
    description: "交互式统计学可视化教学 — 概率论、频率学派推断、贝叶斯推断，以法学案例为背景的量化方法训练",
    tag: "教学工具",
  },
  {
    href: "/brief",
    icon: Newspaper,
    title: "法学简报",
    subtitle: "Legal Brief",
    description: "双语法学新闻简报 — 追踪国内外法学研究前沿、立法动态与司法实践",
    tag: "每日更新",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      {/* Hero */}
      <section className="relative">
        <div className="mx-auto max-w-5xl px-6 pb-20 pt-28 text-center">
          <h1 className="font-serif mx-auto max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl" style={{ color: 'var(--navy)', lineHeight: '1.15', letterSpacing: '-0.02em' }}>
            法脉
            <span className="mx-3 text-3xl sm:text-4xl" style={{ color: 'var(--gold)' }}>JuriPulse</span>
          </h1>

          <p className="mx-auto mt-5 max-w-lg text-base leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            面向法学研究者的学术情报平台。通过文本挖掘与交互式可视化，<br className="hidden sm:block" />
            系统呈现 CLSCI 期刊研究态势，提供量化方法训练与学术动态追踪。
          </p>

          <div className="mt-8 flex items-center justify-center gap-4">
            <Link
              href="/pulse"
              className="inline-flex items-center gap-2 rounded-md px-6 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
              style={{ background: 'var(--navy)' }}
            >
              探索研究态势 <ArrowRight size={15} />
            </Link>
            <Link
              href="/theory"
              className="inline-flex items-center gap-2 rounded-md px-6 py-2.5 text-sm font-medium transition-colors"
              style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
            >
              统计学习
            </Link>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="border-y" style={{ borderColor: 'var(--border)' }}>
        <div className="mx-auto grid max-w-5xl grid-cols-2 sm:grid-cols-4">
          {[
            { n: "20", label: "CLSCI 期刊" },
            { n: "418", label: "泛刑法论文" },
            { n: "15", label: "NLP 主题聚类" },
            { n: "6", label: "统计学章节" },
          ].map((s, i) => (
            <div key={s.label} className="px-6 py-5 text-center" style={{ borderRight: i < 3 ? '1px solid var(--border)' : 'none' }}>
              <div className="font-serif text-2xl font-semibold tracking-tight" style={{ color: 'var(--navy)' }}>{s.n}</div>
              <div className="mt-1 text-[11px] tracking-wide" style={{ color: 'var(--text-tertiary)' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Feature cards */}
      <section className="mx-auto max-w-5xl px-6 py-20">
        <div className="mb-10">
          <p className="text-[11px] font-medium uppercase tracking-widest" style={{ color: 'var(--gold)' }}>Platform</p>
          <h2 className="font-serif mt-2 text-2xl font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>三大核心模块</h2>
        </div>

        <div className="grid gap-5 sm:grid-cols-3">
          {features.map((f) => (
            <Link
              key={f.href}
              href={f.href}
              className="card-hover group relative flex flex-col rounded-lg p-6"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)', borderLeft: '3px solid var(--gold)' }}
            >
              <div className="mb-4 flex items-center justify-between">
                <div className="flex h-9 w-9 items-center justify-center rounded-md" style={{ background: 'var(--accent-glow)', color: 'var(--navy)' }}>
                  <f.icon size={18} strokeWidth={1.5} />
                </div>
                <span className="text-[10px] font-medium uppercase tracking-widest" style={{ color: 'var(--text-tertiary)' }}>{f.tag}</span>
              </div>
              <h3 className="font-serif text-base font-semibold" style={{ color: 'var(--text-primary)' }}>{f.title}</h3>
              <p className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>{f.subtitle}</p>
              <p className="mt-3 flex-1 text-[13px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                {f.description}
              </p>
              <div className="mt-5 flex items-center gap-1 text-[13px] font-medium transition-colors" style={{ color: 'var(--navy)' }}>
                进入 <ArrowRight size={13} className="transition-transform group-hover:translate-x-1" />
              </div>
            </Link>
          ))}
        </div>
      </section>

    </div>
  );
}
