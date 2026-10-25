import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useSlow } from '@/hooks/formdef/use-slow'

const NOTICEABLE_MS = 300

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('useSlow', () => {
  it('turns true only once a run has lasted long enough to notice', () => {
    const { result } = renderHook(() => useSlow(true))

    act(() => vi.advanceTimersByTime(NOTICEABLE_MS - 1))
    expect(result.current).toBe(false)

    act(() => vi.advanceTimersByTime(1))
    expect(result.current).toBe(true)
  })

  it('turns false the moment the run ends, and stays false for a quick one', () => {
    const { result, rerender } = renderHook(({ isRunning }) => useSlow(isRunning), {
      initialProps: { isRunning: true },
    })
    act(() => vi.advanceTimersByTime(NOTICEABLE_MS))
    expect(result.current).toBe(true)

    rerender({ isRunning: false })
    expect(result.current).toBe(false)

    rerender({ isRunning: true })
    act(() => vi.advanceTimersByTime(NOTICEABLE_MS - 1))
    rerender({ isRunning: false })
    act(() => vi.advanceTimersByTime(NOTICEABLE_MS))
    expect(result.current).toBe(false)
  })
})
