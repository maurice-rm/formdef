import { createFormHook } from '@tanstack/react-form'
import { describe, expectTypeOf, it } from 'vitest'
import { z } from 'zod'

import type { FormHandle } from './form-handle'

type Order = { email: string; address: { zip: string }; items: { sku: string }[] }

const HANDLE_MEMBERS = [
  'formId',
  'state',
  'Subscribe',
  'handleSubmit',
  'reset',
  'getFieldValue',
  'setFieldValue',
  'resetField',
  'pushFieldValue',
  'insertFieldValue',
  'replaceFieldValue',
  'removeFieldValue',
  'swapFieldValues',
  'moveFieldValue',
  'clearFieldValues',
  'filterFieldValues',
] as const

describe('FormHandle', () => {
  it("is what a real form built with TanStack's useAppForm offers", () => {
    const { useAppForm } = createFormHook({
      fieldComponents: {},
      formComponents: {},
    })
    const schema = z.object({
      email: z.email(),
      address: z.object({ zip: z.string() }),
      items: z.array(z.object({ sku: z.string() })),
    })

    const useOrderForm = () =>
      useAppForm({
        defaultValues: { email: '', address: { zip: '' }, items: [] } as Order,
        validators: [
          { run: schema, triggers: ['change'] },
          { run: async () => undefined, triggers: [] },
        ],
      })

    expectTypeOf<ReturnType<typeof useOrderForm>>().toExtend<FormHandle<Order>>()
    expectTypeOf<ReturnType<typeof useOrderForm>>().not.toExtend<FormHandle<{ email: number }>>()
  })

  it('holds exactly the members whose type rests on the data type', () => {
    expectTypeOf<keyof FormHandle<Order>>().toEqualTypeOf<(typeof HANDLE_MEMBERS)[number]>()
  })

  it('reads and writes values by path of the data type', () => {
    const form = {} as FormHandle<Order>

    expectTypeOf(form.getFieldValue('address.zip')).toEqualTypeOf<string>()
    form.setFieldValue('email', 'ada@example.com')
    form.pushFieldValue('items', { sku: 'A-1' })
    // @ts-expect-error an order has no `adress`
    form.getFieldValue('adress.zip')
    // @ts-expect-error the email is a string
    form.setFieldValue('email', 42)
  })

  it('submits without arguments, as TanStack Form v2 takes no submit meta', () => {
    const form = {} as FormHandle<Order>

    form.handleSubmit()
    // @ts-expect-error handleSubmit takes no argument
    form.handleSubmit({ intent: 'publish' })
  })

  it('reads the values of its data type from the state', () => {
    expectTypeOf<FormHandle<Order>['state']['values']>().toEqualTypeOf<Order>()
  })
})
