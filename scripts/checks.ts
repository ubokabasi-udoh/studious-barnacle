import assert from 'node:assert/strict'
import { normalizeState } from '../src/lib/normalize'
import { applyToggle, emptyInput, inputFromTask, mergeTask, taskFromInput, canSave } from '../src/lib/task'
import { nextDueFrom, recurrenceLabel } from '../src/lib/recurrence'
import { reminderLabel, reminderMinutes } from '../src/lib/reminder'
import { describeEdit } from '../src/lib/activity'
import { allTags, groupUpcoming, selectViewTasks, streakOf, todaySummary } from '../src/lib/selectors'
import { todayKey, toDue, dueInfo } from '../src/lib/dates'
import { parseQuick } from '../src/lib/parse'
import type { Task } from '../src/types'

let passed = 0
const check = (label: string, fn: () => void) => { fn(); passed++; console.log('  ok  ' + label) }

const day = (offset: number): Date => { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + offset); return d }
const key = (offset: number): string => todayKey(day(offset))
const iso = (offset: number): string => day(offset).toISOString()
const findWeekday = (target: number, from = 30): Date => { const d = day(from); while (d.getDay() !== target) d.setDate(d.getDate() + 1); return d }
/** Narrow away null/undefined so the checks below stay strict-typed. */
const expect = <T>(value: T | null | undefined, label: string): T => {
  if (value === null || value === undefined) throw new Error(`expected ${label}, got ${String(value)}`)
  return value
}

console.log('recurrence')

check('daily steps one day, weekly one week, monthly one month', () => {
  assert.equal(nextDueFrom(key(0), { preset: 'daily' }), key(1))
  assert.equal(nextDueFrom(key(0), { preset: 'weekly' }), key(7))
  assert.equal(recurrenceLabel({ preset: 'monthly' }), 'Monthly')
})

check('every weekday skips the weekend', () => {
  const friday = findWeekday(5)
  assert.equal(friday.getDay(), 5)
  const monday = new Date(friday.getFullYear(), friday.getMonth(), friday.getDate() + 3)
  assert.equal(nextDueFrom(todayKey(friday), { preset: 'weekdays' }), todayKey(monday))
})

check('a past due date rolls forward past today', () => {
  const friday = findWeekday(5, -20)
  const next = nextDueFrom(todayKey(friday), { preset: 'daily' })
  assert.ok(next !== undefined && next >= key(0), `expected today or later, got ${next}`)
})

check('keeps the time of day and rolls late completions forward', () => {
  const next = expect(nextDueFrom(`${key(-10)}T07:30`, { preset: 'daily' }), 'a next due date')
  assert.equal(next.slice(11), '07:30')
  assert.ok(next.slice(0, 10) >= key(0), `expected today or later, got ${next}`)
  assert.equal(nextDueFrom(undefined, { preset: 'daily' }), key(1))
  assert.equal(recurrenceLabel({ preset: 'custom', interval: 2, unit: 'weeks' }), 'Every 2 weeks')
  assert.equal(recurrenceLabel({ preset: 'custom', interval: 1, unit: 'days' }), 'Every day')
})

console.log('task mutations')

check('toggle completes the task and spawns the next occurrence', () => {
  const task = taskFromInput({ ...emptyInput(), title: 'Gym', due: `${key(0)}T07:00`, recurrence: { preset: 'daily' } })
  const after = applyToggle([task], task.id, new Date(), () => 'next')
  assert.equal(after.length, 2)
  assert.equal(after[0].id, 'next')
  assert.equal(after[0].done, false)
  assert.equal(after[0].due, `${key(1)}T07:00`)
  assert.equal(after[1].done, true)
  assert.equal(after[1].activity[0].kind, 'completed')
  const reopened = applyToggle(after.slice(1), task.id)
  assert.equal(reopened.length, 1)
  assert.equal(reopened[0].done, false)
  assert.equal(reopened[0].activity[0].kind, 'reopened')
})

check('mergeTask records what changed', () => {
  const task = taskFromInput({ ...emptyInput(), title: 'Draft brief' })
  const next = { ...inputFromTask(task), title: 'Draft the brief', priority: 3 as const, tags: ['work'] }
  assert.deepEqual(describeEdit(task, next), ['Renamed to “Draft the brief”', 'Priority set to High', 'Tags updated'])
  assert.equal(mergeTask(task, next).activity[0].kind, 'updated')
  assert.equal(mergeTask(task, inputFromTask(task)).activity.length, task.activity.length)
})

check('guards empty titles and normalises tags', () => {
  assert.equal(canSave(emptyInput()), false)
  const task = taskFromInput({ ...emptyInput(), title: '  Ship  ', tags: ['Work', 'work', ' Design '] })
  assert.equal(task.title, 'Ship')
  assert.deepEqual(task.tags, ['work', 'design'])
})

console.log('normalize / migration')

