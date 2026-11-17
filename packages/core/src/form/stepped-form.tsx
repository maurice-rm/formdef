import { useSelector } from '@tanstack/react-form'
import {
  type ComponentType,
  type ReactNode,
  type RefObject,
  useEffect,
  useRef,
  useState,
} from 'react'

import type { BodyProps, StepperProps, StepState } from '../config/structure'
import { Fields, type FieldsProps } from '../render/fields'
import type { RenderForm } from '../render/render-form'
import { hasDueError } from '../widget/has-due-error'
import type { RootStep, RootSteps } from './root-steps'

type FieldMeta =
  | { errors?: readonly unknown[]; isValid: boolean; isBlurred: boolean; isDirty: boolean }
  | undefined

/** The state of a form, as far as the steps read it. */
type StepFormState = {
  values: unknown
  fieldMeta: Readonly<Record<string, FieldMeta>>
  submissionAttempts: number
  isSubmitting: boolean
}

type StepGroup = { handleSubmit: () => Promise<void> }

type FormGroupProps = {
  name: string
  onGroupSubmit: () => void
  children: (group: StepGroup) => ReactNode
}

/** The form `useAppForm` returns, as far as a stepped form uses it. */
export type StepForm = RenderForm & {
  FormGroup: ComponentType<FormGroupProps>
  store: {
    get: () => StepFormState
    subscribe: (listener: (state: StepFormState) => void) => { unsubscribe: () => void }
  }
  handleSubmit: () => Promise<void>
}

type StepParts = FieldsProps['parts'] & {
  structure: { stepper?: ComponentType<StepperProps>; body?: ComponentType<BodyProps> }
}

type SteppedFormProps = {
  parts: StepParts
  form: StepForm
  fields: FieldsProps['fields']
  steps: RootSteps
  requiredPaths: ReadonlySet<string>
  /** Receives what a submit of the `<form>` element does: `next` of the current step. */
  submitStep: RefObject<(() => void) | undefined>
}

type CurrentStepProps = {
  group: StepGroup
  form: StepForm
  stepper: ComponentType<StepperProps>
  stepperProps: Omit<StepperProps, 'next' | 'children'>
  onAttempt: () => void
  submitStep: SteppedFormProps['submitStep']
  children: ReactNode
}

type VisibleStep = { step: RootStep; position: number }

const NO_STEPPER = 'formdef: the form has steps, but no structure.stepper is registered.'

const isUnder = (path: string, key: string): boolean =>
  path === key || path.startsWith(`${key}.`) || path.startsWith(`${key}[`)

const hasErrorUnder = (fieldMeta: StepFormState['fieldMeta'], key: string): boolean =>
  Object.entries(fieldMeta).some(
    ([path, meta]) => isUnder(path, key) && (meta?.errors?.length ?? 0) > 0,
  )

const hasDueErrorUnder = (
  fieldMeta: StepFormState['fieldMeta'],
  key: string,
  wasSubmitted: boolean,
): boolean =>
  Object.entries(fieldMeta).some(
    ([path, meta]) => isUnder(path, key) && meta !== undefined && hasDueError(meta, wasSubmitted),
  )

const isShown = (step: RootStep, values: unknown): boolean =>
  step.visibleWhen === undefined || step.visibleWhen(values)

const hasSameItems = (first: readonly boolean[], second: readonly boolean[]): boolean =>
  first.length === second.length && first.every((item, index) => item === second[index])

const CurrentStep = ({
  group,
  form,
  stepper: Stepper,
  stepperProps,
  onAttempt,
  submitStep,
  children,
}: CurrentStepProps): ReactNode => {
  const next = (): void => {
    onAttempt()
    void (stepperProps.isLast ? form.handleSubmit() : group.handleSubmit())
  }

  useEffect(() => {
    submitStep.current = next
  })

  return (
    <Stepper {...stepperProps} next={next}>
      {children}
    </Stepper>
  )
}

