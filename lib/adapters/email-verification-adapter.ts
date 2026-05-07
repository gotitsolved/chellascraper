/**
 * Email Verification Adapter
 * 
 * This adapter wraps our internal email verification service based on `leak-checker-app`.
 * It uses the LeakCheck.io API to verify email validity and check for breach exposure.
 * 
 * TODO: Integration points for leak-checker-app:
 * 1. Configure LEAKCHECK_API_KEY environment variable
 * 2. Optionally deploy leak-checker-app as a service and call it via HTTP
 * 
 * The LeakCheck API provides:
 * - Email breach detection
 * - Confidence scoring based on exposure history
 * - Field-level exposure details (password, phone, address, etc.)
 */

export interface VerifiedEmail {
  email: string
  confidence: number // 0-100 score
  isValidFormat: boolean
  isRoleBased: boolean // info@, contact@, admin@, etc.
  isDisposable: boolean
  source: "scrape" | "contact-page" | "about-page" | "homepage" | "unknown"
  breachCount: number
  hasPasswordExposed: boolean
  lastBreachDate?: string
  notes?: string
}

export interface EmailVerificationAdapter {
  name: string
  verifyEmails(emails: string[]): Promise<VerifiedEmail[]>
  isAvailable(): Promise<boolean>
}

// Common role-based email prefixes
const ROLE_BASED_PREFIXES = [
  "info",
  "contact",
  "hello",
  "support",
  "admin",
  "sales",
  "marketing",
  "hr",
  "jobs",
  "careers",
  "noreply",
  "no-reply",
  "webmaster",
  "postmaster",
  "billing",
  "accounting",
  "press",
  "media",
]

// Common disposable email domains
const DISPOSABLE_DOMAINS = [
  "tempmail.com",
  "throwaway.email",
  "guerrillamail.com",
  "10minutemail.com",
  "mailinator.com",
  "temp-mail.org",
  "fakeinbox.com",
  "sharklasers.com",
]

function isValidEmailFormat(email: string): boolean {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
  return emailRegex.test(email)
}

function isRoleBasedEmail(email: string): boolean {
  const localPart = email.split("@")[0].toLowerCase()
  return ROLE_BASED_PREFIXES.some((prefix) => localPart === prefix || localPart.startsWith(`${prefix}.`))
}

function isDisposableEmail(email: string): boolean {
  const domain = email.split("@")[1]?.toLowerCase()
  return DISPOSABLE_DOMAINS.includes(domain)
}

/**
 * Mock verification for development
 */
async function mockVerify(emails: string[]): Promise<VerifiedEmail[]> {
  await new Promise((resolve) => setTimeout(resolve, 300))

  return emails.map((email) => {
    const isValid = isValidEmailFormat(email)
    const isRole = isRoleBasedEmail(email)
    const isDisposable = isDisposableEmail(email)

    // Calculate mock confidence score
    let confidence = 70
    if (isRole) confidence -= 10
    if (isDisposable) confidence -= 30
    if (!isValid) confidence = 0

    // Random breach simulation
    const breachCount = Math.random() > 0.7 ? Math.floor(Math.random() * 5) : 0
    const hasPasswordExposed = breachCount > 0 && Math.random() > 0.5

    return {
      email,
      confidence: Math.max(0, Math.min(100, confidence + (Math.random() * 20 - 10))),
      isValidFormat: isValid,
      isRoleBased: isRole,
      isDisposable,
      source: "scrape" as const,
      breachCount,
      hasPasswordExposed,
      lastBreachDate: breachCount > 0 ? "2023-06-15" : undefined,
      notes: breachCount > 0 ? `Found in ${breachCount} breach(es)` : undefined,
    }
  })
}

/**
 * Production verification using LeakCheck.io API
 * 
 * TODO: This integrates with your leak-checker-app's API pattern
 * Adjust the endpoint and response mapping based on your deployment
 */
