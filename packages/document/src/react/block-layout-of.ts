import type { Answers } from '../evaluate/answers'
import { holds } from '../evaluate/holds'
import { resolveSettings } from '../evaluate/resolve-settings'
import type { BlockItem } from '../form-document'
import { blockKindOf } from '../kinds/block-kind-of'
import type { Catalog } from '../kinds/create-catalog'
import type { ValueType } from '../kinds/value-type'
import { withFormattedTexts } from './with-formatted-texts'

type BlockContext = {
  catalog: Catalog<unknown, ValueType>
  answers: Answers
  language: string | undefined
}

/**
 * The layout of blocks outside the form, such as those of an intro or an ending: an entry per
 * block that shows for the answers, with the props its settings give for them.
 */
export function blockLayoutOf(
  blocks: readonly BlockItem[],
  { catalog, answers, language }: BlockContext,
): unknown[] {
  return blocks
    .filter((block) => block.visibleWhen === undefined || holds(block.visibleWhen, answers))
    .map((block) => {
      const kind = blockKindOf(catalog, block)
      const settings = resolveSettings(block, kind, { answers, language })
      return { component: kind.component, props: kind.props(withFormattedTexts(settings, kind)) }
    })
}
