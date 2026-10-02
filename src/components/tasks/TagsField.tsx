import { useState } from 'react'
import { X } from 'lucide-react'
import { Chip } from '../ui/Chip'
import { inputCls } from '../ui/Field'

interface TagsFieldProps {
  tags: string[]
  /** Tags already used elsewhere, offered as one-tap chips. */
  suggestions: string[]
  onChange: (tags: string[]) => void
}

export function TagsField({ tags, suggestions, onChange }: TagsFieldProps) {
  const [draft, setDraft] = useState('')
  const add = (raw: string) => {
    const tag = raw.trim().replace(/^#+/, '').toLowerCase()
    setDraft('')
    if (!tag || tags.includes(tag)) return
    onChange([...tags, tag])
  }
  const unused = suggestions.filter(suggestion => !tags.includes(suggestion))

  return (
    <div className="space-y-2">
      {tags.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {tags.map(tag => (
            <li key={tag} className="inline-flex min-h-[36px] items-center rounded-full bg-brand-soft pl-3 text-xs font-medium text-brand dark:bg-slate-800 dark:text-brand-bright">
              #{tag}
              <button
                type="button" onClick={() => onChange(tags.filter(existing => existing !== tag))}
                aria-label={`Remove tag ${tag}`}
                className="-my-1 ml-0.5 flex h-11 w-11 items-center justify-center rounded-full transition hover:bg-white/70 dark:hover:bg-slate-700"
              >
                <X size={12} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <label htmlFor="task-tags" className="sr-only">Add a tag</label>
      <input
        id="task-tags" value={draft} onChange={event => setDraft(event.target.value)}
        onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); add(draft) } }}
        placeholder="Add a tag and press Enter" className={inputCls}
      />
      {unused.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {unused.map(tag => <Chip key={tag} onClick={() => add(tag)}>#{tag}</Chip>)}
        </div>
      )}
    </div>
  )
}
