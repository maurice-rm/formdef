import type { FieldApiOptions, FieldListeners, FieldValidators } from '@tanstack/react-form'

import type { Visibility } from './visibility'

// biome-ignore lint/suspicious/noExplicitAny: the path and error axes, which a nested config does not know.
type OpenAxis = any

// TanStack types a field's options by its path, which a nested config cannot know: one level may
// render at several paths. The options are typed by the value type and the form's values instead.
type TanStackFieldOptions<TValue, TValues> = Omit<
  FieldApiOptions<
    TValues,
    OpenAxis,
    TValue,
    FieldValidators<TValues, OpenAxis, TValue>,
    OpenAxis,
    TValues,
    OpenAxis
  >,
  'name' | 'validators' | 'listeners'
>

/**
 * The keys every field entry takes, whatever its shape: when it is visible, and TanStack's field
 * options typed by the field's value.
 */
export type FieldEntryOptions<TValue, TValues> = TanStackFieldOptions<TValue, TValues> &
  Visibility<TValues> & {
    validators?: FieldValidators<TValues, OpenAxis, TValue>
    listeners?: FieldListeners<TValues, OpenAxis, TValue, OpenAxis, TValues, OpenAxis>
  }
