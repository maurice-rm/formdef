const ISO_DAY_LENGTH = 10

/** The day of an ISO date, with or without a time, such as `2026-01-31` of `2026-01-31T09:00`. */
export function dayOf(value: string): string {
  return value.slice(0, ISO_DAY_LENGTH)
}
