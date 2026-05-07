import { notFound } from "next/navigation";
import { getJob, listLeads } from "@/lib/api";
import { LeadsView } from "@/components/leads-view";

export default async function JobLeadsPage({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  const { jobId } = await params;
  const [job, { leads }] = await Promise.all([
    getJob(jobId),
    listLeads(jobId, { pageSize: 1000 }),
  ]);

  if (!job) notFound();

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <LeadsView leads={leads} />
    </div>
  );
}
