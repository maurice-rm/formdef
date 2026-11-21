import type { Rule } from './rule'
import type { Setting } from './setting'
import type { ValueType } from './value-type'

/**
 * A field kind of a form document: what a field of that kind is. It binds a widget of the
 * registry to the props built from the field's settings, the rules that check its value, and the
 * settings a person may change. Built with {@link defineFieldKind}, collected with
 * {@link createCatalog}.
 *
 * @typeParam TRegistry - The registry the field kind's widget belongs to.
 */
export type FieldKind<TRegistry> = {
  /** The registry the field kind was defined with. */
  readonly registry: TRegistry
  /** The field kind's name, as a document's `kind` names it. */
  readonly name: string
  /** What a builder shows for the field kind. */
  readonly label: string
  /** The name of the widget that renders fields of this kind. */
  readonly widget: string
  /** What type of answer a field of this kind gives; one of the catalog's value types. */
  readonly valueType: ValueType
  /** The settings a person may change on a field of this kind, by name. */
  readonly settings: Readonly<Record<string, Setting<unknown>>>
  /** The widget props for a field with these settings. */
  props: (settings: Readonly<Record<string, unknown>>) => Readonly<Record<string, unknown>>
  /** The rules for a field with these settings; a rule not set is `undefined`. */
  rules: (settings: Readonly<Record<string, unknown>>) => readonly (Rule<never> | undefined)[]
}
