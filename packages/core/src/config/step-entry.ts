import type { ConfigParts } from './config-parts'
import type { IsLevel } from './is-level'
import type { Visibility } from './visibility'

type NoStepper = 'formdef: a step needs a registered structure.stepper'

/** The keys of `TValues` whose value is an object level, the keys a step can name. */
type LevelKeys<TValues> = {
  [Key in keyof TValues]-?: IsLevel<TValues[Key]> extends true ? Key : never
}[keyof TValues] &
  string

/**
 * One step of a stepped form: an entry of the root `layout` that names an object key of the root
 * level, rendered on its own with that level's `fields` and `layout`. A step needs a registered
 * `structure.stepper`; without one its `step` turns into a message saying so.
 */
export type StepEntry<TParts extends ConfigParts, TValues> = {
  /** The object key of the root level the step renders. */
  step: 'stepper' extends keyof TParts['structure'] ? LevelKeys<TValues> : NoStepper
  /** The label the stepper shows for the step. */
  label: string
  props?: never
} & Visibility<TValues>
