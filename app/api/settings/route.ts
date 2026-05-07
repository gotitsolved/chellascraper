import { NextRequest, NextResponse } from "next/server";
import type { Settings } from "@/lib/types";

// Default settings
const defaultSettings: Settings = {
  minRating: 3.5,
  mustHaveWebsite: false,
  mustHaveEmail: false,
  excludeChains: false,
};

export async function GET() {
  try {
    return NextResponse.json(defaultSettings);
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
    const updated = { ...defaultSettings, ...partial };
    return NextResponse.json(updated);
  } catch (error) {
    console.error("[v0] Error updating settings:", error);
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}

