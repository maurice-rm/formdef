import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { z } from 'zod'

import { findRequiredPaths } from './find-required-paths'

const TextField = (): ReactNode => null
TextField.emptyValue = ''
const NumberField = (): ReactNode => null
NumberField.emptyValue = undefined
const CheckboxField = (): ReactNode => null
CheckboxField.emptyValue = false
const TagsField = (): ReactNode => null
TagsField.emptyValue = [] as string[]
const RangeField = (): ReactNode => null
RangeField.emptyValue = {}
const PlainField = (): ReactNode => null

const widgets = {
  text: TextField,
  number: NumberField,
  checkbox: CheckboxField,
  tags: TagsField,
  range: RangeField,
  plain: PlainField,
}

const text = { widget: 'text' }

const pathsOf = (schema: unknown, fields: Record<string, object>): readonly string[] => {
  const result = findRequiredPaths({ schema, validatesAsync: false, fields, widgets })
  if (!('paths' in result)) {
    throw new Error(result.problem)
  }

  return [...result.paths].sort()
}

describe('findRequiredPaths', () => {
  it('finds the leaves whose empty value the schema rejects, among those that declare one', () => {
    const schema = z.object({
      name: z.string().min(1),
      nickname: z.string(),
      email: z.email(),
      age: z.number(),
      count: z.number().optional(),
      terms: z.literal(true),
      newsletter: z.boolean(),
      tags: z.array(z.string()).min(1),
      title: z.string().min(1),
    })

    expect(
      pathsOf(schema, {
        name: text,
        nickname: text,
        email: text,
        age: { widget: 'number' },
        count: { widget: 'number' },
        terms: { widget: 'checkbox' },
        newsletter: { widget: 'checkbox' },
        tags: { widget: 'tags' },
        title: { widget: 'plain' },
      }),
    ).toEqual(['age', 'email', 'name', 'tags', 'terms'])
  })

  it('finds the leaves of nested levels, also inside an optional object', () => {
    const schema = z.object({
      billing: z.object({ street: z.string().min(1), note: z.string() }),
      shipping: z.object({ street: z.string().min(1) }).optional(),
    })

    expect(
      pathsOf(schema, {
        billing: { fields: { street: text, note: text } },
        shipping: { fields: { street: text } },
      }),
    ).toEqual(['billing.street', 'shipping.street'])
  })

  it("finds the leaves of an array's items once, for every item", () => {
    const schema = z.object({
      contacts: z.array(z.object({ name: z.string().min(1), note: z.string() })),
      emails: z.array(z.email()),
    })

    expect(
      pathsOf(schema, {
        contacts: { item: { fields: { name: text, note: text } } },
        emails: { item: text },
      }),
    ).toEqual(['contacts[].name', 'emails[]'])
  })

  it('counts an issue inside the value of a leaf for that leaf', () => {
    const schema = z.object({
      stay: z.object({ from: z.iso.date(), to: z.iso.date() }),
      window: z.object({ from: z.iso.date().optional(), to: z.iso.date().optional() }),
      stays: z.array(z.object({ from: z.iso.date(), to: z.iso.date() })),
    })

    expect(
      pathsOf(schema, {
        stay: { widget: 'range' },
        window: { widget: 'range' },
        stays: { item: { widget: 'range' } },
      }),
    ).toEqual(['stay', 'stays[]'])
  })

  it('leaves a rule across fields unmarked', () => {
    const schema = z
      .object({ password: z.string().min(8), repeat: z.string() })
      .refine((values) => values.password === values.repeat, { path: ['repeat'] })

    expect(pathsOf(schema, { password: text, repeat: text })).toEqual(['password'])
  })

  it('does not run a schema the config validates asynchronously', () => {
    const isAvailable = vi.fn(async () => true)
    const schema = z.object({ name: z.string().min(1).refine(isAvailable) })

    expect(
      findRequiredPaths({ schema, validatesAsync: true, fields: { name: text }, widgets }),
    ).toEqual({
      problem:
        'formdef: the schema validates asynchronously, so no field is found to be required; pass required in props.',
    })
    expect(isAvailable).not.toHaveBeenCalled()
  })

  it('reports a schema that does not validate the empty values synchronously', () => {
    const schema = z.object({ name: z.string().min(1) }).refine(async () => true)

    expect(
      findRequiredPaths({ schema, validatesAsync: false, fields: { name: text }, widgets }),
    ).toEqual({
      problem:
        'formdef: the schema did not validate empty values synchronously, so no field is found to be required; pass required in props.',
    })
  })

  it('leaves no unhandled rejection when the schema rejects the empty values', async () => {
    const unhandled = vi.fn()
    process.on('unhandledRejection', unhandled)
    const schema = {
      '~standard': {
        version: 1,
        vendor: 'test',
        validate: (): Promise<never> => Promise.reject(new Error('cannot read the address')),
      },
    }

    findRequiredPaths({ schema, validatesAsync: false, fields: { name: text }, widgets })
    await new Promise((resolve) => setTimeout(resolve, 0))
    process.off('unhandledRejection', unhandled)

    expect(unhandled).not.toHaveBeenCalled()
  })

  it('reports a schema that throws on the empty values', () => {
    const schema = {
      '~standard': {
        version: 1,
        vendor: 'test',
        validate: (): never => {
          throw new Error('cannot read the address')
        },
      },
    }

    expect(
      findRequiredPaths({ schema, validatesAsync: false, fields: { name: text }, widgets }),
    ).toEqual({
      problem:
        'formdef: the schema threw on empty values, so no field is found to be required: cannot read the address',
    })
  })
})
