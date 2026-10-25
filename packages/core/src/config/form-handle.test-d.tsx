import { createFormHook, createFormHookContexts } from '@tanstack/react-form'
import { describe, expectTypeOf, it } from 'vitest'
import { z } from 'zod'

import type { FormHandle } from './form-handle'

type Order = { email: string; address: { zip: string }; items: { sku: string }[] }
type Intent = { intent: 'save' | 'publish' }

const HANDLE_MEMBERS = [
  'formId',
  'state',
  'Subscribe',
  'handleSubmit',
  'reset',
  'getFieldValue',
  'setFieldValue',
  'resetField',
  'getFieldMeta',
  'setFieldMeta',
  'pushFieldValue',
  'insertFieldValue',
  'replaceFieldValue',
  'removeFieldValue',
  'swapFieldValues',
  'moveFieldValues',
  'clearFieldValues',
] as const

describe('FormHandle', () => {
  it("is what a real form built with TanStack's useAppForm offers", () => {
    const { fieldContext, formContext } = createFormHookContexts()
    const { useAppForm } = createFormHook({
      fieldContext,
      formContext,
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
        validators: { onChange: schema, onSubmitAsync: async () => undefined },
        onSubmitMeta: { intent: 'save' } as Intent,
      })

    expectTypeOf<ReturnType<typeof useOrderForm>>().toExtend<FormHandle<Order, Intent>>()
    expectTypeOf<ReturnType<typeof useOrderForm>>().not.toExtend<
      FormHandle<{ email: number }, Intent>
    >()
  })

  it('holds exactly the members whose type rests on the data type and the submit meta', () => {
    expectTypeOf<keyof FormHandle<Order, Intent>>().toEqualTypeOf<(typeof HANDLE_MEMBERS)[number]>()
  })

  it('reads and writes values by path of the data type', () => {
    const form = {} as FormHandle<Order, Intent>

    expectTypeOf(form.getFieldValue('address.zip')).toEqualTypeOf<string>()
    form.setFieldValue('email', 'ada@example.com')
    form.pushFieldValue('items', { sku: 'A-1' })
    // @ts-expect-error an order has no `adress`
    form.getFieldValue('adress.zip')
    // @ts-expect-error the email is a string
    form.setFieldValue('email', 42)
  })

  it('submits with the submit meta of its form only', () => {
    const form = {} as FormHandle<Order, Intent>

    form.handleSubmit()
    form.handleSubmit({ intent: 'publish' })
    // @ts-expect-error the intent is save or publish
    form.handleSubmit({ intent: 'delete' })
  })

  it('reads the values of its data type from the state', () => {
    expectTypeOf<FormHandle<Order, Intent>['state']['values']>().toEqualTypeOf<Order>()
  })
})
