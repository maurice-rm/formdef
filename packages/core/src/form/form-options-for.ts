import { revalidateLogic, type ValidationLogicFn } from '@tanstack/react-form'

import type { Validation } from '../config/validation'
import { blurThenChange } from './blur-then-change'

type Mode = NonNullable<Validation['mode']>
type DynamicMode = 'revalidate' | 'blurThenChange'
type Slot = 'onDynamic' | 'onChange' | 'onBlur' | 'onSubmit'

type Options = Readonly<Record<string, unknown>>

type FormOptionsInput = {
  /** The form config: the schema, formdef's own keys and TanStack's form options. */
  config: Options
  /** The instance's TanStack form options, from the form component's `options` prop. */
  options: Options | undefined
}

const DEFAULT_MODE: Mode = 'revalidate'

const isDynamic = (mode: Mode): mode is DynamicMode =>
  mode === 'revalidate' || mode === 'blurThenChange'

const logicFor = (mode: DynamicMode): ValidationLogicFn =>
  mode === 'revalidate' ? revalidateLogic() : blurThenChange

const slotFor = (mode: Mode, isAsync: boolean): Slot | `${Slot}Async` => {
  const slot: Slot = isDynamic(mode) ? 'onDynamic' : mode

  return isAsync ? `${slot}Async` : slot
}

const recordOf = (value: unknown): Options =>
  typeof value === 'object' && value !== null ? (value as Options) : {}

/**
 * The TanStack form options of a form: the config's options and the instance's merged key by key,
 * the instance winning, except `validators` and `listeners`, which merge slot by slot. The schema
 * goes into the slot `validation` picks unless a validator already fills it; a dynamic mode brings
 * its validation logic, an asynchronous schema its debounce unless the options set one.
 */
export function formOptionsFor({ config, options }: FormOptionsInput): Record<string, unknown> {
  const {
    schema,
    validation,
    fields: _renderedByFields,
    layout: _arrangedByFields,
    ...configOptions
  } = config
  const { mode = DEFAULT_MODE, ...timing } = recordOf(validation) as Validation
  const isAsync = timing.async === true
  const slot = slotFor(mode, isAsync)
  const validators = {
    ...recordOf(configOptions.validators),
    ...recordOf(options?.validators),
  }

  return {
    ...(isDynamic(mode) && { validationLogic: logicFor(mode) }),
    ...(isAsync &&
      timing.asyncDebounceMs !== undefined && { asyncDebounceMs: timing.asyncDebounceMs }),
    ...configOptions,
    ...options,
    validators: validators[slot] === undefined ? { ...validators, [slot]: schema } : validators,
    listeners: { ...recordOf(configOptions.listeners), ...recordOf(options?.listeners) },
  }
}
