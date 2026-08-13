import { getJobById } from "@/lib/db/queries";
import { splitBikeYearMakeModel, type InvoicePrefill } from "@/lib/invoices/prefill";
import { InvoiceForm } from "@/components/admin/InvoiceForm";

export default async function NewInvoicePage({
  searchParams,
}: {
  searchParams: Promise<{ fromJobId?: string }>;
}) {
  const { fromJobId } = await searchParams;
  const prefill = fromJobId ? await buildPrefillFromJob(fromJobId) : undefined;

  return <InvoiceForm prefill={prefill} />;
}

async function buildPrefillFromJob(jobId: string): Promise<InvoicePrefill | undefined> {
  const job = await getJobById(jobId);
  if (!job) return undefined;

  const { request } = job;
  // Fall back through job.customer -> request.customer -> the request's
  // own as-submitted contact fields, since older jobs may not have
  // customerId set directly (see approveRequest).
  const customer = job.customer ?? request?.customer ?? null;
  const vehicle = request
    ? splitBikeYearMakeModel(request.bikeYearMakeModel)
    : { year: "", make: "", model: "" };

  return {
    // Prefer the CRM's own customer record (the owner may have hand-edited
    // it since intake) over the request's original submitted contact info.
    customerName: customer?.name ?? request?.name ?? "",
    customerPhone: customer?.phone ?? request?.phone ?? "",
    customerEmail: customer?.email ?? request?.email ?? "",
    customerAddress: customer?.address ?? "",
    vehicleYear: vehicle.year,
    vehicleMake: vehicle.make,
    vehicleModel: vehicle.model,
    // The customer's own words take priority over the owner's (possibly
    // paraphrased) job description, for the same reason the invoice's own
    // field is literally labeled "customer's description of problem."
    jobDescription: request?.details || job.description || "",
  };
}
