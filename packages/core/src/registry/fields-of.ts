import type { LevelFields } from '../config/field-entry'
import type { FormHandle } from '../config/form-handle'
import type { AnyRegistry, PartsOf } from './registry'

/**
 * The `fields` of one level whose value type is `TValue`, in a form whose data type is `TRoot`,
 * with the widgets and structure slots of `TRegistry`. Use it to describe a group of fields once
 * and place it in several forms, or at several places of one form.
 *
 * A fragment fits only forms whose data type is `TRoot`: `visibleWhen`, derived `props` and
 * `dependsOn` read the values of the whole form. Several forms of one data type share it, and so do
 * several places of one form.
 *
 * @typeParam TRegistry - The registry the forms are built with, as `typeof registry`.
 * @typeParam TValue - The value type of the level, such as an address.
 * @typeParam TRoot - The data type of the form the level is part of. Defaults to `TValue`, for a
 *   level that is the whole form, such as the data of a field group.
 *
 * @example
 * ```ts
 * const addressFields: FieldsOf<typeof registry, Address, Customer> = {
 *   street: { widget: 'text', props: { label: 'Street' } },
 *   zip: { widget: 'text', props: { label: 'Postal code' } },
 * }
 *
 * const customerFields: FieldsOf<typeof registry, Customer> = {
 *   billing: { fields: addressFields },
 *   shipping: { fields: addressFields, visibleWhen: (values) => values.hasShippingAddress },
 * }
 * ```
 */
export type FieldsOf<TRegistry extends AnyRegistry, TValue, TRoot = TValue> = LevelFields<
  PartsOf<TRegistry, FormHandle<TRoot, never>>,
  TValue,
  TRoot
>
