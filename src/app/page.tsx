import { api } from "../../convex/_generated/api";
import CanonApp from "@/components/canon/CanonApp";
import { convexServerClient } from "@/lib/db/convex";

/**
 * Canon data changes when someone edits it, which is rarely, so the page is
 * statically generated and revalidated on a timer rather than queried per
 * visitor. Next only accepts a literal here, so this export is the single
 * source of the number and is handed to the Convex client below.
 *
 * Verify with `next build`: this route must report as static, not as
 * server-rendered on demand.
 */
export const revalidate = 3600;

export default async function Page() {
  const franchises = await convexServerClient(revalidate).query(api.canon.list);

  return <CanonApp franchises={franchises} />;
}
