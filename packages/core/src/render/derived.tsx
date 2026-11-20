import { getBy } from '@tanstack/react-form'
import { type ReactNode, useRef } from 'react'

import type { EntryPlace } from '../config/entry-place'
import type { RenderForm } from './render-form'

/** What an entry reads from the form values: its condition, its props and the paths they read. */
type DerivedEntry = {
  visibleWhen?: unknown
  props?: unknown
  dependsOn?: unknown
}

/** Where an entry renders: its path, and the path of the innermost array item it belongs to. */
type Place = {
  path: string
  itemPath: string | undefined
}

type DerivedProps = {
  form: RenderForm
  entry: DerivedEntry
  place: Place
  /** Builds the entry from its props; called only while the entry is visible. */
  children: (props: object | undefined) => ReactNode
}

type LastRead = {
  entry: DerivedEntry
  dependencies: unknown[]
  selected: unknown
}

type Read = (values: unknown, at: EntryPlace) => unknown

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

const placeIn = (values: unknown, { path, itemPath }: Place): EntryPlace => ({
  path,
  item: itemPath === undefined ? undefined : getBy(values, itemPath),
})

// An entry inside an array item reads the item, so it reads again when the item changes.
const dependenciesOf = (values: unknown, dependsOn: readonly string[], place: Place) => [
  ...dependsOn.map((path) => getBy(values, path)),
  ...(place.itemPath === undefined ? [] : [getBy(values, place.itemPath)]),
]

/**
 * Renders an entry from what it reads from the form values. An entry with a condition or derived
 * props subscribes to the values; the selected result alone decides whether it re-renders: whether
 * it is shown for a condition, the values for derived props. Both receive where the entry renders:
 * its path and the value of the innermost array item it belongs to. `dependsOn` narrows when the
 * selector reads again, never what it returns; inside an item, a change of the item reads again
 * too. A hidden entry is never built.
 */
export const Derived = ({ form, entry, place, children }: DerivedProps): ReactNode => {
  const lastRead = useRef<LastRead | undefined>(undefined)
  const { visibleWhen, props, dependsOn } = entry
  const isConditional = typeof visibleWhen === 'function'
  const isDerived = typeof props === 'function'

  if (!(isConditional || isDerived)) {
    return children(propsOf(props))
  }

  const selectFrom = (values: unknown): unknown => {
    if (isConditional && !(visibleWhen as Read)(values, placeIn(values, place))) {
      return HIDDEN
    }

    return isDerived ? values : VISIBLE
  }

  const select = ({ values }: { values: unknown }): unknown => {
    if (!Array.isArray(dependsOn)) {
      return selectFrom(values)
    }

    const dependencies = dependenciesOf(values, dependsOn, place)
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

        return children(
          propsOf(isDerived ? (props as Read)(selected, placeIn(selected, place)) : props),
        )
      }}
    </form.Subscribe>
  )
}
