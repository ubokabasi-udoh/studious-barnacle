import type { ButtonHTMLAttributes } from 'react'

interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Set for toggle chips; omit for plain action chips so no pressed state is announced. */
  active?: boolean
}

/** Small selectable pill used for due-date shortcuts, tags and filters. */
export function Chip({ active, className = '', type = 'button', ...rest }: ChipProps) {
  return (
    <button
      type={type}
      {...(active === undefined ? {} : { 'aria-pressed': active })}
      className={`inline-flex min-h-[44px] items-center gap-1.5 rounded-full border px-3 text-xs font-medium transition ${
        active
          ? 'border-brand bg-brand-soft text-brand dark:border-brand-bright dark:bg-slate-800 dark:text-brand-bright'
          : 'border-[#E2E8F0] text-[#64748B] hover:border-brand hover:text-brand dark:border-slate-700 dark:text-slate-400 dark:hover:border-brand-bright dark:hover:text-brand-bright'
      } ${className}`}
      {...rest}
    />
  )
}
