'use client'

import type { StepperProps } from '@formdef/core'
import { cva } from 'class-variance-authority'
import { cn } from 'cn'
import { ArrowLeft, ArrowRight, Check, TriangleAlert } from 'lucide-react'
import * as React from 'react'

import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'

type StepperStepProps = {
  description?: string | undefined
  icon?: React.ReactNode
}

type StepperStep = StepperProps<StepperStepProps>['steps'][number]

type StepperVariant = 'steps' | 'rail' | 'segments' | 'compact'

type StepperSize = 'sm' | 'default' | 'lg'

type StepperMarkerKind = 'number' | 'icon' | 'dot'

type StepperBreakpoint = 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl'

type StepperActionsAlign = 'between' | 'end'

type StepperLabels = 'all' | 'current' | 'currentExpanded'

type StepperRailStepSize = 'auto' | 'sm' | 'default' | 'lg'

type StepperItemState = 'complete' | 'current' | 'upcoming' | 'error'

type StepperTexts = {
  backLabel?: string | undefined
  nextLabel?: string | undefined
  submitLabel?: string | undefined
  errorLabel?: string | undefined
  completeLabel?: string | undefined
  progressLabel?: ((step: number, total: number) => string) | undefined
  upNextLabel?: ((label: string) => string) | undefined
}

type StepperOptions = {
  variant?: StepperVariant | undefined
  size?: StepperSize | undefined
  marker?: StepperMarkerKind | undefined
  showDescriptions?: boolean | undefined
  showProgress?: boolean | undefined
  showHeading?: boolean | undefined
  showUpNext?: boolean | undefined
  labels?: StepperLabels | undefined
  railStepSize?: StepperRailStepSize | undefined
  collapseBelow?: StepperBreakpoint | 'never' | undefined
  collapsedVariant?: StepperVariant | undefined
  navigable?: boolean | undefined
  actions?: StepperActionsAlign | undefined
  stickyActions?: boolean | undefined
  className?: string | undefined
}

type StepperRootProps = StepperProps<StepperStepProps> & StepperOptions & StepperTexts

const COLLAPSE_CLASSES: Record<
  StepperBreakpoint,
  { narrow: string; wide: string; railColumns: string }
> = {
  sm: {
    narrow: '@sm/stepper:hidden',
    wide: 'hidden @sm/stepper:block',
    railColumns: '@sm/stepper:grid-cols-[14rem_minmax(0,1fr)]',
  },
  md: {
    narrow: '@md/stepper:hidden',
    wide: 'hidden @md/stepper:block',
    railColumns: '@md/stepper:grid-cols-[14rem_minmax(0,1fr)]',
  },
  lg: {
    narrow: '@lg/stepper:hidden',
    wide: 'hidden @lg/stepper:block',
    railColumns: '@lg/stepper:grid-cols-[14rem_minmax(0,1fr)]',
  },
  xl: {
    narrow: '@xl/stepper:hidden',
    wide: 'hidden @xl/stepper:block',
    railColumns: '@xl/stepper:grid-cols-[14rem_minmax(0,1fr)]',
  },
  '2xl': {
    narrow: '@2xl/stepper:hidden',
    wide: 'hidden @2xl/stepper:block',
    railColumns: '@2xl/stepper:grid-cols-[14rem_minmax(0,1fr)]',
  },
  '3xl': {
    narrow: '@3xl/stepper:hidden',
    wide: 'hidden @3xl/stepper:block',
    railColumns: '@3xl/stepper:grid-cols-[14rem_minmax(0,1fr)]',
  },
}

const RAIL_COLUMNS = 'grid-cols-[14rem_minmax(0,1fr)]'

const DEFAULT_COLLAPSE: Record<StepperVariant, StepperBreakpoint | 'never'> = {
  steps: 'never',
  rail: '3xl',
  segments: 'never',
  compact: 'never',
}

const DEFAULT_COLLAPSED_VARIANT: Record<StepperVariant, StepperVariant> = {
  steps: 'compact',
  rail: 'steps',
  segments: 'compact',
  compact: 'compact',
}

