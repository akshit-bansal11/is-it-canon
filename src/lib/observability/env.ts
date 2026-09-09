/**
 * Whether each observability service is configured.
 *
 * Everything here is wired but inert until its token is present. That is
 * deliberate: a missing token should mean "not reporting", never a crash on
 * boot or a stream of failed network calls from every visitor's browser. It
 * also keeps local development and CI quiet without a second code path.
 *
 * Read through `process.env.NEXT_PUBLIC_*` literally rather than dynamically —
 * Next inlines these at build time only when written as a full static member
 * expression, so `process.env[name]` would silently be undefined in the browser.
 */

/** Better Stack Errors. A public application token; it identifies where reports
 *  go and grants nothing, which is why it can ship in the page. */
export const BETTER_STACK_ERRORS_TOKEN = process.env.NEXT_PUBLIC_BETTER_STACK_ERRORS_TOKEN ?? "";

/** Better Stack Telemetry (logs), read by @logtail/next. */
export const BETTER_STACK_SOURCE_TOKEN = process.env.NEXT_PUBLIC_BETTER_STACK_SOURCE_TOKEN ?? "";

export const errorsEnabled = BETTER_STACK_ERRORS_TOKEN !== "";
export const logsEnabled = BETTER_STACK_SOURCE_TOKEN !== "";
