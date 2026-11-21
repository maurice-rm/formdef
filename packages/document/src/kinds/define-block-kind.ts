import type { Registry } from '@formdef/core'

import type { AnyRegistry } from './any-registry'
import type { BlockKind } from './block-kind'
import type { SettingValues } from './define-field-kind'
import type { KindSettings } from './kind-settings'
import { NO_PROPS } from './no-props'
import type { PropsOf } from './props-of'

type FormComponentsOf<TRegistry> =
  // biome-ignore lint/suspicious/noExplicitAny: only the form components are read.
  TRegistry extends Registry<any, infer TFormComponents, any> ? TFormComponents : never

type PropsPart<TComponent, TSettings> =
  // biome-ignore lint/complexity/noBannedTypes: `{}` tests whether every prop is optional.
  {} extends PropsOf<TComponent>
    ? {
        /**
         * The form component's props for a block with these settings.
         *
         * @defaultValue none
         */
        props?: (settings: SettingValues<TSettings>) => PropsOf<TComponent>
      }
    : {
        /** The form component's props for a block with these settings; it needs some of them. */
        props: (settings: SettingValues<TSettings>) => PropsOf<TComponent>
      }

/**
 * What {@link defineBlockKind} takes.
 *
 * @typeParam TFormComponents - The form components of the registry.
 * @typeParam TName - The name of the form component that renders the block kind.
 * @typeParam TSettings - The block kind's settings.
 */
export type BlockKindDefinition<
  TFormComponents,
  TName extends keyof TFormComponents & string,
  TSettings extends KindSettings,
> = {
  /** The block kind's name, as a document's `kind` names it. */
  name: string
  /** The block kind's name in a builder. */
  label: string
  /** The form component that renders blocks of this kind. */
  component: TName
  /**
   * The settings a person may change on a block of this kind.
   *
   * @defaultValue none
   */
  settings?: TSettings
} & PropsPart<TFormComponents[TName], TSettings>

/**
 * Defines a block kind for form documents: content between fields that gives no answer, rendered
 * by a form component of the registry from a block's settings. The compiler checks the props
 * against the form component here, once. A block has no value, rules or required; it shows as its
 * `visibleWhen` says.
 *
 * @typeParam TRegistry - The registry the form component belongs to.
 * @typeParam TName - The name of the form component.
 * @typeParam TSettings - The block kind's settings.
 * @param registry - The registry the form component belongs to; the same one renders the documents.
 * @param definition - The block kind.
 * @returns The block kind, to collect with {@link createCatalog}.
 *
 * @example
 * ```ts
 * const notice = defineBlockKind(registry, {
 *   name: 'notice',
 *   label: 'Notice',
 *   component: 'notice',
 *   settings: { body: setting.text({ label: 'Text', required: true }) },
 *   props: ({ body }) => ({ children: body }),
 * })
 * ```
 */
export function defineBlockKind<
  TRegistry extends AnyRegistry,
  TName extends keyof FormComponentsOf<TRegistry> & string,
  TSettings extends KindSettings = Record<never, never>,
>(
  registry: TRegistry,
  definition: BlockKindDefinition<FormComponentsOf<TRegistry>, TName, TSettings>,
): BlockKind<TRegistry> {
  const { name, label, component, settings } = definition
  const props = (definition as { props?: BlockKind<TRegistry>['props'] }).props

  return { registry, name, label, component, settings: settings ?? {}, props: props ?? NO_PROPS }
}
