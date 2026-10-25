import { describe, expect, it } from 'vitest'

import { fromIsoDate, outsideBounds, toIsoDate } from '@/lib/formdef/date'

const roundTrip = (iso: string): string | undefined => {
  const date = fromIsoDate(iso)

  return date === undefined ? undefined : toIsoDate(date)
}

describe('fromIsoDate and toIsoDate', () => {
  it('read a real day back as itself', () => {
    expect(roundTrip('2026-03-01')).toBe('2026-03-01')
    expect(roundTrip('2024-02-29')).toBe('2024-02-29')
    expect(roundTrip('0999-01-01')).toBe('0999-01-01')
  })

  it('refuse a day that does not exist instead of rolling it over', () => {
    expect(roundTrip('2026-02-30')).toBeUndefined()
    expect(roundTrip('2025-02-29')).toBeUndefined()
    expect(roundTrip('2026-13-01')).toBeUndefined()
  })

  it('refuse anything that is not a plain ISO day', () => {
    expect(roundTrip('')).toBeUndefined()
    expect(roundTrip('2026-3-1')).toBeUndefined()
    expect(roundTrip('2026-03-01T09:00')).toBeUndefined()
  })
})

describe('outsideBounds', () => {
  it('turns the bounds into the days a calendar disables', () => {
    expect(outsideBounds('2026-03-01', '2026-03-31', 'stay')).toEqual([
      { before: new Date(2026, 2, 1) },
      { after: new Date(2026, 2, 31) },
    ])
    expect(outsideBounds(undefined, undefined, 'stay')).toEqual([])
  })

  it('throws with the path for a bound that is no ISO date', () => {
    expect(() => outsideBounds('2026-02-30', undefined, 'stay')).toThrow(
      'formdef: field "stay" bounds its dates with "2026-02-30", which is no ISO date (YYYY-MM-DD).',
    )
  })
})
