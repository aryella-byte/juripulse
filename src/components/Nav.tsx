'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X } from 'lucide-react'

const links = [
  { href: '/', label: '首页' },
  { href: '/pulse', label: '研究态势' },
  { href: '/theory', label: '统计可视化' },
  { href: '/brief', label: '法学简报' },
]

export default function Nav() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  return (
    <nav className="sticky top-0 z-50 border-b" style={{ background: '#fff', borderColor: 'var(--border)' }}>
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M2 12h4l3-8 4 16 3-8h6" stroke="var(--navy)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="font-serif text-[15px] font-semibold tracking-tight" style={{ color: 'var(--navy)' }}>法脉</span>
          <span className="text-[10px] font-medium tracking-widest uppercase" style={{ color: 'var(--text-tertiary)' }}>JuriPulse</span>
        </Link>

        {/* Desktop */}
        <div className="hidden gap-1 md:flex">
          {links.map(l => (
            <Link
              key={l.href}
              href={l.href}
              className="relative px-3 py-4 text-[13px] transition-colors"
              style={{
                color: isActive(l.href) ? 'var(--navy)' : 'var(--text-tertiary)',
                fontWeight: isActive(l.href) ? 500 : 400,
              }}
            >
              {l.label}
              {isActive(l.href) && (
                <span className="absolute bottom-0 left-3 right-3 h-[2px]" style={{ background: 'var(--gold)' }} />
              )}
            </Link>
          ))}
        </div>

        <button className="md:hidden" onClick={() => setOpen(!open)} style={{ color: 'var(--text-secondary)' }}>
          {open ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {open && (
        <div className="border-t px-6 pb-4 pt-2 md:hidden" style={{ background: '#fff', borderColor: 'var(--border)' }}>
          {links.map(l => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="block py-2.5 text-[13px]"
              style={{
                color: isActive(l.href) ? 'var(--navy)' : 'var(--text-tertiary)',
                borderLeft: isActive(l.href) ? '2px solid var(--gold)' : '2px solid transparent',
                paddingLeft: '12px',
              }}
            >
              {l.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  )
}
