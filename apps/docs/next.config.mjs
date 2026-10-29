import { createMDX } from 'fumadocs-mdx/next'

const withMDX = createMDX()

/** @type {import('next').NextConfig} */
const config = {
  output: 'export',
  reactStrictMode: true,
  serverExternalPackages: ['typescript', '@takumi-rs/core'],
}

export default withMDX(config)
