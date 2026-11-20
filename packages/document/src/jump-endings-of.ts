import type { FormDocument } from './form-document'

/**
 * The keys of the endings a jump ends the form with. Such an ending applies only through its jump,
 * never by the order of the endings.
 */
export function jumpEndingsOf(document: FormDocument): ReadonlySet<string> {
  return new Set(
    (document.steps ?? []).flatMap((step) =>
      (step.next ?? []).flatMap((jump) => (jump.end === undefined ? [] : [jump.end])),
    ),
  )
}
