import { useState, type ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { CheckCircle2, Flame, FolderOpen, Inbox, Monitor, Moon, Plus, Sun, Sunrise, Undo2, type LucideIcon } from 'lucide-react'
import { useStore } from '../context/store'
import type { Theme } from '../types'
import { useTaskDrawer } from './tasks/TaskDrawerProvider'

const NAV: { to: string; label: string; Icon: LucideIcon }[] = [
  { to: '/', label: 'Inbox', Icon: Inbox }, { to: '/today', label: 'Today', Icon: Sun },
  { to: '/upcoming', label: 'Upcoming', Icon: Sunrise }, { to: '/completed', label: 'Completed', Icon: CheckCircle2 }]
const link = ({ isActive }: { isActive: boolean }) => `nav ${isActive ? 'active' : ''}`

function ThemeSwitch() {
  const { state, setTheme } = useStore()
  const opts: [Theme, LucideIcon][] = [['light', Sun], ['dark', Moon], ['system', Monitor]]
  return (
    <div role="radiogroup" aria-label="Theme" className="flex rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
      {opts.map(([t, Icon]) => (
        <button key={t} role="radio" aria-checked={state.theme === t} aria-label={`${t} theme`} onClick={() => setTheme(t)}
          className={`flex h-9 flex-1 items-center justify-center rounded-lg transition ${state.theme === t ? 'bg-white text-brand shadow-sm dark:bg-slate-700' : 'muted'}`}><Icon size={15} /></button>))}
    </div>)
}

export function Shell({ children }: { children: ReactNode }) {
  const { state, toast, streak, doneToday, addProject } = useStore()
  const { openNew } = useTaskDrawer()
  const [adding, setAdding] = useState(false)
  const mobileNav = [...NAV, { to: `/project/${state.projects[0]?.id ?? 'none'}`, label: 'Projects', Icon: FolderOpen }]
  return (
    <div className="min-h-screen md:grid md:grid-cols-[256px_1fr]">
      <aside className="sticky top-0 hidden h-screen flex-col gap-6 border-r border-[#E2E8F0] bg-white p-4 dark:border-slate-800 dark:bg-slate-900 md:flex">
        <div className="flex items-center gap-2 px-2 pt-2 text-lg font-bold tracking-tight">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-brand to-[#8B5CF6] text-white"><CheckCircle2 size={18} /></span>FlowTask
        </div>
        <button
          type="button" onClick={() => openNew()}
          className="flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-brand px-3 text-sm font-semibold text-white transition hover:bg-brand/90 active:scale-[.98]"
        >
          <Plus size={18} aria-hidden="true" />New task
        </button>
        <nav aria-label="Main" className="flex flex-col gap-1">
          {NAV.map(({ to, label, Icon }) => <NavLink key={to} to={to} end className={link}><Icon size={18} />{label}</NavLink>)}
        </nav>
        <div className="min-h-0 flex-1 overflow-y-auto">
          <p className="muted mb-2 px-3 text-xs font-semibold">Projects</p>
          {state.projects.map(p => (
            <NavLink key={p.id} to={`/project/${p.id}`} className={link}><span className="h-2.5 w-2.5 rounded-full" style={{ background: p.color }} />{p.name}</NavLink>))}
          {adding
            ? <input autoFocus aria-label="Project name" placeholder="Project name" className="mt-1 h-10 w-full rounded-xl border border-[#E2E8F0] bg-transparent px-3 text-sm dark:border-slate-700"
                onKeyDown={e => { if (e.key === 'Enter' && e.currentTarget.value.trim()) { addProject(e.currentTarget.value.trim()); setAdding(false) } if (e.key === 'Escape') setAdding(false) }} onBlur={() => setAdding(false)} />
            : <button onClick={() => setAdding(true)} className="nav w-full"><Plus size={18} />Add project</button>}
        </div>
        <div className="space-y-3 rounded-2xl bg-brand-soft p-3 text-sm dark:bg-slate-800">
          <div className="flex justify-between"><span className="muted">Done today</span><b>{doneToday}</b></div>
          <div className="flex justify-between"><span className="muted">Streak</span><b className="inline-flex items-center gap-1"><Flame size={14} className="text-[#F59E0B]" />{streak} day{streak === 1 ? '' : 's'}</b></div>
        </div>
        <ThemeSwitch />
      </aside>
      <main className="mx-auto w-full max-w-3xl px-4 pb-28 pt-6 md:px-8 md:pb-12 md:pt-10">{children}</main>
      <button
        type="button" onClick={() => openNew()} aria-label="New task"
        className="fixed bottom-[calc(72px+env(safe-area-inset-bottom))] right-4 z-20 flex h-14 w-14 items-center justify-center rounded-full bg-brand text-white shadow-lg transition hover:bg-brand/90 active:scale-95 md:hidden"
      >
        <Plus size={24} aria-hidden="true" />
      </button>
      <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-5 border-t border-[#E2E8F0] bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur dark:border-slate-800 dark:bg-slate-900/95 md:hidden">
        {mobileNav.map(({ to, label, Icon }) => (
          <NavLink key={label} to={to} end className={({ isActive }) => `flex min-h-[56px] flex-col items-center justify-center gap-0.5 text-[11px] font-medium ${isActive ? 'text-brand dark:text-brand-bright' : 'muted'}`}><Icon size={20} />{label}</NavLink>))}
      </nav>
      {toast && (
        <div role="status" className="rise fixed bottom-[calc(148px+env(safe-area-inset-bottom))] left-1/2 z-30 flex max-w-[calc(100%-2rem)] -translate-x-1/2 items-center gap-4 rounded-xl bg-navy px-4 py-3 text-sm text-white shadow-lg dark:bg-slate-100 dark:text-navy md:bottom-8">
          {toast.msg}{toast.undo && <button onClick={toast.undo} className="inline-flex min-h-[32px] items-center gap-1 whitespace-nowrap font-semibold text-brand-bright dark:text-brand"><Undo2 size={14} aria-hidden="true" />{toast.undoLabel ?? 'Undo'}</button>}
        </div>)}
    </div>)
}
