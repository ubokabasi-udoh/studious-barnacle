import { addDays, endOfWeek, format, isToday, isTomorrow, parseISO, startOfDay, subDays } from 'date-fns'
import { CheckCircle2, Flame, FolderOpen, Inbox, PartyPopper, Plus, Sun, Sunrise, type LucideIcon } from 'lucide-react'
import { useParams } from 'react-router-dom'
import { QuickAdd } from '../components/QuickAdd'
import { TaskRow } from '../components/tasks/TaskRow'
import { useTaskDrawer } from '../components/tasks/TaskDrawerProvider'
import { EmptyState } from '../components/ui/EmptyState'
import { primaryBtnCls } from '../components/ui/Field'
import { useStore } from '../context/store'
import { groupUpcoming, selectViewTasks, todaySummary } from '../lib/selectors'
import type { Task, ViewKind } from '../types'

const META: Record<ViewKind, { title: string; Icon: LucideIcon; empty: [string, string] }> = {
  inbox: { title: 'Inbox', Icon: Inbox, empty: ['Your inbox is clear', 'Capture a thought above and sort it out later.'] },
  today: { title: 'Today', Icon: Sun, empty: ["You're all caught up.", 'No tasks waiting for you. Enjoy the space.'] },
  upcoming: { title: 'Upcoming', Icon: Sunrise, empty: ['Nothing on the horizon', 'Add a due date to a task and it will show up here.'] },
  completed: { title: 'Completed', Icon: CheckCircle2, empty: ['Nothing completed yet', 'Finished tasks will collect here.'] },
  project: { title: 'Project', Icon: FolderOpen, empty: ['This project is empty', 'Add the first task above to get started.'] } }

export default function TaskView({ kind }: { kind: ViewKind }) {
  const { state, streak } = useStore()
  const { openNew } = useTaskDrawer()
  const { id } = useParams()

  const project = kind === 'project' ? state.projects.find(candidate => candidate.id === id) : undefined
  const tasks: Task[] = selectViewTasks(state.tasks, kind, id)
  const groups: [string, Task[]][] = kind === 'upcoming' ? groupUpcoming(tasks) : [['', tasks]]
  const summary = todaySummary(state.tasks)
  const done = tasks.filter(task => task.done).length
  const hour = new Date().getHours()
  const title = project?.name ?? META[kind].title
  const Icon = META[kind].Icon

  return (
    <div className="space-y-6">
      <header>
        {kind === 'today' ? (<>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Good {hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening'}, Basi 👋</h1>
          <p className="muted mt-1">Here's what you have planned for today.</p>
          <dl className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
            {[['Due today', String(summary.dueToday)], ['Completed', String(summary.doneToday)], ['Progress', `${summary.progress}%`], ['Streak', `${streak} day${streak === 1 ? '' : 's'}`]].map(([label, value]) => (
              <div key={label} className="card p-4">
                <dt className="muted text-xs font-medium">{label}</dt>
                <dd className="mt-1 flex items-center gap-1 text-xl font-bold">
                  {label === 'Streak' && <Flame size={18} className="text-[#F59E0B]" aria-hidden="true" />}{value}
                </dd>
              </div>))}
          </dl></>) : (
          <div className="flex items-center gap-3">
            <Icon size={26} style={project ? { color: project.color } : undefined} className="text-brand" aria-hidden="true" />
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{title}</h1>
          </div>)}
        {kind === 'project' && tasks.length > 0 && (
          <div className="mt-4">
            <p className="muted text-sm">{done} of {tasks.length} completed · {tasks.length - done} remaining</p>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
              <div className="h-full rounded-full transition-all duration-300" style={{ width: `${(done / tasks.length) * 100}%`, background: project?.color }} />
            </div>
          </div>)}
      </header>

      {kind !== 'completed' && <QuickAdd />}

      {kind === 'project' && !project ? (
        <p className="card p-8 text-center">This project no longer exists. Pick another from the sidebar.</p>
      ) : tasks.length === 0 ? (
        <EmptyState
          icon={<PartyPopper size={26} aria-hidden="true" />}
          title={META[kind].empty[0]}
          hint={META[kind].empty[1]}
          action={kind === 'completed'
            ? undefined
            : (
              <button type="button" onClick={() => openNew(kind === 'project' ? { project: id } : undefined)} className={primaryBtnCls}>
                <Plus size={16} aria-hidden="true" />New task
              </button>)}
        />
      ) : groups.map(([label, list]) => (
        <section key={label} aria-label={label || title}>
          {label && <h2 className="muted mb-2 text-sm font-semibold">{label}</h2>}
          <ul className="card divide-y divide-[#E2E8F0] overflow-hidden dark:divide-slate-800">
            {list.map(task => <TaskRow key={task.id} task={task} />)}
          </ul>
        </section>))}
    </div>
  )
}

