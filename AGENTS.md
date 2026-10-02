# AGENTS.md — FlowTask

Guide for AI coding agents continuing work on this project. Read this fully before changing code.

## 1. Project goal

**FlowTask** is a premium, modern personal-productivity (to-do) web app. It should feel like a launched SaaS product (think Linear, Things, Todoist, TickTick), not a CRUD demo or an admin dashboard. Brand feel: focus, clarity, momentum, organization, calm productivity.

- Frontend only. No backend, no auth. All data lives in `localStorage`.
- The persistence layer must stay swappable for a real backend later (keep storage behind the store, never call `localStorage` from components).
- The user's name in the greeting is "Basi" (currently hardcoded in `TaskView.tsx`; should become a preference).

## 2. Tech stack (fixed)

React 18, Vite 5, TypeScript (strict), React Router 6, Tailwind CSS 3, Lucide React (icons), date-fns 3. **Recharts** is required for analytics but is not installed yet. Do not add shadcn/ui. Do not add libraries without a strong reason; prefer small hand-rolled solutions. For drag-and-drop, prefer native HTML5 DnD or a very small dependency (`@dnd-kit/core` is acceptable if native is inadequate).

Commands:

```bash
npm install
npm run dev       # dev server
npm run build     # tsc + vite build (must pass with zero errors)
npm run check     # type-checks and runs the pure-logic checks in scripts/checks.ts
```

> **Status:** install, `tsc`, `vite build` and `npm run check` all pass as of the last pass (14 logic checks green). `npm run check` compiles `scripts/` + `src/` to `.checks/` (CommonJS) and runs Node assertions over the pure `lib/` functions — extend it whenever you add lib logic. It needs no test framework.

## 3. Design system (from the brief; follow exactly)

| Token | Value |
|---|---|
| Deep navy (text, toasts) | `#0F172A` → Tailwind `navy` |
| Primary blue | `#2563EB` → `brand` |
| Bright blue (focus, dark-mode accent) | `#3B82F6` → `brand-bright` |
| Soft blue (active nav, chips) | `#EFF6FF` → `brand-soft` |
| Background | `#F8FAFC` |
| Card | `#FFFFFF` |
| Secondary text | `#64748B` |
| Border | `#E2E8F0` |
| Success | `#10B981` |
| Warning | `#F59E0B` |
| Danger | `#EF4444` |
| Purple accent | `#8B5CF6` |

- Font: Plus Jakarta Sans (loaded in `index.html`), falls back to system-ui.
- Shared CSS classes in `src/index.css`: `.card`, `.muted`, `.nav` / `.nav.active`, plus `.pop` and `.rise` animations. Reuse these instead of duplicating long class strings.
- Rounded cards, subtle shadows, clean borders, generous whitespace. Gradients sparingly (currently only the logo mark). Avoid glassmorphism, heavy animation and huge text.
- Animations 150–300ms, and always respect `prefers-reduced-motion` (already globally handled in `index.css`).
- Dark mode is class-based (`dark` on `<html>`, set by the store). It must be designed, not inverted: current dark surfaces are `#0B1120` (page), `slate-900` (cards), `slate-800` (borders/hover). Add dark variants for every new component.
- **Never communicate information by color alone.** Priority = icon + label; overdue = icon + text. Keep that pattern.
- Touch targets ≥ 44px. No horizontal scrolling on normal pages at 320px–1920px.
- Copy style: sentence case, plain verbs, active voice. Buttons say what they do ("Add", "Save changes"), and toasts reuse the same verb ("Task created", "Task deleted", "Task restored"). Empty states explain what to do next.

## 4. Current file map

