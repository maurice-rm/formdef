import { type AnyFormApi, createFormHook, createFormHookContexts } from '@tanstack/react-form'
import { act, cleanup, render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { Derived } from './derived'

const { fieldContext, formContext } = createFormHookContexts()

const { useAppForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: {},
  formComponents: {},
})

type Shipping = { email: string; express: boolean; country: string }

const DEFAULT_VALUES: Shipping = { email: 'ada@example.com', express: false, country: 'DE' }

type ProbeProps = {
  entry: object
  renderEntry: (props: object | undefined) => ReactNode
}

let form: AnyFormApi | undefined

const Probe = ({ entry, renderEntry }: ProbeProps): ReactNode => {
  const instance = useAppForm({ defaultValues: DEFAULT_VALUES })
  form = instance

  return (
    <Derived form={instance} entry={entry}>
      {renderEntry}
    </Derived>
  )
}

const setValue = (path: keyof Shipping, value: unknown): void => {
  act(() => {
    form?.setFieldValue(path, value)
  })
}

const isExpress = (values: Shipping): boolean => values.express

const showProps = (props: object | undefined): ReactNode => <output>{JSON.stringify(props)}</output>

afterEach(() => {
  cleanup()
  form = undefined
})

describe('Derived', () => {
  it('renders an entry without a condition or derived props once, with its props', () => {
    const renderEntry = vi.fn(showProps)
    render(<Probe entry={{ props: { label: 'Email' } }} renderEntry={renderEntry} />)

    setValue('email', 'grace@example.com')

    expect(screen.getByRole('status').textContent).toBe('{"label":"Email"}')
    expect(renderEntry).toHaveBeenCalledTimes(1)
  })

  it('renders an entry only while its condition holds', () => {
    render(<Probe entry={{ visibleWhen: isExpress }} renderEntry={() => <output>shown</output>} />)
    expect(screen.queryByRole('status')).toBeNull()

    setValue('express', true)
    expect(screen.getByRole('status').textContent).toBe('shown')

    setValue('express', false)
    expect(screen.queryByRole('status')).toBeNull()
  })

  it('never builds a hidden entry', () => {
    const renderEntry = vi.fn(showProps)
    render(<Probe entry={{ visibleWhen: isExpress }} renderEntry={renderEntry} />)

    setValue('email', 'grace@example.com')

    expect(renderEntry).not.toHaveBeenCalled()
  })

  it('re-renders a conditional entry only when its condition flips', () => {
    const renderEntry = vi.fn(showProps)
    render(<Probe entry={{ visibleWhen: () => true }} renderEntry={renderEntry} />)

    setValue('email', 'grace@example.com')
    setValue('country', 'AT')

    expect(renderEntry).toHaveBeenCalledTimes(1)
  })

  it('derives props from the values and re-renders on every change without dependsOn', () => {
    const renderEntry = vi.fn(showProps)
    render(
      <Probe
        entry={{ props: (values: Shipping) => ({ label: `To ${values.country}` }) }}
        renderEntry={renderEntry}
      />,
    )

    setValue('country', 'AT')
    expect(screen.getByRole('status').textContent).toBe('{"label":"To AT"}')

    setValue('email', 'grace@example.com')
    expect(renderEntry).toHaveBeenCalledTimes(3)
  })

  it('re-renders derived props only when a path in dependsOn changes', () => {
    const renderEntry = vi.fn(showProps)
    render(
      <Probe
        entry={{
          props: (values: Shipping) => ({ label: `To ${values.country}` }),
          dependsOn: ['country'],
        }}
        renderEntry={renderEntry}
      />,
    )

    setValue('email', 'grace@example.com')
    expect(renderEntry).toHaveBeenCalledTimes(1)

    setValue('country', 'AT')
    expect(renderEntry).toHaveBeenCalledTimes(2)
    expect(screen.getByRole('status').textContent).toBe('{"label":"To AT"}')
  })

  it('reads a condition again only when a path in dependsOn changes', () => {
    const visibleWhen = vi.fn(isExpress)
    render(<Probe entry={{ visibleWhen, dependsOn: ['express'] }} renderEntry={() => 'shown'} />)
    const callsAfterMount = visibleWhen.mock.calls.length

    setValue('email', 'grace@example.com')
    expect(visibleWhen).toHaveBeenCalledTimes(callsAfterMount)

    setValue('express', true)
    expect(visibleWhen.mock.calls.length).toBeGreaterThan(callsAfterMount)
  })

  it('reads a new entry at once, even when its dependsOn values are unchanged', () => {
    const { rerender } = render(
      <Probe
        entry={{ visibleWhen: () => true, dependsOn: ['express'] }}
        renderEntry={() => 'shown'}
      />,
    )

    rerender(
      <Probe
        entry={{ visibleWhen: () => false, dependsOn: ['express'] }}
        renderEntry={() => 'shown'}
      />,
    )

    expect(screen.queryByText('shown')).toBeNull()
  })
})
