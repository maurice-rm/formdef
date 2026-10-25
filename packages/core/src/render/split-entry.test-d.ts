import type { ComponentType } from 'react'
import { describe, expectTypeOf, it } from 'vitest'

import type { FieldEntry } from '../config/field-entry'
import type { FieldEntryOptions } from '../config/field-entry-options'
import type { ArrayFrameProps } from '../config/structure'
import type { Visibility } from '../config/visibility'
import type { FieldOf } from '../widget/field-of'
import type { OwnEntryKey } from './split-entry'

type Values = { name: string; address: { zip: string }; tags: string[] }

type Parts = {
  widgets: { text: ComponentType<FieldOf<string> & { label: string }> }
  structure: { arrayFrame: ComponentType<ArrayFrameProps<string> & { isCompact?: boolean }> }
  formComponents: Record<never, never>
  handle: unknown
}

type KeysOfEach<TType> = TType extends unknown ? keyof TType : never

type EntryKeys =
  | KeysOfEach<FieldEntry<Parts, string, Values>>
  | KeysOfEach<FieldEntry<Parts, Values['address'], Values>>
  | KeysOfEach<FieldEntry<Parts, string[], Values>>

type TanStackKeys = Exclude<keyof FieldEntryOptions<string, Values>, keyof Visibility<Values>>

describe('OwnEntryKey', () => {
  it('lists every key an entry has that is not a TanStack field option', () => {
    expectTypeOf<OwnEntryKey>().toEqualTypeOf<Exclude<EntryKeys, TanStackKeys>>()
  })
})