```
index.html                 Font link, root div
tailwind.config.js         darkMode: 'class', navy/brand colors, font
tsconfig.checks.json       Compiles scripts/ + src/ to .checks/ for `npm run check`
package.json               dev / build / preview / check scripts
scripts/
  checks.ts                Node assertions over the pure lib/ functions
  node-assert.d.ts         Minimal typing for node:assert/strict
src/
  main.tsx                 BrowserRouter + StoreProvider + TaskDrawerProvider + App
  App.tsx                  Routes: / (inbox), /today, /upcoming, /completed, /project/:id
  index.css                Tailwind layers, .card/.muted/.nav, animations, reduced-motion
  types.ts                 Priority, Theme, Subtask, Task, TaskInput, Project, AppState,
                           ViewKind, Toast, Reminder, Recurrence, ActivityEntry
  data/seed.ts             makeSeed(): 4 projects + realistic tasks + past completions for a streak
  lib/
    uid.ts                 uid(): crypto.randomUUID with a non-secure-context fallback
    dates.ts               due string <-> Date helpers, isValidDue, dueInfo (overdue labels)
    activity.ts            makeEntry + describeEdit (turns a task diff into history text)
    task.ts                emptyInput/inputFromTask/taskFromInput/mergeTask/applyToggle
    selectors.ts           selectViewTasks, groupUpcoming, todaySummary, streakOf, allTags
    normalize.ts           normalizeState: validate + migrate stored JSON (SCHEMA_VERSION)
    recurrence.ts          nextDueFrom + recurrenceLabel
    reminder.ts            reminder presets, labels and reminder time
    parse.ts               parseQuick(): quick-add natural-language parser
  context/store.tsx        StoreProvider/useStore: state, persistence, theme, toasts+undo
  hooks/useGlobalKeys.ts   App-level shortcuts (N today; grows with P1.7)
  components/
    Shell.tsx              Desktop sidebar, New task button, mobile nav + FAB, theme switch, toast
    QuickAdd.tsx           Quick-add input (Enter to create, expand button -> drawer)
    ui/
      Drawer.tsx           Accessible dialog: bottom sheet / side panel, focus trap, Esc
      Chip.tsx             Selectable pill (due shortcuts, tags)
      Field.tsx            Field wrapper + shared input/button class constants
      EmptyState.tsx       Shared empty state
    tasks/
      TaskDrawer.tsx       Create/edit form (title, description, due, priority, project,
                           tags, subtasks, reminder, repeat, notes, activity)
      TaskDrawerProvider.tsx  Drawer state + draft, openNew/openEdit via useTaskDrawer()
      TaskRow.tsx          Checkbox, click-to-edit body, due/overdue, priority, project,
                           tags, repeat label, subtask progress, delete
      DuePicker.tsx        Quick due chips + date + time
      PriorityPicker.tsx   Priority radio group (icon + label)
      SubtaskField.tsx     Add/tick/reorder/delete subtasks with progress bar
      TagsField.tsx        Tag chips + create input + suggestions
      RepeatFields.tsx     ReminderField + RecurrenceField
      ActivityList.tsx     Read-only history
      priority.ts          PRIORITY_META (icon + wording per priority)
  pages/TaskView.tsx       One view component for inbox/today/upcoming/completed/project
```

### Data model (`src/types.ts`)

- `Task`: `id, title, description, notes, due?, priority (0–4), project?, tags[], subtasks[], reminder?, recurrence?, activity[], done, doneAt?, createdAt, updatedAt`.
- `due` is a string: `yyyy-MM-dd` or `yyyy-MM-dd'T'HH:mm` (`parseISO` reads both; `includes('T')` means it has a time).
- Priority: 0 none, 1 low, 2 medium, 3 high, 4 urgent. Quick-add `p1` → 4 (urgent) … `p4` → 1 (low).
- `Reminder`: `{ preset: 'none'|'10m'|'30m'|'1h'|'1d'|'custom', minutes? }` (minutes only for `custom`).
- `Recurrence`: `{ preset: 'none'|'daily'|'weekdays'|'weekly'|'monthly'|'custom', interval?, unit? }`.
- `ActivityEntry`: `{ id, at (ISO), kind, text }` — **newest first**; kinds are `created | updated | completed | reopened | rescheduled | repeated`.
- `TaskInput` is the drawer's editable shape (`Pick<Task, 'title'|'description'|'notes'|'priority'|'tags'|'subtasks'>` plus optional `due/project/reminder/recurrence`). Build it with `emptyInput()`, `inputFromTask(task)`.
- `AppState`: `{ version, tasks, projects, theme }`, stored under `localStorage['flowtask:v1']`. `version` is checked by `normalizeState`, which also validates every field and drops broken records.

### Store (`useStore()`)

Exposes `state, toast, streak, doneToday, addTask, updateTask, reschedule, toggle, removeTask, addProject, setTheme, notify, dismissToast`. New mutations must go through the store, call `notify({...})` for toast feedback, and keep all storage access inside `store.tsx` (`loadState()` is the only reader; the migration/validation it calls lives in `lib/normalize.ts`).

## 5. What is DONE

