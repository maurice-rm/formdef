import type { Validation } from '../config/validation'
import { schemaTimingOf } from './schema-timing'

type Options = Readonly<Record<string, unknown>>

type FormOptionsInput = {
  /** The form config: the schema, formdef's own keys and TanStack's form options. */
  config: Options
  /** The instance's TanStack form options, from the form component's `options` prop. */
  options: Options | undefined
}

const recordOf = (value: unknown): Options =>
  typeof value === 'object' && value !== null ? (value as Options) : {}

const listOf = (value: unknown): readonly unknown[] => (Array.isArray(value) ? value : [])

// An instance passing `undefined`, such as data still loading, leaves the config's value in place.
const setEntriesOf = (value: unknown): Options =>
  Object.fromEntries(Object.entries(recordOf(value)).filter(([, entry]) => entry !== undefined))

const schemaValidatorOf = (schema: unknown, validation: unknown): Options => ({
  run: schema,
  ...schemaTimingOf(recordOf(validation) as Validation),
})

/**
 * The TanStack form options of a form: the config's options and the instance's merged key by key,
 * the instance winning; a key the instance sets to `undefined` counts as unset. The validators and
 * listeners of both run, the config's first, and the schema runs after the validators at the
 * times `validation` picks.
 */
export function formOptionsFor({ config, options }: FormOptionsInput): Record<string, unknown> {
  const {
    schema,
    validation,
    fields: _renderedByFields,
    layout: _arrangedByFields,
    stepper: _passedToTheStepper,
    ...configOptions
  } = config
  const instanceOptions = setEntriesOf(options)

  return {
    ...configOptions,
    ...instanceOptions,
    validators: [
      ...listOf(configOptions.validators),
      ...listOf(instanceOptions.validators),
      schemaValidatorOf(schema, validation),
    ],
    listeners: [...listOf(configOptions.listeners), ...listOf(instanceOptions.listeners)],
  }
}
