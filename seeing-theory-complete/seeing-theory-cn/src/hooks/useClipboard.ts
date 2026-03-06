import { useState, useCallback } from 'react'

interface UseClipboardOptions {
  timeout?: number
  onSuccess?: () => void
  onError?: (error: Error) => void
}

export function useClipboard(options: UseClipboardOptions = {}) {
  const { timeout = 2000, onSuccess, onError } = options
  const [copied, setCopied] = useState(false)

  const copy = useCallback(
    async (text: string) => {
      try {
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(text)
        } else {
          // Fallback for older browsers
          const textArea = document.createElement('textarea')
          textArea.value = text
          textArea.style.position = 'fixed'
          textArea.style.left = '-999999px'
          textArea.style.top = '-999999px'
          document.body.appendChild(textArea)
          textArea.focus()
          textArea.select()
          
          const successful = document.execCommand('copy')
          document.body.removeChild(textArea)
          
          if (!successful) {
            throw new Error('execCommand returned false')
          }
        }
        
        setCopied(true)
        onSuccess?.()
        
        setTimeout(() => {
          setCopied(false)
        }, timeout)
        
        return true
      } catch (error) {
        const err = error instanceof Error ? error : new Error('Copy failed')
        onError?.(err)
        return false
      }
    },
    [timeout, onSuccess, onError]
  )

  return { copy, copied }
}

export default useClipboard
