/**
 * Job Runner Service
 * 
 * Executes 4-stage pipeline:
 * 1. Discovery - Search Google Places for businesses
 * 2. Scraping - Fetch websites to extract emails
 * 3. Enrichment - Enrich with additional data
 * 4. Scoring - Score leads based on data quality
 */

import { JobsService } from '@/lib/services/jobs-service';
import { LeadsService } from '@/lib/services/leads-service';
import { searchGooglePlaces, scrapeWebsite } from '@/lib/integrations';
import { extractBusinessContacts } from '@/lib/services/email-extraction';
import type { Lead } from '@/lib/types';

/**
 * Execute complete job pipeline with real data sources
 */
export async function runJob(jobId: string): Promise<void> {
  try {
    const job = await JobsService.getJob(jobId);
    if (!job) {
      throw new Error(`Job ${jobId} not found`);
    }

    console.log(`[v0] Starting job pipeline for ${jobId}`);

    // Stage 1: Discovery - Search Google Places
    await JobsService.updateJobStatus(jobId, 'running');
    console.log(`[v0] Stage 1: Discovering places in ${job.query.locationText}`);

    const places = await searchGooglePlaces({
      location: job.query.locationText || 'Los Angeles, CA',
      radiusKm: job.query.radiusKm || 25,
      businessTypes: job.query.businessTypes || [],
      maxResults: 50,
    });

    console.log(`[v0] Found ${places.length} places`);
    await JobsService.updateJobCounters(jobId, {
      places_discovered: places.length,
    });

    if (places.length === 0) {
      await JobsService.updateJobStatus(jobId, 'completed');
      return;
    }

    // Stage 2: Scraping - Extract emails from websites
    console.log(`[v0] Stage 2: Scraping websites for email addresses`);
    let websitesScraped = 0;
    const leads: Lead[] = [];

    for (const place of places) {
      try {
        if (place.website) {
          const htmlContent = await scrapeWebsite(place.website);
          websitesScraped++;

          // Extract emails from HTML
          const emails = extractBusinessContacts(htmlContent);

          const lead: Lead = {
            id: `lead-${Date.now()}-${Math.random()}`,
            jobId,
            placeId: place.place_id,
            businessName: place.business_name,
            contactName: place.contact_name,
            category: place.category,
            address: place.address,
            city: place.city,
            state: place.state,
            country: place.country || 'USA',
            phone: place.phone,
            email: emails[0] || undefined, // Use first extracted email
            emailVerified: emails.length > 0,
            website: place.website,
            rating: place.rating,
            reviewCount: place.review_count,
            score: calculateScore(place, emails.length > 0),
            icpMatch: isIcpMatch(place),
            source: 'google_places',
            createdAt: new Date().toISOString(),
          };

          leads.push(lead);
        } else {
          // No website, create lead with available data
          const lead: Lead = {
            id: `lead-${Date.now()}-${Math.random()}`,
            jobId,
            placeId: place.place_id,
            businessName: place.business_name,
            contactName: place.contact_name,
            category: place.category,
            address: place.address,
            city: place.city,
            state: place.state,
            country: place.country || 'USA',
            phone: place.phone,
            website: place.website,
            rating: place.rating,
            reviewCount: place.review_count,
            score: calculateScore(place, false),
            icpMatch: isIcpMatch(place),
            source: 'google_places',
            createdAt: new Date().toISOString(),
          };
          leads.push(lead);
        }
      } catch (error) {
        console.warn(`[v0] Error processing place ${place.place_id}:`, error);
        // Continue with next place even if one fails
      }
    }

    console.log(`[v0] Scraped ${websitesScraped} websites, found ${leads.filter(l => l.email).length} emails`);
    await JobsService.updateJobCounters(jobId, {
      websites_scraped: websitesScraped,
    });

    // Stage 3: Enrichment - Add validation and scoring
    console.log(`[v0] Stage 3: Enriching lead data`);
    let leadsEnriched = 0;

    for (const lead of leads) {
      // Validate email format
      if (lead.email && isValidEmail(lead.email)) {
        lead.emailVerified = true;
        leadsEnriched++;
      }

      // Re-calculate score based on enriched data
      lead.score = calculateScore(
        {
          rating: lead.rating,
          review_count: lead.reviewCount,
        },
        lead.emailVerified
      );
    }

    console.log(`[v0] Enriched ${leadsEnriched} leads`);
    await JobsService.updateJobCounters(jobId, {
      leads_enriched: leadsEnriched,
      leads_total: leads.length,
    });

    // Stage 4: Save all leads to database
    console.log(`[v0] Stage 4: Saving ${leads.length} leads to database`);
    await LeadsService.addLeads(jobId, leads);

    // Mark job as completed
    await JobsService.updateJobStatus(jobId, 'completed');
    console.log(`[v0] Job ${jobId} completed successfully`);
  } catch (error) {
    console.error(`[v0] Job runner error for ${jobId}:`, error);
    await JobsService.updateJobStatus(jobId, 'failed').catch(() => {});
  }
}

/**
 * Calculate lead score based on data quality
 */
function calculateScore(
  place: { rating?: number; review_count?: number },
  hasEmail: boolean
): number {
  let score = 50; // Base score

  if (place.rating) {
    score += Math.min(20, place.rating * 4); // Rating contributes up to 20 points
  }

  if (place.review_count && place.review_count > 10) {
    score += Math.min(15, Math.floor(place.review_count / 10)); // Reviews contribute up to 15 points
  }

  if (hasEmail) {
    score += 15; // Email is worth 15 points
  }

  return Math.min(100, Math.max(0, score));
}

/**
 * Check if business matches ICP (Ideal Customer Profile)
 */
function isIcpMatch(place: { category?: string; rating?: number }): boolean {
  if (!place.category) return false;

  const icpCategories = [
    'beauty',
    'salon',
    'spa',
    'wellness',
    'dentist',
    'medical',
    'professional services',
  ];

  const matchesCategory = icpCategories.some((cat) =>
    place.category?.toLowerCase().includes(cat)
  );

  const hasGoodRating = (place.rating || 0) >= 3.5;

  return matchesCategory && hasGoodRating;
}

/**
 * Validate email format
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
