import type { Varying } from '../form-document'
import { isVarying } from '../is-varying'
import type { JsonValue } from '../json-value'
import type { DocumentOption } from '../kinds/document-option'
import { optionValuesOf } from '../kinds/option-values-of'
import type { Setting } from '../kinds/setting'
import { pathTo } from '../path-to'
import type { Text } from '../text'
import { checkCondition } from './check-condition'
import { checkOptionValues } from './check-option-values'
import { checkText } from './check-text'
import { checkVaryingText } from './check-varying-text'
import type { CheckWalk } from './check-walk'
import { fitsSettingType } from './fits-setting-type'
import { report } from './report'

/** A field, a block or a display: what holds the settings of a kind. */
type Owner = { key: string; settings?: Record<string, JsonValue | Varying> }

type CheckText = (text: Text, at: { walk: CheckWalk; path: string }) => void

type At = { walk: CheckWalk; path: string; name: string; field: Owner; checkTextOf: CheckText }

const reportMismatch = ({ walk, path, name }: At, type: string): void => {
  report(walk, { code: 'settingMismatch', path, params: { setting: name, type } })
}

const checkOptionTexts = (option: DocumentOption, { walk, path, checkTextOf }: At): void => {
  checkVaryingText(option.label, { walk, path: `${path}.label` }, checkTextOf)
  if (option.description !== undefined) {
    checkVaryingText(option.description, { walk, path: `${path}.description` }, checkTextOf)
  }
}

const checkOptions = (value: DocumentOption[], setting: Setting<unknown>, at: At): void => {
  const seen = new Set<string>()
  value.forEach((option, index) => {
    const optionPath = `${at.path}[${index}]`
    if (seen.has(option.value)) {
      report(at.walk, {
        code: 'duplicateOption',
        path: `${optionPath}.value`,
        params: { value: option.value },
      })
    }
    seen.add(option.value)
    checkOptionTexts(option, { ...at, path: optionPath })
  })
  if (setting.minCount !== undefined && value.length < setting.minCount) {
    report(at.walk, {
      code: 'settingLimit',
      path: at.path,
      params: { setting: at.name, minCount: setting.minCount },
    })
  }
}

const checkLength = (value: string, setting: Setting<unknown>, at: At): void => {
  if (setting.maxLength !== undefined && value.length > setting.maxLength) {
    report(at.walk, {
      code: 'settingLimit',
      path: at.path,
      params: { setting: at.name, maxLength: setting.maxLength },
    })
  }
}

const checkTextSetting = (value: Text, setting: Setting<unknown>, at: At): void => {
  at.checkTextOf(value, at)
  if (typeof value === 'string') {
    checkLength(value, setting, at)
    return
  }
  for (const [language, translation] of Object.entries(value)) {
    checkLength(translation, setting, { ...at, path: `${at.path}.${language}` })
  }
}

const checkNumber = (value: number, setting: Setting<unknown>, at: At): void => {
  if (setting.integer === true && !Number.isInteger(value)) {
    report(at.walk, {
      code: 'settingLimit',
      path: at.path,
      params: { setting: at.name, integer: true },
    })
  }
}

// Each case runs once the value has the setting's type, which `fitsSettingType` checked.
const checkValue = (value: JsonValue, setting: Setting<unknown>, at: At): void => {
  if (!fitsSettingType(value, setting.type)) {
    reportMismatch(at, setting.type)
    return
  }
  switch (setting.type) {
    case 'text':
      checkTextSetting(value as Text, setting, at)
      return
    case 'number':
      checkNumber(value as number, setting, at)
      return
    case 'options':
      checkOptions(value as DocumentOption[], setting, at)
      return
    case 'option':
    case 'optionList':
      checkOptionValues(
        value,
        { field: at.field.key, options: optionValuesOf(at.field) },
        { walk: at.walk, path: at.path },
      )
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
 * Checks the settings of one field, block or display against its kind: each known setting in the
 * kind's order, then those the kind does not have. A text setting is checked with `checkTextOf`,
 * which a display, whose texts name no answers, sets to {@link checkFixedText}.
 */
export function checkSettings(
  field: Owner,
  kind: { readonly settings: Readonly<Record<string, Setting<unknown>>> },
  {
    walk,
    path,
    checkTextOf = checkText,
  }: { walk: CheckWalk; path: string; checkTextOf?: CheckText },
): void {
  const values = field.settings ?? {}

  for (const [name, setting] of Object.entries(kind.settings)) {
    const settingPath = pathTo.setting(path, name)
    const value = values[name]
    if (value === undefined && setting.required) {
      report(walk, { code: 'missingSetting', path: settingPath, params: { setting: name } })
    }
    if (value !== undefined) {
      checkSetting(value, setting, { walk, path: settingPath, name, field, checkTextOf })
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
