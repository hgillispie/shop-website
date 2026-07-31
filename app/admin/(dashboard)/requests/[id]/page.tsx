import { notFound } from "next/navigation";
import { getJobForRequest, getRequestById } from "@/lib/db/queries";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { approveRequest, declineRequest, sendResponse } from "../actions";

function toLocalDatetimeValue(date: Date | null) {
  if (!date) return "";
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
}

export default async function RequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const request = await getRequestById(id);
  if (!request) notFound();

  const job = await getJobForRequest(id);

  return (
    <div className="max-w-3xl">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{request.name}</h1>
          <p className="mt-1 text-sm text-muted">
            {request.phone} · {request.email}
          </p>
        </div>
        <StatusBadge status={request.status} />
      </div>

      <dl className="mt-8 grid grid-cols-2 gap-6 rounded-lg border border-border bg-surface p-6 text-sm sm:grid-cols-3">
        <div>
          <dt className="text-xs uppercase text-muted">Bike</dt>
          <dd className="mt-1">{request.bikeYearMakeModel}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase text-muted">Services</dt>
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
        <div>
          <dt className="text-xs uppercase text-muted">Submitted</dt>
          <dd className="mt-1">{request.createdAt.toLocaleString()}</dd>
        </div>
      </dl>

      <div className="mt-6">
        <p className="text-xs uppercase text-muted">Details</p>
        <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
          {request.details}
        </p>
      </div>

      {request.photoUrls.length > 0 && (
        <div className="mt-6">
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

      {job && (
        <div className="mt-8 rounded-lg border border-border bg-surface p-6">
          <p className="text-xs uppercase text-muted">Linked Job</p>
          <p className="mt-1 text-sm font-medium">
            Job #{job.jobNumber} — {job.title}
          </p>
          <p className="mt-1 text-xs text-muted">
            Drop-off:{" "}
            {job.dropoffAt ? job.dropoffAt.toLocaleString() : "Not yet scheduled"}
          </p>
        </div>
      )}

      {request.status === "pending" && !job && (
        <form
          action={approveRequest}
          className="mt-8 space-y-4 rounded-lg border border-accent/30 bg-accent-soft p-6"
        >
          <input type="hidden" name="requestId" value={request.id} />
          <h2 className="text-sm font-semibold">Approve &amp; schedule</h2>
          <div>
            <Label htmlFor="title">Job title</Label>
            <Input id="title" name="title" defaultValue={request.bikeYearMakeModel} />
          </div>
          <div>
            <Label htmlFor="description">Job description</Label>
            <Textarea id="description" name="description" defaultValue={request.details} />
          </div>
          <div>
            <Label htmlFor="dropoffAt">Drop-off date &amp; time</Label>
            <Input
              id="dropoffAt"
              name="dropoffAt"
              type="datetime-local"
              defaultValue={toLocalDatetimeValue(request.preferredDropoffAt)}
            />
          </div>
          <div className="flex gap-3">
            <Button type="submit">Approve &amp; notify customer</Button>
            <Button type="submit" variant="outline" formAction={declineRequest}>
              Decline
            </Button>
          </div>
        </form>
      )}

      <form action={sendResponse} className="mt-8 space-y-3 rounded-lg border border-border p-6">
        <input type="hidden" name="requestId" value={request.id} />
        <Label htmlFor="message">Respond to {request.name}</Label>
        <Textarea
          id="message"
          name="message"
          placeholder="Send a note or question to the customer by email…"
        />
        <Button type="submit" variant="outline">
          Send email
        </Button>
      </form>
    </div>
  );
}
