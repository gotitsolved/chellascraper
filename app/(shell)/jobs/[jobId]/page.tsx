import { notFound } from "next/navigation";
import { JobsService } from "@/lib/services/jobs-service";
import { JobOverviewClient } from "@/components/job-overview-client";

export default async function JobOverviewPage({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  const { jobId } = await params;
  const job = await JobsService.getJob(jobId);
  if (!job) notFound();

  return <JobOverviewClient initialJob={job} />;
}
