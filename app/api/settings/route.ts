import { NextRequest, NextResponse } from "next/server";
import { settingsStore } from "@/lib/services/jobs-service";
import type { Settings } from "@/lib/types";

export async function GET() {
  try {
    return NextResponse.json(settingsStore);
  } catch (error) {
    console.error("[v0] Error fetching settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const partial = (await req.json()) as Partial<Settings>;

    // Update settings store
    Object.assign(settingsStore, partial);

    return NextResponse.json(settingsStore);
  } catch (error) {
    console.error("[v0] Error updating settings:", error);
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
