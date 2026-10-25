import { getBy } from '@tanstack/react-form'
import { type ReactNode, useRef } from 'react'

import type { RenderForm } from './render-form'

/** What an entry reads from the form values: its condition, its props and the paths they read. */
type DerivedEntry = {
  visibleWhen?: unknown
  props?: unknown
  dependsOn?: unknown
}

type DerivedProps = {
  form: RenderForm
  entry: DerivedEntry
  /** Builds the entry from its props; called only while the entry is visible. */
  children: (props: object | undefined) => ReactNode
}

type LastRead = {
  entry: DerivedEntry
  dependencies: unknown[]
  selected: unknown
}

const HIDDEN = Symbol('hidden')
const VISIBLE = Symbol('visible')

const propsOf = (props: unknown): object | undefined =>
  typeof props === 'object' && props !== null ? props : undefined

const isStale = (
  last: LastRead | undefined,
  entry: DerivedEntry,
  dependencies: unknown[],
): boolean =>
  last === undefined ||
  last.entry !== entry ||
  dependencies.some((value, index) => !Object.is(value, last.dependencies[index]))

/**
 * Renders an entry from what it reads from the form values. An entry with a condition or derived
 * props subscribes to the values; the selected result alone decides whether it re-renders: whether
 * it is shown for a condition, the values for derived props. `dependsOn` narrows when the selector
 * reads again, never what it returns. A hidden entry is never built.
 */
export const Derived = ({ form, entry, children }: DerivedProps): ReactNode => {
  const lastRead = useRef<LastRead | undefined>(undefined)
  const { visibleWhen, props, dependsOn } = entry
  const isConditional = typeof visibleWhen === 'function'
  const isDerived = typeof props === 'function'

  if (!(isConditional || isDerived)) {
    return children(propsOf(props))
  }

  const selectFrom = (values: unknown): unknown => {
    if (isConditional && !visibleWhen(values)) {
      return HIDDEN
    }

    return isDerived ? values : VISIBLE
  }

  const select = ({ values }: { values: unknown }): unknown => {
    if (!Array.isArray(dependsOn)) {
      return selectFrom(values)
    }

    const dependencies = dependsOn.map((path: string) => getBy(values, path))
    if (isStale(lastRead.current, entry, dependencies)) {
      lastRead.current = { entry, dependencies, selected: selectFrom(values) }
    }

    return lastRead.current?.selected
  }

  return (
    <form.Subscribe selector={select}>
      {(selected) => {
        if (selected === HIDDEN) {
          return null
        }

        return children(propsOf(isDerived ? props(selected) : props))
      }}
    </form.Subscribe>
  )
}
