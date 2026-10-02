import type { ActivityEntry, ActivityKind, Priority, Task, TaskInput } from '../types'
import { dueInfo } from './dates'
import { uid } from './uid'

export const PRIORITY_LABELS: Record<Priority, string> = { 0: 'None', 1: 'Low', 2: 'Medium', 3: 'High', 4: 'Urgent' }

/** Newest-first activity entries. */
export const makeEntry = (kind: ActivityKind, text: string, at: string = new Date().toISOString()): ActivityEntry =>
  ({ id: uid('a'), at, kind, text })

const list = (items: string[]): string => items.join(', ')

/** Text of the entries that describe an edit, so history stays readable. */
export function describeEdit(prev: Task, next: TaskInput): string[] {
  const out: string[] = []
  if (prev.title !== next.title.trim()) out.push(`Renamed to “${next.title.trim()}”`)
  if (prev.description !== next.description.trim()) out.push('Description updated')
  if (prev.notes !== next.notes.trim()) out.push('Notes updated')
  if ((prev.due ?? '') !== (next.due ?? '')) {
    out.push(next.due ? `Due date set to ${dueInfo(next.due, false).text}` : 'Due date removed')
  }
  if (prev.priority !== next.priority) out.push(`Priority set to ${PRIORITY_LABELS[next.priority]}`)
  if ((prev.project ?? '') !== (next.project ?? '')) out.push('Project changed')
  if (list(prev.tags) !== list(next.tags)) out.push('Tags updated')
  if (prev.subtasks.length !== next.subtasks.length) {
    const added = next.subtasks.length - prev.subtasks.length
    out.push(added > 0 ? `Added ${added} subtask${added === 1 ? '' : 's'}` : `Removed ${-added} subtask${added === -1 ? '' : 's'}`)
  }
  if (JSON.stringify(prev.reminder ?? null) !== JSON.stringify(next.reminder ?? null)) out.push('Reminder updated')
  if (JSON.stringify(prev.recurrence ?? null) !== JSON.stringify(next.recurrence ?? null)) out.push('Repeat updated')
  return out
}
