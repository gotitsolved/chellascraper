import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { MapPin, Globe, Sparkles, Users } from "lucide-react";
import type { Job, JobStatus } from "@/lib/types";

function StatusBadge({ status }: { status: JobStatus }) {
  const map: Record<JobStatus, { label: string; className: string }> = {
    queued: {
      label: "Queued",
      className:
        "bg-[oklch(0.65_0.10_75/0.15)] text-[oklch(0.65_0.10_75)] border-[oklch(0.65_0.10_75/0.3)]",
    },
    running: {
      label: "Running",
      className:
        "bg-[oklch(0.70_0.18_225/0.15)] text-[oklch(0.70_0.18_225)] border-[oklch(0.70_0.18_225/0.3)]",
    },
    completed: {
      label: "Completed",
      className:
        "bg-[oklch(0.62_0.16_145/0.15)] text-[oklch(0.62_0.16_145)] border-[oklch(0.62_0.16_145/0.3)]",
    },
    failed: {
      label: "Failed",
      className:
        "bg-[oklch(0.55_0.22_27/0.15)] text-[oklch(0.55_0.22_27)] border-[oklch(0.55_0.22_27/0.3)]",
    },
  };
  const { label, className } = map[status];
  return (
    <Badge variant="outline" className={`text-xs font-medium border ${className}`}>
      {label}
    </Badge>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  total?: number;
}

function StatCard({ icon, label, value, total }: StatCardProps) {
  return (
    <div className="bg-card border border-border rounded-lg p-4 flex flex-col gap-1">
      <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium uppercase tracking-wide">
        {icon}
        {label}
      </div>
      <div className="text-2xl font-semibold text-foreground font-mono">
        {value}
        {total !== undefined && (
          <span className="text-base text-muted-foreground font-normal">
            /{total}
          </span>
        )}
      </div>
    </div>
  );
}

interface JobProgressSummaryProps {
  job: Job;
}

export function JobProgressSummary({ job }: JobProgressSummaryProps) {
  const { counters } = job;
  const enrichmentPct =
    counters.leadsTotal > 0
      ? Math.round((counters.leadsEnriched / counters.leadsTotal) * 100)
      : 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <StatusBadge status={job.status} />
        <span className="text-sm text-muted-foreground">
          {job.query.businessTypes.join(", ")} — {job.query.locationText} —{" "}
          {job.query.radiusKm}km radius
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          icon={<MapPin className="h-3.5 w-3.5" />}
          label="Discovered"
          value={counters.placesDiscovered}
        />
        <StatCard
          icon={<Globe className="h-3.5 w-3.5" />}
          label="Scraped"
          value={counters.websitesScraped}
          total={counters.placesDiscovered}
        />
        <StatCard
          icon={<Sparkles className="h-3.5 w-3.5" />}
          label="Enriched"
          value={counters.leadsEnriched}
          total={counters.leadsTotal}
        />
        <StatCard
          icon={<Users className="h-3.5 w-3.5" />}
          label="Total Leads"
          value={counters.leadsTotal}
        />
      </div>

      {job.status !== "completed" && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Pipeline progress</span>
            <span className="font-mono text-primary">{enrichmentPct}%</span>
          </div>
          <Progress value={enrichmentPct} className="h-1.5" />
        </div>
      )}
    </div>
  );
}
