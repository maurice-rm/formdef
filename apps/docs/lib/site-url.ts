const LOCAL_URL = 'http://localhost:3010'

const configured = process.env.DOCS_URL

// Open Graph images and the registry URL on the installation page need the public address, which
// the deployment sets as DOCS_URL.
export const siteUrl = new URL(
  configured === undefined || configured === '' ? LOCAL_URL : configured,
)
