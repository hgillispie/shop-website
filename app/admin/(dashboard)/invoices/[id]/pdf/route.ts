import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getServiceInvoiceById } from "@/lib/db/queries";
import { renderInvoicePdf } from "@/lib/invoices/pdf";

// middleware.ts's "/admin/:path*" matcher already redirects an
// unauthenticated request to /admin/login — but that's an HTML redirect,
// not a sane response for something meant to be fetched as
// application/pdf, so this route checks explicitly too and returns a
// plain 401 (same "check independent of the page-level gate" posture as
// every Server Action in this app).
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const { id } = await params;
  const invoice = await getServiceInvoiceById(id);
  if (!invoice) {
    return NextResponse.json({ error: "Invoice not found." }, { status: 404 });
  }

  const buffer = await renderInvoicePdf(invoice);

  // "inline", not "attachment" — opens in the browser's own PDF viewer
  // (used as the "Preview PDF" link from the invoice edit page) rather
  // than forcing a download. Wrapped in a plain Uint8Array — Buffer is a
  // Uint8Array at runtime, but TS's BodyInit type doesn't structurally
  // accept Buffer's generic form directly.
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="invoice-${invoice.invoiceNumber}.pdf"`,
    },
  });
}
