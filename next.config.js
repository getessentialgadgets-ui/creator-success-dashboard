/**
 * Minimal Next.js config to ensure the build output directory is the
 * standard `.next`. This prevents ambiguity during Vercel's build
 * finalization where the routes manifest path may otherwise be
 * resolved incorrectly.
 */
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Workaround: Vercel's builder was looking for a directory named
  // "Next.js default" (see deploy logs). Set `distDir` to that exact
  // name so the routes-manifest is written where Vercel expects it.
  // This is a low-risk workaround to avoid the missing manifest error.
  distDir: 'Next.js default',
};

module.exports = nextConfig;
