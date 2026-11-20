import { failAt } from '../fail-at'
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
  /** The field kind of this name, or `undefined` when there is none. */
  findFieldKind: (name: string) => FieldKind<TRegistry> | undefined
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
}

const VALUE_TYPES = 'valueTypes'
const FIELDS = 'fields'

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
 * @defaultValue `options.valueTypes`: none.
 * @returns The catalog, which finds each kind by its name.
 * @throws When two value types or two field kinds share a name, a field kind was defined with
 *   another registry, or its value type is not one of the catalog's.
 *
 * @example
 * ```ts
 * export const catalog = createCatalog(registry, {
 *   valueTypes: [address],
 *   fields: [text, choice, measure, postalAddress],
 * })
 * ```
 */
export function createCatalog<TRegistry, TValueType extends ValueType = never>(
  registry: TRegistry,
  { valueTypes = [], fields }: CatalogOptions<TRegistry, TValueType>,
): Catalog<TRegistry, TValueType> {
  const allValueTypes = collectValueTypes(valueTypes)
  const byName = new Map<string, FieldKind<TRegistry>>()

  fields.forEach((kind, index) => {
    const path = `${FIELDS}[${index}]`
    if (kind.registry !== registry) {
      failAt(path, `the field kind "${kind.name}" was defined with another registry.`)
    }
    if (!allValueTypes.includes(kind.valueType)) {
      failAt(`${path}.valueType`, 'expected a value type of the catalog.')
    }
    if (byName.has(kind.name)) {
      failAt(`${path}.name`, `the name "${kind.name}" is used twice.`)
    }
    byName.set(kind.name, kind)
  })

  return {
    registry,
    valueTypes: allValueTypes as readonly (BuiltInValueType | TValueType)[],
    fields: [...fields],
    findFieldKind: (name) => byName.get(name),
  }
}
