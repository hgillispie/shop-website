import { buildBusinessJsonLd, buildFaqJsonLd } from "@/lib/seo-jsonld";

export function StructuredData({ includeFaq = true }: { includeFaq?: boolean }) {
  const graph = includeFaq
    ? [buildBusinessJsonLd(), buildFaqJsonLd()]
    : [buildBusinessJsonLd()];

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": graph,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
