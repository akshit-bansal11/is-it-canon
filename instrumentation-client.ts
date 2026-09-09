import * as Sentry from "@sentry/nextjs";
import posthog from "posthog-js";
import {
  POSTHOG_HOST,
  POSTHOG_KEY,
  posthogEnabled,
  SENTRY_DSN,
  sentryEnabled,
} from "@/lib/observability/env";

if (sentryEnabled) {
  Sentry.init({
    dsn: SENTRY_DSN,
    tracesSampleRate: 0.1,
    sendDefaultPii: false,
  });
}

if (posthogEnabled) {
  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    // Next's App Router does not do full page loads between routes, so
    // automatic pageview capture would record one visit and then nothing.
    // Pageviews are sent explicitly by the analytics provider instead.
    capture_pageview: false,
    capture_pageleave: true,
    // There are no accounts and nothing to attribute, so identifying every
    // visitor by IP would collect personal data the app has no use for.
    person_profiles: "never",
    respect_dnt: true,
  });
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
