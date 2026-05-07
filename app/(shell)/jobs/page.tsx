import { JobsService } from "@/lib/services/jobs-service";
import { JobsTableClient } from "@/components/jobs-table-client";
import { JobCreateFormDialog } from "@/components/job-create-form-dialog";
import { Briefcase } from "lucide-react";

export default async function JobsPage() {
  const result = await JobsService.listJobs();
  const jobs = result.jobs;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Briefcase className="h-5 w-5 text-muted-foreground" />
          <div>
            <h1 className="text-xl font-semibold text-foreground">Jobs</h1>
            <p className="text-sm text-muted-foreground">
              {jobs.length} job{jobs.length !== 1 ? "s" : ""} total
            </p>
          </div>
        </div>
        <JobCreateFormDialog />
      </div>

      <JobsTableClient jobs={jobs} />
    </div>
  );
}
