import type {
  ActivityEntry, ActivityKind, AppState, Priority, Project, Recurrence, RecurrencePreset, RecurrenceUnit,
  Reminder, ReminderPreset, Subtask, Task, Theme
} from '../types'
import { isValidDue } from './dates'
import { uid } from './uid'

/** Bump when the stored shape changes, and handle it in `migrate()`. */
export const SCHEMA_VERSION = 1

const PRIORITIES: Priority[] = [0, 1, 2, 3, 4]
const REMINDER_PRESETS: ReminderPreset[] = ['none', '10m', '30m', '1h', '1d', 'custom']
const RECURRENCE_PRESETS: RecurrencePreset[] = ['none', 'daily', 'weekdays', 'weekly', 'monthly', 'custom']
const RECURRENCE_UNITS: RecurrenceUnit[] = ['days', 'weeks', 'months']
const ACTIVITY_KINDS: ActivityKind[] = ['created', 'updated', 'completed', 'reopened', 'rescheduled', 'repeated']
const PROJECT_COLORS = ['#2563EB', '#8B5CF6', '#F59E0B', '#10B981', '#EF4444']

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const asText = (value: unknown, fallback = ''): string => (typeof value === 'string' ? value : fallback)
const asBool = (value: unknown): boolean => value === true
const asIso = (value: unknown): string | undefined =>
  typeof value === 'string' && !Number.isNaN(Date.parse(value)) ? value : undefined
const asDue = (value: unknown): string | undefined =>
  typeof value === 'string' && isValidDue(value) ? value : undefined
const asArray = (value: unknown): unknown[] => (Array.isArray(value) ? value : [])
const asInterval = (value: unknown, fallback = 1): number =>
  typeof value === 'number' && Number.isFinite(value) ? Math.min(999, Math.max(1, Math.round(value))) : fallback

function asPriority(value: unknown): Priority {
  return typeof value === 'number' && PRIORITIES.includes(value as Priority) ? (value as Priority) : 0
}

function asTags(value: unknown): string[] {
  return Array.from(new Set(asArray(value).filter((t): t is string => typeof t === 'string').map(t => t.trim().toLowerCase()).filter(Boolean)))
}

function asSubtasks(value: unknown): Subtask[] {
  return asArray(value).flatMap(raw => {
    if (!isRecord(raw)) return []
    const title = asText(raw.title).trim()
    if (!title) return []
    return [{ id: asText(raw.id) || uid('s'), title, done: asBool(raw.done) }]
  })
}

function asActivity(value: unknown, fallbackAt: string): ActivityEntry[] {
  return asArray(value).flatMap(raw => {
    if (!isRecord(raw)) return []
    const kind = ACTIVITY_KINDS.includes(raw.kind as ActivityKind) ? (raw.kind as ActivityKind) : 'updated'
    const text = asText(raw.text).trim()
    if (!text) return []
    return [{ id: asText(raw.id) || uid('a'), at: asIso(raw.at) ?? fallbackAt, kind, text }]
  })
}

function asReminder(value: unknown): Reminder | undefined {
  if (!isRecord(value)) return undefined
  const preset = REMINDER_PRESETS.includes(value.preset as ReminderPreset) ? (value.preset as ReminderPreset) : 'none'
  if (preset === 'none') return undefined
  return preset === 'custom' ? { preset, minutes: asInterval(value.minutes, 30) } : { preset }
}

function asRecurrence(value: unknown): Recurrence | undefined {
  if (!isRecord(value)) return undefined
  const preset = RECURRENCE_PRESETS.includes(value.preset as RecurrencePreset) ? (value.preset as RecurrencePreset) : 'none'
  if (preset === 'none') return undefined
  if (preset !== 'custom') return { preset }
  const unit = RECURRENCE_UNITS.includes(value.unit as RecurrenceUnit) ? (value.unit as RecurrenceUnit) : 'days'
  return { preset, interval: asInterval(value.interval), unit }
}

function asTask(value: unknown): Task | null {
  if (!isRecord(value)) return null
  const title = asText(value.title).trim()
  if (!title) return null
  const createdAt = asIso(value.createdAt) ?? new Date().toISOString()
  const done = asBool(value.done)
  const doneAt = done ? asIso(value.doneAt) ?? createdAt : undefined
  return {
    id: asText(value.id) || uid('t'),
    title,
    description: asText(value.description),
    notes: asText(value.notes),
    due: asDue(value.due),
    priority: asPriority(value.priority),
    project: asText(value.project) || undefined,
    tags: asTags(value.tags),
    subtasks: asSubtasks(value.subtasks),
    reminder: asReminder(value.reminder),
    recurrence: asRecurrence(value.recurrence),
    activity: asActivity(value.activity, doneAt ?? createdAt),
    done,
    doneAt,
    createdAt,
    updatedAt: asIso(value.updatedAt) ?? createdAt
  }
}

function asProject(value: unknown, index: number): Project | null {
  if (!isRecord(value)) return null
  const name = asText(value.name).trim()
  if (!name) return null
  const color = asText(value.color)
  return { id: asText(value.id) || uid('p'), name, color: /^#[0-9a-f]{6}$/i.test(color) ? color : PROJECT_COLORS[index % PROJECT_COLORS.length] }
}

/** Migration hook: older payloads are normalised up to the current schema version. */
function migrate(raw: Record<string, unknown>): Record<string, unknown> {
  // v0 -> v1: tasks gained `notes` and `activity`, the state gained `version`.
  return raw
}

/**
 * Turn unknown stored JSON into a valid `AppState`, dropping anything malformed.
 * Returns `null` when the payload is not usable at all, so callers can recover.
 */
export function normalizeState(value: unknown): AppState | null {
  if (!isRecord(value)) return null
  if (!Array.isArray(value.tasks) || !Array.isArray(value.projects)) return null
  const raw = migrate(value)
  const theme = raw.theme === 'dark' || raw.theme === 'light' || raw.theme === 'system' ? (raw.theme as Theme) : 'system'
  return {
    version: SCHEMA_VERSION,
    theme,
    tasks: asArray(raw.tasks).flatMap(rawTask => {
      const task = asTask(rawTask)
      return task ? [task] : []
    }),
    projects: asArray(raw.projects).flatMap((rawProject, index) => {
      const project = asProject(rawProject, index)
      return project ? [project] : []
    })
  }
}
