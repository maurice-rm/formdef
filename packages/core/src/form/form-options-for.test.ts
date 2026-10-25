import { FieldApi, FormApi } from '@tanstack/react-form'
import { describe, expect, it, vi } from 'vitest'
import { z } from 'zod'

import type { Validation } from '../config/validation'
import { formOptionsFor } from './form-options-for'

const schema = z.object({ email: z.email('Enter an email'), name: z.string() })

const DEFAULT_VALUES = { email: '', name: 'Ada' }

const VALID_EMAIL = 'ada@example.com'

type SignUpConfig = {
  validation?: Validation
  validators?: Record<string, unknown>
  listeners?: Record<string, unknown>
  asyncDebounceMs?: number
  onSubmit?: () => void
}

const configWith = (rest: SignUpConfig = {}): Record<string, unknown> => ({
  schema,
  defaultValues: DEFAULT_VALUES,
  fields: { email: { widget: 'text' } },
  layout: ['email'],
  ...rest,
})

const mountForm = (options: Record<string, unknown>) => {
  const form = new FormApi(options as ConstructorParameters<typeof FormApi>[0])
  const email = new FieldApi({ form, name: 'email' })
  form.mount()
  email.mount()

  return { form, email, errors: (): unknown[] => email.state.meta.errors }
}

const mountMode = (mode: NonNullable<Validation['mode']>) =>
  mountForm(formOptionsFor({ config: configWith({ validation: { mode } }), options: undefined }))

describe('formOptionsFor', () => {
  it("passes TanStack's form options on and leaves formdef's own keys out", () => {
    const onSubmit = vi.fn()
    const options = formOptionsFor({ config: configWith({ onSubmit }), options: undefined })

    expect(options.defaultValues).toBe(DEFAULT_VALUES)
    expect(options.onSubmit).toBe(onSubmit)
    for (const key of ['schema', 'fields', 'layout', 'validation']) {
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

  it('treats a key or slot the instance sets to undefined as unset', () => {
    const onSubmit = vi.fn()
    const onBlur = vi.fn()
    const onChange = vi.fn()
    const options = formOptionsFor({
      config: configWith({ onSubmit, validators: { onBlur }, listeners: { onChange } }),
      options: {
        defaultValues: undefined,
        onSubmit: undefined,
        validators: { onBlur: undefined },
        listeners: { onChange: undefined },
      },
    })

    expect(options.defaultValues).toBe(DEFAULT_VALUES)
    expect(options.onSubmit).toBe(onSubmit)
    expect(options.validators).toEqual({ onBlur, onDynamic: schema })
    expect(options.listeners).toEqual({ onChange })
  })

  it("merges validators slot by slot, so the instance keeps the schema and the config's", () => {
    const onBlur = vi.fn()
    const onSubmitAsync = vi.fn()
    const options = formOptionsFor({
      config: configWith({ validators: { onBlur } }),
      options: { validators: { onSubmitAsync } },
    })

    expect(options.validators).toEqual({ onBlur, onSubmitAsync, onDynamic: schema })
  })

  it('merges listeners slot by slot, so neither side drops the other', () => {
    const onChange = vi.fn()
    const onSubmit = vi.fn()
    const options = formOptionsFor({
      config: configWith({ listeners: { onChange } }),
      options: { listeners: { onSubmit } },
    })

    expect(options.listeners).toEqual({ onChange, onSubmit })
  })

  it('leaves the slot the mode picks to a validator the caller placed there', () => {
    const own = vi.fn()
    const fromConfig = formOptionsFor({
      config: configWith({ validation: { mode: 'onBlur' }, validators: { onBlur: own } }),
      options: undefined,
    })
    const fromInstance = formOptionsFor({
      config: configWith({ validation: { mode: 'onBlur' } }),
      options: { validators: { onBlur: own } },
    })

    expect(fromConfig.validators).toEqual({ onBlur: own })
    expect(fromInstance.validators).toEqual({ onBlur: own })
  })

  it.each([
    ['revalidate', 'onDynamicAsync'],
    ['blurThenChange', 'onDynamicAsync'],
    ['onChange', 'onChangeAsync'],
    ['onBlur', 'onBlurAsync'],
    ['onSubmit', 'onSubmitAsync'],
  ] as const)('places an asynchronous schema of mode %s in %s', (mode, slot) => {
    const options = formOptionsFor({
      config: configWith({ validation: { mode, async: true } }),
      options: undefined,
    })

    expect(options.validators).toEqual({ [slot]: schema })
  })

  it('hands the debounce of an asynchronous schema to the form', () => {
    const options = formOptionsFor({
      config: configWith({ validation: { mode: 'onChange', async: true, asyncDebounceMs: 300 } }),
      options: undefined,
    })

    expect(options.asyncDebounceMs).toBe(300)
  })

  it("lets the form's own debounce win over the schema's", () => {
    const options = formOptionsFor({
      config: configWith({
        validation: { mode: 'onChange', async: true, asyncDebounceMs: 300 },
        asyncDebounceMs: 100,
      }),
      options: undefined,
    })

    expect(options.asyncDebounceMs).toBe(100)
  })
})

describe('the validation modes', () => {
  it('revalidate runs the schema on submit, then on every change', async () => {
    const { form, email, errors } = mountMode('revalidate')

    email.handleChange('ada')
    email.handleBlur()
    expect(errors()).toEqual([])

    await form.handleSubmit()
    expect(errors()).toHaveLength(1)

    email.handleChange(VALID_EMAIL)
    expect(errors()).toEqual([])
  })

  it('revalidate is the default', async () => {
    const { form, email, errors } = mountForm(
      formOptionsFor({ config: configWith(), options: undefined }),
    )

    email.handleChange('ada')
    expect(errors()).toEqual([])

    await form.handleSubmit()
    expect(errors()).toHaveLength(1)
  })

  it('blurThenChange runs the schema when a field is left, then on every change while invalid', () => {
    const { email, errors } = mountMode('blurThenChange')

    email.handleChange('ada')
    expect(errors()).toEqual([])

    email.handleBlur()
    expect(errors()).toHaveLength(1)

    email.handleChange(VALID_EMAIL)
    expect(errors()).toEqual([])

    email.handleChange('ada')
    expect(errors()).toEqual([])
  })

  it('blurThenChange runs the schema on submit', async () => {
    const { form, errors } = mountMode('blurThenChange')

    await form.handleSubmit()

    expect(errors()).toHaveLength(1)
  })

  it('onChange runs the schema on every change', () => {
    const { email, errors } = mountMode('onChange')

    email.handleChange('ada')

    expect(errors()).toHaveLength(1)
  })

  it('onBlur runs the schema when a field is left, not on a change', () => {
    const { email, errors } = mountMode('onBlur')

    email.handleChange('ada')
    expect(errors()).toEqual([])

    email.handleBlur()
    expect(errors()).toHaveLength(1)
  })

  it('onSubmit runs the schema on submit only', async () => {
    const { form, email, errors } = mountMode('onSubmit')

    email.handleChange('ada')
    email.handleBlur()
    expect(errors()).toEqual([])

    await form.handleSubmit()
    expect(errors()).toHaveLength(1)
  })
})
