import { getJobs } from "@/lib/db/queries";
import { MonthCalendar } from "@/components/admin/MonthCalendar";

export const dynamic = "force-dynamic";

export default async function AdminCalendarPage() {
  const jobs = await getJobs();

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Drop-off Calendar</h1>
      <p className="mt-1 text-sm text-muted">
        Scheduled jobs by drop-off date.
      </p>

      <div className="mt-8">
        <MonthCalendar jobs={jobs} />
      </div>
    </div>
  );
}
