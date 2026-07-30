import { siteConfig } from "@/data/site-config";
import { capabilities } from "@/data/services";
import { faqs } from "@/data/faq";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export function StructuredData() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "AutoRepair",
        "@id": `${SITE_URL}/#business`,
        name: siteConfig.shopName,
        description:
          "Independent Harley-Davidson performance, custom fabrication, and vintage restoration shop serving Taylors, Greenville, and Spartanburg, SC. Appointment only.",
        url: SITE_URL,
        telephone: siteConfig.phone,
        founder: {
          "@type": "Person",
          name: siteConfig.builderName,
        },
        address: {
          "@type": "PostalAddress",
          addressLocality: "Taylors",
          addressRegion: "SC",
          addressCountry: "US",
        },
        areaServed: [
          "Taylors, SC",
          "Greenville, SC",
          "Spartanburg, SC",
          "Greer, SC",
          "Easley, SC",
          "Simpsonville, SC",
        ],
        priceRange: "$$",
        openingHoursSpecification: {
          "@type": "OpeningHoursSpecification",
          dayOfWeek: [
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
          ],
          description: "By appointment only — no walk-in hours.",
        },
        hasOfferCatalog: {
          "@type": "OfferCatalog",
          name: "Services",
          itemListElement: capabilities.map((capability) => ({
            "@type": "Offer",
            itemOffered: {
              "@type": "Service",
              name: capability.title,
              description: capability.description,
            },
          })),
        },
      },
      {
        "@type": "FAQPage",
        "@id": `${SITE_URL}/#faq`,
        mainEntity: faqs.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: item.answer,
          },
        })),
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
