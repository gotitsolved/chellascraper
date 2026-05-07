import { notFound } from "next/navigation";
import { getJob, listExports } from "@/lib/api";
import { ExportPageClient } from "@/components/export-page-client";

export default async function JobExportPage({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  const { jobId } = await params;
  const [job, exports] = await Promise.all([
    getJob(jobId),
    listExports(jobId),
  ]);

  if (!job) notFound();

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <ExportPageClient job={job} initialExports={exports} />
    </div>
  );
}
