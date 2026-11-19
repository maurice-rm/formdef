'use client'

import type { StepperVariant } from '@formdef/shadcn/components/formdef/stepper'
import { createContext } from 'react'

/** The variant the stepper preview shows; its picker sets it. */
export const StepperVariantContext = createContext<StepperVariant>('steps')