- Project scaffold: Vite + React + TS + Tailwind + Router, strict TS.
- App shell: desktop sidebar (nav, projects, inline Add project, done-today + streak summary, Light/Dark/System switch) and a mobile bottom nav (Inbox, Today, Upcoming, Completed, Projects → first project).
- Views: Inbox (no due date), Today (due today plus overdue), Upcoming (grouped Tomorrow / This week / Later), Completed (recent first), Project page (progress bar, done/remaining, tasks).
- Today dashboard header with time-based greeting and 4 stat cards (Due today, Completed, Progress %, Streak).
- Quick add with parser: date (today / tomorrow / next week), time (`6pm`, `at 6:30pm`), priority (`p1`–`p4`), `#project` (matches by project name) or `#tag`.
- Task rows: animated checkbox, strike-through + dimmed when done, due label, `Overdue · N days`, priority icon + label, project dot, tags, subtask progress bar with "N of M", delete button.
- Delete with undo toast ("Task deleted · Undo" → "Task restored"). Creating a task and creating a project also toast.
- Theme (light/dark/system) persisted; follows OS changes in system mode.
- Streak calculation (consecutive days with ≥1 completion; still counts if today has none yet).
- Per-view empty states (Inbox, Today, Upcoming, Completed, Project) and a missing-project state.
- Persistence of tasks, projects and theme; realistic seed data.
- Accessibility basics: semantic landmarks, labelled controls, `role="checkbox"`, `role="radiogroup"` for the theme switch, focus-visible ring, `role="status"` toast, reduced-motion support.
- **Task create/edit drawer (P0 done):** bottom sheet on mobile / right-hand panel from `md` up. Fields: title (required, auto-focused), description, due chips (Today / Tomorrow / This weekend / Next week / Clear) + date + time, visual priority selector (None → Urgent, icon + label), project select, tags with suggestions, subtasks, reminder, repeat, notes, activity. Esc and outside click close it, Tab is trapped, focus returns to the opener, `role="dialog"` + `aria-modal` + labelled heading. Opened from the sidebar "New task" button, the mobile FAB, `N`, the quick-add expand button and the empty-state buttons.
- **Draft preservation:** a dirty drawer that is closed accidentally keeps its values ("Draft kept · Discard draft" toast) and restores them the next time the same form is opened.
- **Task editing (P0.2):** clicking a task row body opens the same drawer in edit mode; subtasks can be added, ticked, reordered and deleted with "2 of 4 completed" + progress bar; notes; activity/history appends entries on create, complete, reopen, edit, reschedule and repeat.
- **Recurring tasks (P0.3):** completing a repeating task spawns the next occurrence, keeping the time of day and never landing in the past; rows show a repeat icon plus the rule ("Daily", "Every 2 weeks").
- **Versioned, validated storage:** `AppState.version` + `lib/normalize.ts#normalizeState()` validate and migrate every stored field (including real calendar checks on `due`), dropping broken records; an unreadable payload falls back to the seed *and* tells the user via toast.
- Delete undo now restores the removed task at its original index instead of snapshotting the whole list, and `lib/uid.ts` hides the `crypto.randomUUID()` secure-context requirement.
- Pure logic is covered by `npm run check` (14 assertions over recurrence, task mutations, migration, selectors, dates/reminders and the quick-add parser).

## 6. Known issues and caveats (fix as you go)

**Recently resolved — do not re-introduce:** the project now installs, type-checks and builds cleanly; delete-undo restores only the removed task at its original index; ids come from `lib/uid.ts`; storage carries a `version` and is validated/migrated by `normalizeState()`; `TaskView` no longer does filtering or grouping (that lives in `lib/selectors.ts`); streak/"done today" no longer compare a UTC date slice against a local date key.

Open:

1. **Reminders are stored, not delivered.** The drawer captures `Task.reminder` and shows the rule; firing happens in-app in P3.20. `lib/reminder.ts#reminderTime()` is ready for it, and the drawer copy states the current behaviour.
2. **Overdue quick actions (P0.4) are not built.** `store.reschedule(id, due?)` already exists with an undo toast; it needs the row-level menu (Today / Tomorrow / Next week / Pick date) wired to it.
3. **No row selection or keyboard nav (P0.5).** Arrow keys / `E` / `Delete` / Space don't act on a selection yet; only `N` is bound (in `hooks/useGlobalKeys.ts`).
4. **Mobile "Projects" tab still links to the first project only**; it needs a real projects list/sheet (P2.15).
5. `TaskView` still renders the static "Basi" greeting; move it into preferences in P2.13.
6. The seed adds "Daily review" completed tasks to create a streak; they show under Personal and Completed. Fine for demo, but revisit if it reads as clutter.
7. `preferences` (density, default priority, week starts on …) is not in `AppState` yet — add it in P2.13 together with the settings page.
8. The store value is recreated on every state change and `TaskDrawerProvider` re-renders on every keystroke, so all consumers re-render. Fine at this size; if it becomes a bottleneck, split into state/actions contexts or move to `useSyncExternalStore`.
9. `Project` is still `{ id, name, color }`. P1.10 adds description/icon and edit/delete — decide (and document) what happens to a deleted project's tasks; the plan is to move them to Inbox.
10. Tags are derived from tasks (`allTags`). Renaming a tag (P1.9) means updating every task, or promoting tags to a `Tag` entity.

