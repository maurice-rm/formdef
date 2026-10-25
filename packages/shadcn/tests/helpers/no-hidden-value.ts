/** Inputs that hold a value without being seen: what a widget must not render. */
export const hiddenValueInputs = (container: HTMLElement): HTMLInputElement[] =>
  [...container.querySelectorAll('input')].filter(
    (input) =>
      input.type === 'hidden' ||
      (input.getAttribute('aria-hidden') === 'true' && input.name !== ''),
  )
