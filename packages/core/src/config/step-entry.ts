import type { ConfigParts } from './config-parts'
import type { ExtraProps } from './extra-props'
import type { IsLevel } from './is-level'
import type { PropsEntry } from './props-entry'
import type { StepState } from './structure'
import type { Visibility } from './visibility'

type NoStepper = 'formdef: a step needs a registered structure.stepper'

/** The keys of `TValues` whose value is an object level, the keys a step can name. */
type LevelKeys<TValues> = {
  [Key in keyof TValues]-?: IsLevel<TValues[Key]> extends true ? Key : never
}[keyof TValues] &
  string

type StepOf<TStepper> =
  ExtraProps<TStepper, never> extends { steps: readonly (infer TStep)[] } ? TStep : never

// A mapped type keeps a union of step shapes a union, as ExtraProps does for a slot's props.
type StepProps<TStep> = TStep extends unknown
  ? { [Key in keyof TStep as Key extends keyof StepState ? never : Key]: TStep[Key] }
  : never

/** What a step entry passes to the registered stepper: what it reads per step beyond `StepState`. */
type StepperStepProps<TStructure> = TStructure extends { stepper?: infer TStepper }
  ? StepProps<StepOf<NonNullable<TStepper>>>
  : never

/**
 * One step of a stepped form: an entry of the root `layout` that names an object key of the root
 * level, rendered on its own with that level's `fields` and `layout`. A step needs a registered
 * `structure.stepper`; without one its `step` turns into a message saying so. Its `props` follow
 * what the stepper declares per step: absent when nothing, optional when every key is optional,
 * required otherwise.
 */
export type StepEntry<TParts extends ConfigParts, TValues> = {
  /** The object key of the root level the step renders. */
  step: 'stepper' extends keyof TParts['structure'] ? LevelKeys<TValues> : NoStepper
  /** The label the stepper shows for the step. */
  label: string
} & PropsEntry<StepperStepProps<TParts['structure']>, TValues> &
  Visibility<TValues>
