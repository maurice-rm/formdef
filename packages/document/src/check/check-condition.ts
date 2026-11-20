import type { Condition } from '../condition'
import type { ValueType } from '../kinds/field-kind'
import { isIsoDate } from './iso-date'
import { optionValuesOf } from './option-values'
import { type EarlierField, report, type Walk } from './walk'

type Comparison = Extract<Condition, { field: string }>

const PRESENCE = ['isFilled', 'isEmpty'] as const

const OPERATORS: Record<ValueType, readonly string[]> = {
  text: PRESENCE,
  choice: ['equals', 'notEquals', 'in', 'notIn', ...PRESENCE],
  choices: ['includes', 'excludes', ...PRESENCE],
  boolean: ['isTrue', 'isFalse', ...PRESENCE],
  number: ['equals', 'notEquals', 'lessThan', 'atMost', 'greaterThan', 'atLeast', ...PRESENCE],
  decimal: ['equals', 'notEquals', 'lessThan', 'atMost', 'greaterThan', 'atLeast', ...PRESENCE],
  date: ['equals', 'before', 'onOrBefore', 'after', 'onOrAfter', ...PRESENCE],
}

const checkOption = (
  value: unknown,
  { options, field }: { options: ReadonlySet<string>; field: string },
  { walk, path }: { walk: Walk; path: string },
): void => {
  if (typeof value === 'string' && options.has(value)) return
  report(walk, { code: 'unknownOption', path, params: { field, value: String(value) } })
}

const checkComparedValue = (
  comparison: Comparison,
  earlier: EarlierField,
  { walk, path }: { walk: Walk; path: string },
): void => {
  if (!('value' in comparison) || earlier.kind === undefined) return
  const { valueType } = earlier.kind

  if (valueType === 'choice' || valueType === 'choices') {
    const options = { options: optionValuesOf(earlier.field), field: comparison.field }
    if (Array.isArray(comparison.value)) {
      comparison.value.forEach((entry, index) => {
        checkOption(entry, options, { walk, path: `${path}.value[${index}]` })
      })
      return
    }
    checkOption(comparison.value, options, { walk, path: `${path}.value` })
    return
  }
  if ((valueType === 'number' || valueType === 'decimal') && typeof comparison.value !== 'number') {
    report(walk, { code: 'valueMismatch', path: `${path}.value`, params: { expected: 'number' } })
    return
  }
  if (valueType === 'date' && !isIsoDate(comparison.value)) {
    report(walk, { code: 'valueMismatch', path: `${path}.value`, params: { expected: 'date' } })
  }
}

const checkComparison = (comparison: Comparison, path: string, walk: Walk): void => {
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
  if (earlier.kind === undefined) return

  const { valueType } = earlier.kind
  if (!OPERATORS[valueType].includes(op)) {
    report(walk, { code: 'operatorMismatch', path: `${path}.op`, params: { op, valueType } })
    return
  }
  checkComparedValue(comparison, earlier, { walk, path })
}

/**
 * Checks one condition against the fields before it: that the field exists and comes earlier,
 * that the operator fits its value type, and that the compared value is one it can hold.
 */
export const checkCondition = (condition: Condition, path: string, walk: Walk): void => {
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
