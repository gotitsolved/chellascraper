import { NextRequest, NextResponse } from "next/server";
import { listLeads } from "@/lib/api";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params;
  const sp = req.nextUrl.searchParams;

  const filters = {
    minScore: sp.get("minScore") ? Number(sp.get("minScore")) : undefined,
    minRating: sp.get("minRating") ? Number(sp.get("minRating")) : undefined,
    hasEmail: sp.get("hasEmail") === "true" ? true : undefined,
    hasWebsite: sp.get("hasWebsite") === "true" ? true : undefined,
    icpMatch: sp.get("icpMatch") === "true" ? true : sp.get("icpMatch") === "false" ? false : undefined,
    city: sp.get("city") ?? undefined,
    country: sp.get("country") ?? undefined,
    page: sp.get("page") ? Number(sp.get("page")) : 1,
    pageSize: sp.get("pageSize") ? Number(sp.get("pageSize")) : 50,
  };

  const result = await listLeads(jobId, filters);
  return NextResponse.json(result);
}
