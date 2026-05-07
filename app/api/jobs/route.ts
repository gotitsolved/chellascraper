import { NextRequest, NextResponse } from "next/server";
import { JobsService } from "@/lib/services/jobs-service";
import { runJob } from "@/lib/services/job-runner";
import type { JobQuery } from "@/lib/types";

export async function GET() {
  try {
    const jobs = await JobsService.listJobs();
    return NextResponse.json(jobs);
  } catch (error) {
    console.error("[v0] Error listing jobs:", error);
    return NextResponse.json({ error: "Failed to list jobs" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, query } = body as { name: string; query: JobQuery };

    if (!name || !query) {
      return NextResponse.json(
        { error: "name and query are required" },
        { status: 400 }
      );
    }

    const job = await JobsService.createJob({ name, query });

    // Run job in background (non-blocking)
    runJob(job.id).catch(err => console.error("[v0] Background job error:", err));

    return NextResponse.json(job, { status: 201 });
  } catch (error) {
    console.error("[v0] Error creating job:", error);
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}

