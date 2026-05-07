import { z } from "zod";
import type { EmailVerificationResult, Lead } from "@/lib/types";
import { mockEmailVerifier } from "@/lib/adapters/mock-email-verifier";
import { leadsStore } from "@/lib/mock-data";

// Input validation
const EmailSchema = z.string().email("Invalid email format").toLowerCase();
const VerifyEmailPayloadSchema = z.object({
  email: EmailSchema,
  leadId: z.string().optional(),
  jobId: z.string().optional(),
});

const VerifyEmailsPayloadSchema = z.object({
  emails: z.array(EmailSchema),
  leadIds: z.array(z.string()).optional(),
  jobId: z.string().optional(),
});

type VerifyEmailPayload = z.infer<typeof VerifyEmailPayloadSchema>;
type VerifyEmailsPayload = z.infer<typeof VerifyEmailsPayloadSchema>;

/**
 * Email Verification Service
 * Handles validation, verification logic, and persistence.
 */
export class EmailVerificationService {
  /**
   * Verify a single email and optionally update the lead record.
   */
  static async verifyEmail(
    payload: VerifyEmailPayload
  ): Promise<EmailVerificationResult> {
    // Validate input
    const validated = VerifyEmailPayloadSchema.parse(payload);

    // Perform verification using the adapter
    // TODO: Replace mockEmailVerifier with configurable adapter (settings-driven)
    const result = await mockEmailVerifier.verifyEmail(validated.email);

    // Update lead record if leadId and jobId are provided
    if (validated.leadId && validated.jobId) {
      this.updateLeadVerification(validated.jobId, validated.leadId, result);
    }

    return result;
  }

  /**
   * Verify multiple emails and optionally update lead records.
   */
  static async verifyEmails(
    payload: VerifyEmailsPayload
  ): Promise<EmailVerificationResult[]> {
    // Validate input
    const validated = VerifyEmailsPayloadSchema.parse(payload);

    // Perform batch verification
    // TODO: Replace mockEmailVerifier with configurable adapter
    const results = await mockEmailVerifier.verifyEmails(validated.emails);

    // Update lead records if provided
    if (validated.leadIds && validated.jobId && validated.leadIds.length > 0) {
      for (let i = 0; i < results.length; i++) {
        const leadId = validated.leadIds[i];
        if (leadId) {
          this.updateLeadVerification(validated.jobId, leadId, results[i]);
        }
      }
    }

    return results;
  }

  /**
   * Update a lead's verification status in the store.
   */
  private static updateLeadVerification(
    jobId: string,
    leadId: string,
    result: EmailVerificationResult
  ): void {
    const leads = leadsStore.get(jobId);
    if (!leads) return;

    const leadIndex = leads.findIndex((l) => l.id === leadId);
    if (leadIndex === -1) return;

    const lead = leads[leadIndex];
    const updatedLead: Lead = {
      ...lead,
      verificationStatus: result.status,
      verificationReason: result.reason,
      verificationConfidence: result.confidence,
      verifiedAt: result.verifiedAt,
      isDisposable: result.isDisposable,
      isRoleBased: result.isRoleBased,
      hasMxRecords: result.hasMxRecords,
      smtpCheckAttempted: result.smtpCheckAttempted,
      smtpCheckResult: result.smtpCheckResult,
    };

    leads[leadIndex] = updatedLead;
    leadsStore.set(jobId, leads);
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
