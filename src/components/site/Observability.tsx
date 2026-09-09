import Script from "next/script";
import { BETTER_STACK_ERRORS_TOKEN, errorsEnabled } from "@/lib/observability/env";

/**
 * Better Stack Errors.
 *
 * Delivered as a remote script rather than an npm package, which is Better
 * Stack's own design: `b.js` is generated per application and always carries the
 * current configuration, so the snippet never needs updating. The trade is that
 * it is a third-party script on every page, so it has to be accounted for in the
 * CSP the same way any analytics tag would.
 *
 * `afterInteractive` rather than `beforeInteractive`: error reporting is not
 * needed to render, and blocking first paint on it would make the monitoring
 * worse than the problems it reports. The queue in the snippet buffers anything
 * thrown before the script lands, so early errors are not lost.
 *
 * Renders nothing at all without a token, so local runs and CI stay silent.
 */
export default function Observability() {
  if (!errorsEnabled) return null;

  return (
    <Script id="better-stack-errors" strategy="afterInteractive">
      {`!function(b,e,t,r){b[t]=b[t]||function(...args){(b[t].q=b[t].q||[]).push(args)};b[t].l=+new Date;var s=e.createElement('script');s.async=1;s.crossOrigin='anonymous';s.src='https://betterstack.net/b.js?t='+r;(e.head||e.getElementsByTagName('head')[0]).appendChild(s)}(window,document,'betterstack',${JSON.stringify(BETTER_STACK_ERRORS_TOKEN)});betterstack('init',{environment:${JSON.stringify(process.env.NODE_ENV)}});`}
    </Script>
  );
}
