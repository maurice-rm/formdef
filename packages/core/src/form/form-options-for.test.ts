import type { AnyFieldApi, AnyFormApi } from '@tanstack/react-form'
import { act, cleanup } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { z } from 'zod'

import type { Validation } from '../config/validation'
import { mountField } from '../widget/mount-field.test-support'
import { formOptionsFor } from './form-options-for'

const schema = z.object({ email: z.email('Enter an email'), name: z.string() })

const DEFAULT_VALUES = { email: '', name: 'Ada' }

const VALID_EMAIL = 'ada@example.com'

type SignUpConfig = {
  validation?: Validation
  validators?: readonly unknown[]
  listeners?: readonly unknown[]
  onSubmit?: () => void
}

const configWith = (rest: SignUpConfig = {}): Record<string, unknown> => ({
  schema,
  defaultValues: DEFAULT_VALUES,
  fields: { email: { widget: 'text' } },
  layout: ['email'],
  ...rest,
})

type Mounted = { form: AnyFormApi; email: AnyFieldApi; errors: () => unknown[] }

const mountForm = (options: Record<string, unknown>): Mounted => {
  const { form, field } = mountField({ formOptions: options })
  const email = field()

  return { form, email, errors: (): unknown[] => email.meta.errors }
}

const mountMode = (mode: NonNullable<Validation['mode']>): Mounted =>
  mountForm(formOptionsFor({ config: configWith({ validation: { mode } }), options: undefined }))

const schemaValidatorOf = (options: Record<string, unknown>): unknown =>
  (options.validators as readonly unknown[]).at(-1)

afterEach(cleanup)

describe('formOptionsFor', () => {
  it("passes TanStack's form options on and leaves formdef's own keys out", () => {
    const onSubmit = vi.fn()
    const options = formOptionsFor({
      config: { ...configWith({ onSubmit }), stepper: { props: { variant: 'rail' } } },
      options: undefined,
    })

    expect(options.defaultValues).toBe(DEFAULT_VALUES)
    expect(options.onSubmit).toBe(onSubmit)
    for (const key of ['schema', 'fields', 'layout', 'validation', 'stepper']) {
      expect(options).not.toHaveProperty(key)
    }
  })

  it("lets the instance's options win key by key", () => {
    const onSubmit = vi.fn()
    const defaultValues = { email: VALID_EMAIL, name: 'Grace' }
    const options = formOptionsFor({
      config: configWith({ onSubmit: vi.fn() }),
      options: { defaultValues, onSubmit },
    })

    expect(options.defaultValues).toBe(defaultValues)
    expect(options.onSubmit).toBe(onSubmit)
  })

  it('treats a key the instance sets to undefined as unset', () => {
    const onSubmit = vi.fn()
    const options = formOptionsFor({
      config: configWith({ onSubmit }),
      options: { defaultValues: undefined, onSubmit: undefined },
    })

    expect(options.defaultValues).toBe(DEFAULT_VALUES)
    expect(options.onSubmit).toBe(onSubmit)
  })

  it("runs the config's validators, then the instance's, then the schema", () => {
    const own = { run: vi.fn(), triggers: ['blur'] }
    const instance = { run: vi.fn(), triggers: ['change'] }
    const options = formOptionsFor({
      config: configWith({ validators: [own] }),
      options: { validators: [instance] },
    })

    expect(options.validators).toEqual([own, instance, expect.objectContaining({ run: schema })])
  })

  it("keeps the listeners of both, the config's first", () => {
    const fromConfig = { onChange: vi.fn() }
    const fromInstance = { onSubmit: vi.fn() }
    const options = formOptionsFor({
      config: configWith({ listeners: [fromConfig] }),
      options: { listeners: [fromInstance] },
    })

    expect(options.listeners).toEqual([fromConfig, fromInstance])
  })

  it('hands the debounce of an asynchronous schema to its validator', () => {
    const options = formOptionsFor({
      config: configWith({ validation: { mode: 'onChange', async: true, asyncDebounceMs: 300 } }),
      options: undefined,
    })

    expect(schemaValidatorOf(options)).toMatchObject({ run: schema, triggerDebounceMs: 300 })
  })
})

describe('the validation modes', () => {
  it('revalidate runs the schema on submit, then on every change', async () => {
    const { form, email, errors } = mountMode('revalidate')

    act(() => email.handleChange('ada'))
    act(() => email.handleBlur())
    expect(errors()).toEqual([])

    await act(async () => {
      await form.handleSubmit()
    })
    expect(errors()).toHaveLength(1)

    act(() => email.handleChange(VALID_EMAIL))
    expect(errors()).toEqual([])
  })

  it('revalidate is the default', async () => {
    const { form, email, errors } = mountForm(
      formOptionsFor({ config: configWith(), options: undefined }),
    )

    act(() => email.handleChange('ada'))
    expect(errors()).toEqual([])

    await act(async () => {
      await form.handleSubmit()
    })
    expect(errors()).toHaveLength(1)
  })

  it('blurThenChange runs the schema when a field is left, then on every change while invalid', () => {
    const { email, errors } = mountMode('blurThenChange')

    act(() => email.handleChange('ada'))
    expect(errors()).toEqual([])

    act(() => email.handleBlur())
    expect(errors()).toHaveLength(1)

    act(() => email.handleChange(VALID_EMAIL))
    expect(errors()).toEqual([])

    act(() => email.handleChange('ada'))
    expect(errors()).toEqual([])
  })

  it('blurThenChange runs the schema on submit', async () => {
    const { form, errors } = mountMode('blurThenChange')

    await act(async () => {
      await form.handleSubmit()
    })

    expect(errors()).toHaveLength(1)
  })

  it('onChange runs the schema on every change', () => {
    const { email, errors } = mountMode('onChange')

    act(() => email.handleChange('ada'))

    expect(errors()).toHaveLength(1)
  })

  it('onBlur runs the schema when a field is left, not on a change', () => {
    const { email, errors } = mountMode('onBlur')

    act(() => email.handleChange('ada'))
    expect(errors()).toEqual([])

    act(() => email.handleBlur())
    expect(errors()).toHaveLength(1)
  })

  it('onSubmit runs the schema on submit only', async () => {
    const { form, email, errors } = mountMode('onSubmit')

    act(() => email.handleChange('ada'))
    act(() => email.handleBlur())
    expect(errors()).toEqual([])

    await act(async () => {
      await form.handleSubmit()
    })
    expect(errors()).toHaveLength(1)
  })
})
