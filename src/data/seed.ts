import { addDays, format, subDays } from 'date-fns'
import type { AppState, Task } from '../types'
import { makeEntry } from '../lib/activity'
import { SCHEMA_VERSION } from '../lib/normalize'

const d = (n: number, time = '') => format(addDays(new Date(), n), 'yyyy-MM-dd') + (time ? `T${time}` : '')
const iso = (n: number) => addDays(new Date(), n).toISOString()
let i = 0
const task = (o: Partial<Task> & { title: string }): Task => ({
  id: `t${++i}`, description: '', notes: '', priority: 0, tags: [], subtasks: [],
  activity: [makeEntry('created', 'Task created', iso(-7))],
  done: false, createdAt: iso(-7), updatedAt: iso(-1), ...o })
const sub = (title: string, done: boolean) => ({ id: `s${++i}`, title, done })

export function makeSeed(): AppState {
  const past = [0, -1, -2, -3, -4, -5].map(n => task({ title: `Daily review ${n === 0 ? 'today' : `${-n}d ago`}`, done: true, doneAt: iso(n), project: 'personal' }))
  return {
    version: SCHEMA_VERSION,
    theme: 'system',
    projects: [
      { id: 'personal', name: 'Personal', color: '#8B5CF6' }, { id: 'work', name: 'Work', color: '#2563EB' },
      { id: 'learning', name: 'Learning', color: '#F59E0B' }, { id: 'fitness', name: 'Fitness', color: '#10B981' }],
    tasks: [
      task({ title: 'Finish portfolio redesign', due: d(0, '18:00'), priority: 4, project: 'work', tags: ['design'],
        reminder: { preset: '1h' }, recurrence: { preset: 'weekly' },
        description: 'Polish the case study pages before sharing the link with the team.',
        notes: 'Ask Sam for the final client quotes.',
        subtasks: [sub('Finish homepage', true), sub('Add projects', true), sub('Add testimonials', false), sub('Deploy', false)] }),
      task({ title: 'Review pull request', due: d(-2, '10:00'), priority: 3, project: 'work', tags: ['coding'] }),
      task({ title: 'Study TypeScript generics', due: d(1, '20:00'), priority: 2, project: 'learning', tags: ['coding'] }),
      task({ title: 'Go to the gym', due: d(0, '07:00'), priority: 2, project: 'fitness', recurrence: { preset: 'weekdays' } }),
      task({ title: 'Read 20 pages', due: d(0), priority: 1, project: 'learning' }),
      task({ title: "Plan next week's priorities", due: d(3), priority: 3, project: 'personal' }),
      task({ title: 'Update resume', due: d(9), priority: 1, project: 'work', tags: ['career'] }),
      task({ title: 'Complete project documentation', due: d(5), priority: 3, project: 'work',
        subtasks: [sub('API reference', true), sub('Setup guide', false)] }),
      task({ title: 'Book dentist appointment' }),
      task({ title: 'Ideas for side project', tags: ['coding'] }),
      task({ title: 'Send invoice to client', done: true, doneAt: subDays(new Date(), 1).toISOString(), project: 'work' }),
      ...past ] }
}

