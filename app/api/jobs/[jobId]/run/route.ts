import { NextRequest, NextResponse } from "next/server";
import { runJob, getJobProgress } from "@/lib/services/job-runner";
import { jobsStore } from "@/lib/mock-data";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params;
    
    const job = jobsStore.get(jobId);
    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Check if job is already running
    const progress = getJobProgress(jobId);
    if (progress?.status === "running") {
      return NextResponse.json({ 
        error: "Job is already running",
        progress 
      }, { status: 409 });
    }

    // Start the job (don't await - let it run in background)
    runJob(jobId).catch(err => {
      console.error("[v0] Job runner error:", err);
    });

    return NextResponse.json({ 
      message: "Job started",
      jobId,
    }, { status: 202 });
  } catch (error) {
    console.error("[v0] Error starting job:", error);
    return NextResponse.json({ error: "Failed to start job" }, { status: 500 });
  }
}
