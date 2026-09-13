import Script from "next/script";
import { GoogleAnalytics } from "@next/third-parties/google";
import { getGaMeasurementId, getGoogleAdsId } from "@/lib/ga";

/**
 * One gtag.js loader for GA4 and/or Google Ads. When both IDs are set,
 * `@next/third-parties` still owns the GA4 snippet; we add
 * `gtag('config', 'AW-…')` alongside it so Ads can see its own tag.
 */
export function GoogleTags() {
  const gaId = getGaMeasurementId();
  const adsId = getGoogleAdsId();
  const loaderId = gaId ?? adsId;
  if (!loaderId) return null;

  return (
    <>
      <GoogleAnalytics gaId={loaderId} />
      {adsId && adsId !== loaderId ? (
        <Script
          id="google-ads-gtag-config"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('config', '${adsId}');`,
          }}
        />
      ) : null}
    </>
  );
}
