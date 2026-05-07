import { notFound } from "next/navigation";
import { getJob } from "@/lib/api";
import { JobTabsNav } from "@/components/job-tabs-nav";
import { formatDistanceToNow } from "date-fns";
import { ArrowLeft, Calendar } from "lucide-react";
import Link from "next/link";

export default async function JobLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ jobId: string }>;
}) {
  const { jobId } = await params;
  const job = await getJob(jobId);

  if (!job) notFound();

  return (
    <div className="flex flex-col h-full">
      {/* Job header */}
      <div className="px-6 pt-5 pb-0 bg-card border-b border-border space-y-3">
        <div className="flex items-start gap-3">
          <Link
            href="/jobs"
            className="mt-0.5 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Back to jobs"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-semibold text-foreground text-balance">
              {job.name}
            </h1>
            <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
              <Calendar className="h-3 w-3" />
              Created{" "}
              {formatDistanceToNow(new Date(job.createdAt), {
                addSuffix: true,
              })}{" "}
              &bull; {job.query.locationText} &bull; {job.query.radiusKm}km radius
            </p>
          </div>
        </div>
        <JobTabsNav jobId={jobId} />
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto">{children}</div>
    </div>
  );
}
