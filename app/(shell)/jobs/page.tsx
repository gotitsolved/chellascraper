export const dynamic = 'force-dynamic';

import { JobsTableClient } from "@/components/jobs-table-client";
import { JobCreateFormDialog } from "@/components/job-create-form-dialog";
import { Briefcase } from "lucide-react";

export default function JobsPage() {
  return (
    <div className="p-6 max-w-6xl mx-auto space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Briefcase className="h-5 w-5 text-muted-foreground" />
          <div>
            <h1 className="text-xl font-semibold text-foreground">Jobs</h1>
            <p className="text-sm text-muted-foreground">
              All job listings
            </p>
          </div>
        </div>
        <JobCreateFormDialog />
      </div>

      <JobsTableClient />
    </div>
  );
}
