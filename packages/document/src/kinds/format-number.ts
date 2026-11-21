// Thousands are grouped from five digits on, so a year such as 1978 stays as it is.
const GROUPED_FROM = 10_000
const ALL_DIGITS = 20

/** A number written in a language, or as plain digits without one. */
export function formatNumber(value: number, language: string | undefined): string {
  if (language === undefined) {
    return String(value)
  }
  // Intl writes -0, such as a rounded -0.3, as "-0"; String writes it as "0".
  const unsigned = value === 0 ? 0 : value
  return new Intl.NumberFormat(language, {
    useGrouping: Math.abs(unsigned) >= GROUPED_FROM,
    maximumFractionDigits: ALL_DIGITS,
  }).format(unsigned)
}
