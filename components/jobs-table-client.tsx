"use client";

import { useRouter } from "next/navigation";
import { JobsTable } from "@/components/jobs-table";
import type { Job } from "@/lib/types";

interface JobsTableClientProps {
  jobs: Job[];
}

export function JobsTableClient({ jobs }: JobsTableClientProps) {
  const router = useRouter();
  return (
    <JobsTable
      jobs={jobs}
      onJobClick={(id) => router.push(`/jobs/${id}`)}
    />
  );
}
