'use client'

import type { StepperProps } from '@formdef/core'
import { cn } from 'cn'
import { useEffect, useId, useRef } from 'react'

import { Button } from '@/components/ui/button'

type StepperFrameProps = StepperProps & {
  className?: string | undefined
  backLabel?: string | undefined
  nextLabel?: string | undefined
  submitLabel?: string | undefined
  progressLabel?: ((step: number, total: number) => string) | undefined
}

const PERCENT = 100

const progressOf = (step: number, total: number): string => `Step ${step} of ${total}`

export const Stepper = ({
  steps,
  current,
  back,
  isFirst,
  isLast,
  isSubmitting,
  children,
  className,
  backLabel = 'Back',
  nextLabel = 'Next',
  submitLabel = 'Submit',
  progressLabel = progressOf,
}: StepperFrameProps) => {
  const headingId = useId()
  const heading = useRef<HTMLHeadingElement | null>(null)
  const label = steps[current]?.label
  const shownLabel = useRef(label)
  const step = current + 1
  const progress = progressLabel(step, steps.length)

  useEffect(() => {
    if (shownLabel.current === label) {
      return
    }
    shownLabel.current = label
    heading.current?.focus()
  }, [label])

  return (
    <section
      data-slot="stepper"
      aria-labelledby={headingId}
      className={cn('flex flex-col gap-6', className)}
    >
      <div className="flex flex-col gap-2">
        <p className="text-muted-foreground text-sm">{progress}</p>
        <div
          role="progressbar"
          aria-label={progress}
          aria-valuemin={1}
          aria-valuemax={steps.length}
          aria-valuenow={step}
          aria-valuetext={progress}
          className="h-1 overflow-hidden rounded-full bg-muted"
        >
          <div
            className="h-full bg-primary transition-[width] motion-reduce:transition-none"
            style={{ width: `${(step / steps.length) * PERCENT}%` }}
          />
        </div>
      </div>
      <h2
        ref={heading}
        id={headingId}
        tabIndex={-1}
        className="font-semibold text-base outline-none"
      >
        {label}
      </h2>
      {children}
      <div className="flex justify-between gap-2 border-t pt-4">
        {isFirst ? (
          <span />
        ) : (
          <Button type="button" variant="outline" onClick={back}>
            {backLabel}
          </Button>
        )}
        <Button
          type="submit"
          aria-busy={isSubmitting}
          aria-disabled={isSubmitting}
          onClick={(event) => {
            if (isSubmitting) {
              event.preventDefault()
            }
          }}
        >
          {isLast ? submitLabel : nextLabel}
        </Button>
      </div>
    </section>
  )
}