async function productionVerify(emails: string[]): Promise<VerifiedEmail[]> {
  const leakCheckApiKey = process.env.LEAKCHECK_API_KEY
  const verificationServiceUrl = process.env.EMAIL_VERIFICATION_SERVICE_URL

  if (!leakCheckApiKey && !verificationServiceUrl) {
    console.warn("[v0] No email verification credentials configured, falling back to mock")
    return mockVerify(emails)
  }

  const results: VerifiedEmail[] = []

  for (const email of emails) {
    try {
      let breachData: { found: number; result?: Array<{ source: { name: string; date: string }; fields: string[] }> } = {
        found: 0,
      }

      if (verificationServiceUrl) {
        // Option 1: Use your deployed leak-checker-app service
        const response = await fetch(`${verificationServiceUrl}/api/check`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ query: email, type: "email" }),
        })

        if (response.ok) {
          breachData = await response.json()
        }
      } else if (leakCheckApiKey) {
        // Option 2: Direct LeakCheck.io API call (as used in leak-checker-app)
        const response = await fetch(`https://leakcheck.io/api/v2/query/${encodeURIComponent(email)}`, {
          headers: {
            Accept: "application/json",
            "X-API-Key": leakCheckApiKey,
          },
        })

        if (response.ok) {
          breachData = await response.json()
        }
      }

      const breachCount = breachData.found || 0
      const hasPasswordExposed = breachData.result?.some((r) => r.fields?.includes("password")) || false
      const lastBreach = breachData.result?.[0]?.source?.date

      // Calculate confidence based on breach history
      let confidence = 85
      if (breachCount > 0) confidence -= breachCount * 5
      if (hasPasswordExposed) confidence -= 15
      if (isRoleBasedEmail(email)) confidence -= 5
      if (isDisposableEmail(email)) confidence -= 25

      results.push({
        email,
        confidence: Math.max(0, Math.min(100, confidence)),
        isValidFormat: isValidEmailFormat(email),
        isRoleBased: isRoleBasedEmail(email),
        isDisposable: isDisposableEmail(email),
        source: "scrape",
        breachCount,
        hasPasswordExposed,
        lastBreachDate: lastBreach,
        notes: breachCount > 0 ? `Found in ${breachCount} known breach(es)` : undefined,
      })
    } catch (error) {
      console.error(`[v0] Email verification failed for ${email}:`, error)
      results.push({
        email,
        confidence: 50,
        isValidFormat: isValidEmailFormat(email),
        isRoleBased: isRoleBasedEmail(email),
        isDisposable: isDisposableEmail(email),
        source: "scrape",
        breachCount: 0,
        hasPasswordExposed: false,
        notes: "Verification failed - using format validation only",
      })
    }
  }

  return results
}

class LeakCheckEmailVerificationAdapter implements EmailVerificationAdapter {
  name = "Email Verification Adapter (LeakCheck.io)"

  async verifyEmails(emails: string[]): Promise<VerifiedEmail[]> {
    const useMock =
      process.env.EMAIL_VERIFICATION_MODE === "mock" ||
      (!process.env.LEAKCHECK_API_KEY && !process.env.EMAIL_VERIFICATION_SERVICE_URL)

    if (useMock) {
      return mockVerify(emails)
    }

    return productionVerify(emails)
  }

  async isAvailable(): Promise<boolean> {
    // Check if we have any verification method available
    if (process.env.EMAIL_VERIFICATION_MODE === "off") {
      return false
    }

    if (process.env.EMAIL_VERIFICATION_MODE === "mock") {
      return true
    }

    // Check if LeakCheck API key is configured
    if (process.env.LEAKCHECK_API_KEY) {
      return true
    }

    // Check if custom verification service is available
    const serviceUrl = process.env.EMAIL_VERIFICATION_SERVICE_URL
    if (serviceUrl) {
      try {
        const response = await fetch(`${serviceUrl}/health`, {
          signal: AbortSignal.timeout(5000),
        })
        return response.ok
      } catch {
        return false
      }
    }

    return false
  }
}

// Singleton instance
let verificationInstance: LeakCheckEmailVerificationAdapter | null = null

export function getEmailVerificationAdapter(): EmailVerificationAdapter {
  if (!verificationInstance) {
    verificationInstance = new LeakCheckEmailVerificationAdapter()
  }
  return verificationInstance
}

export { LeakCheckEmailVerificationAdapter }
