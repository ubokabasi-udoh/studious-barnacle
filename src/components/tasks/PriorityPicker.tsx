import { PRIORITY_LABELS } from '../../lib/activity'
import type { Priority } from '../../types'
import { PRIORITY_META, PRIORITY_ORDER } from './priority'

/** Visual priority selector: icon + label per level, never colour alone. */
export function PriorityPicker({ value, onChange }: { value: Priority; onChange: (priority: Priority) => void }) {
  return (
    <div role="radiogroup" aria-label="Priority" className="flex flex-wrap gap-2">
      {PRIORITY_ORDER.map(priority => {
        const meta = PRIORITY_META[priority]
        const active = value === priority
        return (
          <button
            key={priority} type="button" role="radio" aria-checked={active} onClick={() => onChange(priority)}
            className={`inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border px-3 text-sm font-medium transition ${
              active
                ? 'border-brand bg-brand-soft text-brand dark:border-brand-bright dark:bg-slate-800 dark:text-brand-bright'
                : 'border-[#E2E8F0] text-[#64748B] hover:border-brand hover:text-brand dark:border-slate-700 dark:text-slate-400 dark:hover:border-brand-bright dark:hover:text-brand-bright'
            }`}
          >
            {meta && <meta.Icon size={14} className={active ? undefined : meta.cls} aria-hidden="true" />}
            {PRIORITY_LABELS[priority]}
          </button>
        )
      })}
    </div>
  )
}
