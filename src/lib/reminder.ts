import type { Reminder, ReminderPreset } from '../types'

export type ReminderOffsetPreset = Exclude<ReminderPreset, 'none' | 'custom'>

/** Minutes before the due time for each preset. */
export const REMINDER_MINUTES: Record<ReminderOffsetPreset, number> = { '10m': 10, '30m': 30, '1h': 60, '1d': 1440 }

export const REMINDER_PRESETS: ReminderPreset[] = ['none', '10m', '30m', '1h', '1d', 'custom']

export function reminderMinutes(reminder?: Reminder): number | undefined {
  if (!reminder || reminder.preset === 'none') return undefined
  if (reminder.preset === 'custom') return Math.max(1, Math.round(reminder.minutes ?? 30))
  return REMINDER_MINUTES[reminder.preset]
}

export function reminderLabel(reminder?: Reminder): string {
  const minutes = reminderMinutes(reminder)
  if (minutes === undefined) return 'No reminder'
  if (minutes === 1440) return '1 day before'
  if (minutes === 60) return '1 hour before'
  if (minutes < 60) return `${minutes} minutes before`
  const hours = Math.round((minutes / 60) * 10) / 10
  return `${hours} hours before`
}

/** When the reminder should fire, derived from the due string. */
export function reminderTime(due: string | undefined, reminder?: Reminder): Date | undefined {
  const minutes = reminderMinutes(reminder)
  if (!due || minutes === undefined) return undefined
  const at = new Date(new Date(due.includes('T') ? due : `${due}T09:00`).getTime() - minutes * 60_000)
  return Number.isNaN(at.getTime()) ? undefined : at
}
