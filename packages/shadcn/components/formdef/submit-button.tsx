'use client'

import { useStore } from '@tanstack/react-form'
import { LoaderCircleIcon } from 'lucide-react'
import type { ComponentProps, ReactNode } from 'react'

import { Button } from '@/components/ui/button'
import { useSlow } from '@/hooks/formdef/use-slow'
import { useFormContext } from '@/lib/formdef/context'

type SubmitButtonProps = Pick<ComponentProps<typeof Button>, 'variant' | 'size' | 'className'> & {
  label: string
  icon?: ReactNode
}

export const SubmitButton = ({ label, icon, ...attrs }: SubmitButtonProps) => {
  const form = useFormContext()
  const isSubmitting = useStore(form.store, (state) => state.isSubmitting)
  const isSlow = useSlow(isSubmitting)

  return (
    <Button
      {...attrs}
      type="submit"
      aria-busy={isSubmitting}
      aria-disabled={isSubmitting}
      onMouseDown={(event) => event.preventDefault()}
      onClick={(event) => {
        if (isSubmitting) {
          event.preventDefault()
        }
      }}
    >
      {isSlow ? (
        <LoaderCircleIcon
          data-slot="spinner"
          className="motion-safe:animate-spin motion-reduce:animate-pulse"
        />
      ) : (
        icon
      )}
      {label}
    </Button>
  )
}
