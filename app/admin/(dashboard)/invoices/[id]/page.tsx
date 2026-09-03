import { notFound } from "next/navigation";
import { getServiceInvoiceById } from "@/lib/db/queries";
import { InvoiceForm } from "@/components/admin/InvoiceForm";
import { SendShopifyInvoiceButton } from "@/components/admin/SendShopifyInvoiceButton";
import { EmailInvoiceCopyButton } from "@/components/admin/EmailInvoiceCopyButton";

export default async function EditInvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const invoice = await getServiceInvoiceById(id);
  if (!invoice) notFound();

  return (
    <div className="flex flex-col gap-6">
      <SendShopifyInvoiceButton invoice={invoice} />
      <EmailInvoiceCopyButton invoice={invoice} />
      <InvoiceForm invoice={invoice} />
    </div>
  );
}
