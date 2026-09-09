/**
 * Whether each observability service is configured.
 *
 * Both are wired but inert until their key is present. That is deliberate:
 * a missing DSN should mean "not reporting", never a crash on boot or a stream
 * of failed network calls from every visitor's browser. It also keeps local
 * development and CI quiet without a second code path.
 *
 * Read through `process.env.NEXT_PUBLIC_*` literally rather than dynamically —
 * Next inlines these at build time only when written as a full static member
 * expression, so `process.env[name]` would silently be undefined in the browser.
 */
export const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN ?? "";
export const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY ?? "";
export const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com";

export const sentryEnabled = SENTRY_DSN !== "";
export const posthogEnabled = POSTHOG_KEY !== "";
