import { pathTo } from '../document-path'
import type { FieldItem, JsonValue, Varying } from '../form-document'
import { isVarying } from '../is-varying'
import { isIsoDate } from '../iso-date'
import type { FieldKind } from '../kinds/field-kind'
import type { Setting } from '../kinds/setting'
import { checkCondition } from './check-condition'
import { isOption } from './option-values'
import { report, type Walk } from './walk'

type At = { walk: Walk; path: string; name: string }

const mismatch = ({ walk, path, name }: At, type: string): void => {
  report(walk, { code: 'settingMismatch', path, params: { setting: name, type } })
}

const checkOptions = (value: JsonValue, descriptor: Setting<unknown>, at: At): void => {
  if (!Array.isArray(value) || !value.every(isOption)) {
    mismatch(at, 'options')
    return
  }
  const seen = new Set<string>()
  value.forEach((option, index) => {
    if (seen.has(option.value)) {
      report(at.walk, {
        code: 'duplicateOption',
        path: `${at.path}[${index}].value`,
        params: { value: option.value },
      })
    }
    seen.add(option.value)
  })
  if (descriptor.minCount !== undefined && value.length < descriptor.minCount) {
    report(at.walk, {
      code: 'settingLimit',
      path: at.path,
      params: { setting: at.name, minCount: descriptor.minCount },
    })
  }
}

const checkText = (value: JsonValue, descriptor: Setting<unknown>, at: At): void => {
  if (typeof value !== 'string') {
    mismatch(at, 'text')
    return
  }
  if (descriptor.maxLength !== undefined && value.length > descriptor.maxLength) {
    report(at.walk, {
      code: 'settingLimit',
      path: at.path,
      params: { setting: at.name, maxLength: descriptor.maxLength },
    })
  }
}

const checkNumber = (value: JsonValue, descriptor: Setting<unknown>, at: At): void => {
  if (typeof value !== 'number') {
    mismatch(at, 'number')
    return
  }
  if (descriptor.integer === true && !Number.isInteger(value)) {
    report(at.walk, {
      code: 'settingLimit',
      path: at.path,
      params: { setting: at.name, integer: true },
    })
  }
}

const checkValue = (value: JsonValue, descriptor: Setting<unknown>, at: At): void => {
  switch (descriptor.type) {
    case 'text':
      checkText(value, descriptor, at)
      return
    case 'number':
      checkNumber(value, descriptor, at)
      return
    case 'boolean':
      if (typeof value !== 'boolean') mismatch(at, 'boolean')
      return
    case 'date':
      if (!isIsoDate(value)) mismatch(at, 'date')
      return
    case 'options':
      checkOptions(value, descriptor, at)
  }
}

const checkSetting = (value: JsonValue | Varying, descriptor: Setting<unknown>, at: At): void => {
  if (!isVarying(value)) {
    checkValue(value, descriptor, at)
    return
  }
  if (!descriptor.varies) {
    report(at.walk, { code: 'notVarying', path: at.path, params: { setting: at.name } })
    return
  }
  value.cases.forEach((entry, index) => {
    checkCondition(entry.when, pathTo.caseWhen(at.path, index), at.walk)
    checkValue(entry.value, descriptor, { ...at, path: `${pathTo.case(at.path, index)}.value` })
  })
  checkValue(value.otherwise, descriptor, { ...at, path: `${at.path}.otherwise` })
}

/**
 * Checks the settings of one field against its field kind: each known setting in the kind's
 * order, then those the kind does not have.
 */
export const checkSettings = (
  field: FieldItem,
  kind: FieldKind<unknown>,
  { walk, path }: { walk: Walk; path: string },
): void => {
  const values = field.settings ?? {}

  for (const [name, descriptor] of Object.entries(kind.settings)) {
    const settingPath = pathTo.setting(path, name)
    const value = values[name]
    if (value === undefined && descriptor.required) {
      report(walk, { code: 'missingSetting', path: settingPath, params: { setting: name } })
    }
    if (value !== undefined) checkSetting(value, descriptor, { walk, path: settingPath, name })
  }

  for (const name of Object.keys(values)) {
    if (!Object.hasOwn(kind.settings, name)) {
      report(walk, {
        code: 'unknownSetting',
        path: pathTo.setting(path, name),
        params: { setting: name },
      })
    }
  }
}
