import type { Metadata } from "next";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { MobileActionBar } from "@/components/layout/MobileActionBar";
import { Hero } from "@/components/sections/Hero";
import { ProductBanner } from "@/components/sections/ProductBanner";
import { StoreFunnel } from "@/components/sections/StoreFunnel";
import { Services } from "@/components/sections/Services";
import { Booking } from "@/components/sections/Booking";
import { AnalyticsBeacon } from "@/components/AnalyticsBeacon";
import { StructuredData } from "@/components/StructuredData";
import { getFeatured } from "@/lib/shopify/featured";
import { siteConfig } from "@/data/site-config";
import { homeDescription, homeTitle, SITE_NAME } from "@/data/seo";

const HOME_TITLE = `${homeTitle} | ${SITE_NAME}`;

export const metadata: Metadata = {
  title: { absolute: HOME_TITLE },
  description: homeDescription,
  openGraph: {
    title: HOME_TITLE,
    description: homeDescription,
    url: "/",
    siteName: SITE_NAME,
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: HOME_TITLE,
    description: homeDescription,
  },
};

export default async function Home() {
  const featured = await getFeatured(siteConfig.featured);

  return (
    <>
      <AnalyticsBeacon />
      <StructuredData includeFaq={false} />
      <Navbar />
      <main className="flex-1">
        {/* Product-forward order per the owner: gear up top, the ask at the
            bottom, and the long-form story moved to /about. */}
        <Hero featured={featured.hero} />
        <ProductBanner product={featured.banner} />
        <StoreFunnel products={featured.all} />
        <Services />
        <Booking />
      </main>
      <Footer />
      <MobileActionBar />
    </>
  );
}
