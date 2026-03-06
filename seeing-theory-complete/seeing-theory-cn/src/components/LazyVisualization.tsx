import { useIntersectionObserver } from '../hooks/useIntersectionObserver'
import type { ReactNode } from 'react'

interface LazyVisualizationProps {
  children: ReactNode
  className?: string
  placeholder?: ReactNode
  threshold?: number
  rootMargin?: string
}

export function LazyVisualization({
  children,
  className = '',
  placeholder,
  threshold = 0.1,
  rootMargin = '100px'
}: LazyVisualizationProps) {
  const { ref, isIntersecting } = useIntersectionObserver<HTMLDivElement>({
    threshold,
    rootMargin,
    triggerOnce: true
  })

  return (
    <div 
      ref={ref} 
      className={`${className} min-h-[100px]`}
      role="region"
      aria-label="交互式图表"
    >
      {isIntersecting ? (
        children
      ) : placeholder || (
        <div className="flex items-center justify-center h-48 bg-gray-50 rounded-xl animate-pulse">
          <span className="text-gray-400 text-sm">加载中...</span>
        </div>
      )}
    </div>
  )
}

interface LazyLoadOptions {
  threshold?: number
  rootMargin?: string
  triggerOnce?: boolean
}

export function withLazyLoad<T extends object>(
  Component: React.ComponentType<T>,
  options: LazyLoadOptions = {}
) {
  const { threshold = 0.1, rootMargin = '100px', triggerOnce = true } = options

  return function LazyLoadedComponent(props: T) {
    const { ref, isIntersecting } = useIntersectionObserver<HTMLDivElement>({
      threshold,
      rootMargin,
      triggerOnce
    })

    return (
      <div ref={ref} className="min-h-[100px]">
        {isIntersecting && <Component {...props} />}
      </div>
    )
  }
}

export default LazyVisualization
