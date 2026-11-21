import { endingOf } from '../describe/ending-of'
import { evaluate } from '../evaluate/evaluate'
import type { FormDocument } from '../form-document'
import type { Catalog } from '../kinds/create-catalog'
import type { ValueType } from '../kinds/value-type'
import { blockLayoutOf } from './block-layout-of'

/**
 * The layout of the ending that applies to the answers given: an entry per block that shows, with
 * the props its settings give for those answers. `undefined` when no ending applies, or none of
 * its blocks shows.
 */
export function endingLayoutOf(
  document: FormDocument,
  catalog: Catalog<unknown, ValueType>,
  { values, language }: { values: unknown; language: string | undefined },
): unknown[] | undefined {
  const ending = endingOf(document, catalog, {
    values,
    ...(language === undefined ? {} : { language }),
  })
  if (ending === undefined) {
    return undefined
  }
  const { answers } = evaluate(document, catalog, { values, language })
  const layout = blockLayoutOf(ending.items, { catalog, answers, language })
  return layout.length === 0 ? undefined : layout
}
