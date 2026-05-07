/**
 * Leads Service
 * 
 * Handles lead data management, filtering, scoring, and merging scrape results.
 */

import type { Lead, LeadFilters } from "@/lib/types"
import type { ScrapeResult } from "@/lib/adapters/scraper-adapter"
import type { VerifiedEmail } from "@/lib/adapters/email-verification-adapter"
import { mockLeadsByJob, generateLeadsForJob } from "@/lib/mock-data"

// In-memory leads storage
const leadsStore = new Map<string, Lead[]>()

// Initialize with mock data
for (const [jobId, leads] of Object.entries(mockLeadsByJob)) {
  leadsStore.set(jobId, leads)
}

export async function getLeadsForJob(
  jobId: string,
  filters?: LeadFilters
): Promise<{ leads: Lead[]; total: number; filtered: number }> {
  let leads = leadsStore.get(jobId) || []

  const total = leads.length

  // Apply filters
  if (filters) {
    if (filters.minScore !== undefined) {
      leads = leads.filter((lead) => lead.leadScore >= filters.minScore!)
    }
    if (filters.maxScore !== undefined) {
      leads = leads.filter((lead) => lead.leadScore <= filters.maxScore!)
    }
    if (filters.minRating !== undefined) {
      leads = leads.filter((lead) => (lead.rating || 0) >= filters.minRating!)
    }
    if (filters.hasEmail) {
      leads = leads.filter((lead) => lead.emails.length > 0)
    }
    if (filters.hasWebsite) {
      leads = leads.filter((lead) => !!lead.websiteUrl)
    }
    if (filters.icpMatchOnly) {
      leads = leads.filter((lead) => lead.icpMatch)
    }
    if (filters.city) {
      leads = leads.filter(
        (lead) => lead.city?.toLowerCase().includes(filters.city!.toLowerCase())
      )
    }
    if (filters.region) {
      leads = leads.filter(
        (lead) => lead.region?.toLowerCase().includes(filters.region!.toLowerCase())
      )
    }
    if (filters.country) {
      leads = leads.filter(
        (lead) => lead.country?.toLowerCase().includes(filters.country!.toLowerCase())
      )
    }
    if (filters.category) {
      leads = leads.filter(
        (lead) => lead.category?.toLowerCase().includes(filters.category!.toLowerCase())
      )
    }
    if (filters.verificationStatus) {
      leads = leads.filter((lead) => lead.verificationStatus === filters.verificationStatus)
    }
  }

  // Sort by score descending by default
  leads.sort((a, b) => b.leadScore - a.leadScore)

  return { leads, total, filtered: leads.length }
}

export async function getLead(jobId: string, leadId: string): Promise<Lead | null> {
  const leads = leadsStore.get(jobId) || []
  return leads.find((lead) => lead.id === leadId) || null
}

export async function createLeadsForJob(jobId: string, count: number = 30): Promise<Lead[]> {
  const leads = generateLeadsForJob(jobId, count)
  leadsStore.set(jobId, leads)
  return leads
}

export async function mergeScrapeResult(
  jobId: string,
  leadId: string,
  scrapeResult: ScrapeResult
): Promise<Lead | null> {
  const leads = leadsStore.get(jobId)
  if (!leads) return null

  const leadIndex = leads.findIndex((l) => l.id === leadId)
  if (leadIndex === -1) return null

  const lead = leads[leadIndex]

  // Merge scrape data into lead
  lead.emails = [...new Set([...lead.emails, ...scrapeResult.emails])]
  lead.primaryEmail = lead.emails[0] || null
  lead.phones = [...new Set([...lead.phones, ...scrapeResult.phones])]

  // Parse social links
  for (const socialUrl of scrapeResult.socialLinks) {
    if (socialUrl.includes("instagram.com")) {
      lead.instagram = socialUrl
    } else if (socialUrl.includes("facebook.com")) {
      lead.facebook = socialUrl
    } else if (socialUrl.includes("tiktok.com")) {
      lead.tiktok = socialUrl
    }
  }

  lead.contactPageUrl = scrapeResult.contactPageUrl || lead.contactPageUrl
  lead.aboutExcerpt = scrapeResult.aboutText || lead.aboutExcerpt
  lead.scrapedAt = scrapeResult.scrapedAt
  lead.dataSource = "custom-scraper"

  // Recalculate score
  lead.leadScore = calculateLeadScore(lead)
  lead.icpMatch = lead.leadScore >= 70
  lead.icpExplanation = generateIcpExplanation(lead)

  leads[leadIndex] = lead
  leadsStore.set(jobId, leads)

  return lead
}

