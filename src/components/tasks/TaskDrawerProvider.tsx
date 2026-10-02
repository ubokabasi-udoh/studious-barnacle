import { createContext, useContext, useRef, useState, type ReactNode } from 'react'
import { useStore } from '../../context/store'
import { useGlobalKeys } from '../../hooks/useGlobalKeys'
import { canSave, emptyInput, inputFromTask, isSameInput } from '../../lib/task'
import type { Task, TaskInput } from '../../types'
import { TaskDrawer } from './TaskDrawer'

interface TaskDrawerApi {
  isOpen: boolean
  /** Open a blank drawer, or one pre-filled from parsed quick-add text. */
  openNew: (seed?: Partial<TaskInput>) => void
  openEdit: (task: Task) => void
}
const Ctx = createContext<TaskDrawerApi | null>(null)
export const useTaskDrawer = (): TaskDrawerApi => {
  const api = useContext(Ctx)
  if (!api) throw new Error('TaskDrawerProvider missing')
  return api
}

interface Draft { taskId: string | null; values: TaskInput }

/**
 * Owns the task drawer plus its draft, so the app can open the drawer from the
 * sidebar, the quick-add row or a task row, and an accidental close keeps the draft.
 */
export function TaskDrawerProvider({ children }: { children: ReactNode }) {
  const { addTask, updateTask, removeTask, notify } = useStore()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Task | null>(null)
  const [values, setValues] = useState<TaskInput>(emptyInput)
  const baseline = useRef<TaskInput>(values)
  const draft = useRef<Draft | null>(null)

  const launch = (task: Task | null, next: TaskInput) => {
    baseline.current = next
    setValues(next)
    setEditing(task)
    setOpen(true)
  }

  const openNew = (seed?: Partial<TaskInput>) => {
    if (open) return
    const kept = draft.current
    if (seed) { launch(null, { ...emptyInput(), ...seed }); return }
    launch(null, kept && kept.taskId === null ? kept.values : emptyInput())
  }

  const openEdit = (task: Task) => {
    if (open) return
    const kept = draft.current
    launch(task, kept && kept.taskId === task.id ? kept.values : inputFromTask(task))
  }

  const close = () => {
    setOpen(false)
    if (isSameInput(values, baseline.current)) return
    draft.current = { taskId: editing?.id ?? null, values }
    notify({ msg: 'Draft kept', undoLabel: 'Discard draft', undo: () => { draft.current = null } })
  }

  const save = () => {
    if (!canSave(values)) return
    if (editing) updateTask(editing.id, values)
    else addTask(values)
    draft.current = null
    setOpen(false)
  }

  const destroy = () => {
    if (editing) removeTask(editing.id)
    draft.current = null
    setOpen(false)
  }

  useGlobalKeys({ onNewTask: () => openNew() })

  return (
    <Ctx.Provider value={{ isOpen: open, openNew, openEdit }}>
      {children}
      <TaskDrawer
        open={open} task={editing} values={values} onChange={setValues}
        onClose={close} onSave={save} onDelete={destroy}
      />
    </Ctx.Provider>
  )
}
