import { Link } from 'react-router-dom'
import { CheckCircle, Circle, Lock, Play } from 'lucide-react'

interface Chapter {
  id: number
  title: string
  subtitle: string
  desc: string
  bgColor: string
  textColor: string
  prerequisites: string[]
  estimatedTime: string
}

interface LearningPathMapProps {
  chapters: Chapter[]
  currentChapter?: number
  completedChapters?: number[]
}

export function LearningPathMap({ chapters, currentChapter, completedChapters = [] }: LearningPathMapProps) {
  return (
    <div className="w-full py-8">
      <div className="flex flex-col md:flex-row items-stretch justify-center gap-4 md:gap-0">
        {chapters.map((chapter, index) => {
          const isCompleted = completedChapters.includes(chapter.id)
          const isCurrent = currentChapter === chapter.id
          const isLocked = !isCompleted && !isCurrent && chapter.id > (currentChapter || 0)
          
          return (
            <div key={chapter.id} className="flex items-center">
              {/* Chapter Card */}
              <Link
                to={isLocked ? '#' : `/chapter/${chapter.id}`}
                className={`
                  relative group w-full md:w-[180px] p-4 rounded-2xl transition-all duration-300
                  ${isLocked ? 'opacity-60 cursor-not-allowed' : 'hover:scale-105 hover:shadow-xl cursor-pointer'}
                  ${isCurrent ? 'ring-4 ring-white/50 scale-105 shadow-xl' : ''}
                  ${isCompleted ? 'ring-2 ring-white/30' : ''}
                `}
                style={{ backgroundColor: chapter.bgColor }}
                onClick={(e) => isLocked && e.preventDefault()}
              >
                {/* Status Icon */}
                <div className="absolute top-3 right-3">
                  {isCompleted ? (
                    <CheckCircle size={20} className="text-white/80" />
                  ) : isCurrent ? (
                    <Play size={20} className="text-white fill-white" />
                  ) : isLocked ? (
                    <Lock size={20} className="text-white/60" />
                  ) : (
                    <Circle size={20} className="text-white/60" />
                  )}
                </div>

                {/* Chapter Number */}
                <div className="mb-2">
                  <span className={`
                    inline-block px-2 py-0.5 rounded-full text-xs font-medium
                    ${isCompleted ? 'bg-white/30' : 'bg-black/10'}
                  `}>
                    第 {chapter.id} 章
                  </span>
                </div>

                {/* Title */}
                <h3 className={`text-lg font-bold mb-1 ${chapter.textColor}`}>
                  {chapter.title}
                </h3>
                <p className={`text-xs ${chapter.textColor} opacity-70`}>
                  {chapter.subtitle}
                </p>

                {/* Prerequisites Tooltip */}
                <div className="mt-3 pt-3 border-t border-black/10">
                  <p className={`text-[10px] ${chapter.textColor} opacity-60`}>
                    ⏱️ {chapter.estimatedTime}
                  </p>
                </div>

                {/* Hover Tooltip for Prerequisites */}
                <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-48 p-3 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                  <p className="font-medium mb-1">前置知识：</p>
                  <ul className="space-y-1 text-gray-300">
                    {chapter.prerequisites.map((pre, idx) => (
                      <li key={idx}>• {pre}</li>
                    ))}
                  </ul>
                  <div className="absolute left-1/2 -translate-x-1/2 top-full border-4 border-transparent border-t-gray-900" />
                </div>
              </Link>

              {/* Connector Arrow */}
              {index < chapters.length - 1 && (
                <div className="hidden md:flex items-center justify-center w-8">
                  <div className="w-full h-0.5 bg-gradient-to-r from-white/20 to-white/40 relative">
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-0 h-0 border-t-4 border-b-4 border-l-4 border-transparent border-l-white/40" />
                  </div>
                </div>
              )}
              
              {/* Vertical connector for mobile */}
              {index < chapters.length - 1 && (
                <div className="flex md:hidden justify-center py-2">
                  <div className="h-6 w-0.5 bg-gradient-to-b from-white/20 to-white/40" />
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-4 mt-8 text-xs text-white/60">
        <div className="flex items-center gap-1">
          <CheckCircle size={14} className="text-emerald-400" />
          <span>已完成</span>
        </div>
        <div className="flex items-center gap-1">
          <Play size={14} className="text-blue-400" />
          <span>进行中</span>
        </div>
        <div className="flex items-center gap-1">
          <Circle size={14} />
          <span>未开始</span>
        </div>
        <div className="flex items-center gap-1">
          <Lock size={14} />
          <span>需先完成前置章节</span>
        </div>
      </div>
    </div>
  )
}

// 简化的章节进度指示器
interface ChapterProgressProps {
  totalChapters: number
  completedChapters: number
  currentChapter: number
}

export function ChapterProgress({ totalChapters, completedChapters, currentChapter }: ChapterProgressProps) {
  const progress = ((completedChapters) / totalChapters) * 100
  
  return (
    <div className="w-full max-w-md mx-auto">
      <div className="flex justify-between text-xs text-white/70 mb-2">
        <span>学习进度</span>
        <span>{completedChapters}/{totalChapters} 章</span>
      </div>
      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-emerald-400 to-blue-400 transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="text-center text-xs text-white/50 mt-2">
        当前：第 {currentChapter} 章 | 已完成 {Math.round(progress)}%
      </p>
    </div>
  )
}