## 7. What is LEFT (prioritized)

Work in this order. Each item lists the acceptance criteria. Keep the app working and building after every step.

### P0 — Core task experience
1. ✅ **Task create/edit drawer** — done (see §5); open it with `useTaskDrawer().openNew()`. Fields: title (required, auto-focused), description, due date with quick chips (Today, Tomorrow, This weekend, Next week, Custom) plus due time, priority visual selector (None → Urgent, icon + label), project select, tags create/select, reminder (none, 10m, 30m, 1h, 1d, custom), recurrence (none, daily, weekdays, weekly, monthly, custom), notes. Closes on Esc and outside click, traps focus, is an accessible dialog (`role="dialog"`, `aria-modal`, labelled). Preserve draft when accidentally closed. Open from a "New task" button, `N` key, and quick add's expand action.
2. ✅ **Task details/edit** — done (see §5). Subtasks are edited in the drawer draft and saved with it, so `updateTask` stays the single write path; `E` / `Delete` on a selected row belongs to item 5. Clicking a task row (not the checkbox/delete) opens the same drawer in edit mode: inline edits, subtasks add/toggle/delete/reorder with "2 of 4 completed" + progress bar, notes, activity/history (append entries on create/complete/edit/reschedule; extend `Task` with `activity` and `notes`, and add `reminder` and `recurrence` types). Add store actions `updateTask`, `toggleSubtask`, etc. `E` edits the selected task; `Delete` deletes it (with undo).
3. ✅ **Recurring tasks** — done (see §5): `lib/recurrence.ts#nextDueFrom` plus `lib/task.ts#applyToggle`. On completion of a recurring task, create/advance the next occurrence. Show a repeat icon on rows.
4. **Overdue actions — remaining.** `store.reschedule(id, due?)` and `DuePicker` already exist to build the menu on. Reschedule (quick menu: Today / Tomorrow / Next week / Pick date), Complete, Edit, without making overdue rows visually loud.
5. **Row selection + keyboard nav — remaining.** Extend `hooks/useGlobalKeys.ts` and keep the selection logic in `lib/` or `hooks/`. Arrow keys move selection; `E`/`Delete`/Space act on the selected task. Visible selection state.

### P1 — Navigation and discovery
6. **Command palette + global search.** `Ctrl/⌘+K` and `/`. Search titles, descriptions, projects, tags. Filters: priority, project, tag, due date, status. Grouped commands: Create task, Search tasks, Go to Today/Inbox/Calendar/Analytics, Toggle dark mode, View completed, Create project. Keyboard-navigable, with a search-specific empty state.
7. **Keyboard shortcuts** — `N`, `/`, `⌘/Ctrl+K`, `Esc`, `Enter`, `E`, `Delete` — plus a shortcuts help modal (`?`). Never fire single-key shortcuts while typing in inputs.
8. **Filters and sorting** on task lists: filters for priority, project, tags, due date, status, recurring, overdue (multi-select, combinable); active filters shown as removable chips; sort by manual, due date, priority, created date, A–Z. Persist filters/sort per view.
9. **Tags management.** Create, rename, delete (with confirmation), filter by tag; tag pages or filter chips. Promote tags to a `Tag` entity if renaming needs to update tasks.
10. **Projects management.** Edit name, color, icon, description; delete with confirmation (decide and document what happens to tasks, e.g. move to Inbox). Project page also shows upcoming deadlines. Use project color everywhere consistently.

### P2 — Calendar, analytics, settings
11. **Calendar page (`/calendar`)** with Month / Week / Day views, tasks on their dates, click a date to see that day's tasks, create a task from a date. Respect the "week starts on" setting. It must be genuinely usable at 320px (compact month grid with a day list below).
12. **Analytics page (`/analytics`)** using Recharts (lazy-loaded route): completed today / this week / this month, completion rate, current and longest streak, overdue count, most productive day, completed by project. Weekly completion bar chart, project distribution chart, completion-rate progress ring. Charts must be responsive and have text alternatives.
13. **Settings page (`/settings`)**: Appearance (theme, compact/comfortable density), Productivity (default priority, default duration, week starts on, completed-task behavior), Notifications (reminder preferences), Data (export JSON, import JSON, clear local data). Add a `preferences` object to `AppState` and wire the settings into the UI (density affects `TaskRow` padding, etc.).
14. **Import/export.** Export state as JSON. Import validates shape and types before touching state, shows a confirmation step before replacing, and shows clear errors for invalid files. Clear-data also needs confirmation.
15. **Add Calendar, Analytics and Settings to the nav** (sidebar and mobile). The mobile nav currently has 5 slots, so move to a compact "More" sheet for the extras.