const DEFAULT_ERROR_LABEL = 'Has errors'

const DEFAULT_COMPLETE_LABEL = 'Complete'

type StepperNavProps = {
  variant: StepperVariant
  steps: readonly StepperStep[]
  current: number
  goTo: (index: number) => void
  marker: StepperMarkerKind
  navigable: boolean
  showDescriptions: boolean
  showUpNext: boolean
  labels: StepperLabels
  railStepSize: StepperRailStepSize
  errorLabel: string
  completeLabel: string
  progress: string
  upNext: string | undefined
}

type Collapse = (typeof COLLAPSE_CLASSES)[StepperBreakpoint]

type StepperListProps = {
  steps: readonly StepperStep[]
  goTo: (index: number) => void
  marker?: StepperMarkerKind | undefined
  navigable?: boolean | undefined
  showDescriptions?: boolean | undefined
  labels?: StepperLabels | undefined
  railStepSize?: StepperRailStepSize | undefined
  errorLabel?: string | undefined
  completeLabel?: string | undefined
  className?: string | undefined
}

const RAIL_STEP_HEIGHTS: Record<StepperRailStepSize, string | undefined> = {
  auto: undefined,
  sm: 'not-last:min-h-16',
  default: 'not-last:min-h-20',
  lg: 'not-last:min-h-28',
}

const segmentVariants = cva(
  'h-1 w-full rounded-full transition-colors group-data-[size=lg]/stepper:h-1.5',
  {
    variants: {
      state: {
        complete: 'bg-foreground',
        current: 'bg-primary',
        upcoming: 'bg-muted',
        error: 'bg-destructive',
      },
    },
  },
)

const markerVariants = cva(
  'flex size-(--stepper-marker) shrink-0 items-center justify-center rounded-full border font-medium tabular-nums transition-colors',
  {
    variants: {
      kind: {
        number:
          'text-xs group-data-[size=lg]/stepper:text-sm [&_svg]:size-4 group-data-[size=sm]/stepper:[&_svg]:size-3.5',
        icon: '[&_svg]:size-4 group-data-[size=lg]/stepper:[&_svg]:size-5 group-data-[size=sm]/stepper:[&_svg]:size-3.5',
        dot: 'border-0',
      },
      state: {
        complete:
          'border-transparent bg-muted text-foreground group-hover/stepper-trigger:bg-foreground group-hover/stepper-trigger:text-background',
        current: 'border-transparent bg-primary text-primary-foreground',
        upcoming: 'border-border bg-background text-muted-foreground',
        error: 'border-destructive/40 bg-destructive/10 text-destructive',
      },
    },
    compoundVariants: [
      { kind: 'dot', state: 'complete', className: 'bg-foreground' },
      {
        kind: 'dot',
        state: 'current',
        className: 'bg-primary ring-4 ring-primary/25',
      },
      { kind: 'dot', state: 'upcoming', className: 'bg-border' },
      { kind: 'dot', state: 'error', className: 'bg-destructive' },
    ],
  },
)

function progressOf(step: number, total: number) {
  return `Step ${step} of ${total}`
}

function upNextOf(label: string) {
  return `Up next: ${label}`
}

function runOnWidthOf(index: number, total: number) {
  const share = (total - 1 - index) / (total - 1)
  return `calc((100cqw - var(--stepper-marker) - 1rem) * ${share} + var(--stepper-marker) + 1rem)`
}

function stateOf(step: StepperStep): StepperItemState {
  if (step.hasDueError) {
    return 'error'
  }
  if (step.isCurrent) {
    return 'current'
  }
  return step.isComplete ? 'complete' : 'upcoming'
}

