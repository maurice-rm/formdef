import type { Registry, ValueOf } from '@formdef/core'
import type { ComponentType } from 'react'

import type { FieldKind } from './field-kind'
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

type AnswerOf<TValueType> = TValueType extends ValueType<infer TValue> ? TValue : never

// Every value the widget gives is an answer of the value type; a widget without a value type
// gives any.
type ServesWidget<TValueType, TWidgetValue> = unknown extends TWidgetValue
  ? true
  : [NonNullable<TWidgetValue>] extends [AnswerOf<TValueType>]
    ? true
    : false

// A value type that reads options reads them from the setting `options`.
type HasItsOptions<TValueType, TSettings> = TValueType extends { readsOptions: true }
  ? TSettings extends { options: Setting<SettingOption[]> }
    ? true
    : false
  : true

type ValueTypePart<TWidget, TSettings, TValueType> =
  ServesWidget<TValueType, ValueOf<TWidget>> extends true
    ? HasItsOptions<TValueType, TSettings> extends true
      ? unknown
      : { valueType: never }
    : { valueType: never }

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
 * @typeParam TValueType - The field kind's value type.
 */
export type FieldKindDefinition<
  TWidgets,
  TName extends keyof TWidgets & string,
  TSettings extends Settings,
  TValueType extends ValueType,
> = {
  /** The field kind's name, as a document's `kind` names it. */
  name: string
  /** The field kind's name in a builder. */
  label: string
  /** The widget that renders fields of this kind. */
  widget: TName
  /**
   * What kind of answer a field of this kind gives, such as `valueTypes.decimal`; every value the
   * widget gives has to be an answer of it, and it has to be one of the catalog's. A value type
   * that reads options, such as `valueTypes.choice`, reads them from a setting named `options`.
   */
  valueType: TValueType
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
} & PropsPart<TWidgets[TName], TSettings> &
  ValueTypePart<TWidgets[TName], TSettings, TValueType>

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
 * @typeParam TValueType - The field kind's value type.
 * @param registry - The registry the widget belongs to; the same one renders the documents.
 * @param definition - The field kind.
 * @returns The field kind, to collect with {@link createCatalog}.
 *
 * @example
 * ```ts
 * const measure = defineFieldKind(registry, {
 *   name: 'measure',
 *   label: 'Measure with unit',
 *   widget: 'text',
 *   valueType: valueTypes.decimal,
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
  TValueType extends ValueType = ValueType,
>(
  registry: TRegistry,
  definition: FieldKindDefinition<WidgetsOf<TRegistry>, TName, TSettings, TValueType>,
): FieldKind<TRegistry> {
  const { name, label, widget, valueType, settings, rules } = definition
  const props = (definition as { props?: FieldKind<TRegistry>['props'] }).props

  return {
    registry,
    name,
    label,
    widget,
    valueType,
    settings: settings ?? {},
    props: props ?? NO_PROPS,
    rules: (rules as FieldKind<TRegistry>['rules'] | undefined) ?? NO_RULES,
  }
}
