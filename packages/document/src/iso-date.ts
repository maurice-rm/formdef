const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/
const ISO_DAY_LENGTH = 10

/** The day of an ISO date, with or without a time, such as `2026-01-31` of `2026-01-31T09:00`. */
export const dayOf = (value: string): string => value.slice(0, ISO_DAY_LENGTH)

/** Whether a value is an existing date as an ISO string without a time, such as `2026-01-31`. */
export const isIsoDate = (value: unknown): value is string => {
  if (typeof value !== 'string') return false
  const match = ISO_DATE.exec(value)
  if (match === null) return false

  const [, year = 0, month = 0, day = 0] = match.map(Number)
  // setUTCFullYear, since Date.UTC reads the years 0 to 99 as 1900 to 1999.
  const date = new Date(0)
  date.setUTCFullYear(year, month - 1, day)

  return (
    date.getUTCFullYear() === year && date.getUTCMonth() + 1 === month && date.getUTCDate() === day
  )
}
