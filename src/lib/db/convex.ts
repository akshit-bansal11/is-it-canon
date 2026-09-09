import { ConvexHttpClient } from "convex/browser";

/**
 * A Convex client for server components that lets Next cache the result.
 *
 * Deliberately not `fetchQuery` from `convex/nextjs`. That helper hardcodes
 * `cache: "no-store"` on every request, which opts the calling route out of
 * static generation entirely — the build output marked `/` as server-rendered
 * on demand, putting a database round trip in front of every page load. The
 * whole reason for moving the dataset into Convex was to make it editable
 * without a redeploy, not to make it slower to read.
 *
 * Passing a custom `fetch` is the client's own public, typed option, so the
 * request carries Next's `revalidate` hint instead and the page goes back to
 * being statically generated and refreshed on a timer.
 *
 * A new client per call on purpose: ConvexHttpClient is stateful — it holds
 * credentials and queues mutations — and its own documentation warns against
 * sharing one across requests on a server.
 *
 * `revalidateSeconds` is passed in rather than held here so the calling route's
 * own `export const revalidate` stays the single source of that number. Next
 * only accepts a literal for that export, so a shared constant could not have
 * fed both and the two would have drifted the first time one changed.
 */
export function convexServerClient(revalidateSeconds: number): ConvexHttpClient {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;

  if (url === undefined || url === "") {
    throw new Error(
      "NEXT_PUBLIC_CONVEX_URL is not set. Run `npx convex dev --once` locally, or set it in the Vercel project's environment variables.",
    );
  }

  return new ConvexHttpClient(url, {
    fetch: (input, init) => fetch(input, { ...init, next: { revalidate: revalidateSeconds } }),
  });
}
