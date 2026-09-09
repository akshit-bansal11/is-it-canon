import * as Sentry from "@sentry/nextjs";
import { SENTRY_DSN, sentryEnabled } from "@/lib/observability/env";

/**
 * Server and edge error reporting. Next calls this once per runtime at boot.
 *
 * No-op without a DSN, so a deployment that has not been given one starts
 * cleanly rather than failing or retrying against nothing.
 */
export function register() {
  if (!sentryEnabled) return;

  Sentry.init({
    dsn: SENTRY_DSN,
    // Traces are sampled rather than sent whole: this is a static site with a
    // free-tier quota, and 10% is enough to see a regression without spending
    // the month's budget in a day.
    tracesSampleRate: 0.1,
    // The dataset is public and there are no accounts, so there is no user data
    // worth attaching — and sending IPs by default would create a privacy
    // obligation the app otherwise does not have.
    sendDefaultPii: false,
  });
}

export const onRequestError = Sentry.captureRequestError;
