import type { Comparison, Condition } from '../condition'
import type { JsonValue } from '../json-value'
import { operatorOf } from '../kinds/operator-of'
import { optionValuesOf } from '../kinds/option-values-of'
import type { Setting } from '../kinds/setting'
import { checkOptionValues } from './check-option-values'
import type { CheckWalk, EarlierField } from './check-walk'
import { fitsSettingType } from './fits-setting-type'
import { report } from './report'

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
    const options = optionValuesOf(earlier.field)
    checkOptionValues(value, { field: earlier.field.key, options }, at)
  }
}

const otherFieldOf = (key: string, { walk, path }: At): EarlierField | undefined => {
  if (!walk.allFieldKeys.has(key)) {
    report(walk, { code: 'unknownField', path, params: { field: key } })
    return undefined
  }
  const other = walk.earlier.get(key)
  if (other === undefined) {
    report(walk, { code: 'laterField', path, params: { field: key } })
  }
  return other
}

const checkValueFrom = (
  valueFrom: string,
  compares: Setting<unknown> | undefined,
  { walk, path }: At,
): void => {
  const at = { walk, path: `${path}.valueFrom` }
  const other = otherFieldOf(valueFrom, at)
  if (other?.kind === undefined) {
    return
  }
  if (compares === undefined) {
    reportMismatch(at, NOTHING)
    return
  }
  if (other.kind.valueType.comparesAs?.type !== compares.type) {
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
}

const checkComparison = (comparison: Comparison, path: string, walk: CheckWalk): void => {
  const { field, op } = comparison
  if (!walk.allFieldKeys.has(field)) {
    report(walk, { code: 'unknownField', path: `${path}.field`, params: { field } })
    return
  }
  const earlier = walk.earlier.get(field)
  if (earlier === undefined) {
    report(walk, { code: 'laterField', path: `${path}.field`, params: { field } })
    return
  }
  if (earlier.kind === undefined) {
    return
  }

  const { valueType } = earlier.kind
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
 * with, or left out when it compares with nothing. A field compared with through `valueFrom` exists,
 * comes earlier and has a value type that compares as the operator's setting type.
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
