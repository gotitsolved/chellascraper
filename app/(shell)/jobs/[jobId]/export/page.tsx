import { notFound } from "next/navigation";
import { JobsService } from "@/lib/services/jobs-service";
import { LeadsService } from "@/lib/services/leads-service";
import { ExportPageClient } from "@/components/export-page-client";

export default async function JobExportPage({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  const { jobId } = await params;
  const [job, exports] = await Promise.all([
    JobsService.getJob(jobId),
    LeadsService.listExports(jobId),
  ]);

  if (!job) notFound();

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <ExportPageClient job={job} initialExports={exports} />
    </div>
  );
}
