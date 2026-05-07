import { NextRequest, NextResponse } from "next/server";
import { LeadsService } from "@/lib/services/leads-service";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params;
    const exports = await LeadsService.listExports(jobId);
    return NextResponse.json(exports);
  } catch (error) {
    console.error("[v0] Error listing exports:", error);
    return NextResponse.json({ error: "Failed to list exports" }, { status: 500 });
  }
}