function StepperNav({
  variant,
  steps,
  current,
  progress,
  upNext,
  showUpNext,
  ...list
}: StepperNavProps) {
  const listProps = { steps, ...list }
  if (variant === 'rail') {
    return <StepperRail {...listProps} />
  }
  if (variant === 'segments') {
    return <StepperSegments {...listProps} />
  }
  if (variant === 'compact') {
    return (
      <StepperCompact
        value={current + 1}
        max={steps.length}
        progress={progress}
        upNext={showUpNext ? upNext : undefined}
        hasError={steps[current]?.hasDueError}
        errorLabel={list.errorLabel}
      />
    )
  }
  return <StepperSteps {...listProps} />
}

function collapseOf(
  variant: StepperVariant,
  collapseBelow: StepperBreakpoint | 'never',
  collapsedVariant: StepperVariant,
): Collapse | undefined {
  if (collapseBelow === 'never' || collapsedVariant === variant) {
    return undefined
  }
  return COLLAPSE_CLASSES[collapseBelow]
}

function layoutClassOf(variant: StepperVariant, collapse: Collapse | undefined) {
  return cn(
    'grid grid-cols-1 gap-8',
    variant === 'rail' && cn(collapse ? collapse.railColumns : RAIL_COLUMNS, '@3xl/stepper:gap-12'),
  )
}

function eyebrowClassOf(
  variant: StepperVariant,
  collapsedVariant: StepperVariant,
  collapse: Collapse | undefined,
) {
  if (variant === 'compact') {
    return collapse ? collapse.narrow : 'hidden'
  }
  return collapsedVariant === 'compact' ? collapse?.wide : undefined
}

function Stepper({
  steps,
  current,
  back,
  goTo,
  isFirst,
  isLast,
  isSubmitting,
  children,
  className,
  variant = 'steps',
  size = 'default',
  marker = 'number',
  showDescriptions = true,
  showProgress = true,
  showHeading = true,
  showUpNext = true,
  labels = 'all',
  railStepSize = 'auto',
  collapseBelow = DEFAULT_COLLAPSE[variant],
  collapsedVariant = DEFAULT_COLLAPSED_VARIANT[variant],
  navigable = true,
  actions = 'between',
  stickyActions = false,
  backLabel = 'Back',
  nextLabel = 'Next',
  submitLabel = 'Submit',
  errorLabel = DEFAULT_ERROR_LABEL,
  completeLabel = DEFAULT_COMPLETE_LABEL,
  progressLabel = progressOf,
  upNextLabel = upNextOf,
}: StepperRootProps) {
  const titleId = React.useId()
  const title = React.useRef<HTMLHeadingElement | null>(null)
  const step = steps[current]
  const label = step?.label
  const shownLabel = React.useRef(label)
  const following = steps[current + 1]
  const progress = progressLabel(current + 1, steps.length)

  React.useEffect(() => {
    if (shownLabel.current === label) {
      return
    }
    shownLabel.current = label
    title.current?.focus()
  }, [label])

  const collapse = collapseOf(variant, collapseBelow, collapsedVariant)
  const eyebrowClass = eyebrowClassOf(variant, collapsedVariant, collapse)
  const heading = (
    <StepperTitle ref={title} id={titleId} className={cn(!showHeading && 'sr-only')}>
      {label}
    </StepperTitle>
  )
  const nav = {
    steps,
    current,
    goTo,
    marker,
    navigable,
    showDescriptions,
    showUpNext,
    labels,
    railStepSize,
    errorLabel,
    completeLabel,
    progress,
    upNext: following && upNextLabel(following.label),
  }

  return (
    <section
      data-slot="stepper"
      data-variant={variant}
      data-size={size}
      data-marker={marker}
      aria-labelledby={titleId}
      className={cn(
        'group/stepper @container/stepper [--stepper-marker:--spacing(8)] data-[marker=dot]:[--stepper-marker:--spacing(3)] data-[size=lg]:[--stepper-marker:--spacing(10)] data-[size=lg]:data-[marker=dot]:[--stepper-marker:--spacing(3.5)] data-[size=sm]:[--stepper-marker:--spacing(6)] data-[size=sm]:data-[marker=dot]:[--stepper-marker:--spacing(2.5)]',
        className,
      )}
    >
      <div data-slot="stepper-layout" className={layoutClassOf(variant, collapse)}>
        {collapse ? (
          <>
            <div data-slot="stepper-nav" data-collapsed className={collapse.narrow}>
              <StepperNav {...nav} variant={collapsedVariant} />
            </div>
            <div data-slot="stepper-nav" className={collapse.wide}>
              <StepperNav {...nav} variant={variant} />
            </div>
          </>
        ) : (
          <div data-slot="stepper-nav">
            <StepperNav {...nav} variant={variant} />
          </div>
        )}
        <div className="flex min-w-0 flex-col gap-6">
          {showHeading ? (
            <StepperHeading>
              {showProgress && <StepperEyebrow className={eyebrowClass}>{progress}</StepperEyebrow>}
              {heading}
              {showDescriptions && step?.description && (
                <StepperDescription>{step.description}</StepperDescription>
              )}
            </StepperHeading>
          ) : (
            <>
              {showProgress && (
                <StepperHeading className={eyebrowClass}>
                  <StepperEyebrow>{progress}</StepperEyebrow>
                </StepperHeading>
              )}
              {heading}
            </>
          )}
          <StepperContent>{children}</StepperContent>
          <StepperActions align={actions} sticky={stickyActions}>
            {!isFirst && (
              <StepperBack onClick={back} className={cn(actions === 'between' && 'mr-auto')}>
                <ArrowLeft data-icon="inline-start" />
                {backLabel}
              </StepperBack>
            )}
            <StepperNext isSubmitting={isSubmitting}>
              {isLast ? submitLabel : nextLabel}
              {!isLast && <ArrowRight data-icon="inline-end" />}
            </StepperNext>
          </StepperActions>
        </div>
      </div>
    </section>
  )
}

