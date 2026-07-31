import Link from "next/link";
import { getRequests } from "@/lib/db/queries";
import { StatusBadge } from "@/components/admin/StatusBadge";

export const dynamic = "force-dynamic";

export default async function AdminRequestsPage() {
  const requests = await getRequests();

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Appointment Requests</h1>
      <p className="mt-1 text-sm text-muted">
        {requests.length} total — newest first.
      </p>

      <div className="mt-8 overflow-hidden rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-surface text-left text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Bike</th>
              <th className="px-4 py-3">Services</th>
              <th className="px-4 py-3">Submitted</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {requests.map((request) => (
              <tr key={request.id} className="hover:bg-surface">
                <td className="px-4 py-4">
                  <Link
                    href={`/admin/requests/${request.id}`}
                    className="font-medium text-foreground hover:text-accent"
                  >
                    {request.name}
                  </Link>
                  <p className="text-xs text-muted">{request.phone}</p>
                </td>
                <td className="px-4 py-4 text-muted">{request.bikeYearMakeModel}</td>
                <td className="px-4 py-4 text-muted">
                  {request.serviceTypes.length > 0 ? request.serviceTypes.join(", ") : "—"}
                </td>
                <td className="px-4 py-4 text-muted">
                  {request.createdAt.toLocaleDateString()}
                </td>
                <td className="px-4 py-4">
                  <StatusBadge status={request.status} />
                </td>
              </tr>
            ))}
            {requests.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-muted">
                  No requests yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