### P3 — Polish
16. **Drag and drop:** reorder within a list (Manual sort), move between sections (e.g. Upcoming groups → sets due date), move between projects (drop on a sidebar project). Subtle drag feedback, keyboard alternative where practical.
17. **Confirmation dialog component** (accessible) for: delete task (when not undoable), delete project, delete tag, import replace, clear data. Do *not* confirm harmless actions.
18. **Toasts:** move toast into its own component/stack; add "Changes saved" and support multiple. Undo for destructive actions where practical.
19. **Streak celebrations:** subtle milestone messaging (e.g. 7 days) and a tasteful "all done for today" message/animation. Not gamified or pressuring.
20. **Reminders:** in-app reminder handling based on `reminder` (optionally `Notification` API with permission prompt in Settings).
21. **Loading/skeleton and error states:** skeleton on first load if useful, error boundary, corrupt-localStorage recovery (currently falls back to seed silently).
22. **Performance:** lazy-load Calendar, Analytics, Settings routes; memoize selectors; avoid heavy work in render.
23. **Route-level a11y:** set `document.title` per view, move focus to the `<h1>` on navigation, add a skip link.

## 8. Conventions for agents

- **Structure:** follow the layout in section 4, adding `components/{ui,layout,tasks,projects,calendar,analytics,command-palette}`, `hooks/`, `utils/` as they become needed. Move things into `components/ui` (Button, Dialog, Drawer, Chip, Popover, ProgressBar, EmptyState, Toast) rather than repeating markup. Reuse `components/ui/Field.tsx`'s exported class constants (`inputCls`, `selectCls`, `textareaCls`, `primaryBtnCls`, `ghostBtnCls`, `dangerBtnCls`) instead of re-typing long class strings.
- **Business logic out of presentation:** filtering, grouping, streaks and analytics belong in `lib/` (pure functions, easy to test), not inside JSX.
- **Types:** strict TS, no `any`. Add types for `Reminder`, `Recurrence`, `Tag`, `UserPreferences`, `AnalyticsData` in `types.ts`.
- **Dates:** use date-fns only; keep the `due` string format. Always guard against timezone bugs by using date-only strings + `parseISO` (never `new Date('yyyy-MM-dd')`).
- **Accessibility:** every icon-only button needs an `aria-label`; dialogs need focus trap + restore focus; lists use `<ul>/<li>`; inputs have labels (use `sr-only` if hidden visually).
- **Styling:** Tailwind utilities + the shared classes; use brand tokens, not ad-hoc hex values (exceptions: the semantic success/warning/danger colors, currently inline hex).
- **State changes** go through the store and produce a toast where the user needs feedback.
- **Persist** anything the brief says to persist: tasks, projects, tags, theme, preferences, filters.
- Keep components small (roughly < 150 lines). Split before adding more.

## 9. Definition of done (final polish checklist)

Before calling the project complete, verify by actually running the app:

- [ ] `npm install && npm run dev` works from a clean clone; `npm run build` has zero errors
- [ ] No console errors or warnings
- [ ] Every button and nav item works; no broken links or placeholder content
- [ ] Task CRUD, editing, completion, subtasks, recurrence all work
- [ ] Search, command palette, filters and sorting work (including combined filters + removable chips)
- [ ] Calendar (month/week/day), projects, tags work
- [ ] Analytics render with real data and empty data
- [ ] Dark mode, theme persistence, density setting work
- [ ] Export/import round-trips; invalid import is rejected with a clear message; replace requires confirmation
- [ ] All keyboard shortcuts work and the help modal lists them
- [ ] Every view has a designed empty state; error states exist
- [ ] Responsive at 320, 375, 390, 768, 1024, 1440, 1920 px with no horizontal scroll
- [ ] Keyboard-only run-through is possible; focus is always visible; contrast is adequate in both themes
- [ ] `prefers-reduced-motion` respected

The bar is a polished, launchable product. Do not stop at feature completeness: keep refining hierarchy, spacing, typography, interaction states and mobile behavior.
