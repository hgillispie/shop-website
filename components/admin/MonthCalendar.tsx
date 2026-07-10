"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { JobRow } from "@/lib/db/schema";

type JobWithRequest = JobRow & { request: { id: string; name: string } | null };

export function MonthCalendar({ jobs }: { jobs: JobWithRequest[] }) {
  const [monthAnchor, setMonthAnchor] = useState(() => new Date());

  const scheduled = useMemo(() => jobs.filter((job) => job.dropoffAt), [jobs]);
  const unscheduled = useMemo(() => jobs.filter((job) => !job.dropoffAt), [jobs]);

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(monthAnchor));
    const end = endOfWeek(endOfMonth(monthAnchor));
    return eachDayOfInterval({ start, end });
  }, [monthAnchor]);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{format(monthAnchor, "MMMM yyyy")}</h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMonthAnchor(new Date())}
            className="rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:border-accent hover:text-accent"
          >
            Today
          </button>
          <button
            type="button"
            aria-label="Previous month"
            onClick={() => setMonthAnchor((d) => subMonths(d, 1))}
            className="rounded-md border border-border p-1.5 hover:border-accent hover:text-accent"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Next month"
            onClick={() => setMonthAnchor((d) => addMonths(d, 1))}
            className="rounded-md border border-border p-1.5 hover:border-accent hover:text-accent"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-7 overflow-hidden rounded-lg border border-border">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div
            key={day}
            className="border-b border-border bg-surface px-2 py-2 text-center text-xs font-medium uppercase text-muted"
          >
            {day}
          </div>
        ))}

        {days.map((day) => {
          const dayJobs = scheduled.filter((job) => isSameDay(job.dropoffAt!, day));
          return (
            <div
              key={day.toISOString()}
              className={cn(
                "min-h-28 border-b border-r border-border p-2 last:border-r-0",
                !isSameMonth(day, monthAnchor) && "bg-surface/60 text-muted",
              )}
            >
              <p
                className={cn(
                  "text-xs font-medium",
                  isToday(day) && "inline-flex h-5 w-5 items-center justify-center rounded-full bg-accent text-white",
                )}
              >
                {format(day, "d")}
              </p>
              <div className="mt-1 space-y-1">
                {dayJobs.map((job) => (
                  <Link
                    key={job.id}
                    href={job.request ? `/admin/requests/${job.request.id}` : "/admin/board"}
                    className="block truncate rounded bg-accent-soft px-1.5 py-0.5 text-xs text-accent hover:underline"
                    title={job.title}
                  >
                    #{job.jobNumber} {job.title}
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {unscheduled.length > 0 && (
        <div className="mt-6">
          <p className="text-xs uppercase text-muted">Unscheduled jobs</p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {unscheduled.map((job) => (
              <li key={job.id}>
                <Link
                  href={job.request ? `/admin/requests/${job.request.id}` : "/admin/board"}
                  className="rounded-full border border-border px-3 py-1 text-xs hover:border-accent hover:text-accent"
                >
                  #{job.jobNumber} {job.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