export async function updateLeadVerification(
  jobId: string,
  leadId: string,
  verifiedEmails: VerifiedEmail[]
): Promise<Lead | null> {
  const leads = leadsStore.get(jobId)
  if (!leads) return null

  const leadIndex = leads.findIndex((l) => l.id === leadId)
  if (leadIndex === -1) return null

  const lead = leads[leadIndex]

  // Update verification status based on results
  const primaryVerified = verifiedEmails.find((v) => v.email === lead.primaryEmail)
  
  if (primaryVerified) {
    if (primaryVerified.confidence >= 70) {
      lead.verificationStatus = "verified"
    } else if (primaryVerified.confidence >= 40) {
      lead.verificationStatus = "unverified"
    } else {
      lead.verificationStatus = "failed"
    }

    // Update score breakdown
    lead.scoreBreakdown = {
      ...lead.scoreBreakdown,
      emailQuality: Math.round(primaryVerified.confidence / 10),
      contactInfo: primaryVerified.hasPasswordExposed ? 5 : 10,
    }
  }

  // Recalculate total score
  lead.leadScore = calculateLeadScore(lead)

  leads[leadIndex] = lead
  leadsStore.set(jobId, leads)

  return lead
}

export function calculateLeadScore(lead: Lead): number {
  let score = 0

  // Has email (20 points)
  if (lead.emails.length > 0) score += 20

  // Has website (15 points)
  if (lead.websiteUrl) score += 15

  // Rating score (up to 15 points)
  if (lead.rating) score += Math.round((lead.rating / 5) * 15)

  // Review count (up to 10 points)
  if (lead.reviewCount) {
    score += Math.min(10, Math.round(lead.reviewCount / 50) * 2)
  }

  // Has social presence (up to 15 points)
  if (lead.instagram) score += 5
  if (lead.facebook) score += 5
  if (lead.tiktok) score += 5

  // Category match (15 points for beauty-specific)
  const beautyCategories = ["brow bar", "lash studio", "salon", "spa", "beauty"]
  if (beautyCategories.some((cat) => lead.category?.toLowerCase().includes(cat))) {
    score += 15
  }

  // Has phone (5 points)
  if (lead.phones.length > 0) score += 5

  // Verification bonus (5 points)
  if (lead.verificationStatus === "verified") score += 5

  return Math.min(100, score)
}

export function generateIcpExplanation(lead: Lead): string {
  const reasons: string[] = []

  if (lead.emails.length > 0) reasons.push("has contact email")
  if (lead.websiteUrl) reasons.push("has website")
  if ((lead.rating || 0) >= 4) reasons.push("high rating")
  if ((lead.reviewCount || 0) >= 50) reasons.push("established business")
  if (lead.instagram || lead.facebook) reasons.push("social media presence")

  const beautyCategories = ["brow bar", "lash studio", "salon", "spa", "beauty"]
  if (beautyCategories.some((cat) => lead.category?.toLowerCase().includes(cat))) {
    reasons.push("beauty industry match")
  }

  if (reasons.length === 0) {
    return "Low ICP match - missing key criteria"
  }

  return `Good match: ${reasons.join(", ")}`
}

// Export for testing
export function _getLeadsStore() {
  return leadsStore
}
