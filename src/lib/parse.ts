import { addDays, format, nextMonday } from 'date-fns'
import type { Priority, Project, TaskInput } from '../types'

/** "Finish redesign tomorrow at 6pm #work p1" -> task fields */
export function parseQuick(input: string, projects: Project[]): Partial<TaskInput> & { title: string } {
  let t = input, priority: Priority = 0, project: string | undefined, date: Date | undefined, time = ''
  const tags: string[] = []
  t = t.replace(/\bp([1-4])\b/i, (_, n) => { priority = (5 - Number(n)) as Priority; return '' })
  t = t.replace(/#(\w+)/g, (_, w: string) => {
    const p = projects.find(p => p.name.toLowerCase() === w.toLowerCase())
    if (p && !project) project = p.id; else tags.push(w.toLowerCase())
    return ''
  })
  t = t.replace(/\b(today|tomorrow|next week)\b/i, (_, w: string) => {
    const k = w.toLowerCase(), now = new Date()
    date = k === 'today' ? now : k === 'tomorrow' ? addDays(now, 1) : nextMonday(now)
    return ''
  })
  t = t.replace(/\b(?:at\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/i, (_, h: string, m: string | undefined, ap: string) => {
    let hr = Number(h) % 12; if (ap.toLowerCase() === 'pm') hr += 12
    time = `${String(hr).padStart(2, '0')}:${m ?? '00'}`
    return ''
  })
  if (time && !date) date = new Date()
  const due = date ? format(date, 'yyyy-MM-dd') + (time ? `T${time}` : '') : undefined
  return { title: t.replace(/\s+/g, ' ').trim(), priority, project, tags, due }
}
