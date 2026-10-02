import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { AppState, Task, TaskInput, Theme, Toast } from '../types'
import { makeSeed } from '../data/seed'
import { describeEdit, makeEntry } from '../lib/activity'
import { dueInfo } from '../lib/dates'
import { normalizeState } from '../lib/normalize'
import { streakOf, todaySummary } from '../lib/selectors'
import { applyToggle, mergeTask, taskFromInput } from '../lib/task'
import { uid } from '../lib/uid'

const KEY = 'flowtask:v1'
const PROJECT_COLORS = ['#8B5CF6', '#2563EB', '#F59E0B', '#10B981', '#EF4444']
const TOAST_MS = 6000

interface Store {
  state: AppState
  toast: Toast | null
  streak: number
  doneToday: number
  addTask: (input: TaskInput) => Task
  updateTask: (id: string, input: TaskInput) => void
  /** Quick reschedules (Today / Tomorrow / Next week / clear) go through this. */
  reschedule: (id: string, due?: string) => void
  toggle: (id: string) => void
  removeTask: (id: string) => void
  addProject: (name: string) => void
  setTheme: (theme: Theme) => void
  notify: (toast: Toast) => void
  dismissToast: () => void
}
const Ctx = createContext<Store | null>(null)
export const useStore = (): Store => {
  const store = useContext(Ctx)
  if (!store) throw new Error('StoreProvider missing')
  return store
}

interface Loaded { state: AppState; error: string | null }

/** Every storage access lives here so persistence stays swappable for a backend. */
function loadState(): Loaded {
  let raw: string | null = null
  try {
    raw = localStorage.getItem(KEY)
  } catch {
    return { state: makeSeed(), error: 'Local storage is unavailable, so changes will not be saved.' }
  }
  if (!raw) return { state: makeSeed(), error: null }
  try {
    const state = normalizeState(JSON.parse(raw))
    if (state) return { state, error: null }
  } catch { /* corrupt payload: fall through to a fresh start */ }
  return { state: makeSeed(), error: "Saved data couldn't be read, so FlowTask started fresh." }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [loaded] = useState(loadState)
  const [state, setState] = useState<AppState>(loaded.state)
  const [toast, setToast] = useState<Toast | null>(null)
  const timer = useRef<number>()

  const dismissToast = useCallback(() => { window.clearTimeout(timer.current); setToast(null) }, [])
  const notify = useCallback((next: Toast) => {
    setToast(next)
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setToast(null), TOAST_MS)
  }, [])

  useEffect(() => { if (loaded.error) notify({ msg: loaded.error }) }, [loaded.error, notify])
  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify(state)) } catch { /* storage full or blocked */ } }, [state])
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const apply = () => document.documentElement.classList.toggle('dark', state.theme === 'dark' || (state.theme === 'system' && mq.matches))
    apply(); mq.addEventListener('change', apply); return () => mq.removeEventListener('change', apply)
  }, [state.theme])

  const value = useMemo<Store>(() => {
    const patchTasks = (fn: (tasks: Task[]) => Task[]) => setState(current => ({ ...current, tasks: fn(current.tasks) }))
    const summary = todaySummary(state.tasks)
    const touch = (id: string, make: (task: Task, at: string) => Task) =>
      patchTasks(tasks => tasks.map(task => (task.id === id ? make(task, new Date().toISOString()) : task)))

    return {
      state, toast, streak: streakOf(state.tasks), doneToday: summary.doneToday,

      addTask: input => {
        const created = taskFromInput(input)
        patchTasks(tasks => [created, ...tasks])
        notify({ msg: 'Task created' })
        return created
      },

      updateTask: (id, input) => {
        const previous = state.tasks.find(task => task.id === id)
        if (!previous) return
        const changed = describeEdit(previous, input).length > 0
        patchTasks(tasks => tasks.map(task => (task.id === id ? mergeTask(task, input) : task)))
        notify({ msg: changed ? 'Changes saved' : 'No changes to save' })
      },

      reschedule: (id, due) => {
        const before = state.tasks.find(task => task.id === id)?.due
        if (before === due) return
        const text = due ? `Rescheduled to ${dueInfo(due, false).text}` : 'Due date removed'
        touch(id, (task, at) => ({ ...task, due, updatedAt: at, activity: [makeEntry('rescheduled', text, at), ...task.activity] }))
        notify({
          msg: due ? 'Task rescheduled' : 'Due date removed',
          undo: () => {
            touch(id, (task, at) => ({ ...task, due: before, updatedAt: at }))
            notify({ msg: 'Task restored' })
          }
        })
      },

      toggle: id => patchTasks(tasks => applyToggle(tasks, id)),

      removeTask: id => {
        const index = state.tasks.findIndex(task => task.id === id)
        if (index < 0) return
        const [removed] = state.tasks.slice(index, index + 1)
        patchTasks(tasks => tasks.filter(task => task.id !== id))
        notify({
          msg: 'Task deleted',
          undo: () => {
            patchTasks(tasks => tasks.some(task => task.id === removed.id)
              ? tasks
              : [...tasks.slice(0, index), removed, ...tasks.slice(index)])
            notify({ msg: 'Task restored' })
          }
        })
      },

      addProject: name => {
        const trimmed = name.trim()
        if (!trimmed) return
        setState(current => ({
          ...current,
          projects: [...current.projects, {
            id: uid('p'),
            name: trimmed,
            color: PROJECT_COLORS[current.projects.length % PROJECT_COLORS.length]
          }]
        }))
        notify({ msg: 'Project created' })
      },

      setTheme: theme => setState(current => ({ ...current, theme })),
      notify,
      dismissToast
    }
  }, [state, toast, notify, dismissToast])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

