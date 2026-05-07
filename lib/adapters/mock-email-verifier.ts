import type { EmailVerificationResult, EmailVerifierAdapter } from "@/lib/types";

// Disposable email domains (sample list)
const DISPOSABLE_DOMAINS = new Set([
  "tempmail.com",
  "guerrillamail.com",
  "10minutemail.com",
  "throwaway.email",
  "temp-mail.org",
  "mailinator.com",
  "yopmail.com",
  "maildrop.cc",
  "trashmail.com",
]);

// Role-based email prefixes
const ROLE_BASED_PREFIXES = [
  "info@",
  "support@",
  "sales@",
  "admin@",
  "contact@",
  "help@",
  "noreply@",
  "no-reply@",
  "team@",
  "hello@",
  "service@",
];

/**
 * Mock email verifier - uses regex + simulated MX/SMTP checks.
 * Designed to be replaced with real verifier (internal service or API).
 */
export class MockEmailVerifier implements EmailVerifierAdapter {
  name = "mock-verifier";

  /**
   * Layered email verification:
   * 1. Syntax validation (RFC 5322 simplified)
   * 2. Domain validation
   * 3. MX record simulation
   * 4. Disposable email detection
   * 5. Role-based email detection
   * 6. SMTP simulation (optional)
   */
  async verifyEmail(email: string): Promise<EmailVerificationResult> {
    const verifiedAt = new Date().toISOString();
    const lowerEmail = email.toLowerCase().trim();

    // 1. Syntax validation (simplified RFC 5322)
    const syntaxRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!syntaxRegex.test(lowerEmail)) {
      return {
        email: lowerEmail,
        status: "invalid",
        reason: "Invalid email format",
        confidence: 0.95,
        isDisposable: false,
        isRoleBased: false,
        hasMxRecords: false,
        smtpCheckAttempted: false,
        smtpCheckResult: "unknown",
        verifiedAt,
      };
    }

    const [localPart, domain] = lowerEmail.split("@");

    // 2. Domain validation (must have TLD)
    if (!domain.includes(".") || domain.endsWith(".")) {
      return {
        email: lowerEmail,
        status: "invalid",
        reason: "Invalid domain",
        confidence: 0.9,
        isDisposable: false,
        isRoleBased: false,
        hasMxRecords: false,
        smtpCheckAttempted: false,
        smtpCheckResult: "unknown",
        verifiedAt,
      };
    }

    // 4. Disposable email detection
    const isDisposable = DISPOSABLE_DOMAINS.has(domain);
    if (isDisposable) {
      return {
        email: lowerEmail,
        status: "risky",
        reason: "Disposable/temporary email address",
        confidence: 0.98,
        isDisposable: true,
        isRoleBased: false,
        hasMxRecords: true,
        smtpCheckAttempted: false,
        smtpCheckResult: "unknown",
        verifiedAt,
      };
    }

    // 5. Role-based email detection
    const isRoleBased = ROLE_BASED_PREFIXES.some((prefix) =>
      localPart.startsWith(prefix.replace("@", ""))
    );

    // 3. Simulated MX record check (in real system, do actual DNS lookup)
    const hasMxRecords = !domain.includes(".test") && !domain.includes("invalid");

    if (!hasMxRecords) {
      return {
        email: lowerEmail,
        status: "invalid",
        reason: "Domain has no MX records",
        confidence: 0.85,
        isDisposable: false,
        isRoleBased: isRoleBased,
        hasMxRecords: false,
        smtpCheckAttempted: false,
        smtpCheckResult: "unknown",
        verifiedAt,
      };
    }

    // 6. Simulated SMTP check (in real system, connect to SMTP server)
    // Mock: 70% pass, 20% unknown, 10% fail
    const smtpRoll = Math.random();
    const smtpCheckAttempted = Math.random() > 0.3; // 70% of time we attempt SMTP
    let smtpCheckResult: "passed" | "failed" | "unknown" = "unknown";

    if (smtpCheckAttempted) {
      if (smtpRoll < 0.7) {
        smtpCheckResult = "passed";
      } else if (smtpRoll < 0.9) {
        smtpCheckResult = "unknown";
      } else {
        smtpCheckResult = "failed";
      }
    }

    // Final decision
    let status: "valid" | "invalid" | "risky" | "unknown" = "valid";
    let reason = "Email appears valid";
    let confidence = 0.85;

    if (smtpCheckResult === "failed") {
      status = "invalid";
      reason = "SMTP verification failed";
      confidence = 0.9;
    } else if (smtpCheckResult === "unknown") {
      if (isRoleBased) {
        status = "risky";
        reason = "Role-based email address (SMTP inconclusive)";
        confidence = 0.7;
      } else {
        status = "unknown";
        reason = "SMTP check inconclusive";
        confidence = 0.6;
      }
    } else if (isRoleBased) {
      // Role-based emails are valid but flagged as risky
      status = "risky";
      reason = "Valid but role-based email address";
      confidence = 0.8;
    }

    return {
      email: lowerEmail,
      status,
      reason,
      confidence,
      isDisposable,
      isRoleBased,
      hasMxRecords,
      smtpCheckAttempted,
      smtpCheckResult,
      verifiedAt,
    };
  }

  /**
   * Batch email verification.
   */
  async verifyEmails(emails: string[]): Promise<EmailVerificationResult[]> {
    // Add small delay between verifications to simulate real service
    const results: EmailVerificationResult[] = [];
    for (const email of emails) {
      results.push(await this.verifyEmail(email));
      // Simulate network delay
      await new Promise((r) => setTimeout(r, 50));
    }
    return results;
  }
}

// Singleton instance
export const mockEmailVerifier = new MockEmailVerifier();
