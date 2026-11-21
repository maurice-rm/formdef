import type { Setting } from './setting'

/** Whether a setting is a text written in limited Markdown, which renders formatted. */
export function isFormattedText(setting: Setting<unknown> | undefined): boolean {
  return setting?.type === 'text' && setting.formatted === true
}
