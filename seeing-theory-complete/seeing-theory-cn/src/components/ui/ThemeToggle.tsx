import { Sun, Moon, Monitor } from 'lucide-react'
import { useTheme } from '../../hooks/useTheme'
import { Tooltip } from './Tooltip'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-full">
      <Tooltip content="浅色模式" delay={300}>
        <button
          onClick={() => setTheme('light')}
          className={`
            p-2 rounded-full transition-all duration-200
            ${theme === 'light' 
              ? 'bg-white dark:bg-gray-700 text-amber-500 shadow-sm' 
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }
            focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400
          `}
          aria-label="切换到浅色模式"
          aria-pressed={theme === 'light'}
        >
          <Sun size={18} aria-hidden="true" />
        </button>
      </Tooltip>

      <Tooltip content="跟随系统" delay={300}>
        <button
          onClick={() => setTheme('system')}
          className={`
            p-2 rounded-full transition-all duration-200
            ${theme === 'system' 
              ? 'bg-white dark:bg-gray-700 text-blue-500 shadow-sm' 
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }
            focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400
          `}
          aria-label="跟随系统主题"
          aria-pressed={theme === 'system'}
        >
          <Monitor size={18} aria-hidden="true" />
        </button>
      </Tooltip>

      <Tooltip content="深色模式" delay={300}>
        <button
          onClick={() => setTheme('dark')}
          className={`
            p-2 rounded-full transition-all duration-200
            ${theme === 'dark' 
              ? 'bg-white dark:bg-gray-700 text-indigo-500 shadow-sm' 
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }
            focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400
          `}
          aria-label="切换到深色模式"
          aria-pressed={theme === 'dark'}
        >
          <Moon size={18} aria-hidden="true" />
        </button>
      </Tooltip>
    </div>
  )
}

// Simple toggle button for quick switching
export function ThemeToggleSimple() {
  const { resolvedTheme, toggleTheme } = useTheme()

  return (
    <Tooltip content={resolvedTheme === 'light' ? '切换到深色模式' : '切换到浅色模式'} delay={300}>
      <button
        onClick={toggleTheme}
        className="
          p-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 
          text-gray-700 dark:text-gray-200
          hover:bg-gray-200 dark:hover:bg-gray-700
          transition-colors duration-200
          focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400
        "
        aria-label={resolvedTheme === 'light' ? '切换到深色模式' : '切换到浅色模式'}
      >
        {resolvedTheme === 'light' ? (
          <Moon size={20} aria-hidden="true" />
        ) : (
          <Sun size={20} aria-hidden="true" />
        )}
      </button>
    </Tooltip>
  )
}

export default ThemeToggle
