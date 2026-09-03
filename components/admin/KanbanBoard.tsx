"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import {
  DndContext,
  type DragEndEvent,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { deleteJob, updateJobStatus } from "@/app/admin/(dashboard)/board/actions";
import type { JobRow } from "@/lib/db/schema";
import { cn } from "@/lib/utils";

// Widened from the original { id, name } slice so the card itself can
// surface what the customer actually reported — bike + what kind of work —
// without needing to click through. See app/admin/(dashboard)/board/[id]
// for the full detail (findings, photos, "Create Invoice").
type JobWithRequest = JobRow & {
  request: { id: string; name: string; bikeYearMakeModel: string; serviceTypes: string[] } | null;
};
type JobStatus = JobRow["status"];

const COLUMNS: { key: JobStatus; label: string }[] = [
  { key: "backlog", label: "Backlog" },
  { key: "in_progress", label: "In Progress" },
  { key: "waiting_on_customer", label: "Waiting on Customer" },
  { key: "complete", label: "Complete" },
];

function JobCard({ job, onDelete }: { job: JobWithRequest; onDelete: (id: string) => void }) {
  const router = useRouter();
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: job.id,
  });

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
        "group relative cursor-grab rounded-md border border-border bg-background p-3 text-sm shadow-sm active:cursor-grabbing",
        isDragging && "z-10 opacity-70",
      )}
    >
      <button
        type="button"
        aria-label="Delete job"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          if (confirm(`Delete job #${job.jobNumber} (${job.title})?`)) {
            onDelete(job.id);
          }
        }}
        className="absolute right-2 top-2 text-muted opacity-0 transition-opacity hover:text-red-600 group-hover:opacity-100"
      >
        <X className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
      <p className="pr-4 font-medium">
        #{job.jobNumber} {job.title}
      </p>
      {job.description && (
        <p className="mt-1 line-clamp-2 text-xs text-muted">{job.description}</p>
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
        Click to open →
      </p>
    </div>
  );
}

function Column({
  status,
  label,
  jobs,
  onDelete,
}: {
  status: JobStatus;
  label: string;
  jobs: JobWithRequest[];
  onDelete: (id: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex min-h-[24rem] flex-1 flex-col rounded-lg border border-border bg-surface p-3",
        isOver && "border-accent bg-accent-soft",
      )}
    >
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">
        {label} <span className="text-muted">({jobs.length})</span>
      </p>
      <div className="flex flex-1 flex-col gap-2">
        {jobs.map((job) => (
          <JobCard key={job.id} job={job} onDelete={onDelete} />
        ))}
      </div>
    </div>
  );
}

export function KanbanBoard({ jobs: initialJobs }: { jobs: JobWithRequest[] }) {
  const [jobs, setJobs] = useState(initialJobs);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;

    const jobId = String(active.id);
    const newStatus = over.id as JobStatus;
    const job = jobs.find((j) => j.id === jobId);
    if (!job || job.status === newStatus) return;

    setJobs((prev) => prev.map((j) => (j.id === jobId ? { ...j, status: newStatus } : j)));
    updateJobStatus(jobId, newStatus).catch(() => {
      setJobs((prev) => prev.map((j) => (j.id === jobId ? { ...j, status: job.status } : j)));
    });
  }

  function handleDelete(jobId: string) {
    const removed = jobs.find((j) => j.id === jobId);
    setJobs((prev) => prev.filter((j) => j.id !== jobId));
    deleteJob(jobId).catch(() => {
      if (removed) setJobs((prev) => [...prev, removed]);
    });
  }

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        {COLUMNS.map((column) => (
          <Column
            key={column.key}
            status={column.key}
            label={column.label}
            jobs={jobs.filter((job) => job.status === column.key)}
            onDelete={handleDelete}
          />
        ))}
      </div>
    </DndContext>
  );
}
