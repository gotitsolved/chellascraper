import { NextRequest, NextResponse } from "next/server";
import { JobsService } from "@/lib/services/jobs-service";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params;
    const events = await JobsService.getActivity(jobId);
    return NextResponse.json(events);
  } catch (error) {
    console.error("[v0] Error fetching activity:", error);
    return NextResponse.json(
      { error: "Failed to fetch activity" },
      { status: 500 }
    );
  }
}
