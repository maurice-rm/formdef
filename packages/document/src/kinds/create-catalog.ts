import { failAt } from '../fail-at'
import { isLanguageCode } from '../is-language-code'
import { LANGUAGE_CODE_EXPECTED } from '../language-code-expected'
import type { BlockKind } from './block-kind'
import type { DisplayKind } from './display-kind'
import type { FieldKind } from './field-kind'
import type { ValueType } from './value-type'
import { type BuiltInValueType, valueTypes as builtInValueTypes } from './value-types'

/**
 * Every kind a project offers for form documents, for one registry: what a builder lists, and
 * what renders, checks, validates and describes a form document.
 *
 * @typeParam TRegistry - The registry the kinds belong to.
 * @typeParam TValueType - The project's own value types, next to the built-in ones.
 */
export type Catalog<TRegistry, TValueType extends ValueType = never> = {
  /** The registry that renders the documents. */
  readonly registry: TRegistry
  /** Every value type: the built-in ones, then the project's, in the order given. */
  readonly valueTypes: readonly (BuiltInValueType | TValueType)[]
  /** Every field kind, in the order given. */
  readonly fields: readonly FieldKind<TRegistry>[]
  /** Every block kind, in the order given. */
  readonly blocks: readonly BlockKind<TRegistry>[]
  /** Every display kind, in the order given. */
  readonly displays: readonly DisplayKind<TRegistry>[]
  /**
   * The language placeholders write numbers in for a document without `languages`; `undefined`
   * writes them as plain digits.
   */
  readonly language: string | undefined
  /** The value type of this name, or `undefined` when there is none. */
  findValueType: (name: string) => BuiltInValueType | TValueType | undefined
  /** The field kind of this name, or `undefined` when there is none. */
  findFieldKind: (name: string) => FieldKind<TRegistry> | undefined
  /** The block kind of this name, or `undefined` when there is none. */
  findBlockKind: (name: string) => BlockKind<TRegistry> | undefined
  /** The display kind of this name, or `undefined` when there is none. */
  findDisplayKind: (name: string) => DisplayKind<TRegistry> | undefined
}

/**
 * What {@link createCatalog} takes besides the registry.
 *
 * @typeParam TRegistry - The registry the kinds belong to.
 * @typeParam TValueType - The project's own value types.
 */
export type CatalogOptions<TRegistry, TValueType extends ValueType> = {
  /**
   * The project's own value types, each built with {@link defineValueType}; the built-in ones are
   * always part of the catalog.
   *
   * @defaultValue none
   */
  valueTypes?: readonly TValueType[]
  /** The field kinds, each built with {@link defineFieldKind} and the catalog's registry. */
  fields: readonly FieldKind<TRegistry>[]
  /**
   * The block kinds, each built with {@link defineBlockKind} and the catalog's registry.
   *
   * @defaultValue none
   */
  blocks?: readonly BlockKind<TRegistry>[]
  /**
   * The display kinds, each built with {@link defineDisplayKind} and the catalog's registry.
   *
   * @defaultValue none
   */
  displays?: readonly DisplayKind<TRegistry>[]
  /**
   * The language placeholders write numbers in for a document without `languages`, as a language
   * code such as `de`: `20.005` and `120,5` rather than `20005` and `120.5`. A document with
   * `languages` writes them in its own language.
   *
   * @defaultValue none; numbers are written as plain digits
   */
  language?: string
}

type Kind<TRegistry> = { readonly registry: TRegistry; readonly name: string }

const VALUE_TYPES = 'valueTypes'
const FIELDS = 'fields'
const BLOCKS = 'blocks'
const DISPLAYS = 'displays'
const LANGUAGE = 'language'

const collectValueTypes = (own: readonly ValueType[]): readonly ValueType[] => {
  const all = [...Object.values(builtInValueTypes), ...own]
  const names = new Set(Object.keys(builtInValueTypes))

  own.forEach((valueType, index) => {
    if (names.has(valueType.name)) {
      failAt(`${VALUE_TYPES}[${index}].name`, `the name "${valueType.name}" is used twice.`)
    }
    names.add(valueType.name)
  })
  return all
}

