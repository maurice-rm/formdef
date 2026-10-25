import type { ComponentType, ReactNode } from 'react'

import { ArrayEntry } from './array-entry'
import { byName } from './by-name'
import { childPath } from './child-path'
import { Derived } from './derived'
import type { AppFieldProps, RenderForm } from './render-form'
import { splitEntry } from './split-entry'
import { warnOnce } from './warn-once'

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
    arrayFrame?: ComponentType<AnyProps>
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
  /** Props an array frame passes the one widget of an item, through this level. */
  extra?: object | undefined
}

type LevelProps = Level & {
  layout: readonly unknown[] | undefined
}

type EntryProps = Omit<Level, 'fields'> & {
  entry: object
  path: string
}

type FieldContentProps = Omit<EntryProps, 'entry'> & {
  entry: ReturnType<typeof splitEntry> & { source: object }
  props: object | undefined
}

type ItemProps = Omit<EntryProps, 'extra'> & {
  index: number
  extra: object | undefined
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

const DROPPED_EXTRA = 'passes extra props to an item that has no single widget to receive them'

const renderNothing = (): ReactNode => null

const layoutOwner = (path: string | undefined): string =>
  path === undefined ? 'the form' : `"${path}"`

const isLeaf = (entry: unknown): boolean =>
  typeof entry === 'object' && entry !== null && 'widget' in entry

// A frame's extra props have a single target only in a leaf, or an object level whose one field
// is a leaf and which has no layout.
const takesExtra = (item: object): boolean => {
  if (isLeaf(item)) {
    return true
  }
  const { own } = splitEntry(item)
  const fields =
    typeof own.fields === 'object' && own.fields !== null ? Object.values(own.fields) : []

  return own.layout === undefined && fields.length === 1 && isLeaf(fields[0])
}

const Item = ({ parts, form, entry, path, index, extra }: ItemProps): ReactNode => {
  const { own } = splitEntry(entry)
  const item = own.item as object
  const reachesWidget = extra !== undefined && takesExtra(item)
  if (extra !== undefined && !reachesWidget) {
    warnOnce(entry, `formdef: the array frame of "${path}" ${DROPPED_EXTRA}; they are dropped.`)
  }

  return (
    <Entry
      parts={parts}
      form={form}
      entry={item}
      path={childPath(path, index)}
      extra={reachesWidget ? extra : undefined}
    />
  )
}

const FieldContent = ({ parts, form, entry, path, props, extra }: FieldContentProps): ReactNode => {
  const { own, fieldOptions } = entry

  if (typeof own.widget === 'string') {
    const Widget = byName(parts.widgets, own.widget)
    if (Widget === undefined) {
      throw new Error(`formdef: field "${path}" names the unregistered widget "${own.widget}".`)
    }

    return (
      <form.AppField {...fieldOptions} name={path}>
        {(field) => <Widget {...props} {...extra} field={field} />}
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

  if (typeof own.item === 'object' && own.item !== null) {
    return (
      <form.AppField {...fieldOptions} name={path}>
        {(field) => (
          <ArrayEntry
            field={field}
            options={own}
            frame={parts.structure.arrayFrame}
            props={props}
            renderItem={(index, itemExtra) => (
              <Item
                parts={parts}
                form={form}
                entry={entry.source}
                path={path}
                index={index}
                extra={itemExtra}
              />
            )}
          />
        )}
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
        extra={extra}
      />
    </>
  )
}

const Entry = ({ parts, form, entry, path, extra }: EntryProps): ReactNode => {
  const split = { ...splitEntry(entry), source: entry }

  return (
    <Derived form={form} entry={split.own}>
      {(props) => (
        <FieldContent
          parts={parts}
          form={form}
          entry={split}
          path={path}
          props={props}
          extra={extra}
        />
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
    <Entry
      parts={level.parts}
      form={level.form}
      entry={entry}
      path={childPath(level.path, name)}
      extra={level.extra}
    />
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
 * widget, an object as its own level, a custom entry through its `render`, an array through the
 * registered `structure.arrayFrame` or the bare default. An object entry with TanStack options of
 * its own also mounts a field at its path, so its validators run.
 */
export const Fields = ({ parts, form, fields, layout }: FieldsProps): ReactNode => (
  <LevelEntries parts={parts} form={form} fields={fields} layout={layout} path={undefined} />
)
