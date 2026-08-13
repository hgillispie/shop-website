import { notFound } from "next/navigation";
import { getServiceInvoiceById } from "@/lib/db/queries";
import { InvoiceForm } from "@/components/admin/InvoiceForm";

export default async function EditInvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const invoice = await getServiceInvoiceById(id);
  if (!invoice) notFound();

  return <InvoiceForm invoice={invoice} />;
}
