import { NextRequest, NextResponse } from "next/server";
import { LeadsService } from "@/lib/services/leads-service";
import type { ExportRequestPayload } from "@/lib/types";

// POST /api/jobs/[jobId]/export — create a CSV export
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params;

  let payload: ExportRequestPayload = {};
  try {
    payload = await req.json();
  } catch {
    // empty body is fine
  }

  const exportRun = await LeadsService.createExport(jobId, payload);
  return NextResponse.json(exportRun, { status: 201 });
}

// GET /api/jobs/[jobId]/export — download CSV directly
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params;
  const sp = req.nextUrl.searchParams;

  const payload: ExportRequestPayload = {
    minScore: sp.get("minScore") ? Number(sp.get("minScore")) : undefined,
    minRating: sp.get("minRating") ? Number(sp.get("minRating")) : undefined,
    mustHaveEmail: sp.get("mustHaveEmail") === "true" ? true : undefined,
    mustHaveWebsite: sp.get("mustHaveWebsite") === "true" ? true : undefined,
    icpMatchOnly: sp.get("icpMatchOnly") === "true" ? true : undefined,
    city: sp.get("city") ?? undefined,
    country: sp.get("country") ?? undefined,
  };

  const { leads } = await LeadsService.listLeads(jobId, {
    minScore: payload.minScore,
    minRating: payload.minRating,
    hasEmail: payload.mustHaveEmail,
    hasWebsite: payload.mustHaveWebsite,
    icpMatch: payload.icpMatchOnly ? true : undefined,
    pageSize: 10000,
  });

  const csv = LeadsService.generateCsv(leads);

  const timestamp = new Date().toISOString().slice(0, 10);
  const filename = `chella-leads-${jobId}-${timestamp}.csv`;

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
