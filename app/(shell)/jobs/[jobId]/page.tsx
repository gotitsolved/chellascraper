import { notFound } from "next/navigation";
import { JobsService } from "@/lib/services/jobs-service";
import { JobProgressSummary } from "@/components/job-progress-summary";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";

export default async function JobOverviewPage({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  const { jobId } = await params;
  const job = await JobsService.getJob(jobId);
  if (!job) notFound();

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <JobProgressSummary job={job} />

      {/* Query details */}
      <div className="bg-card border border-border rounded-xl p-5 space-y-4">
        <h2 className="text-sm font-semibold text-foreground">
          Search Parameters
        </h2>
        <div className="grid sm:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
              Business Types
            </p>
            <div className="flex flex-wrap gap-1.5">
              {job.query.businessTypes.map((t) => (
                <Badge
                  key={t}
                  variant="secondary"
                  className="bg-muted text-muted-foreground border border-border text-xs"
                >
                  {t}
                </Badge>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
              Location
            </p>
            <p className="text-foreground">
              {job.query.locationText} — {job.query.radiusKm} km radius
            </p>
          </div>
          {job.query.filters.minRating != null && (
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                Min. Rating
              </p>
              <p className="text-foreground">
                {job.query.filters.minRating.toFixed(1)} ★
              </p>
            </div>
          )}
          {job.query.filters.hasWebsite && (
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                Website Filter
              </p>
              <p className="text-foreground">Must have website</p>
            </div>
          )}
          {job.query.filters.excludeChains && (
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                Chains
              </p>
              <p className="text-foreground">Excluded</p>
            </div>
          )}
        </div>
      </div>

      {/* Meta */}
      <div className="grid sm:grid-cols-3 gap-3 text-sm">
        {[
          {
            label: "Created",
            value: formatDistanceToNow(new Date(job.createdAt), {
              addSuffix: true,
            }),
          },
          {
            label: "Last run",
            value: job.lastRunAt
              ? formatDistanceToNow(new Date(job.lastRunAt), {
                  addSuffix: true,
                })
              : "—",
          },
          { label: "Created by", value: job.createdBy ?? "admin" },
        ].map(({ label, value }) => (
          <div key={label} className="bg-card border border-border rounded-lg p-3">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">
              {label}
            </p>
            <p className="text-foreground">{value}</p>
          </div>
        ))}
      </div>

      {job.errorMessage && (
        <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 text-sm text-destructive-foreground">
          <strong>Error:</strong> {job.errorMessage}
        </div>
      )}
    </div>
  );
}
