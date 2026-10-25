import type { ExtraProps } from './extra-props'
import type { PropsEntry } from './props-entry'
import type { Visibility } from './visibility'

type OneKind = 'formdef: a layout entry has one kind: section, row, component or render'

type KindMarkers = {
  section?: OneKind
  row?: OneKind
  component?: OneKind
  render?: OneKind
}

type Owns<TMarker extends keyof KindMarkers> = Omit<KindMarkers, TMarker>

type SectionSupplied = 'label' | 'children'
type RowSupplied = 'children'

// Without a registered slot the renderer draws the bare element, which takes a class name only.
type BareElementProps = { className?: string }

type SlotProps<
  TStructure,
  TSlot extends string,
  TSupplied extends PropertyKey,
> = TSlot extends keyof TStructure
  ? ExtraProps<NonNullable<TStructure[TSlot]>, TSupplied>
  : BareElementProps

// The registry's parts a layout reads, until the registry itself is typed.
type LayoutParts = { structure: object }

type SectionEntry<TParts extends LayoutParts, TNames extends string, TValues> = {
  /** The title of the group. */
  section: string
  layout: LayoutEntry<TParts, TNames, TValues>[]
} & PropsEntry<SlotProps<TParts['structure'], 'section', SectionSupplied>, TValues> &
  Visibility<TValues> &
  Owns<'section'>

type RowEntry<TParts extends LayoutParts, TNames extends string, TValues> = {
  row: LayoutEntry<TParts, TNames, TValues>[]
} & PropsEntry<SlotProps<TParts['structure'], 'row', RowSupplied>, TValues> &
  Visibility<TValues> &
  Owns<'row'>

/**
 * One entry of a level's `layout`: the name of a field the level describes (`TNames`), a titled
 * section or a row of entries. Sections and rows nest; their props follow the structure slot
 * registered in `TParts`, or the bare element without one.
 */
export type LayoutEntry<TParts extends LayoutParts, TNames extends string, TValues> =
  | TNames
  | SectionEntry<TParts, TNames, TValues>
  | RowEntry<TParts, TNames, TValues>
