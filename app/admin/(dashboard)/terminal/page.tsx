import { listProducts, type PrintifyProduct } from "@/lib/printify";
import { TerminalCheckout } from "@/components/admin/TerminalCheckout";

export const dynamic = "force-dynamic";

export default async function TerminalPage() {
  let products: PrintifyProduct[] = [];
  let loadError = false;

  try {
    products = await listProducts();
  } catch (error) {
    console.error("[admin/terminal] failed to load Printify products:", error);
    loadError = true;
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">In-Person Checkout</h1>
      <p className="mt-1 text-sm text-muted">
        Ring up a counter sale with the Stripe Terminal card reader.
      </p>

      {loadError ? (
        <p className="mt-8 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
          Couldn&apos;t load the product catalog right now.
        </p>
      ) : (
        <div className="mt-8">
          <TerminalCheckout products={products} />
        </div>
      )}
    </div>
  );
}
