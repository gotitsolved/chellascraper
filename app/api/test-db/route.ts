import { NextResponse } from "next/server";
import { JobsService } from "@/lib/services/jobs-service";

export async function GET() {
  try {
    // Test database connection by creating a simple job
    const testJob = await JobsService.createJob({
      name: "Database Test Job",
      query: {
        locationText: "Test",
        radiusKm: 1,
        businessTypes: [],
      },
    });

    return NextResponse.json({
      success: true,
      jobId: testJob.id,
      status: testJob.status,
      message: "Database connection successful"
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({
      success: false,
      error: message,
      errorType: typeof error,
    }, { status: 500 });
  }
}
