import { useEffect, useState, useRef } from 'react'
import { useReducedMotion } from '../../hooks/useAccessibility'

// ============================================
// 动态粒子背景
// ============================================
interface ParticleBackgroundProps {
  color?: string
  density?: number
  className?: string
}

export function ParticleBackground({
  color = 'rgba(255, 255, 255, 0.3)',
  density = 30,
  className = ''
}: ParticleBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const prefersReducedMotion = useReducedMotion()
  const animationRef = useRef<number | null>(null)

  useEffect(() => {
    if (prefersReducedMotion) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio
      canvas.height = canvas.offsetHeight * window.devicePixelRatio
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
    }

    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    const particles: Array<{
      x: number
      y: number
      vx: number
      vy: number
      size: number
      alpha: number
    }> = []

    for (let i = 0; i < density; i++) {
      particles.push({
        x: Math.random() * canvas.offsetWidth,
        y: Math.random() * canvas.offsetHeight,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        size: Math.random() * 3 + 1,
        alpha: Math.random() * 0.5 + 0.2
      })
    }

    let frameCount = 0
    const animate = () => {
      frameCount++
      if (frameCount % 2 !== 0) {
        animationRef.current = requestAnimationFrame(animate)
        return
      }

      ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight)

      particles.forEach((particle, i) => {
        particle.x += particle.vx
        particle.y += particle.vy

        if (particle.x < 0 || particle.x > canvas.offsetWidth) particle.vx *= -1
        if (particle.y < 0 || particle.y > canvas.offsetHeight) particle.vy *= -1

        ctx.beginPath()
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
        ctx.fillStyle = color.replace('0.3', String(particle.alpha))
        ctx.fill()

        // 连接临近粒子
        if (i % 3 === 0) {
          particles.slice(i + 1).forEach((other) => {
            const dx = particle.x - other.x
            const dy = particle.y - other.y
            const distance = Math.sqrt(dx * dx + dy * dy)

            if (distance < 100) {
              ctx.beginPath()
              ctx.moveTo(particle.x, particle.y)
              ctx.lineTo(other.x, other.y)
              ctx.strokeStyle = color.replace('0.3', String(0.1 * (1 - distance / 100)))
              ctx.lineWidth = 0.5
              ctx.stroke()
            }
          })
        }
      })

      animationRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener('resize', resizeCanvas)
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [color, density, prefersReducedMotion])

  if (prefersReducedMotion) {
    return (
      <div 
        className={className}
        style={{
          background: `radial-gradient(circle at 30% 30%, ${color}, transparent 50%)`,
          opacity: 0.3
        }}
      />
    )
  }

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none'
      }}
    />
  )
}

// ============================================
// 波浪背景
// ============================================
interface WaveBackgroundProps {
  color?: string
  className?: string
}

export function WaveBackground({
  color = 'rgba(255, 255, 255, 0.1)',
  className = ''
}: WaveBackgroundProps) {
  const prefersReducedMotion = useReducedMotion()

  return (
    <div className={className} style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <svg
        viewBox="0 0 1440 320"
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          width: '100%',
          height: 'auto',
          opacity: 0.3
        }}
        preserveAspectRatio="none"
      >
        <path
          fill={color}
          d="M0,160L48,176C96,192,192,224,288,213.3C384,203,480,149,576,138.7C672,128,768,160,864,181.3C960,203,1056,213,1152,197.3C1248,181,1344,139,1392,117.3L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
          style={{
            animation: prefersReducedMotion ? 'none' : 'wave 8s ease-in-out infinite alternate'
          }}
        />
      </svg>
      <style>{`
        @keyframes wave {
          0% { transform: translateX(0) scaleY(1); }
          100% { transform: translateX(-50px) scaleY(1.1); }
        }
      `}</style>
    </div>
  )
}

// ============================================
// 章节进度指示器
// ============================================
interface ChapterProgressProps {
  currentSection: number
  totalSections: number
  color?: string
}

