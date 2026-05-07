import { NextRequest, NextResponse } from "next/server";
import { getSettings, updateSettings } from "@/lib/api";

export async function GET() {
  const settings = await getSettings();
  return NextResponse.json(settings);
}

export async function PATCH(req: NextRequest) {
  try {
    const partial = await req.json();
    const updated = await updateSettings(partial);
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
