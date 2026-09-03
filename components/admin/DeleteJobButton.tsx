"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteJob } from "@/app/admin/(dashboard)/board/actions";

export function DeleteJobButton({ jobId, confirmText }: { jobId: string; confirmText: string }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  return (
    <button
      type="button"
      disabled={deleting}
      onClick={async () => {
        if (!confirm(confirmText)) return;
        setDeleting(true);
        await deleteJob(jobId);
        router.push("/admin/board");
      }}
      className="text-sm text-muted hover:text-red-600 disabled:opacity-50"
    >
      {deleting ? "Deleting…" : "Delete"}
    </button>
  );
}
