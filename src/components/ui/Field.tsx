import type { ReactNode } from 'react'

export const inputCls = 'h-11 w-full rounded-xl border border-[#E2E8F0] bg-transparent px-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-brand dark:border-slate-700 dark:focus:border-brand-bright'
export const selectCls = `${inputCls} appearance-none pr-8`
export const textareaCls = 'w-full rounded-xl border border-[#E2E8F0] bg-transparent p-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-brand dark:border-slate-700 dark:focus:border-brand-bright'
export const labelCls = 'block text-xs font-semibold text-[#64748B] dark:text-slate-400'
export const primaryBtnCls = 'inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-brand px-4 text-sm font-semibold text-white transition hover:bg-brand/90 active:scale-[.98] disabled:opacity-40'
export const ghostBtnCls = 'inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold text-[#64748B] transition hover:bg-slate-100 hover:text-navy dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100'
export const dangerBtnCls = 'inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl px-3 text-sm font-semibold text-[#EF4444] transition hover:bg-[#EF4444]/10'

interface FieldProps {
  label: string
  /** Set when the label belongs to a single control. */
  htmlFor?: string
  hint?: string
  children: ReactNode
}

export function Field({ label, htmlFor, hint, children }: FieldProps) {
  return (
    <div className="space-y-2">
      {htmlFor
        ? <label htmlFor={htmlFor} className={labelCls}>{label}</label>
        : <p className={labelCls}>{label}</p>}
      {children}
      {hint && <p className="muted text-xs">{hint}</p>}
    </div>
  )
}
