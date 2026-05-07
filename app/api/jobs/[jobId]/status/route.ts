import { NextRequest, NextResponse } from "next/server";
import { getJobProgress, getJobActivities } from "@/lib/services/job-runner";
import { jobsStore } from "@/lib/mock-data";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params;
    
    const job = jobsStore.get(jobId);
    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    const progress = getJobProgress(jobId);
    const activities = getJobActivities(jobId);

    return NextResponse.json({
      job,
      progress,
      activities,
    });
  } catch (error) {
    console.error("[v0] Error fetching job status:", error);
    return NextResponse.json({ error: "Failed to fetch status" }, { status: 500 });
  }
}
