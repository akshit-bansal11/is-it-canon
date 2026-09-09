import { withBetterStack } from "@logtail/next";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
};

/**
 * Better Stack wraps the build to ship server and edge logs to Telemetry.
 *
 * It reads NEXT_PUBLIC_BETTER_STACK_SOURCE_TOKEN and
 * NEXT_PUBLIC_BETTER_STACK_INGESTING_URL from the environment. Without them the
 * wrapper is a no-op and the build still succeeds, which is what keeps local
 * builds and CI from needing production credentials.
 */
export default withBetterStack(nextConfig);
