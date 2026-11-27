import { type ReactNode, useRef } from 'react'

import type { EntryPlace } from '../config/entry-place'
import type { RenderForm } from './render-form'
import { valueAt } from './value-at'

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

/** A form, or a field group, whose atom holds its values and which has no `state`. */
type DerivedForm = Pick<RenderForm, 'Subscribe'> & { atom?: { get: () => unknown } }

type DerivedProps = {
  form: DerivedForm
  entry: DerivedEntry
  place: Place
  /** Builds the entry from its props; called only while the entry is visible. */
  children: (props: object | undefined) => ReactNode
}

/** What was read last, for which entry, where and from which values of its `dependsOn`. */
type LastRead = {
  entry: DerivedEntry
  path: string
  dependencies: unknown[]
  selected: unknown
}

type Read = (values: unknown, at: EntryPlace) => unknown

const HIDDEN = Symbol('hidden')
const VISIBLE = Symbol('visible')

const propsOf = (props: unknown): object | undefined =>
  typeof props === 'object' && props !== null ? props : undefined

// An item moved by its `itemKey` keeps its entry, but renders at another path.
const isStale = (
  last: LastRead | undefined,
  { entry, path, dependencies }: Omit<LastRead, 'selected'>,
): boolean =>
  last === undefined ||
  last.entry !== entry ||
  last.path !== path ||
  dependencies.some((value, index) => !Object.is(value, last.dependencies[index]))

const placeIn = (values: unknown, { path, itemPath }: Place): EntryPlace => ({
  path,
  item: itemPath === undefined ? undefined : valueAt(values, itemPath),
})

/**
 * Renders an entry from what it reads from the form values. An entry with a condition or derived
 * props subscribes to the values; the selected result alone decides whether it re-renders: whether
 * it is shown for a condition, the values for derived props. Both receive where the entry renders:
 * its path and the value of the innermost array item it belongs to. `dependsOn` narrows when the
 * selector reads again, never what it returns; an entry that reads its item names the array in
 * it. A hidden entry is never built.
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

  // A field group's `Subscribe` hands out the state of its form; the group's values sit in its atom.
  const select = (state: { values: unknown }): unknown => {
    const values = 'state' in form ? state.values : form.atom?.get()
    if (!Array.isArray(dependsOn)) {
      return selectFrom(values)
    }

    const dependencies = dependsOn.map((path) => valueAt(values, path))
    const read = { entry, path: place.path, dependencies }
    if (isStale(lastRead.current, read)) {
      lastRead.current = { ...read, selected: selectFrom(values) }
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
