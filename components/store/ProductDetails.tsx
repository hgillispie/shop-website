type ProductDetailsProps = {
  description: string;
};

// Shared by the product page and Quick View so the long Shopify copy
// starts closed in both places. Native <details> stays collapsed unless
// it has `open`, and works in the server-rendered product page.
export function ProductDetails({ description }: ProductDetailsProps) {
  const text = description.trim();
  if (!text) return null;

  return (
    <details className="collapse collapse-arrow rounded-none border-y border-hairline">
      <summary className="collapse-title eyebrow min-h-11 px-0 py-3 text-ember after:end-0">
        Details
      </summary>
      <div className="collapse-content px-0">
        <p className="text-sm leading-relaxed whitespace-pre-line text-bone/65">
          {text}
        </p>
      </div>
    </details>
  );
}