function StepperSteps({
  steps,
  goTo,
  marker = 'number',
  navigable = true,
  showDescriptions = true,
  labels = 'all',
  errorLabel = DEFAULT_ERROR_LABEL,
  completeLabel = DEFAULT_COMPLETE_LABEL,
  className,
}: StepperListProps) {
  return (
    <ol
      data-slot="stepper-steps"
      data-orientation="horizontal"
      className={cn('@container flex', className)}
    >
      {steps.map((step, index) => {
        const isLast = index === steps.length - 1
        const isLabelShown = labels === 'all' || step.isCurrent
        const isLabelRunningOn = labels === 'current' && step.isCurrent && !isLast
        const isExpanded = labels === 'currentExpanded' && step.isCurrent

        return (
          <StepperItem
            key={step.label}
            step={step}
            className={cn('relative min-w-0 flex-1 last:flex-none', isExpanded && 'flex-[3]')}
          >
            {!isLast && (
              <StepperConnector
                isComplete={step.isComplete && !step.isCurrent}
                className="absolute top-[calc(var(--stepper-marker)/2)] right-3 left-[calc(var(--stepper-marker)+0.75rem)]"
              />
            )}
            <StepperTrigger
              step={step}
              navigable={navigable}
              onSelect={() => goTo(index)}
              className="flex-col gap-3 pr-4"
            >
              <StepperMarker step={step} kind={marker} index={index} />
              <StepperLabel
                step={step}
                errorLabel={errorLabel}
                completeLabel={completeLabel}
                className={
                  isLabelShown ? 'sr-only @lg/stepper:not-sr-only @lg/stepper:flex' : 'sr-only'
                }
                textClassName={cn(isLabelRunningOn && 'w-max')}
                textStyle={
                  isLabelRunningOn ? { maxWidth: runOnWidthOf(index, steps.length) } : undefined
                }
                descriptionClassName={cn('hidden', showDescriptions && '@3xl/stepper:block')}
              />
            </StepperTrigger>
          </StepperItem>
        )
      })}
    </ol>
  )
}

