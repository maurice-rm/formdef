import { endingOf } from '../describe/ending-of'
import { evaluate } from '../evaluate/evaluate'
import { holds } from '../evaluate/holds'
import { resolveSettings } from '../evaluate/resolve-settings'
import type { FormDocument } from '../form-document'
import { blockKindOf } from '../kinds/block-kind-of'
import type { Catalog } from '../kinds/create-catalog'
import type { ValueType } from '../kinds/value-type'
import { withFormattedTexts } from './with-formatted-texts'

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
  const shown = ending.items.filter(
    (block) => block.visibleWhen === undefined || holds(block.visibleWhen, answers),
  )
  if (shown.length === 0) {
    return undefined
  }
  return shown.map((block) => {
    const kind = blockKindOf(catalog, block)
    const settings = resolveSettings(block, kind, { answers, language })
    return { component: kind.component, props: kind.props(withFormattedTexts(settings, kind)) }
  })
}
