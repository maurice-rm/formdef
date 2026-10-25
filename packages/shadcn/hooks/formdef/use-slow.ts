'use client'

import { useEffect, useState } from 'react'

const NOTICEABLE_MS = 300

export const useSlow = (isRunning: boolean): boolean => {
  const [isSlow, setIsSlow] = useState(false)

  useEffect(() => {
    if (!isRunning) {
      setIsSlow(false)
      return
    }

    const timer = setTimeout(() => setIsSlow(true), NOTICEABLE_MS)

    return () => clearTimeout(timer)
  }, [isRunning])

  return isSlow
}
