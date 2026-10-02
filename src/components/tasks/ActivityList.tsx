import { formatDistanceToNow, parseISO } from 'date-fns'
import { CalendarClock, CheckCircle2, Pencil, Plus, Repeat2, RotateCcw, type LucideIcon } from 'lucide-react'
import type { ActivityEntry, ActivityKind } from '../../types'

const ICONS: Record<ActivityKind, LucideIcon> = {
  created: Plus, updated: Pencil, completed: CheckCircle2, reopened: RotateCcw,
  rescheduled: CalendarClock, repeated: Repeat2
}

const MAX_ENTRIES = 12

/** Read-only history of what happened to a task, newest first. */
export function ActivityList({ entries }: { entries: ActivityEntry[] }) {
  if (entries.length === 0) return <p className="muted text-sm">Nothing has happened yet.</p>
  return (
    <ul className="space-y-3">
      {entries.slice(0, MAX_ENTRIES).map(entry => {
        const Icon = ICONS[entry.kind]
        const at = parseISO(entry.at)
        return (
          <li key={entry.id} className="flex items-start gap-3 text-sm">
            <span aria-hidden="true" className="muted mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
              <Icon size={13} />
            </span>
            <span className="min-w-0">
              <span className="block">{entry.text}</span>
              {!Number.isNaN(at.getTime()) && (
                <span className="muted text-xs">{formatDistanceToNow(at, { addSuffix: true })}</span>
              )}
            </span>
          </li>
        )
      })}
    </ul>
  )
}
