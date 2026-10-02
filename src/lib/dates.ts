import { addDays, differenceInCalendarDays, format, getDay, isToday, isTomorrow, nextMonday, nextSaturday, parseISO, startOfDay } from 'date-fns'

export const DATE_FORMAT = 'yyyy-MM-dd'
export const DATE_RE = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2})?$/

/** True when a string is a real calendar date (rejects 2026-02-31, 2026-13-99 …). */
export function isValidDue(value: string): boolean {
  if (!DATE_RE.test(value)) return false
  const [datePart] = value.split('T')
  const parsed = parseISO(value)
  if (Number.isNaN(parsed.getTime())) return false
  return format(parsed, DATE_FORMAT) === datePart
}

/** The stored format: date-only, or date with a 24h time. */
export const toDue = (date: Date, time = ''): string => format(date, DATE_FORMAT) + (time ? `T${time}` : '')
export const hasTime = (due: string): boolean => due.includes('T')
export const todayKey = (from: Date = new Date()): string => format(from, DATE_FORMAT)
/** Local calendar day of a stored ISO timestamp (`doneAt`, `updatedAt`). */
export const dayKey = (timestamp: string): string => {
  const date = parseISO(timestamp)
  return Number.isNaN(date.getTime()) ? timestamp.slice(0, 10) : format(date, DATE_FORMAT)
}

export const splitDue = (due?: string): { date: Date | undefined; time: string } => {
  if (!due) return { date: undefined, time: '' }
  return { date: parseISO(due), time: hasTime(due) ? due.slice(11, 16) : '' }
}

export const tomorrow = (from: Date = new Date()): Date => addDays(from, 1)
/** Saturday of the current weekend; stays today when it already is the weekend. */
export const thisWeekend = (from: Date = new Date()): Date => {
  const day = getDay(from)
  return day === 0 || day === 6 ? startOfDay(from) : nextSaturday(from)
}
export const nextWeekStart = (from: Date = new Date()): Date => nextMonday(from)

export interface DueInfo { text: string; overdue: boolean; lateDays: number }
/** Human label for a due string plus whether the task is late. */
export function dueInfo(due: string, done: boolean, now: Date = new Date()): DueInfo {
  const date = parseISO(due)
  const time = hasTime(due) ? ` · ${format(date, 'p')}` : ''
  const lateDays = -differenceInCalendarDays(date, now)
  if (!done && lateDays > 0) return { text: `Overdue · ${lateDays} day${lateDays === 1 ? '' : 's'}`, overdue: true, lateDays }
  const base = isToday(date) ? 'Today' : isTomorrow(date) ? 'Tomorrow' : format(date, 'EEE, MMM d')
  return { text: base + time, overdue: false, lateDays: 0 }
}

/** Due today or earlier — used by the Today view and the overdue actions. */
export const isDueTodayOrLate = (due: string, now: Date = new Date()): boolean =>
  isToday(parseISO(due)) || startOfDay(parseISO(due)) < startOfDay(now)
