import { useState } from 'react'
import { ArrowDown, ArrowUp, Check, X } from 'lucide-react'
import { newSubtask } from '../../lib/task'
import type { Subtask } from '../../types'

const iconBtnCls = 'flex h-11 w-11 items-center justify-center rounded-lg text-slate-400 transition hover:text-brand disabled:opacity-30 dark:hover:text-brand-bright'

interface SubtaskFieldProps {
  subtasks: Subtask[]
  onChange: (subtasks: Subtask[]) => void
}

/** Add, tick, reorder and delete the steps of a task. */
export function SubtaskField({ subtasks, onChange }: SubtaskFieldProps) {
  const [draft, setDraft] = useState('')
  const done = subtasks.filter(subtask => subtask.done).length

  const add = () => {
    const title = draft.trim()
    if (!title) return
    onChange([...subtasks, newSubtask(title)])
    setDraft('')
  }
  const move = (from: number, to: number) => {
    if (to < 0 || to >= subtasks.length) return
    const next = [...subtasks]
    const [moved] = next.splice(from, 1)
    next.splice(to, 0, moved)
    onChange(next)
  }

  return (
    <div className="space-y-2">
      {subtasks.length > 0 && (
        <div className="space-y-2">
          <p className="muted text-xs">{done} of {subtasks.length} completed</p>
          <span aria-hidden="true" className="block h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
            <span className="block h-full rounded-full bg-brand transition-all duration-300" style={{ width: `${(done / subtasks.length) * 100}%` }} />
          </span>
          <ul className="space-y-1">
            {subtasks.map((subtask, index) => (
              <li key={subtask.id} className="flex items-center gap-1">
                <button
                  type="button" role="checkbox" aria-checked={subtask.done}
                  aria-label={`Mark "${subtask.title}" ${subtask.done ? 'incomplete' : 'complete'}`}
                  onClick={() => onChange(subtasks.map(item => (item.id === subtask.id ? { ...item, done: !item.done } : item)))}
                  className="flex h-11 w-11 shrink-0 items-center justify-center"
                >
                  <span className={`pop flex h-5 w-5 items-center justify-center rounded-md border-2 transition-colors ${
                    subtask.done ? 'border-[#10B981] bg-[#10B981] text-white' : 'border-slate-300 dark:border-slate-600'}`}
                  >
                    {subtask.done && <Check size={12} strokeWidth={3} aria-hidden="true" />}
                  </span>
                </button>
                <span className={`min-w-0 flex-1 text-sm ${subtask.done ? 'muted line-through' : ''}`}>{subtask.title}</span>
                <button type="button" onClick={() => move(index, index - 1)} disabled={index === 0}
                  aria-label={`Move "${subtask.title}" up`} className={iconBtnCls}>
                  <ArrowUp size={14} aria-hidden="true" />
                </button>
                <button type="button" onClick={() => move(index, index + 1)} disabled={index === subtasks.length - 1}
                  aria-label={`Move "${subtask.title}" down`} className={iconBtnCls}>
                  <ArrowDown size={14} aria-hidden="true" />
                </button>
                <button type="button" onClick={() => onChange(subtasks.filter(item => item.id !== subtask.id))}
                  aria-label={`Delete subtask "${subtask.title}"`} className={iconBtnCls}>
                  <X size={14} aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="flex gap-2">
        <div className="min-w-0 flex-1">
          <label htmlFor="task-subtask" className="sr-only">Add a subtask</label>
          <input
            id="task-subtask" value={draft} onChange={event => setDraft(event.target.value)}
            onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); add() } }}
            placeholder="Add a subtask" className="h-11 w-full rounded-xl border border-[#E2E8F0] bg-transparent px-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-brand dark:border-slate-700 dark:focus:border-brand-bright"
          />
        </div>
        <button type="button" onClick={add} disabled={!draft.trim()}
          className="h-11 shrink-0 rounded-xl border border-[#E2E8F0] px-3 text-sm font-semibold transition hover:border-brand hover:text-brand disabled:opacity-40 dark:border-slate-700">
          Add
        </button>
      </div>
    </div>
  )
}
