import { Trash2 } from 'lucide-react'
import { useStore } from '../../context/store'
import { allTags } from '../../lib/selectors'
import { canSave } from '../../lib/task'
import type { Task, TaskInput } from '../../types'
import { Drawer } from '../ui/Drawer'
import { Field, dangerBtnCls, ghostBtnCls, inputCls, primaryBtnCls, selectCls, textareaCls } from '../ui/Field'
import { ActivityList } from './ActivityList'
import { DuePicker } from './DuePicker'
import { PriorityPicker } from './PriorityPicker'
import { RecurrenceField, ReminderField } from './RepeatFields'
import { SubtaskField } from './SubtaskField'
import { TagsField } from './TagsField'

interface TaskDrawerProps {
  open: boolean
  /** The task being edited, or null when creating. */
  task: Task | null
  values: TaskInput
  onChange: (values: TaskInput) => void
  onClose: () => void
  onSave: () => void
  onDelete: () => void
}

/** Create and edit form, shown as a bottom sheet on mobile and a side panel on desktop. */
export function TaskDrawer({ open, task, values, onChange, onClose, onSave, onDelete }: TaskDrawerProps) {
  const { state } = useStore()
  const set = <K extends keyof TaskInput>(key: K, value: TaskInput[K]) => onChange({ ...values, [key]: value })
  const canSubmit = canSave(values)

  return (
    <Drawer
      open={open} onClose={onClose} titleId="task-drawer-title" title={task ? 'Edit task' : 'New task'}
      footer={
        <div className="flex items-center justify-between gap-2">
          {task
            ? <button type="button" onClick={onDelete} className={dangerBtnCls}><Trash2 size={16} aria-hidden="true" />Delete</button>
            : <span />}
          <div className="flex items-center gap-1">
            <button type="button" onClick={onClose} className={ghostBtnCls}>Cancel</button>
            <button type="submit" form="task-form" disabled={!canSubmit} className={primaryBtnCls}>
              {task ? 'Save changes' : 'Add task'}
            </button>
          </div>
        </div>
      }
    >
      <form id="task-form" className="space-y-5 p-4 md:p-5" onSubmit={event => { event.preventDefault(); if (canSubmit) onSave() }}>
        <div>
          <label htmlFor="task-title" className="sr-only">Title</label>
          <input
            id="task-title" data-autofocus value={values.title} onChange={event => set('title', event.target.value)}
            placeholder="What needs to be done?" className={`${inputCls} text-base font-medium`}
          />
        </div>

        <div>
          <label htmlFor="task-description" className="sr-only">Description</label>
          <input
            id="task-description" value={values.description} onChange={event => set('description', event.target.value)}
            placeholder="Add a short description" className={inputCls}
          />
        </div>

        <Field label="Due date"><DuePicker value={values.due} onChange={due => set('due', due)} /></Field>
        <Field label="Priority"><PriorityPicker value={values.priority} onChange={priority => set('priority', priority)} /></Field>

        <Field label="Project" htmlFor="task-project">
          <select
            id="task-project" value={values.project ?? ''} className={selectCls}
            onChange={event => set('project', event.target.value || undefined)}
          >
            <option value="">No project</option>
            {state.projects.map(project => <option key={project.id} value={project.id}>{project.name}</option>)}
          </select>
        </Field>

        <Field label="Tags">
          <TagsField tags={values.tags} suggestions={allTags(state.tasks)} onChange={tags => set('tags', tags)} />
        </Field>

        <Field label="Subtasks">
          <SubtaskField subtasks={values.subtasks} onChange={subtasks => set('subtasks', subtasks)} />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Reminder"><ReminderField value={values.reminder} onChange={reminder => set('reminder', reminder)} /></Field>
          <Field label="Repeat"><RecurrenceField value={values.recurrence} onChange={recurrence => set('recurrence', recurrence)} /></Field>
        </div>

        <Field label="Notes" htmlFor="task-notes">
          <textarea
            id="task-notes" rows={4} value={values.notes} onChange={event => set('notes', event.target.value)}
            placeholder="Anything else worth remembering" className={textareaCls}
          />
        </Field>

        {task && <Field label="Activity"><ActivityList entries={task.activity} /></Field>}
      </form>
    </Drawer>
  )
}
