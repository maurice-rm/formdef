import type { FormHandle } from '../config/form-handle'
import type { LayoutEntry } from '../config/layout-entry'
import type { AnyRegistry, PartsOf } from './registry'

/**
 * The `layout` of one level whose value type is `TValue`, in a form whose data type is `TRoot`,
 * with the structure slots and form components of `TRegistry`. Names in it are keys of the level
 * itself, never paths. An inline entry receives the form as a {@link FormHandle}; it submits
 * without submit meta, which a level does not know.
 *
 * @typeParam TRegistry - The registry the forms are built with, as `typeof registry`.
 * @typeParam TValue - The value type of the level.
 * @typeParam TRoot - The data type of the form the level is part of. Defaults to `TValue`, for a
 *   level that is the whole form, such as the data of a field group.
 *
 * @example
 * ```ts
 * const customerLayout: LayoutOf<typeof registry, Customer> = [
 *   { section: 'Customer', layout: ['name', 'billing'] },
 *   { component: 'SubmitButton', props: { label: 'Save' } },
 * ]
 * ```
 */
export type LayoutOf<TRegistry extends AnyRegistry, TValue, TRoot = TValue> = LayoutEntry<
  PartsOf<TRegistry, FormHandle<TRoot, never>>,
  keyof NonNullable<TValue> & string,
  TRoot
>[]
