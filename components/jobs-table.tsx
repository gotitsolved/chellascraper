"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import type { Job, JobStatus } from "@/lib/types";
import { MapPin, Users, Globe, CheckCircle } from "lucide-react";

interface JobsTableProps {
  jobs: Job[];
  onJobClick: (jobId: string) => void;
}

function StatusBadge({ status }: { status: JobStatus }) {
  const map: Record<
    JobStatus,
    { label: string; className: string }
  > = {
    queued: {
      label: "Queued",
      className: "bg-[oklch(0.65_0.10_75/0.15)] text-[oklch(0.65_0.10_75)] border-[oklch(0.65_0.10_75/0.3)]",
    },
    running: {
      label: "Running",
      className: "bg-[oklch(0.70_0.18_225/0.15)] text-[oklch(0.70_0.18_225)] border-[oklch(0.70_0.18_225/0.3)]",
    },
    completed: {
      label: "Completed",
      className: "bg-[oklch(0.62_0.16_145/0.15)] text-[oklch(0.62_0.16_145)] border-[oklch(0.62_0.16_145/0.3)]",
    },
    failed: {
      label: "Failed",
      className: "bg-[oklch(0.55_0.22_27/0.15)] text-[oklch(0.55_0.22_27)] border-[oklch(0.55_0.22_27/0.3)]",
    },
  };

  const { label, className } = map[status];
  return (
    <Badge
      variant="outline"
      className={`text-xs font-medium border ${className}`}
    >
      {label}
    </Badge>
  );
}

export function JobsTable({ jobs, onJobClick }: JobsTableProps) {
  if (jobs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <Users className="h-10 w-10 mb-3 opacity-40" />
        <p className="text-sm">No jobs yet. Create one above to get started.</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="border-border hover:bg-transparent">
            <TableHead className="text-muted-foreground font-medium">
              Job Name
            </TableHead>
            <TableHead className="text-muted-foreground font-medium">
              Location
            </TableHead>
            <TableHead className="text-muted-foreground font-medium">
              Status
            </TableHead>
            <TableHead className="text-muted-foreground font-medium text-right">
              Leads
            </TableHead>
            <TableHead className="text-muted-foreground font-medium text-right">
              Scraped
            </TableHead>
            <TableHead className="text-muted-foreground font-medium text-right">
              Enriched
            </TableHead>
            <TableHead className="text-muted-foreground font-medium">
              Created
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {jobs.map((job) => (
            <TableRow
              key={job.id}
              onClick={() => onJobClick(job.id)}
              className="border-border cursor-pointer hover:bg-accent/50 transition-colors"
            >
              <TableCell className="font-medium text-foreground">
                {job.name}
              </TableCell>
              <TableCell>
                <span className="flex items-center gap-1.5 text-muted-foreground text-sm">
                  <MapPin className="h-3.5 w-3.5" />
                  {job.query.locationText}
                </span>
              </TableCell>
              <TableCell>
                <StatusBadge status={job.status} />
              </TableCell>
              <TableCell className="text-right font-mono text-sm text-foreground">
                {job.counters.leadsTotal}
              </TableCell>
              <TableCell className="text-right">
                <span className="flex items-center justify-end gap-1.5 font-mono text-sm text-muted-foreground">
                  <Globe className="h-3.5 w-3.5" />
                  {job.counters.websitesScraped}
                </span>
              </TableCell>
              <TableCell className="text-right">
                <span className="flex items-center justify-end gap-1.5 font-mono text-sm text-muted-foreground">
                  <CheckCircle className="h-3.5 w-3.5" />
                  {job.counters.leadsEnriched}
                </span>
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {formatDistanceToNow(new Date(job.createdAt), {
                  addSuffix: true,
                })}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
