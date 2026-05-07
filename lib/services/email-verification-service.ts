import { z } from "zod";
import type { EmailVerificationResult } from "@/lib/types";
import { mockEmailVerifier } from "@/lib/adapters/mock-email-verifier";
import { LeadsService } from "@/lib/services/leads-service";

// Input validation
const EmailSchema = z.string().email("Invalid email format").toLowerCase();
const VerifyEmailPayloadSchema = z.object({
  email: EmailSchema,
  leadId: z.string().optional(),
  jobId: z.string().optional(),
});

type VerifyEmailPayload = z.infer<typeof VerifyEmailPayloadSchema>;

/**
 * Email Verification Service
 * Handles validation, verification logic, and persistence to Neon database.
 */
export class EmailVerificationService {
  /**
   * Verify a single email and optionally update the lead record in the database.
   */
  static async verifyEmail(
    payload: VerifyEmailPayload
  ): Promise<EmailVerificationResult> {
    // Validate input
    const validated = VerifyEmailPayloadSchema.parse(payload);

    // Perform verification using the adapter
    const result = await mockEmailVerifier.verifyEmail(validated.email);

    // Update lead record in database if leadId is provided
    if (validated.leadId) {
      await LeadsService.updateVerificationStatus(validated.leadId, {
        verificationStatus: result.status,
        verificationReason: result.reason,
        verificationConfidence: result.confidence,
        isDisposable: result.isDisposable,
        isRoleBased: result.isRoleBased,
        hasMxRecords: result.hasMxRecords,
        smtpCheckAttempted: result.smtpCheckAttempted,
        smtpCheckResult: result.smtpCheckResult,
      });
    }

    return result;
  }

  /**
   * Verify multiple emails in batch.
   */
  static async verifyEmails(emails: string[]): Promise<EmailVerificationResult[]> {
    // Perform batch verification using the adapter
    return await mockEmailVerifier.verifyEmails(emails);
  }

  /**
   * Get verification status badge color.
   */
  static getStatusColor(
    status: "valid" | "invalid" | "risky" | "unknown"
  ): string {
    switch (status) {
      case "valid":
        return "bg-[oklch(0.62_0.16_145)]"; // Green
      case "invalid":
        return "bg-[oklch(0.55_0.22_27)]"; // Red
      case "risky":
        return "bg-[oklch(0.76_0.15_55)]"; // Amber/Yellow
      case "unknown":
        return "bg-[oklch(0.50_0.02_260)]"; // Gray
    }
  }

  /**
   * Get verification status label.
   */
  static getStatusLabel(
    status: "valid" | "invalid" | "risky" | "unknown"
  ): string {
    return status.charAt(0).toUpperCase() + status.slice(1);
  }
}
