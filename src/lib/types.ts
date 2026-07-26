export type PricingMode = 'per_lesson' | 'monthly'

export type EntryKind = 'lesson' | 'payment'

export type Presence =
  | 'present'
  | 'no_show'
  | 'cancellation'
  | 'late_cancellation'
  | 'teacher_cancellation'
  | 'reschedule'

/** Lesson type lives on the Class, not here -- it's a property of the course. */
export interface Student {
  id: string
  user_id: string
  name: string
  contact: string | null
  level: string | null
  needs: string | null
  notes: string | null
  archived: boolean
  created_at: string
  updated_at: string
}

export interface Class {
  id: string
  user_id: string
  name: string
  lesson_type: string | null
  default_duration_min: number
  pricing_mode: PricingMode
  price_per_lesson: number | null
  monthly_price: number | null
  notes: string | null
  archived: boolean
  created_at: string
  updated_at: string
}

export interface ClassStudent {
  class_id: string
  student_id: string
  user_id: string
}

export interface Entry {
  id: string
  user_id: string
  class_id: string
  kind: EntryKind

  /** Lesson date. Null on payment rows. */
  entry_date: string | null
  duration_min: number | null
  presence: Presence | null
  /** The discreet first-column checkbox: strikes the row out, charges nothing. */
  not_charged: boolean
  lesson_notes: string | null

  /** Payment due date. Null on lesson rows. */
  due_date: string | null
  /** Payment amount, or a one-off price override on a lesson row. */
  amount: number | null
  paid: boolean
  paid_date: string | null

  extra_notes: string | null
  created_at: string
  updated_at: string
}

/**
 * How each presence value is drawn and whether it bills by default. The wording
 * lives in i18n.ts under presence.* -- only the glyph and the money rule are
 * properties of the data.
 */
export const PRESENCE_META: Record<Presence, { glyph: string; chargeable: boolean }> = {
  present: { glyph: '×', chargeable: true },
  no_show: { glyph: '⊘', chargeable: true },
  cancellation: { glyph: '○', chargeable: false },
  late_cancellation: { glyph: '◑', chargeable: true },
  teacher_cancellation: { glyph: '—', chargeable: false },
  reschedule: { glyph: '›', chargeable: false },
}

export const PRESENCE_ORDER: Presence[] = [
  'present',
  'no_show',
  'late_cancellation',
  'cancellation',
  'teacher_cancellation',
  'reschedule',
]
