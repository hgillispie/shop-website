import { getJobs } from "@/lib/db/queries";
import { KanbanBoard } from "@/components/admin/KanbanBoard";

export const dynamic = "force-dynamic";

export default async function AdminBoardPage() {
  const jobs = await getJobs();

  return (
    <div>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Job Board</h1>
        <p className="mt-1 text-sm text-muted">
          Drag cards between columns to update status. Open Drafts are screenshot
          intakes — review one, then move it out of that column (or approve it) to
          create the customer and ticket.
        </p>
      </div>

      <div className="mt-8">
        <KanbanBoard jobs={jobs} />
      </div>
    </div>
  );
}
