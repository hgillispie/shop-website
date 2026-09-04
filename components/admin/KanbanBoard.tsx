"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  type DragEndEvent,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { updateJobStatus } from "@/app/admin/(dashboard)/board/actions";
import type { IntakeDraftRow, JobRow } from "@/lib/db/schema";
import { cn } from "@/lib/utils";

type JobWithDetails = JobRow & {
  request: {
    id: string;
    name: string;
    bikeYearMakeModel: string;
    serviceTypes: string[];
  } | null;
  intakeDraft: IntakeDraftRow | null;
};
type JobStatus = JobRow["status"];

const COLUMNS: { key: JobStatus; label: string }[] = [
  { key: "open_draft", label: "Open Drafts" },
  { key: "backlog", label: "Backlog" },
  { key: "in_progress", label: "In Progress" },
  { key: "waiting_on_customer", label: "Waiting on Customer" },
  { key: "complete", label: "Complete" },
];

function JobCard({ job }: { job: JobWithDetails }) {
  const router = useRouter();
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: job.id,
  });
  const draft = job.intakeDraft;
  const isDraft = job.status === "open_draft";

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={() => router.push(`/admin/board/${job.id}`)}
      style={
        transform
          ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
          : undefined
      }
      className={cn(
        "group relative cursor-grab rounded-md border bg-background p-3 text-sm shadow-sm active:cursor-grabbing",
        isDraft ? "border-dashed border-accent" : "border-border",
        isDragging && "z-10 opacity-70",
      )}
    >
      <p className="font-medium">
        #{job.jobNumber} {job.title}
      </p>
      {job.description && (
        <p className="mt-1 line-clamp-2 text-xs text-muted">{job.description}</p>
      )}
      {draft && (
        <p className="mt-2 text-xs text-muted">
          {draft.source === "telegram" ? "Telegram" : "Email"}
          {draft.customerName || draft.customerPhone || draft.bikeYearMakeModel
            ? ` · ${[draft.customerName, draft.customerPhone, draft.bikeYearMakeModel].filter(Boolean).join(" · ")}`
            : " · Needs review"}
        </p>
      )}
      {job.request && (
        <div className="mt-2 space-y-1">
          <p className="text-xs text-muted">
            {job.request.name} · {job.request.bikeYearMakeModel}
          </p>
          {job.request.serviceTypes.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {job.request.serviceTypes.map((type) => (
                <span
                  key={type}
                  className="rounded-full bg-accent-soft px-2 py-0.5 text-[10px] text-accent"
                >
                  {type}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
      <p className="mt-2 text-[10px] text-muted opacity-0 transition-opacity group-hover:opacity-100">
        {isDraft ? "Review to approve →" : "Click to open →"}
      </p>
    </div>
  );
}

function Column({
  status,
  label,
  jobs,
}: {
  status: JobStatus;
  label: string;
  jobs: JobWithDetails[];
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const isDraftColumn = status === "open_draft";

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex min-h-[24rem] flex-1 flex-col rounded-lg border bg-surface p-3",
        isDraftColumn ? "border-dashed border-accent/50" : "border-border",
        isOver && "border-accent bg-accent-soft",
      )}
    >
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">
        {label} <span className="text-muted">({jobs.length})</span>
      </p>
      <div className="flex flex-1 flex-col gap-2">
        {jobs.map((job) => (
          <JobCard key={job.id} job={job} />
        ))}
      </div>
    </div>
  );
}

export function KanbanBoard({ jobs: initialJobs }: { jobs: JobWithDetails[] }) {
  const [jobs, setJobs] = useState(initialJobs);
  const [error, setError] = useState<string | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;

    const jobId = String(active.id);
    const newStatus = over.id as JobStatus;
    const job = jobs.find((j) => j.id === jobId);
    if (!job || job.status === newStatus) return;
    if (newStatus === "open_draft") return;

    const previousStatus = job.status;
    setError(null);
    setJobs((prev) => prev.map((j) => (j.id === jobId ? { ...j, status: newStatus } : j)));
    updateJobStatus(jobId, newStatus).catch((err: unknown) => {
      setJobs((prev) =>
        prev.map((j) => (j.id === jobId ? { ...j, status: previousStatus } : j)),
      );
      const message = err instanceof Error ? err.message : "Could not move job.";
      setError(
        message.includes("phone") || message.includes("name")
          ? "Open the draft and fill in name + phone before moving it out of Open Drafts."
          : message,
      );
    });
  }

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      {error && (
        <p className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          {error}
        </p>
      )}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        {COLUMNS.map((column) => (
          <Column
            key={column.key}
            status={column.key}
            label={column.label}
            jobs={jobs.filter((job) => job.status === column.key)}
          />
        ))}
      </div>
    </DndContext>
  );
}
