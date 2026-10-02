import { useEffect, useRef } from 'react'

const isTypingTarget = (target: EventTarget | null): boolean => {
  const element = target as HTMLElement | null
  if (!element) return false
  return element.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(element.tagName)
}

interface GlobalKeyHandlers {
  /** `N` — open the new-task drawer. */
  onNewTask?: () => void
}

/**
 * App-level keyboard shortcuts. Single-key shortcuts never fire while the user is
 * typing, and the latest handlers are read from a ref so the listener stays put.
 */
export function useGlobalKeys(handlers: GlobalKeyHandlers) {
  const latest = useRef(handlers)
  latest.current = handlers

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return
      if (event.key.toLowerCase() !== 'n') return
      if (isTypingTarget(event.target)) return
      if (!latest.current.onNewTask) return
      event.preventDefault()
      latest.current.onNewTask()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])
}
