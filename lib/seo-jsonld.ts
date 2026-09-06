import { siteConfig } from "../data/site-config";
import { capabilities } from "../data/services";
import { faqs } from "../data/faq";
import { businessJsonLdDescription } from "../data/seo";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export function buildBusinessJsonLd() {
  return {
    "@type": ["MotorcycleRepair", "AutomotiveBusiness"],
    "@id": `${SITE_URL}/#business`,
    name: siteConfig.shopName,
    description: businessJsonLdDescription,
    url: SITE_URL,
    telephone: siteConfig.phone,
    email: siteConfig.email,
    address: {
      "@type": "PostalAddress",
      addressLocality: siteConfig.city.replace(", SC", ""),
      addressRegion: "SC",
      addressCountry: "US",
    },
    areaServed: [
      "Upstate South Carolina",
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
      description: "By appointment only. No walk-in hours.",
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
  };
}

export function buildFaqJsonLd() {
  return {
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
  };
}
