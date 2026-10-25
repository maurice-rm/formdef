const LOCAL_URL = 'http://localhost:3010'

const configured = process.env.DOCS_URL

// Open Graph images need absolute URLs; the deployment sets DOCS_URL to the public address.
export const siteUrl = new URL(
  configured === undefined || configured === '' ? LOCAL_URL : configured,
)
