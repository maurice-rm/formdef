'use client'

import type { StepperVariant } from '@formdef/shadcn/components/formdef/stepper'
import { Button } from '@formdef/shadcn/components/ui/button'
import { useState } from 'react'

import { StepperPreview } from './stepper'
import { StepperVariantContext } from './stepper-variant-context'

const VARIANTS: { value: StepperVariant; label: string }[] = [
  { value: 'steps', label: 'Steps' },
  { value: 'rail', label: 'Rail' },
  { value: 'segments', label: 'Segments' },
  { value: 'compact', label: 'Compact' },
]

/** The stepper preview with a picker for its variant. */
export const StepperVariantPreview = () => {
  const [variant, setVariant] = useState<StepperVariant>('steps')

  return (
    <div className="flex flex-col gap-6">
      <fieldset className="flex flex-wrap gap-2">
        <legend className="sr-only">Variant</legend>
        {VARIANTS.map((option) => (
          <Button
            key={option.value}
            type="button"
            size="sm"
            variant={option.value === variant ? 'secondary' : 'ghost'}
            aria-pressed={option.value === variant}
            onClick={() => setVariant(option.value)}
          >
            {option.label}
          </Button>
        ))}
      </fieldset>
      <StepperVariantContext value={variant}>
        <StepperPreview />
      </StepperVariantContext>
    </div>
  )
}