const byNameOf = <TRegistry, TKind extends Kind<TRegistry>>(
  kinds: readonly TKind[],
  { registry, list, noun }: { registry: TRegistry; list: string; noun: string },
): ReadonlyMap<string, TKind> => {
  const byName = new Map<string, TKind>()
  kinds.forEach((kind, index) => {
    const path = `${list}[${index}]`
    if (kind.registry !== registry) {
      failAt(path, `the ${noun} "${kind.name}" was defined with another registry.`)
    }
    if (byName.has(kind.name)) {
      failAt(`${path}.name`, `the name "${kind.name}" is used twice.`)
    }
    byName.set(kind.name, kind)
  })
  return byName
}

/**
 * Collects every kind a project offers for form documents, for one registry.
 *
 * @typeParam TRegistry - The registry the kinds belong to.
 * @typeParam TValueType - The project's own value types.
 * @param registry - The registry that renders the documents.
 * @param options - The kinds the catalog holds.
 * @param options.valueTypes - The project's own value types, next to the built-in ones.
 * @param options.fields - The field kinds, each built with {@link defineFieldKind} and this
 *   registry.
 * @param options.blocks - The block kinds, each built with {@link defineBlockKind} and this
 *   registry.
 * @param options.displays - The display kinds, each built with {@link defineDisplayKind} and this
 *   registry.
 * @param options.language - The language placeholders write numbers in for a document without
 *   `languages`, as a language code.
 * @defaultValue `options.valueTypes`, `options.blocks` and `options.displays`: none;
 *   `options.language`: none, numbers are written as plain digits.
 * @returns The catalog, which finds each kind by its name.
 * @throws When two value types, two field kinds, two block kinds or two display kinds share a
 *   name, a kind was defined with another registry, a field kind's value type is not one of the
 *   catalog's, or `options.language` is no language code.
 *
 * @example
 * ```ts
 * export const catalog = createCatalog(registry, {
 *   valueTypes: [address],
 *   fields: [text, choice, measure, postalAddress],
 *   blocks: [notice],
 *   displays: [rail],
 * })
 * ```
 */
export function createCatalog<TRegistry, TValueType extends ValueType = never>(
  registry: TRegistry,
  {
    valueTypes = [],
    fields,
    blocks = [],
    displays = [],
    language,
  }: CatalogOptions<TRegistry, TValueType>,
): Catalog<TRegistry, TValueType> {
  if (language !== undefined && !isLanguageCode(language)) {
    failAt(LANGUAGE, LANGUAGE_CODE_EXPECTED)
  }
  const allValueTypes = collectValueTypes(valueTypes)
  fields.forEach((kind, index) => {
    if (!allValueTypes.includes(kind.valueType)) {
      failAt(`${FIELDS}[${index}].valueType`, 'expected a value type of the catalog.')
    }
  })
  const fieldsByName = byNameOf(fields, { registry, list: FIELDS, noun: 'field kind' })
  const blocksByName = byNameOf(blocks, { registry, list: BLOCKS, noun: 'block kind' })
  const displaysByName = byNameOf(displays, { registry, list: DISPLAYS, noun: 'display kind' })
  const catalogValueTypes = allValueTypes as readonly (BuiltInValueType | TValueType)[]
  const valueTypesByName = new Map(
    catalogValueTypes.map((valueType) => [valueType.name, valueType]),
  )

  return {
    registry,
    valueTypes: catalogValueTypes,
    fields: [...fields],
    blocks: [...blocks],
    displays: [...displays],
    language,
    findValueType: (name) => valueTypesByName.get(name),
    findFieldKind: (name) => fieldsByName.get(name),
    findBlockKind: (name) => blocksByName.get(name),
    findDisplayKind: (name) => displaysByName.get(name),
  }
}
