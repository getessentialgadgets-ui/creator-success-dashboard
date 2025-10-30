/**
 * Minimal Next.js config to ensure the build output directory is the
 * standard `.next`. This prevents ambiguity during Vercel's build
 * finalization where the routes manifest path may otherwise be
 * resolved incorrectly.
 */
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Explicitly set distDir to the default to avoid any environment
  // or platform-specific override that could lead to a missing
  // routes-manifest.json during Vercel builds.
  distDir: '.next',
};

module.exports = nextConfig;
