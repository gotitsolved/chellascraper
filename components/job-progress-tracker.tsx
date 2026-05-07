"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle2, XCircle, Search, Globe, Sparkles, Target } from "lucide-react";

interface JobProgress {
  jobId: string;
  status: "queued" | "running" | "completed" | "failed";
  stage: "places" | "scraping" | "enrichment" | "scoring" | "done";
  stageProgress: number;
  overallProgress: number;
  currentAction: string;
  placesFound: number;
  websitesScraped: number;
  leadsEnriched: number;
  errors: string[];
  startedAt: string;
  updatedAt: string;
}

interface JobProgressTrackerProps {
  jobId: string;
  onComplete?: () => void;
}

const STAGES = [
  { key: "places", label: "Discovery", icon: Search, description: "Searching Google Places" },
  { key: "scraping", label: "Scraping", icon: Globe, description: "Extracting website data" },
  { key: "enrichment", label: "Enrichment", icon: Sparkles, description: "Finding contact info" },
  { key: "scoring", label: "Scoring", icon: Target, description: "Scoring against ICP" },
] as const;

export function JobProgressTracker({ jobId, onComplete }: JobProgressTrackerProps) {
  const [progress, setProgress] = useState<JobProgress | null>(null);
  const [polling, setPolling] = useState(true);

  useEffect(() => {
    if (!polling) return;

    const poll = async () => {
      try {
        const res = await fetch(`/api/jobs/${jobId}/status`);
        if (res.ok) {
          const data = await res.json();
          setProgress(data.progress);

          if (data.progress?.status === "completed" || data.progress?.status === "failed") {
            setPolling(false);
            onComplete?.();
          }
        }
      } catch (error) {
        console.error("[v0] Error polling status:", error);
      }
    };

    poll();
    const interval = setInterval(poll, 1000);
    return () => clearInterval(interval);
  }, [jobId, polling, onComplete]);

  if (!progress) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="py-8">
          <div className="flex items-center justify-center gap-3 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Initializing job...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentStageIndex = STAGES.findIndex(s => s.key === progress.stage);

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium">Job Progress</CardTitle>
          <StatusBadge status={progress.status} />
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall progress bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{progress.currentAction}</span>
            <span className="font-mono text-primary">{progress.overallProgress}%</span>
          </div>
          <Progress value={progress.overallProgress} className="h-2" />
        </div>

        {/* Stage indicators */}
        <div className="grid grid-cols-4 gap-2">
          {STAGES.map((stage, index) => {
            const isActive = stage.key === progress.stage;
            const isComplete = index < currentStageIndex || progress.status === "completed";
            const Icon = stage.icon;

            return (
              <div
                key={stage.key}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border transition-colors ${
                  isActive
                    ? "bg-primary/10 border-primary/50"
                    : isComplete
                    ? "bg-muted/50 border-border"
                    : "bg-transparent border-border/50 opacity-50"
                }`}
              >
                <div className={`p-2 rounded-full ${
                  isActive ? "bg-primary/20" : isComplete ? "bg-muted" : "bg-transparent"
                }`}>
                  {isActive && progress.status === "running" ? (
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  ) : isComplete ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : (
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
                <span className={`text-xs font-medium ${
                  isActive ? "text-primary" : isComplete ? "text-foreground" : "text-muted-foreground"
                }`}>
                  {stage.label}
                </span>
                {isActive && (
                  <span className="text-[10px] text-muted-foreground">
                    {progress.stageProgress}%
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 pt-2">
          <StatCard label="Places Found" value={progress.placesFound} />
          <StatCard label="Sites Scraped" value={progress.websitesScraped} />
          <StatCard label="Leads Enriched" value={progress.leadsEnriched} />
        </div>

        {/* Errors */}
        {progress.errors.length > 0 && (
          <div className="text-xs text-destructive bg-destructive/10 rounded p-2">
            {progress.errors.length} error(s) encountered
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status }: { status: JobProgress["status"] }) {
  switch (status) {
    case "running":
      return (
        <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/30">
          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
          Running
        </Badge>
      );
    case "completed":
      return (
        <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/30">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Completed
        </Badge>
      );
    case "failed":
      return (
        <Badge variant="outline" className="bg-red-500/10 text-red-400 border-red-500/30">
          <XCircle className="h-3 w-3 mr-1" />
          Failed
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className="bg-muted text-muted-foreground">
          Queued
        </Badge>
      );
  }
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="text-center p-2 bg-muted/30 rounded">
      <div className="text-lg font-semibold text-foreground">{value}</div>
      <div className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</div>
    </div>
  );
}
