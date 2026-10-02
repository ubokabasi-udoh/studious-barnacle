export type Priority = 0 | 1 | 2 | 3 | 4 // none, low, medium, high, urgent
export type Theme = 'light' | 'dark' | 'system'
export interface Subtask { id: string; title: string; done: boolean }

export type ReminderPreset = 'none' | '10m' | '30m' | '1h' | '1d' | 'custom'
/** Minutes before the due time. `custom` carries its own `minutes`. */
export interface Reminder { preset: ReminderPreset; minutes?: number }

export type RecurrencePreset = 'none' | 'daily' | 'weekdays' | 'weekly' | 'monthly' | 'custom'
export type RecurrenceUnit = 'days' | 'weeks' | 'months'
export interface Recurrence { preset: RecurrencePreset; interval?: number; unit?: RecurrenceUnit }

export type ActivityKind = 'created' | 'updated' | 'completed' | 'reopened' | 'rescheduled' | 'repeated'
export interface ActivityEntry { id: string; at: string; kind: ActivityKind; text: string }

export interface Task {
  id: string; title: string; description: string; notes: string
  due?: string // yyyy-MM-dd or yyyy-MM-dd'T'HH:mm
  priority: Priority; project?: string; tags: string[]; subtasks: Subtask[]
  reminder?: Reminder; recurrence?: Recurrence
  activity: ActivityEntry[]
  done: boolean; doneAt?: string; createdAt: string; updatedAt: string
}

/** The editable shape of a task, as owned by the task drawer. */
export type TaskInput = Pick<Task, 'title' | 'description' | 'notes' | 'priority' | 'tags' | 'subtasks'> & {
  due?: string; project?: string; reminder?: Reminder; recurrence?: Recurrence
}

export interface Project { id: string; name: string; color: string }
export interface AppState { version: number; tasks: Task[]; projects: Project[]; theme: Theme }

export type ViewKind = 'inbox' | 'today' | 'upcoming' | 'completed' | 'project'

export interface Toast { msg: string; undo?: () => void; undoLabel?: string }

