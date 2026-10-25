import type { FormAsyncValidateOrFn, FormOptions, FormValidateOrFn } from '@tanstack/react-form'

// biome-ignore lint/suspicious/noExplicitAny: the validator axes, which only the validators type.
type OpenValidator = any

type SyncValidator<TData> = FormValidateOrFn<TData> | undefined
type AsyncValidator<TData> = FormAsyncValidateOrFn<TData> | undefined

// TanStack reads its validator axes without distributing over a union, so axes typed for any
// validator turn the errors in every callback into `never`. They type the validators alone; every
// other option leaves them open, which types the errors loosely.
type TypedValidators<TData> = FormOptions<
  TData,
  SyncValidator<TData>,
  SyncValidator<TData>,
  AsyncValidator<TData>,
  SyncValidator<TData>,
  AsyncValidator<TData>,
  SyncValidator<TData>,
  AsyncValidator<TData>,
  SyncValidator<TData>,
  AsyncValidator<TData>,
  AsyncValidator<TData>,
  never
>['validators']

type TanStackFormOptions<TData, TSubmitMeta> = FormOptions<
  TData,
  OpenValidator,
  OpenValidator,
  OpenValidator,
  OpenValidator,
  OpenValidator,
  OpenValidator,
  OpenValidator,
  OpenValidator,
  OpenValidator,
  OpenValidator,
  TSubmitMeta
>

/**
 * TanStack's form options as a form config and a form's `options` take them: every option keeps
 * TanStack's meaning, the validators are typed by the data type, and the initial state takes no
 * values, which come from `defaultValues`.
 */
export type FormOptionsOf<TData, TSubmitMeta> = Omit<
  TanStackFormOptions<TData, TSubmitMeta>,
  'defaultValues' | 'defaultState' | 'validators'
> & {
  /**
   * TanStack's initial form state, without `values`: the start values come from `defaultValues`.
   *
   * @defaultValue none; TanStack's initial state
   */
  defaultState?: Omit<
    NonNullable<TanStackFormOptions<TData, TSubmitMeta>['defaultState']>,
    'values'
  >
  /**
   * TanStack's form validators, typed by the data type, next to the schema.
   *
   * @defaultValue none; the schema validates alone
   */
  validators?: TypedValidators<TData>
}
