"use client";

import { useState } from "react";
import { ExportOptionsPanel } from "@/components/export-options-panel";
import type { Job, ExportRun, ExportRequestPayload } from "@/lib/types";

interface ExportPageClientProps {
  job: Job;
  initialExports: ExportRun[];
}

export function ExportPageClient({ job, initialExports }: ExportPageClientProps) {
  const [exports, setExports] = useState<ExportRun[]>(initialExports);

  async function handleExport(payload: ExportRequestPayload) {
    const res = await fetch(`/api/jobs/${job.id}/export`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      const newExport: ExportRun = await res.json();
      setExports((prev) => [newExport, ...prev]);
    }
  }

  return (
    <ExportOptionsPanel job={job} onExport={handleExport} exports={exports} />
  );
}
