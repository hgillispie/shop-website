import { notFound } from "next/navigation";
import { getServiceInvoiceById } from "@/lib/db/queries";
import { InvoiceForm } from "@/components/admin/InvoiceForm";
import { SendShopifyInvoiceButton } from "@/components/admin/SendShopifyInvoiceButton";
import { EmailInvoiceCopyButton } from "@/components/admin/EmailInvoiceCopyButton";
import { DocumentStageBadge } from "@/components/admin/DocumentStageBadge";
import { adminDocumentStage } from "@/lib/invoices/document-stage";

export default async function EditInvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const invoice = await getServiceInvoiceById(id);
  if (!invoice) notFound();

  const stage = adminDocumentStage(invoice);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4 rounded-xl border border-border/60 px-4 py-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Document stage</p>
          <p className="mt-1 text-sm text-foreground">
            Same write-up number throughout — Quote #{invoice.invoiceNumber} becomes Invoice #
            {invoice.invoiceNumber} when you send the pay link.
          </p>
        </div>
        <DocumentStageBadge stage={stage} />
      </div>
      <EmailInvoiceCopyButton invoice={invoice} />
      <SendShopifyInvoiceButton invoice={invoice} />
      <InvoiceForm invoice={invoice} />
    </div>
  );
}
