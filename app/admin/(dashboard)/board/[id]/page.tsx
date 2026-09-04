import { notFound } from "next/navigation";
import Link from "next/link";
import { getJobById } from "@/lib/db/queries";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { DeleteJobButton } from "@/components/admin/DeleteJobButton";
import { ApproveDraftForm } from "@/components/admin/ApproveDraftForm";
import { ButtonLink } from "@/components/ui/button";

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const job = await getJobById(id);
  if (!job) notFound();

  const { request } = job;
  // Fall back to the request's own customer link for jobs created before
  // customerId was set directly on the job (see approveRequest).
  const customer = job.customer ?? request?.customer ?? null;
  const draft = job.intakeDraft;
  const isDraft = job.status === "open_draft";

  return (
    <div className="max-w-3xl">
      <Link href="/admin/board" className="text-xs text-muted hover:text-accent">
        ← Board
      </Link>

      <div className="mt-4 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            #{job.jobNumber} {job.title}
          </h1>
          <p className="mt-1 text-sm text-muted">
            {isDraft
              ? `Open draft from ${draft?.source === "telegram" ? "Telegram" : "email"} — not yet a customer or ticket`
              : job.dropoffAt
                ? `Drop-off ${job.dropoffAt.toLocaleString()}`
                : "No drop-off scheduled"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={job.status} />
          {!isDraft && (
            <DeleteJobButton
              jobId={job.id}
              confirmText={`Delete job #${job.jobNumber} (${job.title})? This can't be undone.`}
            />
          )}
        </div>
      </div>

      {job.description && (
        <p className="mt-4 whitespace-pre-wrap text-sm text-foreground/90">{job.description}</p>
      )}

      {isDraft && draft && (
        <ApproveDraftForm jobId={job.id} jobNumber={job.jobNumber} draft={draft} />
      )}

      {draft && draft.photoUrls.length > 0 && (
        <div className="mt-6">
          <p className="text-xs uppercase text-muted">Screenshots</p>
          <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {draft.photoUrls.map((url) => (
              <a key={url} href={url} target="_blank" rel="noreferrer">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt=""
                  className="aspect-square rounded-md border border-border object-cover"
                />
              </a>
            ))}
          </div>
        </div>
      )}

      {customer && (
        <div className="mt-6 rounded-lg border border-border bg-surface p-4 text-sm">
          <p className="text-xs uppercase text-muted">Customer</p>
          <Link
            href={`/admin/crm/${customer.id}`}
            className="mt-1 block font-medium hover:text-accent"
          >
            {customer.name} →
          </Link>
          <p className="mt-1 text-muted">
            {customer.phone}
            {customer.email ? ` · ${customer.email}` : ""}
          </p>
          {customer.address && <p className="mt-1 text-muted">{customer.address}</p>}
        </div>
      )}

      {request && (
        <div className="mt-6 rounded-lg border border-border p-6">
          <p className="text-xs uppercase text-muted">From the intake form</p>
          <dl className="mt-3 grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-xs uppercase text-muted">Bike</dt>
              <dd className="mt-1">{request.bikeYearMakeModel}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-muted">Services requested</dt>
              <dd className="mt-1">
                {request.serviceTypes.length > 0 ? request.serviceTypes.join(", ") : "See details"}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-muted">Preferred drop-off</dt>
              <dd className="mt-1">
                {request.preferredDropoffAt
                  ? request.preferredDropoffAt.toLocaleDateString()
                  : "Not specified"}
              </dd>
            </div>
          </dl>

          <div className="mt-4">
            <p className="text-xs uppercase text-muted">Customer&apos;s own description</p>
            <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
              {request.details}
            </p>
          </div>

          {request.photoUrls.length > 0 && (
            <div className="mt-4">
              <p className="text-xs uppercase text-muted">Photos</p>
              <div className="mt-2 grid grid-cols-3 gap-3 sm:grid-cols-4">
                {request.photoUrls.map((url) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={url}
                    src={url}
                    alt=""
                    className="aspect-square rounded-md border border-border object-cover"
                  />
                ))}
              </div>
            </div>
          )}

          <Link
            href={`/admin/requests/${request.id}`}
            className="mt-4 inline-block text-xs text-accent hover:underline"
          >
            View original request →
          </Link>
        </div>
      )}

      {!isDraft && (
        <div className="mt-8 rounded-lg border border-accent/30 bg-accent-soft p-6">
          <h2 className="text-sm font-semibold">Ready to write up the paperwork?</h2>
          <p className="mt-1 text-sm text-muted">
            Starts a new invoice with this customer and vehicle already filled in — everything stays
            editable before you print.
          </p>
          <ButtonLink href={`/admin/invoices/new?fromJobId=${job.id}`} className="mt-4">
            Create Invoice
          </ButtonLink>
        </div>
      )}
    </div>
  );
}
