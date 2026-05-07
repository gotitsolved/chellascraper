import { NextRequest, NextResponse } from "next/server";
import { getActivity } from "@/lib/api";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params;
  const events = await getActivity(jobId);
  return NextResponse.json(events);
}
