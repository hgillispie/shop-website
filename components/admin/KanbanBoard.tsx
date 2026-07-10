"use client";

import { useState } from "react";
import Link from "next/link";
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
import type { JobRow } from "@/lib/db/schema";
import { cn } from "@/lib/utils";

type JobWithRequest = JobRow & { request: { id: string; name: string } | null };
type JobStatus = JobRow["status"];

const COLUMNS: { key: JobStatus; label: string }[] = [
  { key: "backlog", label: "Backlog" },
  { key: "in_progress", label: "In Progress" },
  { key: "waiting_on_customer", label: "Waiting on Customer" },
  { key: "complete", label: "Complete" },
];

function JobCard({ job }: { job: JobWithRequest }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: job.id,
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={
        transform
          ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
          : undefined
      }
      className={cn(
        "cursor-grab rounded-md border border-border bg-background p-3 text-sm shadow-sm active:cursor-grabbing",
        isDragging && "z-10 opacity-70",
      )}
    >
      <p className="font-medium">
        #{job.jobNumber} {job.title}
      </p>
      {job.description && (
        <p className="mt-1 line-clamp-2 text-xs text-muted">{job.description}</p>
      )}
      {job.request && (
        <Link
          href={`/admin/requests/${job.request.id}`}
          className="mt-2 inline-block text-xs text-accent hover:underline"
        >
          {job.request.name} →
        </Link>
      )}
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
  jobs: JobWithRequest[];
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
          <JobCard key={job.id} job={job} />
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

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
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
