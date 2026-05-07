"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { JobProgressTracker } from "@/components/job-progress-tracker";
import { JobProgressSummary } from "@/components/job-progress-summary";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { Play, RefreshCw } from "lucide-react";
import type { Job } from "@/lib/types";

interface JobOverviewClientProps {
  initialJob: Job;
}

export function JobOverviewClient({ initialJob }: JobOverviewClientProps) {
  const router = useRouter();
  const [job, setJob] = useState<Job>(initialJob);
  const [isRunning, setIsRunning] = useState(initialJob.status === "running" || initialJob.status === "queued");
  const [startingJob, setStartingJob] = useState(false);

  // Poll for job updates when running
  useEffect(() => {
    if (!isRunning) return;

    const poll = async () => {
      try {
        const res = await fetch(`/api/jobs/${job.id}/status`);
        if (res.ok) {
          const data = await res.json();
          if (data.job) {
            setJob(data.job);
            if (data.job.status === "completed" || data.job.status === "failed") {
              setIsRunning(false);
              router.refresh();
            }
          }
        }
      } catch {
        // Ignore polling errors
      }
    };

    poll();
    const interval = setInterval(poll, 2000);
    return () => clearInterval(interval);
  }, [job.id, isRunning, router]);

  const handleRunJob = async () => {
    setStartingJob(true);
    try {
      const res = await fetch(`/api/jobs/${job.id}/run`, { method: "POST" });
      if (res.ok) {
        setIsRunning(true);
        setJob({ ...job, status: "running" });
      }
    } catch {
      // Ignore start errors
    } finally {
      setStartingJob(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Show progress tracker when running */}
      {isRunning ? (
        <JobProgressTracker 
          jobId={job.id} 
          onComplete={() => {
            setIsRunning(false);
            router.refresh();
          }} 
        />
      ) : (
        <>
          <JobProgressSummary job={job} />
          
          {/* Run button for queued or completed jobs */}
          {(job.status === "queued" || job.status === "completed" || job.status === "failed") && (
            <Button
              onClick={handleRunJob}
              disabled={startingJob}
              className="w-full sm:w-auto"
            >
              {startingJob ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Play className="h-4 w-4 mr-2" />
              )}
              {job.status === "queued" ? "Start Job" : "Re-run Job"}
            </Button>
          )}
        </>
      )}

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
              {job.query.businessTypes.slice(0, 6).map((t) => (
                <Badge
                  key={t}
                  variant="secondary"
                  className="bg-muted text-muted-foreground border border-border text-xs"
                >
                  {t}
                </Badge>
              ))}
              {job.query.businessTypes.length > 6 && (
                <Badge
                  variant="secondary"
                  className="bg-muted text-muted-foreground border border-border text-xs"
                >
                  +{job.query.businessTypes.length - 6} more
                </Badge>
              )}
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
