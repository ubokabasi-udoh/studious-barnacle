import { useRef, useState } from 'react'
import { Maximize2, Plus } from 'lucide-react'
import { useStore } from '../context/store'
import { parseQuick } from '../lib/parse'
import { emptyInput } from '../lib/task'
import { useTaskDrawer } from './tasks/TaskDrawerProvider'

export function QuickAdd() {
  const { state, addTask } = useStore()
  const { openNew } = useTaskDrawer()
  const [value, setValue] = useState('')
  const ref = useRef<HTMLInputElement>(null)

  const submit = () => {
    const parsed = parseQuick(value, state.projects)
    if (!parsed.title) return
    addTask({ ...emptyInput(), ...parsed })
    setValue('')
  }

  /** Expand the same text into the full drawer, so details can be set before saving. */
  const expand = () => {
    const seed = value.trim() ? parseQuick(value, state.projects) : undefined
    openNew(seed ? { ...emptyInput(), ...seed } : undefined)
    setValue('')
  }

  return (
    <div className="card flex items-center gap-2 p-2 focus-within:ring-2 focus-within:ring-brand-bright/40">
      <label htmlFor="quick-add" className="sr-only">Quick add task</label>
      <Plus size={18} className="muted ml-2 shrink-0" aria-hidden />
      <input id="quick-add" ref={ref} value={value} onChange={e => setValue(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') submit(); if (e.key === 'Escape') ref.current?.blur() }}
        placeholder="What needs to be done? Press N for details"
        className="h-11 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400" />
      <button
        type="button" onClick={expand} aria-label="Open details for a new task"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-brand dark:hover:bg-slate-800 dark:hover:text-brand-bright">
        <Maximize2 size={16} aria-hidden="true" />
      </button>
      <button type="button" onClick={submit} disabled={!value.trim()} className="h-10 rounded-xl bg-brand px-4 text-sm font-semibold text-white transition active:scale-95 disabled:opacity-40">Add</button>
    </div>)
}
