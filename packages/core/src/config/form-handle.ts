import type { FormApi, ReactComponentTree, ReactTanStackFormComponents } from '@tanstack/react-form'

// biome-ignore lint/suspicious/noExplicitAny: the error axis the handle leaves open.
type OpenErrors = any

type HandleMember =
  | 'formId'
  | 'state'
  | 'handleSubmit'
  | 'reset'
  | 'getFieldValue'
  | 'setFieldValue'
  | 'resetField'
  | 'pushFieldValue'
  | 'insertFieldValue'
  | 'replaceFieldValue'
  | 'removeFieldValue'
  | 'swapFieldValues'
  | 'moveFieldValue'
  | 'clearFieldValues'
  | 'filterFieldValues'

/**
 * The form as an inline layout entry sees it: the members of TanStack's form whose types rest on
 * the data type alone. It reads and writes values by path, subscribes to the form state, submits,
 * resets and changes arrays.
 *
 * Members whose types carry the form's validators, such as `atom` and `validate`, are left out; a
 * form that needs them builds its own shell with `formHook.useAppForm`. The validation errors in
 * `state` are typed loosely for the same reason.
 *
 * @typeParam TData - The data type of the form.
 *
 * @example
 * ```tsx
 * const layout: LayoutOf<typeof registry, Order> = [
 *   'items',
 *   {
 *     render: (form) => (
 *       <form.Subscribe selector={(state) => state.values.items.length}>
 *         {(count) => <p>{count} items</p>}
 *       </form.Subscribe>
 *     ),
 *   },
 * ]
 * ```
 */
export type FormHandle<TData> = Pick<FormApi<TData, OpenErrors>, HandleMember> &
  Pick<ReactTanStackFormComponents<TData, OpenErrors, ReactComponentTree>, 'Subscribe'>
