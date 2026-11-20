import type { Setting } from './setting'

/**
 * What a display kind applies to: the whole form of steps, through the stepper; one step, through
 * what the stepper shows per step; a section; or a row.
 */
export type DisplayTarget = 'form' | 'step' | 'section' | 'row'

/**
 * A display kind of a form document: how a form of steps, a step, a section or a row looks. It
 * builds the props of the structure slot that renders it from a display's settings. Built with
 * {@link defineDisplayKind}, collected with {@link createCatalog}.
 *
 * @typeParam TRegistry - The registry whose structure slot the display kind gives props to.
 */
export type DisplayKind<TRegistry> = {
  /** The registry the display kind was defined with. */
  readonly registry: TRegistry
  /** The display kind's name, as a document's `display.kind` names it. */
  readonly name: string
  /** The display kind's name in a builder. */
  readonly label: string
  /** What the display kind applies to. */
  readonly appliesTo: DisplayTarget
  /** The settings a person may change on a display of this kind, by name. */
  readonly settings: Readonly<Record<string, Setting<unknown>>>
  /** The structure slot's props for a display with these settings. */
  props: (settings: Readonly<Record<string, unknown>>) => Readonly<Record<string, unknown>>
}
