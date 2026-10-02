import { useEffect, useRef, type KeyboardEvent as ReactKeyboardEvent, type ReactNode } from 'react'
import { X } from 'lucide-react'

const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])'

interface DrawerProps {
  open: boolean
  /** Dialog heading, also used as its accessible name. */
  title: string
  /** id applied to the heading so the dialog can be labelled by it. */
  titleId: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
}

/**
 * Accessible dialog: bottom sheet on mobile, right-side panel from md up.
 * Traps focus, closes on Esc and outside click, and restores focus on close.
 */
export function Drawer({ open, title, titleId, onClose, children, footer }: DrawerProps) {
  const panel = useRef<HTMLDivElement>(null)
  const opener = useRef<HTMLElement | null>(null)
  const close = useRef(onClose)
  close.current = onClose

  useEffect(() => {
    if (!open) return
    opener.current = document.activeElement as HTMLElement | null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const node = panel.current
    const target = node?.querySelector<HTMLElement>('[data-autofocus]') ?? node?.querySelector<HTMLElement>(FOCUSABLE)
    target?.focus()
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); close.current() }
    }
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = previousOverflow
      opener.current?.focus?.()
    }
  }, [open])

  if (!open) return null

  const trapTab = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Tab') return
    const items = panel.current?.querySelectorAll<HTMLElement>(FOCUSABLE)
    if (!items || items.length === 0) return
    const first = items[0]
    const last = items[items.length - 1]
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
  }

  return (
    <div className="fixed inset-0 z-40">
      <div className="absolute inset-0 bg-navy/40 dark:bg-black/60" onClick={() => close.current()} aria-hidden="true" />
      <div
        ref={panel} role="dialog" aria-modal="true" aria-labelledby={titleId} onKeyDown={trapTab}
        className="rise absolute inset-x-0 bottom-0 flex max-h-[92vh] flex-col overflow-hidden rounded-t-2xl border border-[#E2E8F0] bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900 md:inset-y-0 md:left-auto md:right-0 md:max-h-none md:w-[440px] md:rounded-l-2xl md:rounded-tr-none"
      >
        <div className="flex items-center justify-between gap-3 border-b border-[#E2E8F0] px-4 py-2 dark:border-slate-800 md:px-5">
          <h2 id={titleId} className="text-base font-semibold">{title}</h2>
          <button
            type="button" onClick={() => close.current()} aria-label="Close"
            className="-mr-2 flex h-11 w-11 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-navy dark:hover:bg-slate-800 dark:hover:text-slate-100"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
        {footer && <div className="border-t border-[#E2E8F0] px-4 py-3 dark:border-slate-800 md:px-5">{footer}</div>}
      </div>
    </div>
  )
}
