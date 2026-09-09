"use client";

import { usePathname, useSearchParams } from "next/navigation";
import posthog from "posthog-js";
import { useEffect } from "react";
import { posthogEnabled } from "@/lib/observability/env";

/**
 * Sends one pageview per client-side navigation.
 *
 * PostHog's automatic capture is switched off in instrumentation-client.ts: the
 * App Router never does a full page load between routes, so autocapture records
 * the first visit and then nothing for the rest of the session.
 *
 * Rendered inside Suspense by the layout, because useSearchParams opts its
 * whole subtree into client rendering otherwise, which would have quietly made
 * every static page dynamic — the same failure the Convex read path hit.
 */
export default function Analytics() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!posthogEnabled) return;

    const query = searchParams.toString();
    posthog.capture("$pageview", {
      $current_url: `${window.location.origin}${pathname}${query === "" ? "" : `?${query}`}`,
    });
  }, [pathname, searchParams]);

  return null;
}