function StepperRail({
  steps,
  goTo,
  marker = 'number',
  navigable = true,
  showDescriptions = true,
  railStepSize = 'auto',
  errorLabel = DEFAULT_ERROR_LABEL,
  completeLabel = DEFAULT_COMPLETE_LABEL,
  className,
}: StepperListProps) {
  return (
    <ol
      data-slot="stepper-rail"
      data-orientation="vertical"
      className={cn('flex flex-col', className)}
    >
      {steps.map((step, index) => (
        <StepperItem
          key={step.label}
          step={step}
          className={cn('relative pb-6 last:pb-0', RAIL_STEP_HEIGHTS[railStepSize])}
        >
          {index < steps.length - 1 && (
            <StepperConnector
              isComplete={step.isComplete && !step.isCurrent}
              className="absolute top-[calc(max(var(--stepper-marker),1.25rem)+0.5rem)] bottom-2 left-[calc(max(var(--stepper-marker),1.25rem)/2)] h-auto w-px -translate-x-1/2"
            />
          )}
          <StepperTrigger
            step={step}
            navigable={navigable}
            onSelect={() => goTo(index)}
            className="items-start gap-3"
          >
            <span className="flex size-[max(var(--stepper-marker),1.25rem)] shrink-0 items-center justify-center">
              <StepperMarker step={step} kind={marker} index={index} />
            </span>
            <StepperLabel
              step={step}
              errorLabel={errorLabel}
              completeLabel={completeLabel}
              className="flex pt-[max(0px,calc((var(--stepper-marker)_-_1.25rem)/2))]"
              descriptionClassName={cn(!showDescriptions && 'hidden')}
            />
          </StepperTrigger>
        </StepperItem>
      ))}
    </ol>
  )
}

function StepperSegments({
  steps,
  goTo,
  navigable = true,
  showDescriptions = true,
  errorLabel = DEFAULT_ERROR_LABEL,
  completeLabel = DEFAULT_COMPLETE_LABEL,
  className,
}: StepperListProps) {
  return (
    <ol
      data-slot="stepper-segments"
      data-orientation="horizontal"
      className={cn('grid auto-cols-fr grid-flow-col gap-2', className)}
    >
      {steps.map((step, index) => (
        <StepperItem key={step.label} step={step} className="min-w-0">
          <StepperTrigger
            step={step}
            navigable={navigable}
            onSelect={() => goTo(index)}
            className="w-full flex-col gap-3 py-1"
          >
            <span
              data-slot="stepper-segment"
              data-state={stateOf(step)}
              className={segmentVariants({ state: stateOf(step) })}
            />
            <StepperLabel
              step={step}
              errorLabel={errorLabel}
              completeLabel={completeLabel}
              className="sr-only w-full @lg/stepper:not-sr-only @lg/stepper:flex"
              descriptionClassName={cn('hidden', showDescriptions && '@3xl/stepper:block')}
            />
          </StepperTrigger>
        </StepperItem>
      ))}
    </ol>
  )
}

function StepperCompact({
  className,
  value,
  max,
  progress,
  upNext,
  hasError = false,
  errorLabel = DEFAULT_ERROR_LABEL,
  ...props
}: React.ComponentProps<'div'> & {
  value: number
  max: number
  progress: string
  upNext?: string | undefined
  hasError?: boolean | undefined
  errorLabel?: string | undefined
}) {
  return (
    <div
      data-slot="stepper-compact"
      data-state={hasError ? 'error' : undefined}
      className={cn('flex flex-col gap-3', className)}
      {...props}
    >
      <div className="flex items-baseline justify-between gap-4 text-sm">
        <p
          className={cn(
            'flex items-center gap-1.5 font-medium tabular-nums @md/stepper:shrink-0',
            hasError && 'text-destructive',
          )}
        >
          {hasError && <TriangleAlert className="size-4 shrink-0 self-center" />}
          {progress}
          {hasError && <span className="sr-only">, {errorLabel}</span>}
        </p>
        {upNext && (
          <p className="hidden text-end text-pretty text-muted-foreground @md/stepper:block">
            {upNext}
          </p>
        )}
      </div>
      <Progress
        value={value}
        max={max}
        aria-label={progress}
        getAriaValueText={() => progress}
        className={cn(
          '**:data-[slot=progress-track]:h-2 group-data-[size=lg]/stepper:**:data-[slot=progress-track]:h-3 group-data-[size=sm]/stepper:**:data-[slot=progress-track]:h-1.5',
          hasError && '**:data-[slot=progress-indicator]:bg-destructive',
        )}
      />
    </div>
  )
}

