import type { DeepKeys } from '@tanstack/react-form'

/** When an entry renders: the keys every field entry and every layout entry takes. */
export type Visibility<TValues> = {
  /** Whether the entry renders, from the values of the whole form. */
  visibleWhen?: (values: TValues) => boolean
  /** The paths `visibleWhen` and derived props read; only these make them read again. */
  dependsOn?: readonly DeepKeys<TValues>[]
}
