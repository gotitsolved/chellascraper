import { NextRequest, NextResponse } from "next/server";
import { EmailVerificationService } from "@/lib/services/email-verification-service";
import { z } from "zod";

const VerifyEmailsSchema = z.object({
  emails: z.array(z.string().email()),
  leadIds: z.array(z.string()).optional(),
  jobId: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const payload = VerifyEmailsSchema.parse(body);

    const results = await EmailVerificationService.verifyEmails(payload);
    return NextResponse.json(results, { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request body", details: error.errors },
        { status: 400 }
      );
    }
    console.error("[v0] Error verifying emails:", error);
    return NextResponse.json(
      { error: "Failed to verify emails" },
      { status: 500 }
    );
  }
}
