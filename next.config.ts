import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
};

/**
 * Sentry wraps the build so source maps are uploaded and stack traces point at
 * real lines. Without that upload every trace is minified noise and the whole
 * integration reports nothing useful.
 *
 * The upload needs SENTRY_AUTH_TOKEN, SENTRY_ORG and SENTRY_PROJECT at build
 * time. Absent them the wrapper is a no-op and the build still succeeds, which
 * is what keeps local builds and CI from needing production credentials.
 */
export default withSentryConfig(nextConfig, {
  silent: true,
  // Source maps are uploaded to Sentry and then deleted from the output, so
  // they are not served publicly alongside the bundle.
  sourcemaps: { deleteSourcemapsAfterUpload: true },
  // Routes Sentry's browser requests through the app's own origin so ad
  // blockers do not silently drop every error report.
  tunnelRoute: "/monitoring",
  disableLogger: true,
});
