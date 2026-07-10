import { getJobs } from "@/lib/db/queries";
import { KanbanBoard } from "@/components/admin/KanbanBoard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createJob } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminBoardPage() {
  const jobs = await getJobs();

  return (
    <div>
      <div className="flex items-start justify-between gap-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Job Board</h1>
          <p className="mt-1 text-sm text-muted">Drag cards between columns to update status.</p>
        </div>

        <details className="w-80 rounded-lg border border-border bg-surface p-4">
          <summary className="cursor-pointer text-sm font-medium">+ New job</summary>
          <form action={createJob} className="mt-4 space-y-3">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input id="title" name="title" required />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Input id="description" name="description" />
            </div>
            <div>
              <Label htmlFor="dropoffAt">Drop-off date &amp; time</Label>
              <Input id="dropoffAt" name="dropoffAt" type="datetime-local" />
            </div>
            <Button type="submit" size="sm" className="w-full">
              Add job
            </Button>
          </form>
        </details>
      </div>

      <div className="mt-8">
        <KanbanBoard jobs={jobs} />
      </div>
    </div>
  );
}
