import type { Comparison, Condition } from '../condition'
import { isIsoDate } from '../is-iso-date'
import { optionValuesOf } from '../kinds/option-values-of'
import type { ValueType } from '../kinds/value-type'
import { valueTypes } from '../kinds/value-types'
import type { Operator } from '../operators'
import type { CheckWalk, EarlierField } from './check-walk'
import { report } from './report'

type At = { walk: CheckWalk; path: string }

const FILL_OPERATORS: readonly Operator[] = ['isFilled', 'isEmpty']
const NUMBER_OPERATORS: readonly Operator[] = [
  'equals',
  'notEquals',
  'lessThan',
  'atMost',
  'greaterThan',
  'atLeast',
  ...FILL_OPERATORS,
]

const OPERATORS: ReadonlyMap<ValueType, readonly Operator[]> = new Map<
  ValueType,
  readonly Operator[]
>([
  [valueTypes.text, FILL_OPERATORS],
  [valueTypes.choice, ['equals', 'notEquals', 'in', 'notIn', ...FILL_OPERATORS]],
  [valueTypes.choices, ['includes', 'excludes', ...FILL_OPERATORS]],
  [valueTypes.boolean, ['isTrue', 'isFalse', ...FILL_OPERATORS]],
  [valueTypes.number, NUMBER_OPERATORS],
  [valueTypes.decimal, NUMBER_OPERATORS],
  [valueTypes.date, ['equals', 'before', 'onOrBefore', 'after', 'onOrAfter', ...FILL_OPERATORS]],
])

const operatorsOf = (valueType: ValueType): readonly Operator[] =>
  OPERATORS.get(valueType) ?? FILL_OPERATORS

const checkOption = (
  value: unknown,
  { options, field }: { options: ReadonlySet<string>; field: string },
  { walk, path }: At,
): void => {
  if (typeof value === 'string' && options.has(value)) {
    return
  }
  report(walk, { code: 'unknownOption', path, params: { field, value: String(value) } })
}

const checkComparedOptions = (
  comparison: Extract<Comparison, { value: unknown }>,
  earlier: EarlierField,
  { walk, path }: At,
): void => {
  const options = { options: optionValuesOf(earlier.field), field: comparison.field }
  if (!Array.isArray(comparison.value)) {
    checkOption(comparison.value, options, { walk, path: `${path}.value` })
    return
  }
  comparison.value.forEach((entry, index) => {
    checkOption(entry, options, { walk, path: `${path}.value[${index}]` })
  })
}

const checkComparedValue = (comparison: Comparison, earlier: EarlierField, at: At): void => {
  if (!('value' in comparison) || earlier.kind === undefined) {
    return
  }
  const { valueType } = earlier.kind
  const { walk, path } = at

  if (valueType.readsOptions) {
    checkComparedOptions(comparison, earlier, at)
    return
  }
  const isNumeric = valueType === valueTypes.number || valueType === valueTypes.decimal
  if (isNumeric && typeof comparison.value !== 'number') {
    report(walk, { code: 'valueMismatch', path: `${path}.value`, params: { expected: 'number' } })
    return
  }
  if (valueType === valueTypes.date && !isIsoDate(comparison.value)) {
    report(walk, { code: 'valueMismatch', path: `${path}.value`, params: { expected: 'date' } })
  }
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
  if (!operatorsOf(valueType).includes(op)) {
    report(walk, {
      code: 'operatorMismatch',
      path: `${path}.op`,
      params: { op, valueType: valueType.name },
    })
    return
  }
  checkComparedValue(comparison, earlier, { walk, path })
}

/**
 * Checks one condition against the fields before it: that the field exists and comes earlier,
 * that the operator fits its value type, and that the compared value is one it can hold.
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
