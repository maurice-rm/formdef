import type { ComponentType, ReactNode } from 'react'

import { byName } from './by-name'
import { childPath } from './child-path'
import { Derived } from './derived'
import type { AppFieldProps, RenderForm } from './render-form'
import { splitEntry } from './split-entry'

// biome-ignore lint/suspicious/noExplicitAny: registered components take props of their own; the config types check them.
type AnyProps = any

type ComponentMap = Readonly<Record<string, ComponentType<AnyProps>>>

/** The maps of a registry the renderer looks names up in. */
type RenderParts = {
  widgets: ComponentMap
  formComponents: ComponentMap
  structure: {
    section?: ComponentType<AnyProps>
    row?: ComponentType<AnyProps>
  }
}

type LevelFields = Readonly<Record<string, object>>

type LayoutNodeEntry = string | Readonly<Record<string, unknown>>

/** The props of {@link Fields}. */
export type FieldsProps = {
  parts: RenderParts
  form: RenderForm
  fields: LevelFields
  layout?: readonly unknown[] | undefined
}

type Level = Omit<FieldsProps, 'layout'> & {
  path: string | undefined
}

type LevelProps = Level & {
  layout: readonly unknown[] | undefined
}

type EntryProps = Omit<Level, 'fields'> & {
  entry: object
  path: string
}

type FieldContentProps = Omit<EntryProps, 'entry'> & {
  entry: ReturnType<typeof splitEntry>
  props: object | undefined
}

type LayoutNodeProps = {
  level: Level
  entry: LayoutNodeEntry
}

type LayoutKindProps = {
  level: Level
  entry: Readonly<Record<string, unknown>>
  props: object | undefined
}

const renderNothing = (): ReactNode => null

const layoutOwner = (path: string | undefined): string =>
  path === undefined ? 'the form' : `"${path}"`

const FieldContent = ({ parts, form, entry, path, props }: FieldContentProps): ReactNode => {
  const { own, fieldOptions } = entry

  if (typeof own.widget === 'string') {
    const Widget = byName(parts.widgets, own.widget)
    if (Widget === undefined) {
      throw new Error(`formdef: field "${path}" names the unregistered widget "${own.widget}".`)
    }

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
      <LevelEntries
        parts={parts}
        form={form}
        fields={own.fields as LevelFields}
        layout={Array.isArray(own.layout) ? own.layout : undefined}
        path={path}
      />
    </>
  )
}

const Entry = ({ parts, form, entry, path }: EntryProps): ReactNode => {
  const split = splitEntry(entry)

  return (
    <Derived form={form} entry={split.own}>
      {(props) => (
        <FieldContent parts={parts} form={form} entry={split} path={path} props={props} />
      )}
    </Derived>
  )
}

const FieldNode = ({ level, name }: { level: Level; name: string }): ReactNode => {
  const entry = byName(level.fields, name)
  if (entry === undefined) {
    throw new Error(
      `formdef: the layout of ${layoutOwner(level.path)} names "${name}", which the level does not describe.`,
    )
  }

  return (
    <Entry parts={level.parts} form={level.form} entry={entry} path={childPath(level.path, name)} />
  )
}

const LayoutNodes = ({ level, entries }: { level: Level; entries: unknown }): ReactNode =>
  (Array.isArray(entries) ? (entries as LayoutNodeEntry[]) : []).map((entry, index) => (
    // biome-ignore lint/suspicious/noArrayIndexKey: a layout comes from the config and never reorders; a name may appear twice.
    <LayoutNode key={index} level={level} entry={entry} />
  ))

const SectionNode = ({ level, entry, props }: LayoutKindProps): ReactNode => {
  const children = <LayoutNodes level={level} entries={entry.layout} />
  const Section = level.parts.structure.section

  if (Section !== undefined) {
    return (
      <Section {...props} label={entry.section}>
        {children}
      </Section>
    )
  }

  return (
    <fieldset {...props}>
      <legend>{entry.section as string}</legend>
      {children}
    </fieldset>
  )
}

const RowNode = ({ level, entry, props }: LayoutKindProps): ReactNode => {
  const children = <LayoutNodes level={level} entries={entry.row} />
  const Row = level.parts.structure.row

  if (Row !== undefined) {
    return <Row {...props}>{children}</Row>
  }

  return (
    <div {...props} data-formdef-row="">
      {children}
    </div>
  )
}

const ComponentNode = ({ level, entry, props }: LayoutKindProps): ReactNode => {
  const name = entry.component as string
  const Component = byName(level.parts.formComponents, name)
  if (Component === undefined) {
    throw new Error(
      `formdef: the layout of ${layoutOwner(level.path)} places the unregistered form component "${name}".`,
    )
  }

  return <Component {...props} />
}

const LayoutKind = ({ level, entry, props }: LayoutKindProps): ReactNode => {
  if ('section' in entry) {
    return <SectionNode level={level} entry={entry} props={props} />
  }
  if ('row' in entry) {
    return <RowNode level={level} entry={entry} props={props} />
  }
  if (typeof entry.component === 'string') {
    return <ComponentNode level={level} entry={entry} props={props} />
  }
  if (typeof entry.render === 'function') {
    return (entry.render as (form: RenderForm) => ReactNode)(level.form)
  }

  return null
}

const LayoutNode = ({ level, entry }: LayoutNodeProps): ReactNode => {
  if (typeof entry === 'string') {
    return <FieldNode level={level} name={entry} />
  }

  return (
    <Derived form={level.form} entry={entry}>
      {(props) => <LayoutKind level={level} entry={entry} props={props} />}
    </Derived>
  )
}

const LevelEntries = ({ layout, ...level }: LevelProps): ReactNode => {
  if (layout !== undefined) {
    return <LayoutNodes level={level} entries={layout} />
  }

  return Object.keys(level.fields).map((name) => <FieldNode key={name} level={level} name={name} />)
}

/**
 * Renders the field entries of a level with the widgets of `parts`. Without a `layout` the entries
 * appear in the order `fields` declares them; with one, the layout decides the order, groups them
 * into sections and rows and places form components and inline entries. A leaf renders as its
 * widget, an object as its own level, a custom entry through its `render`. An object entry with
 * TanStack options of its own also mounts a field at its path, so its validators run.
 */
export const Fields = ({ parts, form, fields, layout }: FieldsProps): ReactNode => (
  <LevelEntries parts={parts} form={form} fields={fields} layout={layout} path={undefined} />
)
