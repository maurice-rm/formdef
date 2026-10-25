const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/
const PAD = '0'
const YEAR_DIGITS = 4
const PART_DIGITS = 2

export const toIsoDate = (date: Date): string =>
  [
    String(date.getFullYear()).padStart(YEAR_DIGITS, PAD),
    String(date.getMonth() + 1).padStart(PART_DIGITS, PAD),
    String(date.getDate()).padStart(PART_DIGITS, PAD),
  ].join('-')

export const fromIsoDate = (iso: string): Date | undefined => {
  const match = ISO_DATE.exec(iso)
  if (match === null) {
    return undefined
  }

  const date = new Date(0, 0, 1)
  date.setFullYear(Number(match[1]), Number(match[2]) - 1, Number(match[3]))

  return toIsoDate(date) === iso ? date : undefined
}

const boundOf = (iso: string | undefined, path: string): Date | undefined => {
  if (iso === undefined) {
    return undefined
  }

  const date = fromIsoDate(iso)
  if (date === undefined) {
    throw new Error(
      `formdef: field "${path}" bounds its dates with "${iso}", which is no ISO date (YYYY-MM-DD).`,
    )
  }

  return date
}

export const outsideBounds = (
  min: string | undefined,
  max: string | undefined,
  path: string,
): ({ before: Date } | { after: Date })[] => {
  const before = boundOf(min, path)
  const after = boundOf(max, path)

  return [
    ...(before === undefined ? [] : [{ before }]),
    ...(after === undefined ? [] : [{ after }]),
  ]
}
