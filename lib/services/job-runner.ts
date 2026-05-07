/**
 * Job Runner Service
 * 
 * Executes lead generation and populates database with demo data.
 * In production, would integrate with Google Places API and web scrapers.
 */

import { JobsService } from "@/lib/services/jobs-service";
import { LeadsService } from "@/lib/services/leads-service";
import { extractBusinessContacts } from "@/lib/services/email-extraction";

/**
 * Generate demo leads for a job based on search location.
 */
function generateDemoLeads(jobId: string, location: string, count: number = 30) {
  const businessTypes = [
    "Hair Salon",
    "Nail Studio",
    "Skin Care",
    "Waxing Studio",
    "Lash Extensions",
    "Brow Bar",
    "Massage Therapy",
    "Spa",
    "Beauty",
  ];

  const firstNames = [
    "Sarah", "Jennifer", "Emily", "Jessica", "Amanda", "Michelle", "Lisa", 
    "Karen", "Nancy", "Lauren", "Maria", "Angela", "Maria", "Jessica"
  ];

  const lastNames = [
    "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis",
    "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson"
  ];

  const leads = [];

  for (let i = 0; i < count; i++) {
    const businessType = businessTypes[Math.floor(Math.random() * businessTypes.length)];
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const businessNum = Math.floor(Math.random() * 10000);

    leads.push({
      businessName: `${businessType} ${businessNum}`,
      contactName: `${firstName} ${lastName}`,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@business${businessNum}.com`,
      phone: `+1${Math.floor(Math.random() * 9000000000) + 1000000000}`,
      website: `https://www.business${businessNum}.com`,
      address: `${Math.floor(Math.random() * 5000) + 100} Main Street`,
      city: location.split(",")[0] || "Los Angeles",
      state: location.split(",")[1]?.trim() || "CA",
      country: "USA",
      rating: Math.random() * 2 + 3.5, // 3.5 - 5.5
      reviewCount: Math.floor(Math.random() * 200) + 10,
      source: "google_places",
      score: Math.floor(Math.random() * 40) + 60, // 60-100
    });
  }

  return leads;
}

/**
 * Run a complete job pipeline.
 * In this mock implementation, immediately creates demo leads.
 */
export async function runJob(jobId: string): Promise<void> {
  try {
    const job = await JobsService.getJob(jobId);
    if (!job) {
      throw new Error(`Job ${jobId} not found`);
    }

    // Extract location from query
    const location = job.query.locationText || "Los Angeles, CA";
    
    // Generate demo leads
    const leadCount = Math.floor(Math.random() * 30) + 20; // 20-50 leads
    const demoLeads = generateDemoLeads(jobId, location, leadCount);

    // Add leads to database
    await LeadsService.addLeads(jobId, demoLeads);

    // Update job counters
    await JobsService.updateJobCounters(jobId, {
      placesDiscovered: leadCount,
      websitesScraped: Math.floor(leadCount * 0.9),
      leadsEnriched: leadCount,
      leadsTotal: leadCount,
    });

    // Mark job as completed
    await JobsService.updateJobStatus(jobId, "completed");
  } catch (error) {
    console.error(`[v0] Job runner error for ${jobId}:`, error);
    await JobsService.updateJobStatus(jobId, "failed");
  }
}

/**
 * Extract emails from website HTML content.
 * Wrapper around email extraction service.
 */
export async function extractEmailsFromWebsite(
  businessName: string,
  website: string,
  html: string
): Promise<string[]> {
  try {
    const result = await extractBusinessContacts(businessName, website, html);
    return result.emails.map(e => e.email);
  } catch (error) {
    console.error(`[v0] Email extraction error for ${businessName}:`, error);
    return [];
  }
}