function StepperItem({
  className,
  step,
  ...props
}: React.ComponentProps<'li'> & { step: StepperStep }) {
  return (
    <li
      data-slot="stepper-item"
      data-state={stateOf(step)}
      data-reachable={step.isReachable}
      className={className}
      {...props}
    />
  )
}

function StepperTrigger({
  step,
  navigable = true,
  onSelect,
  className,
  children,
}: {
  step: StepperStep
  navigable?: boolean | undefined
  onSelect: () => void
  className?: string | undefined
  children: React.ReactNode
}) {
  const base = cn('group/stepper-trigger flex rounded-xl text-left outline-none', className)
  if (!navigable || !step.isReachable || step.isCurrent) {
    return (
      <span
        data-slot="stepper-trigger"
        data-state={stateOf(step)}
        aria-current={step.isCurrent ? 'step' : undefined}
        className={base}
      >
        {children}
      </span>
    )
  }
  return (
    <button
      type="button"
      data-slot="stepper-trigger"
      data-state={stateOf(step)}
      onClick={onSelect}
      className={cn(base, 'cursor-pointer focus-visible:ring-3 focus-visible:ring-ring/30')}
    >
      {children}
    </button>
  )
}

function StepperMarker({
  className,
  step,
  kind = 'number',
  index,
  ...props
}: React.ComponentProps<'span'> & {
  step: StepperStep
  kind?: StepperMarkerKind | undefined
  index: number
}) {
  const state = stateOf(step)
  return (
    <span
      data-slot="stepper-marker"
      data-state={state}
      data-kind={kind}
      className={cn(markerVariants({ kind, state }), className)}
      {...props}
    >
      {kind !== 'dot' && <StepperMarkerContent step={step} kind={kind} index={index} />}
    </span>
  )
}

function StepperMarkerContent({
  step,
  kind,
  index,
}: {
  step: StepperStep
  kind: StepperMarkerKind
  index: number
}) {
  const state = stateOf(step)
  if (state === 'error') {
    return <TriangleAlert />
  }
  if (state === 'complete') {
    return <Check strokeWidth={2.25} />
  }
  if (kind === 'icon' && step.icon) {
    return step.icon
  }
  return index + 1
}

function StepperConnector({
  className,
  isComplete,
  ...props
}: React.ComponentProps<'span'> & { isComplete: boolean }) {
  return (
    <span
      aria-hidden
      data-slot="stepper-connector"
      data-complete={isComplete}
      className={cn(
        'block h-px bg-border transition-colors data-[complete=true]:bg-foreground/40',
        className,
      )}
      {...props}
    />
  )
}

function StepperLabel({
  step,
  errorLabel = DEFAULT_ERROR_LABEL,
  completeLabel = DEFAULT_COMPLETE_LABEL,
  className,
  textClassName,
  textStyle,
  descriptionClassName,
}: {
  step: StepperStep
  errorLabel?: string | undefined
  completeLabel?: string | undefined
  className?: string | undefined
  textClassName?: string | undefined
  textStyle?: React.CSSProperties | undefined
  descriptionClassName?: string | undefined
}) {
  const state = stateOf(step)
  return (
    <span
      data-slot="stepper-label"
      data-state={state}
      className={cn('min-w-0 flex-col gap-0.5', className)}
    >
      <span
        style={textStyle}
        className={cn(
          'font-heading text-sm font-medium text-balance wrap-break-word transition-colors group-data-[size=lg]/stepper:text-base',
          state === 'upcoming' && 'text-muted-foreground',
          state === 'error' && 'text-destructive',
          step.isReachable && !step.isCurrent && 'group-hover/stepper-trigger:text-foreground',
          textClassName,
        )}
      >
        {step.label}
        {state === 'error' && <span className="sr-only">, {errorLabel}</span>}
        {state === 'complete' && <span className="sr-only">, {completeLabel}</span>}
      </span>
      {step.description && (
        <span
          data-slot="stepper-label-description"
          className={cn(
            'text-xs text-pretty text-muted-foreground group-data-[size=lg]/stepper:text-sm',
            descriptionClassName,
          )}
        >
          {step.description}
        </span>
      )}
    </span>
  )
}

