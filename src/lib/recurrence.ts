import { addDays, addMonths, addWeeks, getDay, parseISO, startOfDay } from 'date-fns'
import type { Recurrence, RecurrencePreset } from '../types'
import { hasTime, toDue } from './dates'

export const RECURRENCE_PRESETS: RecurrencePreset[] = ['none', 'daily', 'weekdays', 'weekly', 'monthly', 'custom']

export const RECURRENCE_LABELS: Record<RecurrencePreset, string> = {
  none: 'Does not repeat', daily: 'Daily', weekdays: 'Every weekday', weekly: 'Weekly', monthly: 'Monthly', custom: 'Custom'
}

const plural = (n: number, unit: string): string => (n === 1 ? unit : `${n} ${unit}s`)

export function recurrenceLabel(recurrence?: Recurrence): string {
  if (!recurrence || recurrence.preset === 'none') return 'Does not repeat'
  if (recurrence.preset !== 'custom') return RECURRENCE_LABELS[recurrence.preset]
  const n = Math.max(1, Math.round(recurrence.interval ?? 1))
  const unit = (recurrence.unit ?? 'days').replace(/s$/, '')
  return `Every ${plural(n, unit)}`
}

const stepWeekday = (from: Date): Date => {
  let next = addDays(from, 1)
  while (getDay(next) === 0 || getDay(next) === 6) next = addDays(next, 1)
  return next
}

function stepper(recurrence: Recurrence): (from: Date) => Date {
  if (recurrence.preset === 'daily') return from => addDays(from, 1)
  if (recurrence.preset === 'weekdays') return stepWeekday
  if (recurrence.preset === 'weekly') return from => addWeeks(from, 1)
  if (recurrence.preset === 'monthly') return from => addMonths(from, 1)
  if (recurrence.preset === 'custom') {
    const n = Math.max(1, Math.round(recurrence.interval ?? 1))
    const unit = recurrence.unit ?? 'days'
    if (unit === 'weeks') return from => addWeeks(from, n)
    if (unit === 'months') return from => addMonths(from, n)
    return from => addDays(from, n)
  }
  return from => addDays(from, 1)
}

/**
 * The due string of the next occurrence. Keeps the original time of day and skips
 * forward past today so a late completion never lands in the past.
 */
export function nextDueFrom(due: string | undefined, recurrence: Recurrence, now: Date = new Date()): string | undefined {
  if (!recurrence || recurrence.preset === 'none') return undefined
  const time = due && hasTime(due) ? due.slice(11, 16) : ''
  const step = stepper(recurrence)
  let next = step(due ? parseISO(due) : startOfDay(now))
  let guard = 0
  while (startOfDay(next) < startOfDay(now) && guard < 400) { next = step(next); guard++ }
  return toDue(next, time)
}
