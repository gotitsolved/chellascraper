import { NextRequest, NextResponse } from "next/server";
import { listExports } from "@/lib/api";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params;
  const exports = await listExports(jobId);
  return NextResponse.json(exports);
}
