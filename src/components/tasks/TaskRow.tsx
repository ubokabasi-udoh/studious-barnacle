import { AlertCircle, Check, Repeat, Trash2 } from 'lucide-react'
import { useStore } from '../../context/store'
import { dueInfo } from '../../lib/dates'
import { recurrenceLabel } from '../../lib/recurrence'
import type { Task } from '../../types'
import { PRIORITY_META } from './priority'
import { useTaskDrawer } from './TaskDrawerProvider'

export function TaskRow({ task }: { task: Task }) {
  const { state, toggle, removeTask } = useStore()
  const { openEdit } = useTaskDrawer()
  const due = task.due ? dueInfo(task.due, task.done) : null
  const priority = PRIORITY_META[task.priority]
  const project = state.projects.find(candidate => candidate.id === task.project)
  const subDone = task.subtasks.filter(subtask => subtask.done).length
  const repeating = !!task.recurrence && task.recurrence.preset !== 'none'

  return (
    <li className={`group rise flex items-start gap-3 px-4 py-3 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 ${task.done ? 'opacity-60' : ''}`}>
      <button
        type="button" onClick={() => toggle(task.id)} role="checkbox" aria-checked={task.done}
        aria-label={`Mark "${task.title}" ${task.done ? 'incomplete' : 'complete'}`}
        className="-m-2 flex h-11 w-11 shrink-0 items-center justify-center"
      >
        <span
          key={String(task.done)}
          className={`flex h-5 w-5 items-center justify-center rounded-full border-2 transition-colors ${
            task.done ? 'pop border-[#10B981] bg-[#10B981] text-white' : 'border-slate-300 group-hover:border-brand dark:border-slate-600'}`}
        >
          {task.done && <Check size={12} strokeWidth={3} aria-hidden="true" />}
        </span>
      </button>

      <button type="button" onClick={() => openEdit(task)} className="min-w-0 flex-1 rounded-lg text-left">
        <span className={`block truncate font-medium ${task.done ? 'line-through' : ''}`}>{task.title}</span>
        <span className="muted mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
          {due && (
            <span className={`inline-flex items-center gap-1 ${due.overdue ? 'font-semibold text-[#EF4444]' : ''}`}>
              {due.overdue && <AlertCircle size={12} aria-hidden="true" />}{due.text}
            </span>)}
          {priority && (
            <span className={`inline-flex items-center gap-1 font-medium ${priority.cls}`}>
              <priority.Icon size={12} aria-hidden="true" />{priority.label}
            </span>)}
          {project && (
            <span className="inline-flex items-center gap-1.5">
              <span aria-hidden="true" className="h-2 w-2 rounded-full" style={{ background: project.color }} />{project.name}
            </span>)}
          {task.tags.map(tag => <span key={tag} className="text-brand dark:text-brand-bright">#{tag}</span>)}
          {repeating && (
            <span className="inline-flex items-center gap-1">
              <Repeat size={12} aria-hidden="true" />{recurrenceLabel(task.recurrence)}
            </span>)}
          {task.subtasks.length > 0 && (
            <span className="inline-flex items-center gap-1.5">
              <span aria-hidden="true" className="h-1 w-12 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                <span className="block h-full bg-brand transition-all duration-300" style={{ width: `${(subDone / task.subtasks.length) * 100}%` }} />
              </span>
              {subDone} of {task.subtasks.length}
            </span>)}
        </span>
      </button>

      <button
        type="button" onClick={() => removeTask(task.id)} aria-label={`Delete "${task.title}"`}
        className="-m-1 flex h-11 w-11 items-center justify-center rounded-lg text-slate-400 opacity-0 transition hover:text-[#EF4444] focus:opacity-100 group-hover:opacity-100 max-md:opacity-100"
      >
        <Trash2 size={16} aria-hidden="true" />
      </button>
    </li>
  )
}
