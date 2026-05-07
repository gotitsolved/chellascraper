import { NextRequest, NextResponse } from "next/server";
import { listJobs, createJob } from "@/lib/api";
import type { JobQuery } from "@/lib/types";

export async function GET() {
  const jobs = await listJobs();
  return NextResponse.json(jobs);
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

    const job = await createJob({ name, query });
    return NextResponse.json(job, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
