import type { EntryPlace } from '../config/entry-place'

/** A step of the root layout, as the renderer reads it. */
export type RootStep = {
  step: string
  label: string
  visibleWhen?: ((values: unknown, at: EntryPlace) => boolean) | undefined
  submitsWhen?: ((values: unknown) => boolean) | undefined
  /** The props for the stepper: an object, or a function of the form's values and its place. */
  props?: unknown
}

/** Where a step renders: a layout entry of the root level, outside any array. */
export const STEP_PLACE: EntryPlace = { path: '', item: undefined }

/** The steps of a root layout that holds any: at least one. */
export type RootSteps = readonly [RootStep, ...RootStep[]]

const MIXED_LAYOUT =
  'formdef: the root layout holds a step and other entries; a root layout that holds a step holds only steps.'

const isStep = (entry: unknown): entry is RootStep =>
  typeof entry === 'object' && entry !== null && 'step' in entry

const hasFields = (entry: unknown): boolean =>
  typeof entry === 'object' && entry !== null && 'fields' in entry

/**
 * The steps of a root layout, or `undefined` when it holds none.
 *
 * @throws When the layout mixes steps with other entries, or a step names no entry of `fields`
 *   with fields of its own.
 */
export function rootStepsOf(
  layout: unknown,
  fields: Readonly<Record<string, unknown>>,
): RootSteps | undefined {
  const entries: unknown[] = Array.isArray(layout) ? layout : []
  const [first, ...rest] = entries.filter(isStep)
  if (first === undefined) {
    return undefined
  }
  if (rest.length + 1 < entries.length) {
    throw new Error(MIXED_LAYOUT)
  }

  const steps: RootSteps = [first, ...rest]
  for (const { step } of steps) {
    if (!(Object.hasOwn(fields, step) && hasFields(fields[step]))) {
      throw new Error(`formdef: the step "${step}" names no entry of the root level with fields.`)
    }
  }

  return steps
}
