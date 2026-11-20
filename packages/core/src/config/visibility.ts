import type { DeepKeys } from '@tanstack/react-form'

import type { EntryPlace } from './entry-place'

/** When an entry renders: the keys every field entry and every layout entry takes. */
export type Visibility<TValues> = {
  /**
   * Whether the entry renders, from the values of the whole form and where the entry renders,
   * such as the array item it belongs to.
   */
  visibleWhen?: (values: TValues, at: EntryPlace) => boolean
  /**
   * The paths `visibleWhen` and derived props read; only these make them read again, and inside an
   * array item a change of the item.
   */
  dependsOn?: readonly DeepKeys<TValues>[]
}
