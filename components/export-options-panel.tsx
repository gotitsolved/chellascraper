"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Download,
  FileSpreadsheet,
  Loader2,
  CheckCircle,
  Clock,
  AlertCircle,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { Job, ExportRun, ExportRequestPayload } from "@/lib/types";

interface ExportOptionsPanelProps {
  job: Job;
  onExport: (payload: ExportRequestPayload) => Promise<void>;
  exports: ExportRun[];
}

function ExportStatusIcon({ status }: { status: ExportRun["status"] }) {
  if (status === "ready")
    return <CheckCircle className="h-4 w-4 text-[oklch(0.62_0.16_145)]" />;
  if (status === "failed")
    return <AlertCircle className="h-4 w-4 text-destructive-foreground" />;
  return <Clock className="h-4 w-4 text-muted-foreground" />;
}

export function ExportOptionsPanel({
  job,
  onExport,
  exports,
}: ExportOptionsPanelProps) {
  const [minScore, setMinScore] = useState(0);
  const [minRating, setMinRating] = useState(0);
  const [mustHaveEmail, setMustHaveEmail] = useState(false);
  const [mustHaveWebsite, setMustHaveWebsite] = useState(false);
  const [icpMatchOnly, setIcpMatchOnly] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleExport() {
    setLoading(true);
    setSuccess(false);
    try {
      const payload: ExportRequestPayload = {
        minScore: minScore > 0 ? minScore : undefined,
        minRating: minRating > 0 ? minRating : undefined,
        mustHaveEmail: mustHaveEmail || undefined,
        mustHaveWebsite: mustHaveWebsite || undefined,
        icpMatchOnly: icpMatchOnly || undefined,
      };
      await onExport(payload);

      // Trigger a direct browser download
      const qs = new URLSearchParams(
        Object.entries(payload)
          .filter(([, v]) => v !== undefined)
          .map(([k, v]) => [k, String(v)])
      ).toString();
      const url = `/api/jobs/${job.id}/export${qs ? `?${qs}` : ""}`;
      const timestamp = new Date().toISOString().slice(0, 10);
      const a = document.createElement("a");
      a.href = url;
      a.download = `chella-leads-${job.id}-${timestamp}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      setSuccess(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Export options */}
      <div className="space-y-5">
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-1">
            Export to CSV
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Exports include: <span className="text-foreground font-medium">Contact Name, Business Name</span>, category, address, city, state, country, phone, email, website, Instagram, Facebook, rating, review count, lead score, and ICP match.
          </p>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">
              Min. Lead Score
            </Label>
            <span className="text-xs font-mono text-primary">
              {minScore > 0 ? `${minScore}+` : "Any"}
            </span>
          </div>
          <Slider
            min={0}
            max={100}
            step={5}
            value={[minScore]}
            onValueChange={([v]) => setMinScore(v)}
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">Min. Rating</Label>
            <span className="text-xs font-mono text-primary">
              {minRating > 0 ? `${minRating.toFixed(1)} ★` : "Any"}
            </span>
          </div>
          <Slider
            min={0}
            max={5}
            step={0.5}
            value={[minRating]}
            onValueChange={([v]) => setMinRating(v)}
          />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">
              Must have email
            </Label>
            <Switch
              checked={mustHaveEmail}
              onCheckedChange={setMustHaveEmail}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">
              Must have website
            </Label>
            <Switch
              checked={mustHaveWebsite}
              onCheckedChange={setMustHaveWebsite}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">
              ICP matches only
            </Label>
            <Switch
              checked={icpMatchOnly}
              onCheckedChange={setIcpMatchOnly}
            />
          </div>
        </div>

        <Button
          onClick={handleExport}
          disabled={loading || job.status !== "completed"}
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              Export to CSV
            </>
          )}
        </Button>

        {success && (
          <p className="text-xs text-[oklch(0.62_0.16_145)] flex items-center gap-1.5">
            <CheckCircle className="h-3.5 w-3.5" />
            Export created and downloading.
          </p>
        )}

        {job.status !== "completed" && (
          <p className="text-xs text-muted-foreground">
            Export is available once the job is completed.
          </p>
        )}

        <p className="text-xs text-muted-foreground border-t border-border pt-3">
          Emails shown here are public business contacts. Always follow
          applicable email and privacy laws.
        </p>
      </div>

      {/* Export history */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-foreground">
          Export History
        </h3>

        {exports.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground text-sm border border-border rounded-lg">
            No exports yet.
          </div>
        ) : (
          <div className="space-y-2">
            {exports.map((exp) => (
              <div
                key={exp.id}
                className="flex items-start gap-3 p-3 bg-card border border-border rounded-lg"
              >
                <ExportStatusIcon status={exp.status} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <FileSpreadsheet className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs font-medium text-foreground">
                      {exp.rowCount} rows
                    </span>
                    <Badge
                      variant="outline"
                      className="text-xs border-border text-muted-foreground"
                    >
                      {exp.format.toUpperCase()}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {exp.filterSummary}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formatDistanceToNow(new Date(exp.createdAt), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
                {exp.status === "ready" && (
                  <a
                    href={`/api/jobs/${exp.jobId}/export`}
                    download={`chella-leads-${exp.jobId}.csv`}
                    className="text-xs text-primary hover:underline flex items-center gap-1 shrink-0"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Download
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export { Separator };
