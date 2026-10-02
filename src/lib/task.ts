import type { Subtask, Task, TaskInput } from '../types'
import { describeEdit, makeEntry } from './activity'
import { nextDueFrom } from './recurrence'
import { uid } from './uid'

export const newSubtask = (title: string): Subtask => ({ id: uid('s'), title: title.trim(), done: false })

export const emptyInput = (): TaskInput => ({ title: '', description: '', notes: '', priority: 0, tags: [], subtasks: [] })

export const inputFromTask = (task: Task): TaskInput => ({
  title: task.title, description: task.description, notes: task.notes, due: task.due, priority: task.priority,
  project: task.project, tags: [...task.tags], subtasks: task.subtasks.map(s => ({ ...s })),
  reminder: task.reminder ? { ...task.reminder } : undefined,
  recurrence: task.recurrence ? { ...task.recurrence } : undefined
})

/** Structural comparison — used to tell whether a drawer draft is dirty. */
export const isSameInput = (a: TaskInput, b: TaskInput): boolean => JSON.stringify(a) === JSON.stringify(b)

export const canSave = (input: TaskInput): boolean => input.title.trim().length > 0

const uniqueTags = (tags: string[]): string[] => Array.from(new Set(tags.map(t => t.trim().toLowerCase()).filter(Boolean)))

type TaskBase = Pick<Task, 'id' | 'activity' | 'done' | 'createdAt' | 'updatedAt'>

/** Fold the drawer input onto the parts of a task the input does not own. */
function applyInput(base: TaskBase, input: TaskInput): Task {
  return {
    ...base,
    title: input.title.trim(),
    description: input.description.trim(),
    notes: input.notes.trim(),
    due: input.due,
    priority: input.priority,
    project: input.project,
    tags: uniqueTags(input.tags),
    subtasks: input.subtasks.map(s => ({ ...s, title: s.title.trim() })).filter(s => s.title.length > 0),
    reminder: input.reminder && input.reminder.preset !== 'none' ? { ...input.reminder } : undefined,
    recurrence: input.recurrence && input.recurrence.preset !== 'none' ? { ...input.recurrence } : undefined
  }
}

export function taskFromInput(input: TaskInput, now: Date = new Date()): Task {
  const at = now.toISOString()
  const base: TaskBase = { id: uid('t'), activity: [], done: false, createdAt: at, updatedAt: at }
  return { ...applyInput(base, input), activity: [makeEntry('created', 'Task created', at)] }
}

export function mergeTask(previous: Task, input: TaskInput, now: Date = new Date()): Task {
  const at = now.toISOString()
  const changes = describeEdit(previous, input).map(text => makeEntry('updated', text, at))
  return { ...applyInput(previous, input), updatedAt: at, activity: [...changes, ...previous.activity] }
}

/**
 * Toggle a task's done state, optionally spawning the next occurrence of a
 * repeating task. Pure so React can call it from a state updater.
 */
export function applyToggle(tasks: Task[], id: string, now: Date = new Date(), nextId: () => string = () => uid('t')): Task[] {
  const at = now.toISOString()
  const out: Task[] = []
  for (const task of tasks) {
    if (task.id !== id) { out.push(task); continue }
    const done = !task.done
    out.push({
      ...task, done, doneAt: done ? at : undefined, updatedAt: at,
      activity: [makeEntry(done ? 'completed' : 'reopened', done ? 'Marked complete' : 'Marked incomplete', at), ...task.activity]
    })
    if (done && task.recurrence && task.recurrence.preset !== 'none') {
      const due = nextDueFrom(task.due, task.recurrence, now)
      if (due) {
        out.unshift({
          ...task, id: nextId(), due, done: false, doneAt: undefined, createdAt: at, updatedAt: at,
          subtasks: task.subtasks.map(s => ({ ...s, done: false })),
          activity: [makeEntry('repeated', 'Repeated from a recurring task', at)]
        })
      }
    }
  }
  return out
}
