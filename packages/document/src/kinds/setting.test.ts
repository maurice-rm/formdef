import { describe, expect, it } from 'vitest'

import { setting } from './setting'

describe('setting', () => {
  it('describes a setting as data a builder renders its settings panel from', () => {
    expect(setting.text({ label: 'Unit', required: true, varies: true })).toEqual({
      type: 'text',
      label: 'Unit',
      required: true,
      varies: true,
    })
    expect(setting.number({ label: 'Minimum', integer: true })).toEqual({
      type: 'number',
      label: 'Minimum',
      required: false,
      varies: false,
      integer: true,
    })
  })

  it('marks a text setting written in limited Markdown as formatted', () => {
    expect(setting.text({ label: 'Text', formatted: true })).toEqual({
      type: 'text',
      label: 'Text',
      required: false,
      varies: false,
      formatted: true,
    })
  })

  it('defaults to optional and not varying', () => {
    expect(setting.boolean({ label: 'Several lines' })).toEqual({
      type: 'boolean',
      label: 'Several lines',
      required: false,
      varies: false,
    })
  })

  it('keeps a description and the constraints a builder enforces', () => {
    expect(
      setting.text({
        label: 'Placeholder',
        description: 'Shown inside the empty field',
        maxLength: 80,
      }),
    ).toEqual({
      type: 'text',
      label: 'Placeholder',
      description: 'Shown inside the empty field',
      required: false,
      varies: false,
      maxLength: 80,
    })
    expect(setting.options({ label: 'Choices', minCount: 2 })).toEqual({
      type: 'options',
      label: 'Choices',
      required: true,
      varies: false,
      minCount: 2,
    })
    expect(setting.date({ label: 'Earliest' })).toEqual({
      type: 'date',
      label: 'Earliest',
      required: false,
      varies: false,
    })
  })

  it('describes one option of the field, and several', () => {
    expect(setting.option({ label: 'Option', required: true })).toEqual({
      type: 'option',
      label: 'Option',
      required: true,
      varies: false,
    })
    expect(setting.optionList({ label: 'Options' })).toEqual({
      type: 'optionList',
      label: 'Options',
      required: false,
      varies: false,
    })
  })
})
