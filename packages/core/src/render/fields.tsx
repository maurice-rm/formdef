import type { AnyFieldApi } from '@tanstack/react-form'
import type { ComponentType, ReactNode } from 'react'

import { byName } from './by-name'
import { childPath } from './child-path'
import { splitEntry } from './split-entry'

// biome-ignore lint/suspicious/noExplicitAny: widgets take props of their own; the config types check them.
type AnyProps = any

type AppFieldProps = Record<string, unknown> & {
  name: string
  children: (field: AnyFieldApi) => ReactNode
}

/** The part of a TanStack form that renders fields: `AppField` of `useAppForm`'s result. */
type RenderForm = {
  AppField: ComponentType<AppFieldProps>
}

/** The maps of a registry the renderer looks names up in. */
type RenderParts = {
  widgets: Readonly<Record<string, ComponentType<AnyProps>>>
}

/** The props of {@link Fields}. */
export type FieldsProps = {
  parts: RenderParts
  form: RenderForm
  fields: Readonly<Record<string, object>>
}

type LevelProps = FieldsProps & {
  path: string | undefined
}

type EntryProps = Omit<FieldsProps, 'fields'> & {
  entry: object
  path: string
}

const renderNothing = (): ReactNode => null

const Entry = ({ parts, form, entry, path }: EntryProps): ReactNode => {
  const { own, fieldOptions } = splitEntry(entry)

  if (typeof own.widget === 'string') {
    const Widget = byName(parts.widgets, own.widget)
    if (Widget === undefined) {
      throw new Error(`formdef: field "${path}" names the unregistered widget "${own.widget}".`)
    }
    const props = typeof own.props === 'object' ? own.props : undefined

    return (
      <form.AppField {...fieldOptions} name={path}>
        {(field) => <Widget {...props} field={field} />}
      </form.AppField>
    )
  }

  if (typeof own.render === 'function') {
    return (
      <form.AppField {...fieldOptions} name={path}>
        {own.render as AppFieldProps['children']}
      </form.AppField>
    )
  }

  if (typeof own.fields !== 'object' || own.fields === null) {
    return null
  }

  return (
    <>
      {Object.keys(fieldOptions).length > 0 && (
        <form.AppField {...fieldOptions} name={path}>
          {renderNothing}
        </form.AppField>
      )}
      <Level parts={parts} form={form} fields={own.fields as FieldsProps['fields']} path={path} />
    </>
  )
}

const Level = ({ parts, form, fields, path }: LevelProps): ReactNode =>
  Object.entries(fields).map(([key, entry]) => {
    const entryPath = childPath(path, key)

    return <Entry key={entryPath} parts={parts} form={form} entry={entry} path={entryPath} />
  })

/**
 * Renders the field entries of a level with the widgets of `parts`, in the order `fields`
 * declares them: a leaf as its widget, an object as its own level, a custom entry through its
 * `render`. An object entry with TanStack options of its own also mounts a field at its path, so
 * its validators run.
 */
export const Fields = ({ parts, form, fields }: FieldsProps): ReactNode => (
  <Level parts={parts} form={form} fields={fields} path={undefined} />
)