/**
 * Renders a form whose root layout holds steps: the current step as a TanStack form group at its
 * key, inside the registered stepper. A step moves on when its group submits valid; the last step
 * submits the form. A step its condition hides is skipped, except while it is the current one.
 *
 * @throws When no `structure.stepper` is registered.
 */
export const SteppedForm = ({
  parts,
  form,
  fields,
  steps,
  requiredPaths,
  submitStep,
}: SteppedFormProps): ReactNode => {
  const [currentKey, setCurrentKey] = useState(
    () => (steps.find((step) => isShown(step, form.store.get().values)) ?? steps[0]).step,
  )
  const [visited, setVisited] = useState<ReadonlySet<string>>(() => new Set([currentKey]))
  const [attempted, setAttempted] = useState<ReadonlySet<string>>(() => new Set())
  const shownByCondition = useSelector(
    form.store,
    (state) => steps.map((step) => isShown(step, state.values)),
    { compare: hasSameItems },
  )
  const hasErrors = useSelector(
    form.store,
    (state) => steps.map((step) => hasErrorUnder(state.fieldMeta, step.step)),
    { compare: hasSameItems },
  )
  const hasDueErrors = useSelector(
    form.store,
    (state) =>
      steps.map((step) =>
        hasDueErrorUnder(
          state.fieldMeta,
          step.step,
          state.submissionAttempts > 0 || attempted.has(step.step),
        ),
      ),
    { compare: hasSameItems },
  )
  const isSubmitting = useSelector(form.store, (state) => state.isSubmitting)
  // A step's submit settles after its validation; by then another step may be shown.
  const shownKey = useRef(currentKey)
  useEffect(() => {
    shownKey.current = currentKey
  })

  const Stepper = parts.structure.stepper
  if (Stepper === undefined) {
    throw new Error(NO_STEPPER)
  }

  const visible: VisibleStep[] = steps
    .map((step, position) => ({ step, position }))
    .filter(({ step, position }) => step.step === currentKey || shownByCondition[position])
  const current = visible.findIndex(({ step }) => step.step === currentKey)
  const isValidAt = ({ position }: VisibleStep): boolean => !hasErrors[position]
  const states: StepState[] = visible.map(({ step, position }, index) => ({
    label: step.label,
    isCurrent: index === current,
    isVisited: visited.has(step.step),
    isReachable: visited.has(step.step) && visible.slice(0, index).every(isValidAt),
    hasDueError: hasDueErrors[position] ?? false,
  }))

  const moveTo = (key: string): void => {
    setCurrentKey(key)
    setVisited((previous) => new Set(previous).add(key))
  }
  const back = (): void => {
    const previous = visible[current - 1]
    if (previous !== undefined) {
      setCurrentKey(previous.step.step)
    }
  }
  const goTo = (index: number): void => {
    const target = visible[index]
    if (target !== undefined && states[index]?.isReachable === true) {
      setCurrentKey(target.step.step)
    }
  }
  const markAttempted = (): void => {
    setAttempted((previous) => new Set(previous).add(currentKey))
  }
  const following = visible[current + 1]

  const Body = parts.structure.body
  const content = (
    <Fields
      parts={parts}
      form={form}
      fields={{ [currentKey]: fields[currentKey] ?? {} }}
      layout={[currentKey]}
      requiredPaths={requiredPaths}
    />
  )

  return (
    <form.FormGroup
      key={currentKey}
      name={currentKey}
      onGroupSubmit={() => {
        if (following !== undefined && shownKey.current === currentKey) {
          moveTo(following.step.step)
        }
      }}
    >
      {(group) => (
        <CurrentStep
          group={group}
          form={form}
          stepper={Stepper}
          stepperProps={{
            steps: states,
            current,
            back,
            goTo,
            isFirst: current === 0,
            isLast: following === undefined,
            isSubmitting,
          }}
          onAttempt={markAttempted}
          submitStep={submitStep}
        >
          {Body === undefined ? content : <Body>{content}</Body>}
        </CurrentStep>
      )}
    </form.FormGroup>
  )
}
