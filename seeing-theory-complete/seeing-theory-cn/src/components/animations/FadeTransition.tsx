import { useEffect, useState, useRef, type ReactNode } from 'react'
import { useReducedMotion } from '../../hooks/useAccessibility'

// ============================================
// 淡入过渡组件
// ============================================
interface FadeTransitionProps {
  children: ReactNode
  duration?: number
  delay?: number
  className?: string
  direction?: 'up' | 'down' | 'left' | 'right' | 'none'
  distance?: number
}

export function FadeTransition({
  children,
  duration = 500,
  delay = 0,
  className = '',
  direction = 'up',
  distance = 24
}: FadeTransitionProps) {
  const prefersReducedMotion = useReducedMotion()
  const [isVisible, setIsVisible] = useState(prefersReducedMotion)

  useEffect(() => {
    if (prefersReducedMotion) {
      setIsVisible(true)
      return
    }

    const timer = setTimeout(() => {
      setIsVisible(true)
    }, delay)

    return () => clearTimeout(timer)
  }, [delay, prefersReducedMotion])

  const getTransform = () => {
    if (prefersReducedMotion || direction === 'none') return 'none'
    const offset = isVisible ? 0 : distance
    switch (direction) {
      case 'up': return `translateY(${offset}px)`
      case 'down': return `translateY(-${offset}px)`
      case 'left': return `translateX(${offset}px)`
      case 'right': return `translateX(-${offset}px)`
      default: return 'none'
    }
  }

  return (
    <div
      className={className}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: getTransform(),
        transition: prefersReducedMotion 
          ? 'none' 
          : `opacity ${duration}ms cubic-bezier(0.16, 1, 0.3, 1), transform ${duration}ms cubic-bezier(0.16, 1, 0.3, 1)`,
        willChange: prefersReducedMotion ? 'auto' : 'opacity, transform'
      }}
    >
      {children}
    </div>
  )
}

// ============================================
// 页面过渡组件
// ============================================
interface PageTransitionProps {
  children: ReactNode
  className?: string
}

export function PageTransition({ children, className = '' }: PageTransitionProps) {
  const prefersReducedMotion = useReducedMotion()
  const [isVisible, setIsVisible] = useState(prefersReducedMotion)

  useEffect(() => {
    if (prefersReducedMotion) return
    
    setIsVisible(false)
    const timer = setTimeout(() => setIsVisible(true), 50)
    return () => clearTimeout(timer)
  }, [prefersReducedMotion])

  return (
    <div
      className={className}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(12px)',
        transition: prefersReducedMotion 
          ? 'none' 
          : 'opacity 400ms cubic-bezier(0.16, 1, 0.3, 1), transform 400ms cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      {children}
    </div>
  )
}

// ============================================
// 交错动画容器
// ============================================
interface StaggerContainerProps {
  children: ReactNode
  className?: string
  staggerDelay?: number
}

export function StaggerContainer({ 
  children, 
  className = '',
  staggerDelay = 100 
}: StaggerContainerProps) {
  return (
    <div className={className}>
      {Array.isArray(children) 
        ? children.map((child, index) => (
            <FadeTransition
              key={index}
              delay={index * staggerDelay}
              duration={500}
            >
              {child}
            </FadeTransition>
          ))
        : children
      }
    </div>
  )
}

// ============================================
// 滚动触发动画
// ============================================
interface ScrollRevealProps {
  children: ReactNode
  className?: string
  threshold?: number
  delay?: number
  direction?: 'up' | 'down' | 'left' | 'right' | 'scale'
}

export function ScrollReveal({
  children,
  className = '',
  threshold = 0.1,
  delay = 0,
  direction = 'up'
}: ScrollRevealProps) {
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const prefersReducedMotion = useReducedMotion()

  useEffect(() => {
    if (prefersReducedMotion) {
      setIsVisible(true)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setIsVisible(true), delay)
          observer.disconnect()
        }
      },
      { threshold }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => observer.disconnect()
  }, [threshold, delay, prefersReducedMotion])

  const getTransform = () => {
    if (prefersReducedMotion) return 'none'
    if (isVisible) {
      if (direction === 'scale') return 'scale(1)'
      return 'translate(0, 0)'
    }
    switch (direction) {
      case 'up': return 'translateY(30px)'
      case 'down': return 'translateY(-30px)'
      case 'left': return 'translateX(30px)'
      case 'right': return 'translateX(-30px)'
      case 'scale': return 'scale(0.95)'
      default: return 'none'
    }
  }

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: getTransform(),
        transition: prefersReducedMotion
          ? 'none'
          : 'opacity 600ms cubic-bezier(0.16, 1, 0.3, 1), transform 600ms cubic-bezier(0.16, 1, 0.3, 1)',
        willChange: prefersReducedMotion ? 'auto' : 'opacity, transform'
      }}
    >
      {children}
    </div>
  )
}

