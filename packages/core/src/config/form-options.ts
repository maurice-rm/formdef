import type { FormOptions, FormOptionsValidators } from '@tanstack/react-form'

// biome-ignore lint/suspicious/noExplicitAny: the validator and submit axes, which only TanStack's own inference fills.
type OpenAxis = any

type TanStackFormOptions<TData> = FormOptions<TData, OpenAxis, OpenAxis, OpenAxis, unknown>

/**
 * TanStack's form options as a form config and a form's `options` take them: every option keeps
 * TanStack's meaning, the validators are typed by the data type, and the values come from
 * `defaultValues`.
 */
export type FormOptionsOf<TData> = Omit<
  TanStackFormOptions<TData>,
  'defaultValues' | 'validators'
> & {
  /**
   * TanStack's form validators, typed by the data type. They run before the schema.
   *
   * @defaultValue none; the schema validates alone
   */
  validators?: FormOptionsValidators<TData, unknown[]>
}