function StepperHeading({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="stepper-heading"
      className={cn('flex min-w-0 flex-col gap-1', className)}
      {...props}
    />
  )
}

function StepperEyebrow({ className, ...props }: React.ComponentProps<'p'>) {
  return (
    <p
      data-slot="stepper-eyebrow"
      className={cn('text-sm text-muted-foreground tabular-nums', className)}
      {...props}
    />
  )
}

function StepperTitle({ className, ...props }: React.ComponentProps<'h2'>) {
  return (
    <h2
      data-slot="stepper-title"
      tabIndex={-1}
      className={cn(
        'font-heading text-xl font-medium text-balance outline-none group-data-[size=lg]/stepper:text-2xl group-data-[size=sm]/stepper:text-lg',
        className,
      )}
      {...props}
    />
  )
}

function StepperDescription({ className, ...props }: React.ComponentProps<'p'>) {
  return (
    <p
      data-slot="stepper-description"
      className={cn('text-sm text-pretty text-muted-foreground', className)}
      {...props}
    />
  )
}

function StepperContent({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div data-slot="stepper-content" className={cn('flex flex-col gap-6', className)} {...props} />
  )
}

function StepperActions({
  className,
  align = 'between',
  sticky = false,
  ...props
}: React.ComponentProps<'div'> & {
  align?: StepperActionsAlign | undefined
  sticky?: boolean | undefined
}) {
  return (
    <div
      data-slot="stepper-actions"
      data-align={align}
      data-sticky={sticky}
      className={cn(
        'flex justify-end gap-2 border-t pt-6 data-[sticky=true]:sticky data-[sticky=true]:bottom-0 data-[sticky=true]:z-10 data-[sticky=true]:bg-background data-[sticky=true]:pb-4',
        className,
      )}
      {...props}
    />
  )
}

function StepperBack({ className, ...props }: Omit<React.ComponentProps<typeof Button>, 'type'>) {
  return (
    <Button
      data-slot="stepper-back"
      type="button"
      variant="outline"
      className={className}
      {...props}
    />
  )
}

function StepperNext({
  className,
  isSubmitting,
  onClick,
  ...props
}: Omit<React.ComponentProps<typeof Button>, 'type'> & {
  isSubmitting: boolean
}) {
  return (
    <Button
      data-slot="stepper-next"
      type="submit"
      aria-busy={isSubmitting}
      aria-disabled={isSubmitting}
      className={className}
      onClick={(event) => {
        if (isSubmitting) {
          event.preventDefault()
          return
        }
        onClick?.(event)
      }}
      {...props}
    />
  )
}

export {
  Stepper,
  StepperActions,
  type StepperActionsAlign,
  StepperBack,
  type StepperBreakpoint,
  StepperCompact,
  StepperConnector,
  StepperContent,
  StepperDescription,
  StepperEyebrow,
  StepperHeading,
  StepperItem,
  StepperLabel,
  type StepperLabels,
  StepperMarker,
  type StepperMarkerKind,
  StepperNext,
  StepperRail,
  type StepperRailStepSize,
  StepperSegments,
  type StepperSize,
  type StepperStep,
  type StepperStepProps,
  StepperSteps,
  StepperTitle,
  StepperTrigger,
  type StepperVariant,
}
