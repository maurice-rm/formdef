import { describe, expectTypeOf, it } from 'vitest'

import type { Validation } from './validation'

describe('Validation', () => {
  it('takes each of the five modes', () => {
    expectTypeOf<Validation['mode']>().toEqualTypeOf<
      'revalidate' | 'blurThenChange' | 'onChange' | 'onBlur' | 'onSubmit' | undefined
    >()
  })

  it('rejects a mode it does not know', () => {
    // @ts-expect-error validation runs on change, blur or submit, never on focus
    const validation: Validation = { mode: 'onFocus' }
    expectTypeOf(validation).not.toBeAny()
  })

  it('takes nothing, for revalidation by a synchronous schema', () => {
    expectTypeOf({}).toExtend<Validation>()
  })

  it('debounces an asynchronous schema', () => {
    expectTypeOf({
      mode: 'onChange',
      async: true,
      asyncDebounceMs: 300,
    } as const).toExtend<Validation>()
  })

  it('debounces only an asynchronous schema', () => {
    // @ts-expect-error a debounce applies to an asynchronous schema only
    const implicit: Validation = { asyncDebounceMs: 300 }
    // @ts-expect-error a debounce applies to an asynchronous schema only
    const explicit: Validation = { async: false, asyncDebounceMs: 300 }
    expectTypeOf(implicit).not.toBeAny()
    expectTypeOf(explicit).not.toBeAny()
  })
})