export function ChapterProgress({
  currentSection,
  totalSections,
  color = '#B8A99A'
}: ChapterProgressProps) {
  const progress = (currentSection / totalSections) * 100

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '3px',
        background: 'rgba(0, 0, 0, 0.05)',
        zIndex: 100,
      }}
    >
      <div
        style={{
          height: '100%',
          width: `${progress}%`,
          background: `linear-gradient(90deg, ${color} 0%, ${color}dd 100%)`,
          transition: 'width 300ms cubic-bezier(0.16, 1, 0.3, 1)',
          boxShadow: `0 0 10px ${color}40`
        }}
      />
    </div>
  )
}

// ============================================
// 章节导航指示器
// ============================================
interface SectionIndicatorProps {
  sections: string[]
  activeSection: number
  onSectionClick?: (index: number) => void
  color?: string
  className?: string
}

export function SectionIndicator({
  sections,
  activeSection,
  onSectionClick,
  color = '#B8A99A',
  className = ''
}: SectionIndicatorProps) {
  return (
    <div className={className}>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
          padding: '1rem',
          background: 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(10px)',
          borderRadius: '1rem',
          border: '1px solid rgba(0, 0, 0, 0.05)'
        }}
      >
        {sections.map((section, index) => (
          <button
            key={index}
            onClick={() => onSectionClick?.(index)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.5rem 0.75rem',
              borderRadius: '0.5rem',
              border: 'none',
              background: activeSection === index 
                ? `${color}15` 
                : 'transparent',
              cursor: onSectionClick ? 'pointer' : 'default',
              transition: 'all 200ms ease',
              textAlign: 'left'
            }}
          >
            <div
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: activeSection === index ? color : 'rgba(0,0,0,0.2)',
                transition: 'all 200ms ease',
                transform: activeSection === index ? 'scale(1.2)' : 'scale(1)'
              }}
            />
            <span
              style={{
                fontSize: '0.8125rem',
                color: activeSection === index ? '#1a1a1a' : '#6b6b6b',
                fontWeight: activeSection === index ? 500 : 400,
                transition: 'all 200ms ease'
              }}
            >
              {section}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

// ============================================
// 大标题动画
// ============================================
interface AnimatedTitleProps {
  text: string
  className?: string
  delay?: number
}

export function AnimatedTitle({ text, className = '', delay = 0 }: AnimatedTitleProps) {
  const [isVisible, setIsVisible] = useState(false)
  const prefersReducedMotion = useReducedMotion()

  useEffect(() => {
    if (prefersReducedMotion) {
      setIsVisible(true)
      return
    }
    const timer = setTimeout(() => setIsVisible(true), delay)
    return () => clearTimeout(timer)
  }, [delay, prefersReducedMotion])

  return (
    <h1
      className={className}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
        transition: prefersReducedMotion 
          ? 'none' 
          : 'opacity 800ms cubic-bezier(0.16, 1, 0.3, 1), transform 800ms cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      {text}
    </h1>
  )
}

// ============================================
// 面包屑导航
// ============================================
interface BreadcrumbProps {
  items: Array<{
    label: string
    href?: string
  }>
  className?: string
}

export function Breadcrumb({ items, className = '' }: BreadcrumbProps) {
  return (
    <nav className={className} aria-label="面包屑导航">
      <ol
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          listStyle: 'none',
          margin: 0,
          padding: 0
        }}
      >
        {items.map((item, index) => (
          <li key={index} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {index > 0 && (
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                style={{ color: '#9a9a9a', opacity: 0.5 }}
              >
                <path d="M9 18l6-6-6-6" />
              </svg>
            )}
            {item.href ? (
              <a
                href={item.href}
                style={{
                  fontSize: '0.875rem',
                  color: index === items.length - 1 ? '#1a1a1a' : '#6b6b6b',
                  fontWeight: index === items.length - 1 ? 500 : 400,
                  textDecoration: 'none',
                  transition: 'color 200ms ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#1a1a1a'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = index === items.length - 1 ? '#1a1a1a' : '#6b6b6b'
                }}
              >
                {item.label}
              </a>
            ) : (
              <span
                style={{
                  fontSize: '0.875rem',
                  color: index === items.length - 1 ? '#1a1a1a' : '#6b6b6b',
                  fontWeight: index === items.length - 1 ? 500 : 400
                }}
              >
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}

export default ParticleBackground
