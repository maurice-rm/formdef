import type { Varying } from '../form-document'
import { isPlainObject } from '../is-plain-object'
import type { JsonValue } from '../json-value'
import { looksVarying } from '../looks-varying'
import { readJson } from './read-json'
import { readShape } from './read-shape'
import { readVarying } from './read-varying'
import { readVaryingText } from './read-varying-text'

const OPTION_TEXTS = ['label', 'description']

const readOption = (value: unknown, path: string): JsonValue => {
  const entry = readJson(value, path)
  if (!isPlainObject(value) || !OPTION_TEXTS.some((name) => looksVarying(value[name]))) {
    return entry
  }
  const texts = OPTION_TEXTS.filter((name) => looksVarying(value[name])).map((name) => [
    name,
    readVaryingText(value[name], `${path}.${name}`),
  ])
  return { ...(entry as Record<string, JsonValue>), ...Object.fromEntries(texts) }
}

const readSettingValue = (value: unknown, path: string): JsonValue =>
  Array.isArray(value)
    ? value.map((entry, index) => readOption(entry, `${path}[${index}]`))
    : readJson(value, path)

const readSetting = (value: unknown, path: string): JsonValue | Varying =>
  looksVarying(value) ? readVarying(value, path, readSettingValue) : readSettingValue(value, path)

/** Reads the settings of a kind by name, each a JSON value or one that follows an answer. */
export function readSettings(value: unknown, path: string): Record<string, JsonValue | Varying> {
  return Object.fromEntries(
    Object.entries(readShape(value, path)).map(([name, setting]) => [
      name,
      readSetting(setting, `${path}.${name}`),
    ]),
  )
}
