import type { ReactNode } from 'react'

interface EmptyStateProps {
  icon: ReactNode
  title: string
  hint: string
  action?: ReactNode
}

/** Shared empty state: what happened, what to do next. */
export function EmptyState({ icon, title, hint, action }: EmptyStateProps) {
  return (
    <div className="card flex flex-col items-center px-6 py-14 text-center">
      <span aria-hidden="true" className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-soft text-brand dark:bg-slate-800 dark:text-brand-bright">
        {icon}
      </span>
      <h2 className="mt-4 text-lg font-semibold">{title}</h2>
      <p className="muted mt-1 max-w-xs text-sm">{hint}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