// ============================================
// 浮动动画组件
// ============================================
interface FloatProps {
  children: ReactNode
  className?: string
  duration?: number
  distance?: number
}

export function Float({
  children,
  className = '',
  duration = 3,
  distance = 10
}: FloatProps) {
  const prefersReducedMotion = useReducedMotion()

  return (
    <div
      className={className}
      style={{
        animation: prefersReducedMotion 
          ? 'none' 
          : `float ${duration}s ease-in-out infinite`,
        ['--float-distance' as string]: `${distance}px`,
      }}
    >
      {children}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(var(--float-distance, 10px)); }
        }
      `}</style>
    </div>
  )
}

// ============================================
// 文字渐变动画
// ============================================
interface GradientTextProps {
  children: ReactNode
  className?: string
  colors?: string[]
}

export function GradientText({
  children,
  className = '',
  colors = ['#B8A99A', '#9CAFAA', '#A8A4CE']
}: GradientTextProps) {
  return (
    <span
      className={className}
      style={{
        background: `linear-gradient(135deg, ${colors.join(', ')})`,
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
      }}
    >
      {children}
    </span>
  )
}

// ============================================
// 脉冲效果
// ============================================
interface PulseProps {
  children: ReactNode
  className?: string
}

export function Pulse({ children, className = '' }: PulseProps) {
  const prefersReducedMotion = useReducedMotion()

  return (
    <div
      className={className}
      style={{
        animation: prefersReducedMotion 
          ? 'none' 
          : 'pulse-soft 2s ease-in-out infinite',
      }}
    >
      {children}
      <style>{`
        @keyframes pulse-soft {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.85; transform: scale(0.98); }
        }
      `}</style>
    </div>
  )
}

// ============================================
// 计数动画
// ============================================
interface CountUpProps {
  end: number
  duration?: number
  suffix?: string
  prefix?: string
  className?: string
}

export function CountUp({
  end,
  duration = 2000,
  suffix = '',
  prefix = '',
  className = ''
}: CountUpProps) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const prefersReducedMotion = useReducedMotion()

  useEffect(() => {
    if (prefersReducedMotion) {
      setCount(end)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          let startTime: number
          const animate = (currentTime: number) => {
            if (!startTime) startTime = currentTime
            const progress = Math.min((currentTime - startTime) / duration, 1)
            const easeOut = 1 - Math.pow(1 - progress, 3)
            setCount(Math.floor(easeOut * end))
            if (progress < 1) {
              requestAnimationFrame(animate)
            }
          }
          requestAnimationFrame(animate)
          observer.disconnect()
        }
      },
      { threshold: 0.5 }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => observer.disconnect()
  }, [end, duration, prefersReducedMotion])

  return (
    <span ref={ref} className={className}>
      {prefix}{count.toLocaleString()}{suffix}
    </span>
  )
}

// ============================================
// 骨架屏加载
// ============================================
interface SkeletonProps {
  width?: string | number
  height?: string | number
  className?: string
  circle?: boolean
}

export function Skeleton({
  width = '100%',
  height = 20,
  className = '',
  circle = false
}: SkeletonProps) {
  return (
    <div
      className={className}
      style={{
        width,
        height,
        borderRadius: circle ? '50%' : '0.5rem',
        background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.5s infinite',
      }}
    >
      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  )
}

// ============================================
// 悬停缩放
// ============================================
interface HoverScaleProps {
  children: ReactNode
  className?: string
  scale?: number
}

export function HoverScale({
  children,
  className = '',
  scale = 1.02
}: HoverScaleProps) {
  const [isHovered, setIsHovered] = useState(false)
  const prefersReducedMotion = useReducedMotion()

  return (
    <div
      className={className}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        transform: isHovered && !prefersReducedMotion ? `scale(${scale})` : 'scale(1)',
        transition: 'transform 300ms cubic-bezier(0.34, 1.56, 0.64, 1)',
      }}
    >
      {children}
    </div>
  )
}

// ============================================
// 玻璃拟态卡片
// ============================================
interface GlassCardProps {
  children: ReactNode
  className?: string
  hover?: boolean
}

export function GlassCard({ children, className = '', hover = true }: GlassCardProps) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div
      className={className}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        background: isHovered 
          ? 'rgba(255, 255, 255, 0.9)' 
          : 'rgba(255, 255, 255, 0.75)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.5)',
        borderRadius: '1.5rem',
        boxShadow: isHovered
          ? '0 8px 40px -10px rgba(31, 38, 135, 0.15)'
          : '0 8px 32px 0 rgba(31, 38, 135, 0.07)',
        transform: hover && isHovered ? 'translateY(-2px)' : 'translateY(0)',
        transition: 'all 300ms cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      {children}
    </div>
  )
}

export default FadeTransition
