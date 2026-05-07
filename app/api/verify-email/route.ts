import { NextRequest, NextResponse } from "next/server";
import { EmailVerificationService } from "@/lib/services/email-verification-service";
import { z } from "zod";

const VerifyEmailSchema = z.object({
  email: z.string().email(),
  leadId: z.string().optional(),
  jobId: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const payload = VerifyEmailSchema.parse(body);

    const result = await EmailVerificationService.verifyEmail(payload);
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request body", details: error.errors },
        { status: 400 }
      );
    }
    console.error("[v0] Error verifying email:", error);
    return NextResponse.json(
      { error: "Failed to verify email" },
      { status: 500 }
    );
  }
}
