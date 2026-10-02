import { REMINDER_PRESETS, reminderLabel, reminderMinutes } from '../../lib/reminder'
import { RECURRENCE_LABELS, RECURRENCE_PRESETS } from '../../lib/recurrence'
import type { Recurrence, RecurrenceUnit, Reminder, ReminderPreset } from '../../types'
import { inputCls, selectCls } from '../ui/Field'

interface ReminderFieldProps { value?: Reminder; onChange: (reminder?: Reminder) => void }

/** Reminder offset relative to the due time. */
export function ReminderField({ value, onChange }: ReminderFieldProps) {
  const preset = value?.preset ?? 'none'
  const minutes = reminderMinutes(value) ?? 30
  return (
    <div className="space-y-2">
      <label htmlFor="task-reminder" className="sr-only">Reminder</label>
      <select
        id="task-reminder" value={preset} className={selectCls}
        onChange={event => onChange(event.target.value === 'none'
          ? undefined
          : { preset: event.target.value as ReminderPreset, minutes: event.target.value === 'custom' ? minutes : undefined })}
      >
        {REMINDER_PRESETS.map(option => <option key={option} value={option}>{option === 'custom' ? 'Custom' : reminderLabel({ preset: option })}</option>)}
      </select>
      {preset === 'custom' && (
        <div className="flex items-center gap-2">
          <label htmlFor="task-reminder-minutes" className="sr-only">Minutes before the due time</label>
          <input
            id="task-reminder-minutes" type="number" min={1} max={999} value={minutes}
            onChange={event => onChange({ preset: 'custom', minutes: Math.max(1, Number(event.target.value) || 1) })}
            className={`${inputCls} w-24`}
          />
          <span className="muted text-sm">minutes before</span>
        </div>
      )}
      {preset !== 'none' && <p className="muted text-xs">Reminders appear in the app while FlowTask is open.</p>}
    </div>
  )
}

interface RecurrenceFieldProps { value?: Recurrence; onChange: (recurrence?: Recurrence) => void }

/** Repeat rule; the next occurrence is created when the task is completed. */
export function RecurrenceField({ value, onChange }: RecurrenceFieldProps) {
  const preset = value?.preset ?? 'none'
  const interval = value?.interval ?? 1
  const unit = value?.unit ?? 'days'
  return (
    <div className="space-y-2">
      <label htmlFor="task-recurrence" className="sr-only">Repeat</label>
      <select
        id="task-recurrence" value={preset} className={selectCls}
        onChange={event => onChange(event.target.value === 'none'
          ? undefined
          : event.target.value === 'custom'
            ? { preset: 'custom', interval, unit }
            : { preset: event.target.value as Recurrence['preset'] })}
      >
        {RECURRENCE_PRESETS.map(option => (
          <option key={option} value={option}>
            {option === 'custom' ? 'Custom' : RECURRENCE_LABELS[option]}
          </option>
        ))}
      </select>
      {preset === 'custom' && (
        <div className="flex items-center gap-2">
          <span className="muted text-sm">Every</span>
          <label htmlFor="task-recurrence-every" className="sr-only">Repeat every</label>
          <input
            id="task-recurrence-every" type="number" min={1} max={999} value={interval}
            onChange={event => onChange({ preset: 'custom', interval: Math.max(1, Number(event.target.value) || 1), unit })}
            className={`${inputCls} w-20`}
          />
          <label htmlFor="task-recurrence-unit" className="sr-only">Interval unit</label>
          <select
            id="task-recurrence-unit" value={unit}
            onChange={event => onChange({ preset: 'custom', interval, unit: event.target.value as RecurrenceUnit })}
            className={`${selectCls} w-28`}
          >
            <option value="days">days</option>
            <option value="weeks">weeks</option>
            <option value="months">months</option>
          </select>
        </div>
      )}
    </div>
  )
}
