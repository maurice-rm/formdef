import type { Comparison, Condition } from '../condition'
import { isText } from '../is-text'
import type { JsonValue } from '../json-value'
import { operatorOf } from '../kinds/operator-of'
import type { Setting } from '../kinds/setting'
import { checkOptionValues } from './check-option-values'
import type { CheckWalk } from './check-walk'
import type { EarlierField } from './earlier-field'
import { earlierFieldNamed } from './earlier-field-named'
import { fitsSettingType } from './fits-setting-type'
import { numberLimitBroken } from './number-limit-broken'
import { report } from './report'
import type { ValueLimit } from './value-limit'

type At = { walk: CheckWalk; path: string }

const NOTHING = 'nothing'

const reportMismatch = ({ walk, path }: At, expected: string): void => {
  report(walk, { code: 'valueMismatch', path, params: { expected } })
}

const checkComparedValue = (
  value: JsonValue,
  { compares, earlier }: { compares: Setting<unknown>; earlier: EarlierField },
  at: At,
): void => {
  const { type } = compares
  if (!fitsSettingType(value, type)) {
    reportMismatch(at, type)
    return
  }
  if (type === 'option' || type === 'optionList') {
    checkOptionValues(value, { field: earlier.key, options: earlier.optionValues }, at)
  }
}

const limitBroken = (value: JsonValue, compares: Setting<unknown>): ValueLimit | undefined => {
  if (typeof value === 'number') {
    return numberLimitBroken(value, compares)
  }
  const { maxLength } = compares
  if (maxLength === undefined || !isText(value)) {
    return undefined
  }
  const translations = typeof value === 'string' ? [value] : Object.values(value)
  return translations.some((text) => text.length > maxLength) ? { maxLength } : undefined
}

const checkValueFrom = (
  valueFrom: string,
  compares: Setting<unknown> | undefined,
  { walk, path }: At,
): void => {
  const at = { walk, path: `${path}.valueFrom` }
  const other = earlierFieldNamed(valueFrom, at)
  const valueType = other?.valueType
  if (valueType === undefined) {
    return
  }
  if (compares === undefined) {
    reportMismatch(at, NOTHING)
    return
  }
  if (valueType.comparesAs?.type !== compares.type) {
    reportMismatch(at, compares.type)
  }
}

const checkCompared = (
  comparison: Comparison,
  { compares, earlier }: { compares: Setting<unknown> | undefined; earlier: EarlierField },
  at: At,
): void => {
  if (comparison.valueFrom !== undefined) {
    if (comparison.value !== undefined) {
      reportMismatch({ walk: at.walk, path: `${at.path}.value` }, NOTHING)
    }
    checkValueFrom(comparison.valueFrom, compares, at)
    return
  }
  const valueAt = { walk: at.walk, path: `${at.path}.value` }
  if (compares === undefined) {
    if (comparison.value !== undefined) {
      reportMismatch(valueAt, NOTHING)
    }
    return
  }
  if (comparison.value === undefined) {
    reportMismatch(valueAt, compares.type)
    return
  }
  checkComparedValue(comparison.value, { compares, earlier }, valueAt)
  const limit = limitBroken(comparison.value, compares)
  if (limit !== undefined) {
    report(at.walk, {
      code: 'valueLimit',
      path: valueAt.path,
      params: { op: comparison.op, ...limit },
    })
  }
}

const checkComparison = (comparison: Comparison, path: string, walk: CheckWalk): void => {
  const { field, op } = comparison
  const earlier = earlierFieldNamed(field, { walk, path: `${path}.field` })
  if (earlier === undefined) {
    return
  }
  const { valueType } = earlier
  if (valueType === undefined) {
    return
  }
  const operator = operatorOf(valueType, op)
  if (operator === undefined) {
    report(walk, {
      code: 'operatorMismatch',
      path: `${path}.op`,
      params: { op, valueType: valueType.name },
    })
    return
  }
  checkCompared(comparison, { compares: operator.compares, earlier }, { walk, path })
}

/**
 * Checks one condition against the fields before it: that the field exists and comes earlier,
 * that its value type has the operator, and that the compared value is what the operator compares
 * with, or left out when it compares with nothing. A field compared with through `valueFrom`
 * exists, comes earlier and has a value type that compares as the operator's setting type.
 */
export function checkCondition(condition: Condition, path: string, walk: CheckWalk): void {
  if ('all' in condition) {
    condition.all.forEach((entry, index) => {
      checkCondition(entry, `${path}.all[${index}]`, walk)
    })
    return
  }
  if ('any' in condition) {
    condition.any.forEach((entry, index) => {
      checkCondition(entry, `${path}.any[${index}]`, walk)
    })
    return
  }
  checkComparison(condition, path, walk)
}
