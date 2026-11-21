import type { Setting } from './setting'

/**
 * A block kind of a form document: content between fields that gives no answer, such as a notice
 * or a heading. It binds a form component of the registry to the props built from a block's
 * settings, and the settings a person may change. Built with {@link defineBlockKind}, collected
 * with {@link createCatalog}.
 *
 * @typeParam TRegistry - The registry the block kind's form component belongs to.
 */
export type BlockKind<TRegistry> = {
  /** The registry the block kind was defined with. */
  readonly registry: TRegistry
  /** The block kind's name, as a document's `kind` names it. */
  readonly name: string
  /** What a builder shows for the block kind. */
  readonly label: string
  /** The name of the form component that renders blocks of this kind. */
  readonly component: string
  /** The settings a person may change on a block of this kind, by name. */
  readonly settings: Readonly<Record<string, Setting<unknown>>>
  /** The form component's props for a block with these settings. */
  props: (settings: Readonly<Record<string, unknown>>) => Readonly<Record<string, unknown>>
}
