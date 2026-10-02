import { ArrowUp, ChevronsUp, Equal, Minus, type LucideIcon } from 'lucide-react'
import { PRIORITY_LABELS } from '../../lib/activity'
import type { Priority } from '../../types'

export interface PriorityMeta { label: string; Icon: LucideIcon; cls: string }

/** Icon + wording per priority. Priority 0 has no icon, on purpose. */
export const PRIORITY_META: Record<Priority, PriorityMeta | null> = {
  0: null,
  1: { label: PRIORITY_LABELS[1], Icon: Minus, cls: 'text-slate-400' },
  2: { label: PRIORITY_LABELS[2], Icon: Equal, cls: 'text-[#F59E0B]' },
  3: { label: PRIORITY_LABELS[3], Icon: ArrowUp, cls: 'text-orange-500' },
  4: { label: PRIORITY_LABELS[4], Icon: ChevronsUp, cls: 'text-[#EF4444]' }
}

export const PRIORITY_ORDER: Priority[] = [0, 1, 2, 3, 4]
