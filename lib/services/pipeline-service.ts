/**
 * Pipeline Service
 * 
 * Orchestrates the lead generation flow:
 * 1. Discover businesses
 * 2. Scrape websites for contact data
 * 3. Verify emails
 * 4. Score leads
 * 
 * Uses our internal adapters (custom-website-scraper, email-verification-adapter)
 */

import type { Job, PipelineEvent, PipelineEventType } from "@/lib/types"
import { getCustomWebsiteScraper } from "@/lib/adapters/custom-website-scraper"
import { getEmailVerificationAdapter } from "@/lib/adapters/email-verification-adapter"
import * as jobsService from "./jobs-service"
import * as leadsService from "./leads-service"

// In-memory activity log storage
const activityStore = new Map<string, PipelineEvent[]>()

export async function runPipeline(jobId: string): Promise<void> {
  const job = await jobsService.getJob(jobId)
  if (!job) {
    throw new Error(`Job ${jobId} not found`)
  }

  try {
    // Start the job
    await jobsService.updateJobStatus(jobId, "running")
    await logEvent(jobId, "JOB_STARTED", "Pipeline execution started")

    // Stage 1: Discovery
    await logEvent(jobId, "DISCOVERY_STARTED", "Discovering businesses in target area")
    
    // Generate mock leads (in production, this would call Google Places API or similar)
    const leads = await leadsService.createLeadsForJob(jobId, 30)
    
    await jobsService.updateJobCounters(jobId, {
      discovered: leads.length,
      withWebsite: leads.filter((l) => l.websiteUrl).length,
    })
    await logEvent(jobId, "DISCOVERY_COMPLETED", `Discovered ${leads.length} businesses`)

    // Stage 2: Website Scraping
    await logEvent(jobId, "SCRAPING_STARTED", "Starting website scraping with internal adapter")
    
    const scraper = getCustomWebsiteScraper()
    const leadsWithWebsite = leads.filter((l) => l.websiteUrl)
    let scrapedCount = 0
    let withEmailCount = 0

    for (const lead of leadsWithWebsite) {
      try {
        await logEvent(jobId, "WEBSITE_SCRAPE_STARTED", `Scraping ${lead.websiteUrl}`, {
          leadId: lead.id,
          leadName: lead.name,
        })

        const scrapeResult = await scraper.scrapeWebsite(lead.websiteUrl!, {
          depth: "homepage-contact-about",
        })

        await leadsService.mergeScrapeResult(jobId, lead.id, scrapeResult)
        scrapedCount++

        if (scrapeResult.emails.length > 0) {
          withEmailCount++
        }

        await logEvent(
          jobId,
          "WEBSITE_SCRAPE_COMPLETED",
          `Scraped ${lead.name}: found ${scrapeResult.emails.length} emails`,
          {
            leadId: lead.id,
            emails: scrapeResult.emails,
            status: scrapeResult.status,
          }
        )

        // Update progress
        const progress = Math.round((scrapedCount / leadsWithWebsite.length) * 50)
        await jobsService.updateJobProgress(jobId, progress)
      } catch (error) {
        await logEvent(jobId, "WEBSITE_SCRAPE_FAILED", `Failed to scrape ${lead.websiteUrl}`, {
          leadId: lead.id,
          error: error instanceof Error ? error.message : "Unknown error",
        })
      }
    }

    await jobsService.updateJobCounters(jobId, {
      scraped: scrapedCount,
      withEmail: withEmailCount,
    })
    await logEvent(jobId, "SCRAPING_COMPLETED", `Scraped ${scrapedCount} websites, found ${withEmailCount} with emails`)

    // Stage 3: Email Verification
    await logEvent(jobId, "VERIFICATION_STARTED", "Starting email verification with internal adapter")

    const verifier = getEmailVerificationAdapter()
    const isVerifierAvailable = await verifier.isAvailable()

    if (isVerifierAvailable) {
      const { leads: allLeads } = await leadsService.getLeadsForJob(jobId, { hasEmail: true })
      let verifiedCount = 0

      for (const lead of allLeads) {
        if (lead.emails.length > 0) {
          try {
            const verifiedEmails = await verifier.verifyEmails(lead.emails)
            await leadsService.updateLeadVerification(jobId, lead.id, verifiedEmails)
            verifiedCount++

            await logEvent(jobId, "EMAIL_VERIFIED", `Verified emails for ${lead.name}`, {
              leadId: lead.id,
              results: verifiedEmails.map((v) => ({
                email: v.email,
                confidence: v.confidence,
                breachCount: v.breachCount,
              })),
            })
          } catch (error) {
            await logEvent(jobId, "EMAIL_VERIFICATION_FAILED", `Failed to verify ${lead.primaryEmail}`, {
              leadId: lead.id,
              error: error instanceof Error ? error.message : "Unknown error",
            })
          }
        }

        // Update progress
        const progress = 50 + Math.round((verifiedCount / allLeads.length) * 40)
        await jobsService.updateJobProgress(jobId, progress)
      }

      await jobsService.updateJobCounters(jobId, { verified: verifiedCount })
      await logEvent(jobId, "VERIFICATION_COMPLETED", `Verified ${verifiedCount} leads`)
    } else {
      await logEvent(jobId, "VERIFICATION_SKIPPED", "Email verification adapter not available")
    }

    // Stage 4: Scoring
    await logEvent(jobId, "SCORING_STARTED", "Calculating lead scores")
    
    const { leads: finalLeads } = await leadsService.getLeadsForJob(jobId)
    const icpMatchCount = finalLeads.filter((l) => l.icpMatch).length
    
    await logEvent(jobId, "SCORING_COMPLETED", `Scored ${finalLeads.length} leads, ${icpMatchCount} match ICP`)

    // Complete the job
    await jobsService.updateJobStatus(jobId, "completed")
    await jobsService.updateJobProgress(jobId, 100)
    await logEvent(jobId, "JOB_COMPLETED", "Pipeline execution completed successfully")
  } catch (error) {
    await jobsService.updateJobStatus(jobId, "failed")
    await logEvent(jobId, "JOB_FAILED", `Pipeline failed: ${error instanceof Error ? error.message : "Unknown error"}`)
    throw error
  }
}

export async function logEvent(
  jobId: string,
  type: PipelineEventType,
  message: string,
  metadata?: Record<string, unknown>
): Promise<PipelineEvent> {
  const event: PipelineEvent = {
    id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    jobId,
    type,
    message,
    metadata,
    timestamp: new Date().toISOString(),
  }

  const events = activityStore.get(jobId) || []
  events.push(event)
  activityStore.set(jobId, events)

  return event
}

export async function getActivityLog(
  jobId: string,
  options?: { limit?: number; offset?: number }
): Promise<{ events: PipelineEvent[]; total: number }> {
  let events = activityStore.get(jobId) || []

  // Sort by timestamp, newest first
  events = [...events].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  )

  const total = events.length

  if (options?.offset !== undefined) {
    events = events.slice(options.offset)
  }
  if (options?.limit !== undefined) {
    events = events.slice(0, options.limit)
  }

  return { events, total }
}

// Export for testing
export function _getActivityStore() {
  return activityStore
}
