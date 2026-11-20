import type { Registry, RowProps, SectionProps, StepperProps, StepState } from '@formdef/core'
import type { ComponentType } from 'react'

import { failAt } from '../fail-at'
import type { SettingValues } from './define-field-kind'
import type { DisplayKind, DisplayTarget } from './display-kind'
import type { Setting, SettingType } from './setting'

// biome-ignore lint/suspicious/noExplicitAny: a registry of any widgets, form components and slots.
type AnyRegistry = Registry<any, any, any>

type StructureOf<TRegistry> =
  // biome-ignore lint/suspicious/noExplicitAny: only the structure slots are read.
  TRegistry extends Registry<any, any, infer TStructure> ? TStructure : never

type PropsOf<TComponent> = TComponent extends ComponentType<infer TProps> ? TProps : never

type SlotOf<TStructure, TSlot extends string> = TSlot extends keyof TStructure
  ? NonNullable<TStructure[TSlot]>
  : never

type OwnProps<TProps, TSupplied extends PropertyKey> = TProps extends unknown
  ? { [Key in keyof TProps as Key extends TSupplied | 'key' | 'ref' ? never : Key]: TProps[Key] }
  : never

type StepOf<TStepper> =
  PropsOf<TStepper> extends { steps: readonly (infer TStep)[] } ? TStep : never

/** The props a display of `TTarget` gives to the slot that renders it, without those formdef gives. */
type TargetProps<TStructure, TTarget extends DisplayTarget> = {
  form: OwnProps<PropsOf<SlotOf<TStructure, 'stepper'>>, keyof StepperProps>
  step: OwnProps<StepOf<SlotOf<TStructure, 'stepper'>>, keyof StepState>
  section: OwnProps<PropsOf<SlotOf<TStructure, 'section'>>, keyof SectionProps>
  row: OwnProps<PropsOf<SlotOf<TStructure, 'row'>>, keyof RowProps>
}[TTarget]

type Settings = Readonly<Record<string, Setting<unknown>>>

// A display is how something looks, which does not follow the answers.
type FixedSettingsPart<TSettings> = true extends {
  [Name in keyof TSettings]: TSettings[Name] extends { formatted: true } ? true : false
}[keyof TSettings]
  ? { settings: never }
  : unknown

/**
 * What {@link defineDisplayKind} takes.
 *
 * @typeParam TStructure - The structure slots of the registry.
 * @typeParam TTarget - What the display kind applies to.
 * @typeParam TSettings - The display kind's settings.
 */
export type DisplayKindDefinition<
  TStructure,
  TTarget extends DisplayTarget,
  TSettings extends Settings,
> = {
  /** The display kind's name, as a document's `display.kind` names it. */
  name: string
  /** The display kind's name in a builder. */
  label: string
  /**
   * What the display kind applies to: `form` gives props to the stepper of a form of steps,
   * `step` to what the stepper shows per step, `section` and `row` to those slots.
   */
  appliesTo: TTarget
  /**
   * The settings a person may change on a display of this kind; they are fixed for the form, so
   * none varies, and none is a formatted text or holds options.
   *
   * @defaultValue none
   */
  settings?: TSettings
} & NoInfer<{
  /**
   * The slot's props for a display with these settings, checked against the slot registered for
   * what the display kind applies to.
   *
   * @defaultValue none
   */
  props?: (settings: SettingValues<TSettings>) => TargetProps<TStructure, TTarget>
}> &
  FixedSettingsPart<TSettings>

const NO_PROPS = (): Readonly<Record<string, unknown>> => ({})

// Options and option values name the choices of a field, which a display has none of.
const OPTION_TYPES: ReadonlySet<SettingType> = new Set(['options', 'option', 'optionList'])

const refuseUnfitSettings = (settings: Settings): void => {
  for (const [name, setting] of Object.entries(settings)) {
    if (setting.varies) {
      failAt(`settings.${name}`, "a display kind's setting does not follow an answer.")
    }
    if (OPTION_TYPES.has(setting.type)) {
      failAt(`settings.${name}`, "a display kind's setting is no options setting.")
    }
  }
}

/**
 * Defines a display kind for form documents: how a form of steps, a step, a section or a row looks,
 * as the props of the structure slot that renders it, built from a display's settings. The
 * compiler checks the props against that slot here, once. A display is fixed for the form: its
 * settings do not follow an answer or name one, but may be translated.
 *
 * @typeParam TRegistry - The registry whose structure slot the display kind gives props to.
 * @typeParam TTarget - What the display kind applies to.
 * @typeParam TSettings - The display kind's settings.
 * @param registry - The registry the slot belongs to; the same one renders the documents.
 * @param definition - The display kind.
 * @returns The display kind, to collect with {@link createCatalog}.
 * @throws When one of its settings varies, or holds options or option values.
 *
 * @example
 * ```ts
 * const rail = defineDisplayKind(registry, {
 *   name: 'rail',
 *   label: 'Rail',
 *   appliesTo: 'form',
 *   props: () => ({ variant: 'rail' }),
 * })
 * ```
 */
export function defineDisplayKind<
  TRegistry extends AnyRegistry,
  TTarget extends DisplayTarget,
  TSettings extends Settings = Record<never, never>,
>(
  registry: TRegistry,
  definition: DisplayKindDefinition<StructureOf<TRegistry>, TTarget, TSettings>,
): DisplayKind<TRegistry> {
  const { name, label, appliesTo, settings = {} } = definition
  refuseUnfitSettings(settings)
  const props = definition.props as DisplayKind<TRegistry>['props'] | undefined

  return { registry, name, label, appliesTo, settings, props: props ?? NO_PROPS }
}
