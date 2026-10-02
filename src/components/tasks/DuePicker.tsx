import { format, parseISO } from 'date-fns'
import { nextWeekStart, splitDue, thisWeekend, toDue, tomorrow } from '../../lib/dates'
import { Chip } from '../ui/Chip'
import { inputCls } from '../ui/Field'

const key = (date: Date): string => format(date, 'yyyy-MM-dd')

/** Quick date chips plus an exact date and time. */
export function DuePicker({ value, onChange }: { value?: string; onChange: (due?: string) => void }) {
  const { date, time } = splitDue(value)
  const setDate = (next: string) => onChange(next ? toDue(parseISO(next), time) : undefined)
  const setTime = (next: string) => onChange(toDue(date ?? new Date(), next))
  const quick = (target: Date) => onChange(toDue(target, time))
  const isChosen = (target: Date) => !!date && key(date) === key(target)

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <Chip active={isChosen(new Date())} onClick={() => quick(new Date())}>Today</Chip>
        <Chip active={isChosen(tomorrow())} onClick={() => quick(tomorrow())}>Tomorrow</Chip>
        <Chip active={isChosen(thisWeekend())} onClick={() => quick(thisWeekend())}>This weekend</Chip>
        <Chip active={isChosen(nextWeekStart())} onClick={() => quick(nextWeekStart())}>Next week</Chip>
        {value && <Chip onClick={() => onChange(undefined)}>Clear</Chip>}
      </div>
      <div className="flex gap-2">
        <div className="min-w-0 flex-1">
          <label htmlFor="task-due-date" className="sr-only">Due date</label>
          <input
            id="task-due-date" type="date" value={date ? key(date) : ''}
            onChange={event => setDate(event.target.value)} className={inputCls}
          />
        </div>
        <div className="w-32 shrink-0">
          <label htmlFor="task-due-time" className="sr-only">Due time</label>
          <input
            id="task-due-time" type="time" value={time}
            onChange={event => setTime(event.target.value)} className={inputCls}
          />
        </div>
      </div>
    </div>
  )
}
