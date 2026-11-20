import type { ComputedItem } from '../form-document'
import { checkExpression } from './check-expression'
import { checkVaryingText } from './check-varying-text'
import type { CheckWalk } from './check-walk'
import { report } from './report'
import { isResultKind } from './result-kind'

const NO_OPTIONS: ReadonlySet<string> = new Set()

/**
 * Checks a computed value once its key and condition are checked: its label, its value type,
 * which is `number`, `text` or `date` and in the catalog, and its expression, whose result has to
 * be of that type. Afterwards, later conditions and expressions may read it like an answer.
 */
export function checkComputed(
  computed: ComputedItem,
  { walk, path }: { walk: CheckWalk; path: string },
): void {
  checkVaryingText(computed.label, { walk, path: `${path}.label` })
  const valueType = walk.valueTypeNamed(computed.valueType)
  const isKnown = valueType !== undefined && isResultKind(computed.valueType)
  if (!isKnown) {
    report(walk, {
      code: 'resultMismatch',
      path: `${path}.valueType`,
      params: { valueType: computed.valueType },
    })
  }
  const result = checkExpression(computed.expression, { walk, path: `${path}.expression` })
  if (isKnown && result !== undefined && result !== computed.valueType) {
    report(walk, {
      code: 'resultMismatch',
      path: `${path}.expression`,
      params: { valueType: computed.valueType, result },
    })
  }
  walk.earlier.set(computed.key, {
    key: computed.key,
    valueType: isKnown ? valueType : undefined,
    optionValues: NO_OPTIONS,
  })
}
