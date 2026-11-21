const FOCUSABLE = 'input, select, textarea, button, [tabindex]'

const isTabbable = (element: HTMLElement): boolean =>
  element.tabIndex >= 0 && !element.matches(':disabled')

/**
 * Moves the focus to a field's control. A control that takes no focus itself, such as the group
 * of a radio or checkbox group that carries the field's id, hands it to the first control inside
 * it a person could tab to.
 */
export function focusControl(control: HTMLElement): void {
  control.focus()
  if (document.activeElement === control) {
    return
  }
  const inner = [...control.querySelectorAll<HTMLElement>(FOCUSABLE)].find(isTabbable)
  inner?.focus()
}
