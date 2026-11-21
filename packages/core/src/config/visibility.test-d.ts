import { describe, expectTypeOf, it } from 'vitest'

import type { EntryPlace } from './entry-place'
import type { Visibility } from './visibility'

type Values = {
  email: string
  age: number
  address: { zip: string }
  contacts: { name: string }[]
}

type EntryVisibility = Visibility<Values>

describe('Visibility', () => {
  it('gives visibleWhen the values of the whole form', () => {
    const options: EntryVisibility = {
      visibleWhen: (values) => {
        expectTypeOf(values).toEqualTypeOf<Values>()

        return values.age >= 18
      },
    }
    expectTypeOf(options).not.toBeAny()
  })

  it('gives visibleWhen where the entry renders, with the item of an array', () => {
    const options: EntryVisibility = {
      visibleWhen: (_values, at) => {
        expectTypeOf(at).toEqualTypeOf<EntryPlace>()

        return at.path.startsWith('contacts[') && at.item !== undefined
      },
    }
    expectTypeOf(options).not.toBeAny()
  })

  it('takes the paths of the whole data type in dependsOn', () => {
    const paths: EntryVisibility = { dependsOn: ['age', 'address.zip', 'contacts[0].name'] }
    expectTypeOf(paths).not.toBeAny()

    const shared = ['age', 'address.zip'] as const
    const sharedPaths: EntryVisibility = { dependsOn: shared }
    expectTypeOf(sharedPaths).not.toBeAny()

    // @ts-expect-error `adress` is misspelled
    const options: EntryVisibility = { dependsOn: ['adress.zip'] }
    expectTypeOf(options).not.toBeAny()
  })
})
