import type { Setting } from '../kinds/setting'

/** A constraint of a number setting that a value breaks. */
export type NumberLimit = { integer: true } | { min: number } | { max: number }

/** The first constraint of a number setting the value breaks; `undefined` when it keeps them. */
export function numberLimitBroken(
  value: number,
  setting: Setting<unknown>,
): NumberLimit | undefined {
  if (setting.integer === true && !Number.isInteger(value)) {
    return { integer: true }
  }
  if (setting.min !== undefined && value < setting.min) {
    return { min: setting.min }
  }
  if (setting.max !== undefined && value > setting.max) {
    return { max: setting.max }
  }
  return undefined
}
