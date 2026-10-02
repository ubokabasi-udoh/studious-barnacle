import { addDays, endOfWeek, format, isToday, isTomorrow, parseISO, startOfDay, subDays } from 'date-fns'
import type { Task, ViewKind } from '../types'
import { dayKey } from './dates'

export const openTasks = (tasks: Task[]): Task[] => tasks.filter(t => !t.done)

const startOfDue = (task: Task): Date => startOfDay(parseISO(task.due!))
const byDueThenPriority = (a: Task, b: Task): number =>
  (a.due ?? '').localeCompare(b.due ?? '') || b.priority - a.priority

/** Every task that belongs to a view, in the order the view shows it. */
export function selectViewTasks(tasks: Task[], kind: ViewKind, projectId?: string, now: Date = new Date()): Task[] {
  const open = openTasks(tasks)
  const todayStart = startOfDay(now)
  const tomorrowStart = startOfDay(addDays(now, 1))
  switch (kind) {
    case 'inbox':
      return open.filter(t => !t.due)
    case 'today':
      return open.filter(t => !!t.due && (isToday(parseISO(t.due)) || startOfDue(t) < todayStart)).sort(byDueThenPriority)
    case 'upcoming':
      return open.filter(t => !!t.due && startOfDue(t) >= tomorrowStart).sort(byDueThenPriority)
    case 'completed':
      return tasks.filter(t => t.done).sort((a, b) => (b.doneAt ?? '').localeCompare(a.doneAt ?? ''))
    case 'project':
      return tasks.filter(t => t.project === projectId).sort((a, b) => Number(a.done) - Number(b.done) || byDueThenPriority(a, b))
    default:
      return []
  }
}

/** "Tomorrow" first, then everything up to the end of this week, then Later. */
export function groupUpcoming(tasks: Task[], now: Date = new Date()): [string, Task[]][] {
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 })
  const groups: Record<string, Task[]> = { Tomorrow: [], 'This week': [], Later: [] }
  tasks.forEach(task => {
    const due = startOfDue(task)
    const bucket = isTomorrow(due) ? groups.Tomorrow : due <= weekEnd ? groups['This week'] : groups.Later
    bucket.push(task)
  })
  return Object.entries(groups).filter(([, list]) => list.length > 0)
}

export interface TodaySummary { dueToday: number; doneToday: number; progress: number }

export function todaySummary(tasks: Task[], now: Date = new Date()): TodaySummary {
  const key = format(now, 'yyyy-MM-dd')
  const doneToday = tasks.filter(t => t.done && t.doneAt && dayKey(t.doneAt) === key).length
  const dueToday = openTasks(tasks).filter(t => !!t.due && isToday(parseISO(t.due))).length
  return { dueToday, doneToday, progress: Math.round((doneToday / Math.max(doneToday + dueToday, 1)) * 100) }
}

/** Consecutive days with at least one completion; a day with none yet keeps the streak alive. */
export function streakOf(tasks: Task[], now: Date = new Date()): number {
  const days = new Set(tasks.filter(t => t.doneAt).map(t => dayKey(t.doneAt!)))
  const today = format(now, 'yyyy-MM-dd')
  let day = days.has(today) ? now : subDays(now, 1)
  let streak = 0
  while (days.has(format(day, 'yyyy-MM-dd'))) { streak++; day = subDays(day, 1) }
  return streak
}

export const allTags = (tasks: Task[]): string[] =>
  Array.from(new Set(tasks.flatMap(t => t.tags))).sort((a, b) => a.localeCompare(b))

export const overdueCount = (tasks: Task[], now: Date = new Date()): number =>
  openTasks(tasks).filter(t => !!t.due && startOfDue(t) < startOfDay(now)).length