check('legacy payloads gain notes, activity and a version', () => {
  const state = expect(normalizeState({
    theme: 'dark',
    projects: [{ id: 'p1', name: 'Work', color: 'nope' }],
    tasks: [{ id: 'x', title: ' Old ', due: '2026-13-99', priority: 9, tags: ['A', 'a', ''], subtasks: [{ title: 'step' }], done: true }]
  }), 'a normalised state')
  assert.equal(state.version, 1)
  const task = state.tasks[0]
  assert.equal(task.title, 'Old')
  assert.equal(task.due, undefined)
  assert.equal(task.priority, 0)
  assert.deepEqual(task.tags, ['a'])
  assert.equal(task.subtasks.length, 1)
  assert.equal(task.notes, '')
  assert.equal(task.description, '')
  assert.ok(Array.isArray(task.activity))
  assert.equal(task.activity.length, 0, 'no history is invented for legacy tasks')
  assert.equal(typeof task.doneAt, 'string')
  assert.equal(state.projects[0].color, '#2563EB')
  assert.equal(state.theme, 'dark')
})

check('rejects unusable payloads and drops broken tasks', () => {
  assert.equal(normalizeState('nope'), null)
  assert.equal(normalizeState({ theme: 'light' }), null)
  assert.equal(normalizeState({ tasks: [{ title: '   ' }, null, 'x'], projects: [] })?.tasks.length, 0)
  assert.equal(normalizeState({ tasks: [], projects: [] })?.theme, 'system')
})

console.log('selectors')

const make = (title: string, extra: Partial<Task> = {}): Task => ({ ...taskFromInput({ ...emptyInput(), title }), ...extra })

check('views filter the way the pages expect', () => {
  const tasks: Task[] = [
    make('Inbox item'),
    make('Due today', { due: key(0) }),
    make('Overdue', { due: key(-3) }),
    make('Tomorrow', { due: key(1) }),
    make('Later', { due: key(20) }),
    make('Done', { done: true, doneAt: iso(0) }),
    make('Project task', { project: 'p1' })
  ]
  assert.deepEqual(selectViewTasks(tasks, 'inbox').map(t => t.title), ['Inbox item', 'Project task'])
  assert.deepEqual(selectViewTasks(tasks, 'today').map(t => t.title), ['Overdue', 'Due today'])
  assert.deepEqual(selectViewTasks(tasks, 'upcoming').map(t => t.title), ['Tomorrow', 'Later'])
  assert.deepEqual(selectViewTasks(tasks, 'completed').map(t => t.title), ['Done'])
  assert.deepEqual(selectViewTasks(tasks, 'project', 'p1').map(t => t.title), ['Project task'])
  assert.deepEqual(groupUpcoming(selectViewTasks(tasks, 'upcoming')).map(([label]) => label), ['Tomorrow', 'Later'])
})

check('summary and streak count the last days', () => {
  const tasks: Task[] = [
    make('a', { done: true, doneAt: iso(0) }),
    make('b', { done: true, doneAt: iso(-1) }),
    make('c', { done: true, doneAt: iso(-2) }),
    make('d', { due: key(0) }),
    make('e', { due: key(-1), done: true, doneAt: iso(0) })
  ]
  assert.deepEqual(todaySummary(tasks), { dueToday: 1, doneToday: 2, progress: 67 })
  assert.equal(streakOf(tasks), 3)
  assert.deepEqual(allTags([make('x', { tags: ['work', 'design'] }), make('y', { tags: ['design'] })]), ['design', 'work'])
})

console.log('dates, reminders and quick add')

check('due labels and overdue flags', () => {
  assert.equal(dueInfo(key(0), false).text, 'Today')
  assert.equal(dueInfo(`${key(0)}T18:00`, false).text, 'Today · 6:00 PM')
  const late = dueInfo(key(-2), false)
  assert.equal(late.overdue, true)
  assert.equal(late.text, 'Overdue · 2 days')
  assert.equal(dueInfo(key(-2), true).overdue, false)
  assert.equal(toDue(day(1), '09:30'), `${key(1)}T09:30`)
})

check('reminder labels', () => {
  assert.equal(reminderLabel(undefined), 'No reminder')
  assert.equal(reminderLabel({ preset: '1h' }), '1 hour before')
  assert.equal(reminderMinutes({ preset: '1d' }), 1440)
  assert.equal(reminderMinutes({ preset: 'custom', minutes: 45 }), 45)
})

check('quick add still parses dates, times, tags and priority', () => {
  const parsed = parseQuick('Call Sam tomorrow at 6pm #work p2', [{ id: 'work', name: 'Work', color: '#000000' }])
  assert.equal(parsed.title, 'Call Sam')
  assert.equal(parsed.project, 'work')
  assert.equal(parsed.priority, 3)
  assert.equal(parsed.due?.slice(11), '18:00')
  assert.deepEqual(parsed.tags, [])
})

console.log(`\n${passed} checks passed`)

