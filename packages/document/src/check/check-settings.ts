import type { FieldItem, Varying } from '../form-document'
import { isIsoDate } from '../is-iso-date'
import { isVarying } from '../is-varying'
import type { JsonValue } from '../json-value'
import type { FieldKind } from '../kinds/field-kind'
import { isOption } from '../kinds/is-option'
import type { Setting } from '../kinds/setting'
import { pathTo } from '../path-to'
import { checkCondition } from './check-condition'
import type { CheckWalk } from './check-walk'
import { report } from './report'

type At = { walk: CheckWalk; path: string; name: string }

const reportMismatch = ({ walk, path, name }: At, type: string): void => {
  report(walk, { code: 'settingMismatch', path, params: { setting: name, type } })
}

const checkOptions = (value: JsonValue, setting: Setting<unknown>, at: At): void => {
  if (!Array.isArray(value) || !value.every(isOption)) {
    reportMismatch(at, 'options')
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
  if (setting.minCount !== undefined && value.length < setting.minCount) {
    report(at.walk, {
      code: 'settingLimit',
      path: at.path,
      params: { setting: at.name, minCount: setting.minCount },
    })
  }
}

const checkText = (value: JsonValue, setting: Setting<unknown>, at: At): void => {
  if (typeof value !== 'string') {
    reportMismatch(at, 'text')
    return
  }
  if (setting.maxLength !== undefined && value.length > setting.maxLength) {
    report(at.walk, {
      code: 'settingLimit',
      path: at.path,
      params: { setting: at.name, maxLength: setting.maxLength },
    })
  }
}

const checkNumber = (value: JsonValue, setting: Setting<unknown>, at: At): void => {
  if (typeof value !== 'number') {
    reportMismatch(at, 'number')
    return
  }
  if (setting.integer === true && !Number.isInteger(value)) {
    report(at.walk, {
      code: 'settingLimit',
      path: at.path,
      params: { setting: at.name, integer: true },
    })
  }
}

const checkValue = (value: JsonValue, setting: Setting<unknown>, at: At): void => {
  switch (setting.type) {
    case 'text':
      checkText(value, setting, at)
      return
    case 'number':
      checkNumber(value, setting, at)
      return
    case 'boolean':
      if (typeof value !== 'boolean') {
        reportMismatch(at, 'boolean')
      }
      return
    case 'date':
      if (!isIsoDate(value)) {
        reportMismatch(at, 'date')
      }
      return
    case 'options':
      checkOptions(value, setting, at)
  }
}

const checkSetting = (value: JsonValue | Varying, setting: Setting<unknown>, at: At): void => {
  if (!isVarying(value)) {
    checkValue(value, setting, at)
    return
  }
  if (!setting.varies) {
    report(at.walk, { code: 'notVarying', path: at.path, params: { setting: at.name } })
    return
  }
  value.cases.forEach((entry, index) => {
    checkCondition(entry.when, pathTo.caseWhen(at.path, index), at.walk)
    checkValue(entry.value, setting, { ...at, path: `${pathTo.case(at.path, index)}.value` })
  })
  checkValue(value.otherwise, setting, { ...at, path: `${at.path}.otherwise` })
}

/**
 * Checks the settings of one field against its field kind: each known setting in the kind's
 * order, then those the kind does not have.
 */
export function checkSettings(
  field: FieldItem,
  kind: FieldKind<unknown>,
  { walk, path }: { walk: CheckWalk; path: string },
): void {
  const values = field.settings ?? {}

  for (const [name, setting] of Object.entries(kind.settings)) {
    const settingPath = pathTo.setting(path, name)
    const value = values[name]
    if (value === undefined && setting.required) {
      report(walk, { code: 'missingSetting', path: settingPath, params: { setting: name } })
    }
    if (value !== undefined) {
      checkSetting(value, setting, { walk, path: settingPath, name })
    }
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
