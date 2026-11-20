type NoParams = Record<never, never>

/**
 * The parameters of the issues the package reports, by code, as the validator gives them and
 * error texts name them; a project's own rules report codes of their own.
 */
export type IssueParams = {
  /** A required field left empty. */
  required: NoParams
  /** A value of the wrong type; the value type expected. */
  type: { expected: string }
  /** A choice that is no option of the field. */
  option: NoParams
  /** No whole number. */
  integer: NoParams
  /** No number written with a comma or a dot. */
  decimal: NoParams
  /** Below the bound. */
  min: { min: number }
  /** Above the bound. */
  max: { max: number }
  /** More characters than allowed. */
  maxLength: { maxLength: number }
  /** Fewer choices than needed. */
  minCount: { minCount: number }
  /** More choices than allowed. */
  maxCount: { maxCount: number }
  /** A date before the earliest, as an ISO date. */
  earliest: { earliest: string }
  /** A date after the latest, as an ISO date. */
  latest: { latest: string }
  /** No email address. */
  email: NoParams
  /** A check of the field against other answers that fails, without a message of its own. */
  check: NoParams
  /** Fewer entries in a repeat than it needs. */
  minEntries: { min: number }
  /** More entries in a repeat than it allows. */
  maxEntries: { max: number }
}

/** The names of the parameters of each code the package reports, for checking error texts. */
export const ISSUE_PARAM_NAMES: { readonly [Code in keyof IssueParams]: readonly string[] } = {
  required: [],
  type: ['expected'],
  option: [],
  integer: [],
  decimal: [],
  min: ['min'],
  max: ['max'],
  maxLength: ['maxLength'],
  minCount: ['minCount'],
  maxCount: ['maxCount'],
  earliest: ['earliest'],
  latest: ['latest'],
  email: [],
  check: [],
  minEntries: ['min'],
  maxEntries: ['max'],
}

/** The parameter every error text receives besides its code's: the label of the field. */
export const LABEL_PARAM = 'label'
