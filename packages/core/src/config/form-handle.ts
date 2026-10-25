import type { ReactFormExtendedApi } from '@tanstack/react-form'

// biome-ignore lint/suspicious/noExplicitAny: the validator axes the handle leaves open.
type OpenValidator = any

type HandleMember =
  | 'formId'
  | 'state'
  | 'Subscribe'
  | 'handleSubmit'
  | 'reset'
  | 'getFieldValue'
  | 'setFieldValue'
  | 'resetField'
  | 'getFieldMeta'
  | 'setFieldMeta'
  | 'pushFieldValue'
  | 'insertFieldValue'
  | 'replaceFieldValue'
  | 'removeFieldValue'
  | 'swapFieldValues'
  | 'moveFieldValues'
  | 'clearFieldValues'

/**
 * The form as an inline layout entry sees it: the members of TanStack's form whose types rest on
 * the data type and the submit meta alone. It reads and writes values and field meta by path,
 * subscribes to the form state, submits, resets and changes arrays.
 *
 * Members whose types carry the form's validators, such as `store`, the error-map setters and the
 * `validate` methods, are left out; a form that needs them builds its own shell with
 * `formHook.useAppForm`. The validation errors in `state` are typed loosely for the same reason.
 *
 * @typeParam TData - The data type of the form.
 * @typeParam TSubmitMeta - What `handleSubmit` takes besides the values, as in TanStack's
 *   `onSubmitMeta`.
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
export type FormHandle<TData, TSubmitMeta> = Pick<
  ReactFormExtendedApi<
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
  >,
  HandleMember
>
