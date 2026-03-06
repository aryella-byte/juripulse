import { useState } from 'react'
import { ChevronDown, ChevronUp, Lightbulb, AlertTriangle, CheckCircle, HelpCircle } from 'lucide-react'

// 学习检查点类型
export type CheckpointType = 'think' | 'mistake' | 'try'

interface CheckpointProps {
  type: CheckpointType
  title?: string
  children: React.ReactNode
}

// 学习检查点组件
export function Checkpoint({ type, title, children }: CheckpointProps) {
  const [isExpanded, setIsExpanded] = useState(true)

  const config = {
    think: {
      icon: Lightbulb,
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      titleColor: 'text-blue-800',
      iconColor: 'text-blue-500',
      defaultTitle: '💭 暂停思考'
    },
    mistake: {
      icon: AlertTriangle,
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200',
      titleColor: 'text-amber-800',
      iconColor: 'text-amber-500',
      defaultTitle: '⚠️ 常见误区'
    },
    try: {
      icon: CheckCircle,
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-200',
      titleColor: 'text-emerald-800',
      iconColor: 'text-emerald-500',
      defaultTitle: '✏️ 试一试'
    }
  }

  const { icon: Icon, bgColor, borderColor, titleColor, iconColor, defaultTitle } = config[type]

  return (
    <div className={`rounded-xl border ${borderColor} ${bgColor} p-4 my-6`}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between w-full text-left"
      >
        <div className="flex items-center gap-2">
          <Icon size={18} className={iconColor} />
          <span className={`font-medium ${titleColor}`}>{title || defaultTitle}</span>
        </div>
        {isExpanded ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
      </button>
      
      {isExpanded && (
        <div className="mt-3 text-sm text-gray-700 leading-relaxed">
          {children}
        </div>
      )}
    </div>
  )
}

// 桥梁说明组件 - 连接统计概念与法律应用
interface BridgeExplanationProps {
  concept: string
  law: string
  explanation: React.ReactNode
}

export function BridgeExplanation({ concept, law, explanation }: BridgeExplanationProps) {
  return (
    <div className="rounded-xl border-2 border-indigo-200 bg-gradient-to-r from-indigo-50 to-purple-50 p-5 my-6">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-2xl">🌉</span>
        <span className="font-semibold text-indigo-800">桥梁：从统计概念到法律应用</span>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="bg-white/70 rounded-lg p-3">
          <p className="text-xs text-gray-500 mb-1">统计概念</p>
          <p className="text-sm font-medium text-gray-800">{concept}</p>
        </div>
        <div className="bg-white/70 rounded-lg p-3">
          <p className="text-xs text-gray-500 mb-1">法律应用</p>
          <p className="text-sm font-medium text-gray-800">{law}</p>
        </div>
      </div>
      
      <div className="text-sm text-indigo-900 leading-relaxed">
        {explanation}
      </div>
    </div>
  )
}

// 章节开头组件
interface SectionIntroProps {
  prerequisites: string[]
  learningGoals: string[]
  overview: React.ReactNode
  chapterColor?: string
}

export function SectionIntro({ prerequisites, learningGoals, overview, chapterColor = '#6B7280' }: SectionIntroProps) {
  return (
    <div className="rounded-2xl bg-white/80 border border-white/50 backdrop-blur-sm shadow-sm p-6 mb-8">
      {/* 前置知识 */}
      <div className="mb-6">
        <h3 className="flex items-center gap-2 font-semibold text-gray-800 mb-3">
          <span className="text-xl">📍</span>
          前置知识
        </h3>
        <ul className="space-y-2">
          {prerequisites.map((item, idx) => (
            <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
              <span className="text-gray-400 mt-0.5">•</span>
              {item}
            </li>
          ))}
        </ul>
      </div>

      {/* 学习目标 */}
      <div className="mb-6">
        <h3 className="flex items-center gap-2 font-semibold text-gray-800 mb-3">
          <span className="text-xl">🎯</span>
          学习目标
        </h3>
        <ul className="space-y-2">
          {learningGoals.map((goal, idx) => (
            <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
              <span className="text-emerald-500 mt-0.5">✓</span>
              {goal}
            </li>
          ))}
        </ul>
      </div>

      {/* 本章概览 */}
      <div>
        <h3 className="flex items-center gap-2 font-semibold text-gray-800 mb-3">
          <span className="text-xl">🗺️</span>
          本章概览
        </h3>
        <div className="text-sm text-gray-600 leading-relaxed">
          {overview}
        </div>
      </div>

      {/* 学习路径提示 */}
      <div 
        className="mt-6 pt-4 border-t border-gray-100 flex items-center gap-2 text-sm"
        style={{ color: chapterColor }}
      >
        <HelpCircle size={16} />
        <span>建议学习时间：30-45分钟 | 包含交互实验和法律案例</span>
      </div>
    </div>
  )
}

// 章节结尾组件
interface SectionOutroProps {
  keyPoints: string[]
  nextChapter?: {
    title: string
    description: string
    link: string
  }
  question: string
  hint?: string
}

export function SectionOutro({ keyPoints, nextChapter, question, hint }: SectionOutroProps) {
  const [showHint, setShowHint] = useState(false)

  return (
    <div className="rounded-2xl bg-white/80 border border-white/50 backdrop-blur-sm shadow-sm p-6 mt-12">
      {/* 核心要点 */}
      <div className="mb-8">
        <h3 className="flex items-center gap-2 font-semibold text-gray-800 mb-4">
          <span className="text-xl">✅</span>
          核心要点
        </h3>
        <ul className="space-y-3">
          {keyPoints.map((point, idx) => (
            <li key={idx} className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-sm font-medium">
                {idx + 1}
              </span>
              <span className="text-sm text-gray-700 leading-relaxed">{point}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* 思考题 */}
      <div className="mb-8 p-5 rounded-xl bg-gradient-to-r from-violet-50 to-purple-50 border border-violet-200">
        <h3 className="flex items-center gap-2 font-semibold text-violet-800 mb-3">
          <span className="text-xl">💡</span>
          思考题
        </h3>
        <p className="text-sm text-violet-900 leading-relaxed mb-3">{question}</p>
        {hint && (
          <div>
            <button
              onClick={() => setShowHint(!showHint)}
              className="text-xs text-violet-600 hover:text-violet-800 underline"
            >
              {showHint ? '隐藏提示' : '查看提示'}
            </button>
            {showHint && (
              <p className="mt-2 text-xs text-violet-700 bg-white/60 rounded-lg p-3">
                💭 {hint}
              </p>
            )}
          </div>
        )}
      </div>

      {/* 下章预告 */}
      {nextChapter && (
        <div className="flex items-start gap-4 p-4 rounded-xl bg-gray-50 border border-gray-200">
          <div className="text-2xl">🔗</div>
          <div className="flex-1">
            <p className="text-xs text-gray-500 mb-1">下章预告</p>
            <h4 className="font-medium text-gray-800 mb-1">{nextChapter.title}</h4>
            <p className="text-sm text-gray-600 mb-3">{nextChapter.description}</p>
            <a
              href={nextChapter.link}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg text-sm font-medium hover:bg-gray-900 transition-colors"
            >
              继续学习 →
            </a>
          </div>
        </div>
      )}
    </div>
  )
}

// 问题引入组件
interface ProblemIntroProps {
  title: string
  problem: React.ReactNode
  hint?: React.ReactNode
}

export function ProblemIntro({ title, problem, hint }: ProblemIntroProps) {
  const [showHint, setShowHint] = useState(false)

  return (
    <div className="rounded-xl border-l-4 border-indigo-500 bg-indigo-50 p-5 my-6">
      <h4 className="flex items-center gap-2 font-semibold text-indigo-800 mb-3">
        <HelpCircle size={18} />
        {title}
      </h4>
      <div className="text-sm text-indigo-900 leading-relaxed mb-3">
        {problem}
      </div>
      {hint && (
        <div>
          <button
            onClick={() => setShowHint(!showHint)}
            className="text-xs text-indigo-600 hover:text-indigo-800 underline"
          >
            {showHint ? '收起提示' : '需要提示？'}
          </button>
          {showHint && (
            <div className="mt-3 p-3 bg-white/70 rounded-lg text-xs text-indigo-700">
              {hint}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
