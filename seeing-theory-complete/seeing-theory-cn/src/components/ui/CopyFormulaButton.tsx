import { Copy, Check } from 'lucide-react'
import { useClipboard } from '../../hooks/useClipboard'
import { Tooltip } from './Tooltip'

interface CopyFormulaButtonProps {
  latex: string
  displayText?: string
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function CopyFormulaButton({
  latex,
  displayText,
  className = '',
  size = 'md'
}: CopyFormulaButtonProps) {
  const { copy, copied } = useClipboard({ timeout: 2000 })

  const sizeClasses = {
    sm: 'p-1.5 text-xs',
    md: 'p-2 text-sm',
    lg: 'p-2.5 text-base'
  }

  const iconSizes = {
    sm: 12,
    md: 14,
    lg: 16
  }

  const handleCopy = () => {
    copy(latex)
  }

  return (
    <Tooltip
      content={copied ? '已复制！' : '复制 LaTeX 公式'}
      position="top"
      delay={200}
    >
      <button
        onClick={handleCopy}
        className={`
          inline-flex items-center gap-1.5 
          bg-gray-100 hover:bg-gray-200 
          text-gray-600 hover:text-gray-800
          rounded-lg transition-colors
          focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1
          ${sizeClasses[size]}
          ${className}
        `}
        aria-label={`复制公式: ${displayText || latex}`}
        aria-live="polite"
      >
        {copied ? (
          <>
            <Check size={iconSizes[size]} className="text-green-600" aria-hidden="true" />
            <span className="text-green-600 font-medium">已复制</span>
          </>
        ) : (
          <>
            <Copy size={iconSizes[size]} aria-hidden="true" />
            <span className="hidden sm:inline">复制公式</span>
          </>
        )}
      </button>
    </Tooltip>
  )
}

export default CopyFormulaButton
