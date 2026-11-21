/** Refuses settings with a formatted text, for a kind whose texts do not render formatted. */
export type WithoutFormattedSettings<TSettings> = true extends {
  [Name in keyof TSettings]: TSettings[Name] extends { formatted: true } ? true : false
}[keyof TSettings]
  ? { settings: never }
  : unknown
