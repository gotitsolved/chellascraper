import { notFound } from "next/navigation";
import { JobsService } from "@/lib/services/jobs-service";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import type { ActivityEvent } from "@/lib/types";
import {
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Info,
} from "lucide-react";

function EventIcon({ type }: { type: ActivityEvent["type"] }) {
  if (type === "success")
    return <CheckCircle2 className="h-4 w-4 text-[oklch(0.62_0.16_145)] shrink-0" />;
  if (type === "error")
    return <AlertCircle className="h-4 w-4 text-destructive-foreground shrink-0" />;
  if (type === "warning")
    return <AlertTriangle className="h-4 w-4 text-[oklch(0.65_0.10_75)] shrink-0" />;
  return <Info className="h-4 w-4 text-muted-foreground shrink-0" />;
}

const STAGE_LABELS: Record<ActivityEvent["stage"], string> = {
  places: "Google Places",
  scraping: "Web Scraping",
  enrichment: "Enrichment",
  scoring: "Scoring",
  system: "System",
};

export default async function JobActivityPage({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  const { jobId } = await params;
  const [job, events] = await Promise.all([
    JobsService.getJob(jobId),
    JobsService.getActivity(jobId),
  ]);

  if (!job) notFound();

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-4">
      <p className="text-sm text-muted-foreground">
        Pipeline event log for this job.
      </p>

      <div className="relative space-y-0">
        {/* Vertical line */}
        <div className="absolute left-[17px] top-2 bottom-2 w-px bg-border" />

        {events.map((event, i) => (
          <div key={event.id} className="flex gap-4 relative pb-4 last:pb-0">
            <div
              className={cn(
                "w-9 h-9 rounded-full border border-border bg-card flex items-center justify-center shrink-0 z-10",
                i === events.length - 1 && "ring-2 ring-primary/20"
              )}
            >
              <EventIcon type={event.type} />
            </div>
            <div className="flex-1 min-w-0 pt-1.5 pb-2">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <p className="text-sm text-foreground font-medium leading-snug">
                    {event.message}
                  </p>
                  {event.detail && (
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                      {event.detail}
                    </p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <span className="text-xs bg-muted text-muted-foreground rounded px-1.5 py-0.5">
                    {STAGE_LABELS[event.stage]}
                  </span>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(event.timestamp), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
