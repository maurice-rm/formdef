import type { AnyFormApi } from '@tanstack/react-form'

import type { Validation } from '../config/validation'

type Mode = NonNullable<Validation['mode']>

/** What TanStack hands a trigger's `when`: the form, and the group of a group validator. */
type TriggerContext = {
  formApi: AnyFormApi
  groupApi?: { state: { submissionAttempts: number } }
}

type Trigger = 'change' | 'blur' | { trigger: 'change'; when: (context: TriggerContext) => boolean }

const DEFAULT_MODE: Mode = 'revalidate'

// A step's group counts as submitted once its own submit ran, before the form's has.
const wasSubmitted = ({ formApi, groupApi }: TriggerContext): boolean =>
  formApi.state.submissionAttempts > 0 || (groupApi?.state.submissionAttempts ?? 0) > 0

const isInvalid = ({ formApi }: TriggerContext): boolean => !formApi.state.isValid

// TanStack runs every validator on submit; the triggers add when else the schema runs.
const TRIGGERS: Readonly<Record<Mode, readonly Trigger[]>> = {
  revalidate: [{ trigger: 'change', when: wasSubmitted }],
  blurThenChange: ['blur', { trigger: 'change', when: isInvalid }],
  onChange: ['change'],
  onBlur: ['blur'],
  onSubmit: [],
}

/**
 * When the schema runs besides on submit, and its debounce, as a TanStack validator takes them,
 * for the `validation` of a config.
 */
export function schemaTimingOf(validation: Validation | undefined): {
  triggers: readonly Trigger[]
  triggerDebounceMs?: number
} {
  const { mode = DEFAULT_MODE, ...timing } = validation ?? {}
  const triggers = TRIGGERS[mode]

  return timing.async === true && timing.asyncDebounceMs !== undefined
    ? { triggers, triggerDebounceMs: timing.asyncDebounceMs }
    : { triggers }
}
