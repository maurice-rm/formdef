import type { Registry, ValueOf } from '@formdef/core'
import type { ComponentType } from 'react'

import type { FieldKind } from './field-kind'
import type { ChoiceValueType } from './is-choice'
import type { Rule } from './rule'
import type { Setting, SettingOption } from './setting'
import type { ValueType } from './value-type'

// biome-ignore lint/suspicious/noExplicitAny: a registry of any widgets, form components and slots.
type AnyRegistry = Registry<any, any, any>

type WidgetsOf<TRegistry> =
  // biome-ignore lint/suspicious/noExplicitAny: only the widgets are read.
  TRegistry extends Registry<infer TWidgets, any, any> ? TWidgets : never

type PropsOf<TWidget> = TWidget extends ComponentType<infer TProps> ? TProps : never

/** What the renderer passes every widget itself, so a field kind does not. */
type Supplied = 'field' | 'label' | 'description' | 'required'

type OwnProps<TWidget> = Omit<PropsOf<TWidget>, Supplied>

type Settings = Readonly<Record<string, Setting<unknown>>>

/**
 * The values of a field kind's settings, as its `props` and `rules` receive them.
 *
 * @typeParam TSettings - The field kind's settings, as `setting.*` describes them.
 */
export type SettingValues<TSettings> = {
  [Name in keyof TSettings]: TSettings[Name] extends Setting<infer TValue> ? TValue : never
}

// The value types a widget's value can carry; a widget without a value type carries every one.
type ValueTypesFor<TValue> = unknown extends TValue
  ? ValueType
  : FilledValueTypes<NonNullable<TValue>>

type FilledValueTypes<TValue> = [TValue] extends [string]
  ? 'text' | 'choice' | 'decimal' | 'date'
  : [TValue] extends [readonly string[]]
    ? 'choices'
    : [TValue] extends [boolean]
      ? 'boolean'
      : [TValue] extends [number]
        ? 'number'
        : never

// A choice reads its options from the setting `options`, to compare and describe answers.
type AllowedValueTypes<TWidget, TSettings> = TSettings extends {
  options: Setting<SettingOption[]>
}
  ? ValueTypesFor<ValueOf<TWidget>>
  : Exclude<ValueTypesFor<ValueOf<TWidget>>, ChoiceValueType>

type PropsPart<TWidget, TSettings> =
  // biome-ignore lint/complexity/noBannedTypes: `{}` tests whether every own prop is optional.
  {} extends OwnProps<TWidget>
    ? {
        /**
         * The widget props for a field with these settings.
         *
         * @defaultValue none
         */
        props?: (settings: SettingValues<TSettings>) => OwnProps<TWidget>
      }
    : {
        /** The widget props for a field with these settings; the widget needs some of them. */
        props: (settings: SettingValues<TSettings>) => OwnProps<TWidget>
      }

/**
 * What {@link defineFieldKind} takes.
 *
 * @typeParam TWidgets - The widgets of the registry.
 * @typeParam TName - The name of the widget that renders the field kind.
 * @typeParam TSettings - The field kind's settings.
 */
export type FieldKindDefinition<
  TWidgets,
  TName extends keyof TWidgets & string,
  TSettings extends Settings,
> = {
  /** The field kind's name, as a document's `kind` names it. */
  name: string
  /** The field kind's name in a builder. */
  label: string
  /** The widget that renders fields of this kind. */
  widget: TName
  /**
   * What kind of answer a field of this kind gives; it has to fit the widget's value. A `choice`
   * or `choices` reads its options from a setting named `options`.
   */
  valueType: AllowedValueTypes<TWidgets[TName], TSettings>
  /**
   * The settings a person may change on a field of this kind.
   *
   * @defaultValue none
   */
  settings?: TSettings
  /**
   * The rules for a field with these settings. A rule left `undefined`, such as `rule.min` of an
   * unset bound, is left out.
   *
   * @defaultValue none
   */
  rules?: (
    settings: SettingValues<TSettings>,
  ) => (Rule<NonNullable<ValueOf<TWidgets[TName]>>> | undefined)[]
} & PropsPart<TWidgets[TName], TSettings>

const NO_PROPS = (): Readonly<Record<string, unknown>> => ({})
const NO_RULES = (): readonly (Rule<never> | undefined)[] => []

/**
 * Defines a field kind for form documents: a widget of the registry, the props built from a
 * field's settings, the rules that check its value, and the settings a person may change. The
 * compiler checks the props and rules against the widget here, once, since nothing types a
 * document's fields at runtime.
 *
 * @typeParam TRegistry - The registry the widget belongs to.
 * @typeParam TName - The name of the widget.
 * @typeParam TSettings - The field kind's settings.
 * @param registry - The registry the widget belongs to; the same one renders the documents.
 * @param definition - The field kind.
 * @returns The field kind, to collect with {@link createFieldKinds}.
 *
 * @example
 * ```ts
 * const measure = defineFieldKind(registry, {
 *   name: 'measure',
 *   label: 'Measure with unit',
 *   widget: 'text',
 *   valueType: 'decimal',
 *   settings: { unit: setting.text({ label: 'Unit', required: true, varies: true }) },
 *   props: ({ unit }) => ({ inputMode: 'decimal', addons: [{ id: 'unit', content: unit, align: 'inline-end' }] }),
 *   rules: () => [rule.decimal()],
 * })
 * ```
 */
export function defineFieldKind<
  TRegistry extends AnyRegistry,
  TName extends keyof WidgetsOf<TRegistry> & string,
  TSettings extends Settings = Record<never, never>,
>(
  registry: TRegistry,
  definition: FieldKindDefinition<WidgetsOf<TRegistry>, TName, TSettings>,
): FieldKind<TRegistry> {
  const { name, label, widget, valueType, settings, rules } = definition
  const props = (definition as { props?: FieldKind<TRegistry>['props'] }).props

  return {
    registry,
    name,
    label,
    widget,
    valueType: valueType as ValueType,
    settings: settings ?? {},
    props: props ?? NO_PROPS,
    rules: (rules as FieldKind<TRegistry>['rules'] | undefined) ?? NO_RULES,
  }
}
