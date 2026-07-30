import { getIpRules, getRecentPageViews, getRequests } from "@/lib/db/queries";
import { PageViewsChart } from "@/components/admin/PageViewsChart";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { addIpRule } from "./actions";

export const dynamic = "force-dynamic";

function dayKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

export default async function AnalyticsPage() {
  const [pageViews, requests, rules] = await Promise.all([
    getRecentPageViews(2000),
    getRequests(),
    getIpRules(),
  ]);

  const days: { date: string; count: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push({ date: dayKey(d), count: 0 });
  }
  const dayIndex = new Map(days.map((d, i) => [d.date, i]));
  for (const view of pageViews) {
    const key = dayKey(view.createdAt);
    const idx = dayIndex.get(key);
    if (idx !== undefined) days[idx].count += 1;
  }

  const totalViews = pageViews.length;
  const uniqueIps = new Set(pageViews.map((v) => v.ipAddress).filter(Boolean)).size;
  const flaggedRequests = requests.filter((r) => r.flaggedReason);

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
      <p className="mt-1 text-sm text-muted">
        First-party visit tracking — no third-party analytics account required.
      </p>

      <div className="mt-8 grid grid-cols-3 gap-4">
        <div className="rounded-lg border border-border bg-surface p-4">
          <p className="text-xs uppercase text-muted">Page views (tracked)</p>
          <p className="mt-1 text-2xl font-semibold">{totalViews}</p>
        </div>
        <div className="rounded-lg border border-border bg-surface p-4">
          <p className="text-xs uppercase text-muted">Unique IPs</p>
          <p className="mt-1 text-2xl font-semibold">{uniqueIps}</p>
        </div>
        <div className="rounded-lg border border-border bg-surface p-4">
          <p className="text-xs uppercase text-muted">Flagged submissions</p>
          <p className="mt-1 text-2xl font-semibold">{flaggedRequests.length}</p>
        </div>
      </div>

      <div className="mt-8 rounded-lg border border-border bg-surface p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
          Views, last 14 days
        </h2>
        <div className="mt-4">
          <PageViewsChart data={days} />
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
          IP rules ({rules.length})
        </h2>
        <p className="mt-1 text-xs text-muted">
          Matching submissions are flagged for review — nothing is silently blocked yet.
        </p>

        <div className="mt-3 space-y-2">
          {rules.map((rule) => (
            <div
              key={rule.id}
              className="flex items-center justify-between rounded-lg border border-border p-3 text-sm"
            >
              <div>
                <span className="font-mono">{rule.cidr}</span>
                {rule.note && <span className="ml-2 text-xs text-muted">{rule.note}</span>}
              </div>
              <span className="rounded-full bg-surface px-2 py-1 text-xs uppercase text-muted">
                {rule.action}
              </span>
            </div>
          ))}
          {rules.length === 0 && (
            <p className="text-sm text-muted">No IP rules configured.</p>
          )}
        </div>

        <form action={addIpRule} className="mt-4 grid gap-3 rounded-lg border border-dashed border-border p-4 sm:grid-cols-4">
          <div className="sm:col-span-2">
            <Label htmlFor="cidr">IP or CIDR range</Label>
            <Input id="cidr" name="cidr" placeholder="e.g. 1.2.3.0/24" required />
          </div>
          <div>
            <Label htmlFor="action">Action</Label>
            <Select id="action" name="action" defaultValue="flag">
              <option value="flag">Flag</option>
              <option value="block">Block</option>
            </Select>
          </div>
          <div>
            <Label htmlFor="note">Note</Label>
            <Input id="note" name="note" placeholder="optional" />
          </div>
          <div className="sm:col-span-4">
            <Button type="submit" size="sm">
              Add rule
            </Button>
          </div>
        </form>
      </div>

      <div className="mt-8">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
          Recent submissions ({requests.length})
        </h2>
        <div className="mt-3 overflow-hidden rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-surface text-left text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">IP</th>
                <th className="px-4 py-3">Flag</th>
                <th className="px-4 py-3">Submitted</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {requests.slice(0, 50).map((request) => (
                <tr key={request.id} className={request.flaggedReason ? "bg-amber-50" : undefined}>
                  <td className="px-4 py-3">{request.name}</td>
                  <td className="px-4 py-3 font-mono text-xs text-muted">
                    {request.ipAddress ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted">
                    {request.flaggedReason ?? ""}
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {request.createdAt.toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
          Recent page views
        </h2>
        <div className="mt-3 max-h-96 overflow-y-auto overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-surface text-left text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-3">Path</th>
                <th className="px-4 py-3">Referrer</th>
                <th className="px-4 py-3">IP</th>
                <th className="px-4 py-3">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {pageViews.slice(0, 100).map((view) => (
                <tr key={view.id}>
                  <td className="px-4 py-2">{view.path}</td>
                  <td className="px-4 py-2 text-muted">{view.referrer ?? "direct"}</td>
                  <td className="px-4 py-2 font-mono text-xs text-muted">
                    {view.ipAddress ?? "—"}
                  </td>
                  <td className="px-4 py-2 text-muted">{view.createdAt.toLocaleString()}</td>
                </tr>
              ))}
              {pageViews.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-muted">
                    No page views recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
