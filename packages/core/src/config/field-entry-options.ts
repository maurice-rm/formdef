import type { DeepKeys, StandardSchemaV1, UseFieldOptionsBound } from '@tanstack/react-form'

import type { FieldApiOf } from '../widget/field-of'

// biome-ignore lint/suspicious/noExplicitAny: the parent data and path axes, which a nested config does not know.
type OpenAxis = any

// TanStack rejects a promise in a sync slot through an inference site on its own generics; a
// pre-declared union has none, so these members leave a thenable out structurally. A rule typed to
// return `unknown` is rejected with it, which TanStack would accept.
type SyncResult =
  | (object & { then?: never })
  | string
  | number
  | bigint
  | boolean
  | symbol
  | null
  | undefined

type RuleProps<TValue> = { value: TValue; fieldApi: FieldApiOf<TValue> }

type SyncRule<TValue> =
  | StandardSchemaV1<TValue, unknown>
  | ((props: RuleProps<TValue>) => SyncResult)

type AsyncRule<TValue> =
  | StandardSchemaV1<TValue, unknown>
  | ((props: RuleProps<TValue> & { signal: AbortSignal }) => unknown)

type Listener<TValue> = (props: RuleProps<TValue>) => void

// TanStack types these slots by the field's path, which a nested config cannot know: one level may
// render at several paths. The slots are listed here by value type instead, and a type test keeps
// the list equal to TanStack's.
type Validators<TValue, TValues> = {
  onMount?: SyncRule<TValue>
  onChange?: SyncRule<TValue>
  onChangeAsync?: AsyncRule<TValue>
  onChangeAsyncDebounceMs?: number
  onChangeListenTo?: DeepKeys<TValues>[]
  onBlur?: SyncRule<TValue>
  onBlurAsync?: AsyncRule<TValue>
  onBlurAsyncDebounceMs?: number
  onBlurListenTo?: DeepKeys<TValues>[]
  onSubmit?: SyncRule<TValue>
  onSubmitAsync?: AsyncRule<TValue>
  onDynamic?: SyncRule<TValue>
  onDynamicAsync?: AsyncRule<TValue>
  onDynamicAsyncDebounceMs?: number
}

type Listeners<TValue> = {
  onChange?: Listener<TValue>
  onChangeDebounceMs?: number
  onBlur?: Listener<TValue>
  onBlurDebounceMs?: number
  onMount?: Listener<TValue>
  onUnmount?: Listener<TValue>
  onSubmit?: Listener<TValue>
  onGroupSubmit?: Listener<TValue>
}

type TanStackFieldOptions<TValue> = Omit<
  UseFieldOptionsBound<
    OpenAxis,
    OpenAxis,
    TValue,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined
  >,
  'name' | 'validators' | 'listeners'
>

/**
 * The keys every field entry takes, whatever its shape: when it is visible, and TanStack's field
 * options typed by the field's value.
 */
export type FieldEntryOptions<TValue, TValues> = TanStackFieldOptions<TValue> & {
  /** Whether the entry renders, from the values of the whole form. */
  visibleWhen?: (values: TValues) => boolean
  /** The paths `visibleWhen` and derived props read; only these make them read again. */
  dependsOn?: readonly DeepKeys<TValues>[]
  validators?: Validators<TValue, TValues>
  listeners?: Listeners<TValue>
}
