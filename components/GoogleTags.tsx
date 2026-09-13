import { GoogleAnalytics } from "@next/third-parties/google";
import { getGaMeasurementId, getGoogleAdsId } from "@/lib/ga";

/**
 * One gtag.js loader for GA4 and/or Google Ads. When both IDs are set,
 * `@next/third-parties` still owns the GA4 snippet; a real HTML script
 * adds `gtag('config', 'AW-…')` so Ads' tag checker can see its own tag
 * in the document (next/script would bury it in the RSC payload).
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
        <script
          id="google-ads-gtag-config"
          dangerouslySetInnerHTML={{
            __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('config','${adsId}');`,
          }}
        />
      ) : null}
    </>
  );
}
