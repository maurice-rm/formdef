import type { Rule } from './rule'
import type { Setting } from './setting'

/**
 * A field kind of a form document: what a field of that kind is. It binds a widget of the
 * registry to the props built from the field's settings, the rules that check its value, and the
 * settings a person may change. Built with `defineFieldKind`, collected with `createFieldKinds`.
 *
 * @typeParam TRegistry - The registry the field kind's widget belongs to.
 */
export type FieldKind<TRegistry> = {
  /** The registry the field kind was defined with. */
  readonly registry: TRegistry
  /** The field kind's name, as a document's `kind` names it. */
  readonly name: string
  /** The field kind's name in a builder. */
  readonly label: string
  /** The name of the widget that renders fields of this kind. */
  readonly widget: string
  /** The settings a person may change on a field of this kind, by name. */
  readonly settings: Readonly<Record<string, Setting<unknown>>>
  /** The widget props for a field with these settings. */
  props(settings: Readonly<Record<string, unknown>>): Readonly<Record<string, unknown>>
  /** The rules for a field with these settings; a rule not set is `undefined`. */
  rules(settings: Readonly<Record<string, unknown>>): readonly (Rule<never> | undefined)[]
}
