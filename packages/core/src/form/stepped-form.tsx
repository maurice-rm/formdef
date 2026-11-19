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
import { warnOnce } from '../render/warn-once'
import { fieldId } from '../widget/field-id'
import { hasDueError } from '../widget/has-due-error'
import { StepSubmitted } from '../widget/step-submitted'
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
  onGroupSubmitInvalid: () => void
  children: (group: StepGroup) => ReactNode
}

/** The form `useAppForm` returns, as far as a stepped form uses it. */
export type StepForm = RenderForm & {
  FormGroup: ComponentType<FormGroupProps>
  formId: string
  fieldInfo: Readonly<Record<string, { instance: unknown } | undefined>>
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

type GroupHandleProps = {
  group: StepGroup
  /** Receives the form group of the current step, for `next` to submit it. */
  currentGroup: RefObject<StepGroup | undefined>
  children: ReactNode
}

type VisibleStep = { step: RootStep; position: number }

const NO_STEPPER = 'formdef: the form has steps, but no structure.stepper is registered.'

const isUnder = (path: string, key: string): boolean =>
  path === key || path.startsWith(`${key}.`) || path.startsWith(`${key}[`)

const erringPathsUnder = (fieldMeta: StepFormState['fieldMeta'], key: string): string[] =>
  Object.entries(fieldMeta)
    .filter(([path, meta]) => isUnder(path, key) && (meta?.errors?.length ?? 0) > 0)
    .map(([path]) => path)

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

type StepProps = Readonly<Record<string, unknown>> | undefined

const stepPropsOf = (step: RootStep, values: unknown): StepProps => {
  const props = typeof step.props === 'function' ? step.props(values) : step.props

  return typeof props === 'object' && props !== null ? props : undefined
}

const hasSameProps = (first: StepProps, second: StepProps): boolean => {
  if (first === undefined || second === undefined) {
    return first === second
  }
  const keys = Object.keys(first)

  return (
    keys.length === Object.keys(second).length &&
    keys.every((key) => Object.hasOwn(second, key) && Object.is(first[key], second[key]))
  )
}

// Props a function of the values builds anew are equal when every value is the same.
const hasSameStepProps = (first: readonly StepProps[], second: readonly StepProps[]): boolean =>
  first.length === second.length &&
  first.every((props, index) => hasSameProps(props, second[index]))

// The step's own path belongs to its form group, which renders no control.
const erringFieldPathsUnder = (form: StepForm, key: string): string[] =>
  erringPathsUnder(form.store.get().fieldMeta, key).filter((path) => path !== key)

const isRendered = (form: StepForm, path: string): boolean =>
  Boolean(form.fieldInfo[path]?.instance)

const comesFirst = (first: HTMLElement, second: HTMLElement): number =>
  first.compareDocumentPosition(second) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1

/** The control of the step's first invalid field in document order, if one is rendered. */
const firstInvalidControl = (form: StepForm, key: string): HTMLElement | undefined =>
  erringFieldPathsUnder(form, key)
    .map((path) => document.getElementById(fieldId(form.formId, path)))
    .filter((control) => control !== null)
    .sort(comesFirst)[0]

// TanStack's form group counts every field whose path starts with its name, separator or not.
const warnAboutWiderKeys = (steps: RootSteps, fields: FieldsProps['fields']): void => {
  for (const step of steps) {
    const wider = Object.keys(fields).find(
      (key) => key !== step.step && key.startsWith(step.step) && !isUnder(key, step.step),
    )
    if (wider !== undefined) {
      warnOnce(
        step,
        `formdef: the step "${step.step}" starts the root key "${wider}"; its form group would count the fields of "${wider}" as its own.`,
      )
    }
  }
}

const warnAboutUnrenderedErrors = (form: StepForm, key: string, owner: object): void => {
  const erring = erringFieldPathsUnder(form, key)
  if (erring.length === 0 || erring.some((path) => isRendered(form, path))) {
    return
  }

  warnOnce(
    owner,
    `formdef: the step "${key}" is held back by errors on fields it does not render: ${erring.join(', ')}. What a condition hides is optional in the schema.`,
  )
}

// A hidden step has a condition; its function is a stable owner the other warnings do not use.
const warnAboutHiddenSteps = (steps: RootSteps, fieldMeta: StepFormState['fieldMeta']): void => {
  for (const step of steps) {
    const erring = erringPathsUnder(fieldMeta, step.step)
    if (erring.length > 0 && step.visibleWhen !== undefined) {
      warnOnce(
        step.visibleWhen,
        `formdef: the form fails to submit through errors in the hidden step "${step.step}": ${erring.join(', ')}. What a condition hides is optional in the schema.`,
      )
    }
  }
}

const GroupHandle = ({ group, currentGroup, children }: GroupHandleProps): ReactNode => {
  useEffect(() => {
    currentGroup.current = group
  })

  return children
}

/**
 * Renders a form whose root layout holds steps: the current step as a TanStack form group at its
 * key, inside the registered stepper. A step moves on when its group submits valid; otherwise its
 * errors become due and its first invalid control takes the focus. The last step submits the
 * form; when that fails, the first step holding an error is shown and its first invalid control
 * takes the focus. A step its condition hides is skipped, except while it is the current one. The
 * props of each step entry arrive flat on its state; props built from the values are read again
 * when the values change, never for a hidden step, and the stepper renders again only when one of
 * them changed.
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
  const [isFocusPending, setIsFocusPending] = useState(false)
  const shownByCondition = useSelector(
    form.store,
    (state) => steps.map((step) => isShown(step, state.values)),
    { compare: hasSameItems },
  )
  const hasErrors = useSelector(
    form.store,
    (state) => steps.map((step) => erringPathsUnder(state.fieldMeta, step.step).length > 0),
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
  const stepProps = useSelector(
    form.store,
    (state) =>
      steps.map((step) =>
        step.step === currentKey || isShown(step, state.values)
          ? stepPropsOf(step, state.values)
          : undefined,
      ),
    { compare: hasSameStepProps },
  )
  const wasSubmitted = useSelector(form.store, (state) => state.submissionAttempts > 0)
  const isSubmitting = useSelector(form.store, (state) => state.isSubmitting)
  // A step's submit settles after its validation; by then another step may be shown.
  const shownKey = useRef(currentKey)
  useEffect(() => {
    shownKey.current = currentKey
  })
  // Runs after the current step's fields are mounted, so their controls exist to take the focus.
  useEffect(() => {
    if (!isFocusPending) {
      return
    }
    setIsFocusPending(false)
    const control = firstInvalidControl(form, currentKey)
    if (control === undefined) {
      warnAboutUnrenderedErrors(form, currentKey, fields[currentKey] ?? steps)
      return
    }
    control.focus()
  }, [isFocusPending, form, currentKey, fields, steps])

  const currentGroup = useRef<StepGroup | undefined>(undefined)

  const visible: VisibleStep[] = steps
    .map((step, position) => ({ step, position }))
    .filter(({ step, position }) => step.step === currentKey || shownByCondition[position])
  const current = visible.findIndex(({ step }) => step.step === currentKey)
  const isValidAt = ({ position }: VisibleStep): boolean => !hasErrors[position]
  const states: StepState[] = visible.map(({ step, position }, index) => ({
    ...stepProps[position],
    label: step.label,
    isCurrent: index === current,
    isVisited: visited.has(step.step),
    isReachable: visited.has(step.step) && visible.slice(0, index).every(isValidAt),
    isComplete: (wasSubmitted || attempted.has(step.step)) && !hasErrors[position],
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
  const submitForm = async (): Promise<void> => {
    await form.handleSubmit()
    const { fieldMeta } = form.store.get()
    const erring = visible.find(({ step }) => erringPathsUnder(fieldMeta, step.step).length > 0)
    if (erring === undefined) {
      warnAboutHiddenSteps(steps, fieldMeta)
      return
    }
    moveTo(erring.step.step)
    setIsFocusPending(true)
  }
  const following = visible[current + 1]
  const next = (): void => {
    markAttempted()
    if (following === undefined) {
      void submitForm()
      return
    }
    void currentGroup.current?.handleSubmit()
  }
  useEffect(() => {
    submitStep.current = next
  })

  const Stepper = parts.structure.stepper
  if (Stepper === undefined) {
    throw new Error(NO_STEPPER)
  }
  warnAboutWiderKeys(steps, fields)

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
    <Stepper
      steps={states}
      current={current}
      next={next}
      back={back}
      goTo={goTo}
      isFirst={current === 0}
      isLast={following === undefined}
      isSubmitting={isSubmitting}
    >
      <form.FormGroup
        key={currentKey}
        name={currentKey}
        onGroupSubmit={() => {
          if (following !== undefined && shownKey.current === currentKey) {
            moveTo(following.step.step)
          }
        }}
        onGroupSubmitInvalid={() => {
          if (shownKey.current === currentKey) {
            setIsFocusPending(true)
          }
        }}
      >
        {(group) => (
          <GroupHandle group={group} currentGroup={currentGroup}>
            <StepSubmitted value={attempted.has(currentKey)}>
              {Body === undefined ? content : <Body>{content}</Body>}
            </StepSubmitted>
          </GroupHandle>
        )}
      </form.FormGroup>
    </Stepper>
  )
}
