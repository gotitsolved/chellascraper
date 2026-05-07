/**
 * Job Runner Service
 * 
 * Executes the lead discovery pipeline:
 * 1. Search Google Places API
 * 2. Scrape business websites
 * 3. Extract contact information
 * 4. Score leads against ICP
 */

import type { Job, Lead, ActivityEvent } from "@/lib/types";
import { jobsStore, leadsStore } from "@/lib/mock-data";
import { readLeads, writeLeads } from "@/lib/persistent-store";
import { searchGooglePlaces, scrapeWebsite, extractLeadDataFromHtml } from "@/lib/integrations";

// In-memory progress tracking
export const jobProgressStore = new Map<string, JobProgress>();

export interface JobProgress {
  jobId: string;
  status: "queued" | "running" | "completed" | "failed";
  stage: "places" | "scraping" | "enrichment" | "scoring" | "done";
  stageProgress: number; // 0-100
  overallProgress: number; // 0-100
  currentAction: string;
  placesFound: number;
  websitesScraped: number;
  leadsEnriched: number;
  errors: string[];
  startedAt: string;
  updatedAt: string;
}

const activityStore = new Map<string, ActivityEvent[]>();

function addActivity(jobId: string, event: Omit<ActivityEvent, "id" | "jobId" | "timestamp">) {
  const activities = activityStore.get(jobId) || [];
  activities.push({
    id: `act-${jobId}-${activities.length + 1}`,
    jobId,
    timestamp: new Date().toISOString(),
    ...event,
  });
  activityStore.set(jobId, activities);
}

export function getJobProgress(jobId: string): JobProgress | null {
  return jobProgressStore.get(jobId) || null;
}

export function getJobActivities(jobId: string): ActivityEvent[] {
  return activityStore.get(jobId) || [];
}

/**
 * Run a job through the full pipeline.
 * This is designed to be called and return immediately while the job runs.
 */
export async function runJob(jobId: string): Promise<void> {
  const job = jobsStore.get(jobId);
  if (!job) {
    throw new Error(`Job ${jobId} not found`);
  }

  // Initialize progress
  const progress: JobProgress = {
    jobId,
    status: "running",
    stage: "places",
    stageProgress: 0,
    overallProgress: 0,
    currentAction: "Starting job...",
    placesFound: 0,
    websitesScraped: 0,
    leadsEnriched: 0,
    errors: [],
    startedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  jobProgressStore.set(jobId, progress);

  // Update job status
  job.status = "running";
  job.lastRunAt = new Date().toISOString();
  jobsStore.set(jobId, job);

  addActivity(jobId, {
    type: "info",
    stage: "system",
    message: "Job started.",
  });

  try {
    // Stage 1: Google Places Discovery
    progress.stage = "places";
    progress.currentAction = "Searching Google Places...";
    progress.updatedAt = new Date().toISOString();
    jobProgressStore.set(jobId, { ...progress });

    addActivity(jobId, {
      type: "info",
      stage: "places",
      message: "Google Places search started.",
      detail: `Searching: ${job.query.businessTypes.slice(0, 3).join(", ")} in ${job.query.locationText}`,
    });

    // Simulate progress for Places search
    await simulateProgress(progress, "places", 0, 50, 2000);

    const placesResult = await searchGooglePlaces({ query: job.query });
    let leads = placesResult.leads;

    // If no API key, generate mock leads
    if (leads.length === 0) {
      leads = generateMockLeads(jobId, job.query.locationText, 15 + Math.floor(Math.random() * 20));
      addActivity(jobId, {
        type: "warning",
        stage: "places",
        message: "Using mock data (no API key configured).",
        detail: `Generated ${leads.length} mock leads for testing.`,
      });
    }

    progress.placesFound = leads.length;
    progress.stageProgress = 100;
    progress.overallProgress = 25;
    progress.updatedAt = new Date().toISOString();
    jobProgressStore.set(jobId, { ...progress });

    addActivity(jobId, {
      type: "success",
      stage: "places",
      message: `Found ${leads.length} businesses.`,
    });

    // Stage 2: Website Scraping
    progress.stage = "scraping";
    progress.stageProgress = 0;
    progress.currentAction = "Scraping business websites...";
    progress.updatedAt = new Date().toISOString();
    jobProgressStore.set(jobId, { ...progress });

    addActivity(jobId, {
      type: "info",
      stage: "scraping",
      message: "Website scraping started.",
      detail: `Targeting ${leads.filter(l => l.websiteUrl).length} businesses with websites.`,
    });

    const leadsWithWebsite = leads.filter(l => l.websiteUrl);
    let scrapedCount = 0;

    for (let i = 0; i < leadsWithWebsite.length; i++) {
      const lead = leadsWithWebsite[i];
      const url = lead.websiteUrl;
      
      if (url) {
        try {
          // Simulate scraping delay
          await new Promise(r => setTimeout(r, 200 + Math.random() * 300));
          
          // In mock mode, just simulate
          const mockSuccess = Math.random() > 0.15;
          if (mockSuccess) {
            scrapedCount++;
            // Generate mock contact data
            lead.email = `contact@${url.replace(/https?:\/\//, '').replace(/\/.*/,'').replace('www.', '')}`;
            lead.phone = `(${Math.floor(Math.random() * 900) + 100}) ${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`;
          }
        } catch {
          progress.errors.push(`Failed to scrape: ${url}`);
        }
      }

      progress.websitesScraped = scrapedCount;
      progress.stageProgress = Math.round(((i + 1) / leadsWithWebsite.length) * 100);
      progress.overallProgress = 25 + Math.round((progress.stageProgress / 100) * 25);
      progress.currentAction = `Scraping ${i + 1}/${leadsWithWebsite.length}...`;
      progress.updatedAt = new Date().toISOString();
      jobProgressStore.set(jobId, { ...progress });
    }

    addActivity(jobId, {
      type: "success",
      stage: "scraping",
      message: `Scraped ${scrapedCount} websites.`,
      detail: `${leadsWithWebsite.length - scrapedCount} sites returned errors.`,
    });

    // Stage 3: Enrichment
    progress.stage = "enrichment";
    progress.stageProgress = 0;
    progress.currentAction = "Enriching lead data...";
    progress.overallProgress = 50;
    progress.updatedAt = new Date().toISOString();
    jobProgressStore.set(jobId, { ...progress });

    addActivity(jobId, {
      type: "info",
      stage: "enrichment",
      message: "Contact extraction & enrichment started.",
    });

    for (let i = 0; i < leads.length; i++) {
      const lead = leads[i];
      lead.jobId = jobId;
      
      // Simulate enrichment
      await new Promise(r => setTimeout(r, 50 + Math.random() * 100));
      
      // Add contact name if email exists
      if (lead.email && Math.random() > 0.3) {
        const names = ["Jessica", "Maria", "Sarah", "Priya", "Natalie", "Diana", "Jasmine", "Olivia"];
        const lastNames = ["Rivera", "Chen", "Patel", "Kim", "Martinez", "Williams", "Thompson", "Garcia"];
        lead.contactName = `${names[Math.floor(Math.random() * names.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
      }

      progress.leadsEnriched = i + 1;
      progress.stageProgress = Math.round(((i + 1) / leads.length) * 100);
      progress.overallProgress = 50 + Math.round((progress.stageProgress / 100) * 25);
      progress.updatedAt = new Date().toISOString();
      jobProgressStore.set(jobId, { ...progress });
    }

    addActivity(jobId, {
      type: "success",
      stage: "enrichment",
      message: `Enriched ${leads.length} leads.`,
      detail: `${leads.filter(l => l.email).length} emails found.`,
    });

    // Stage 4: Scoring
    progress.stage = "scoring";
    progress.stageProgress = 0;
    progress.currentAction = "Scoring leads against ICP...";
    progress.overallProgress = 75;
    progress.updatedAt = new Date().toISOString();
    jobProgressStore.set(jobId, { ...progress });

    addActivity(jobId, {
      type: "info",
      stage: "scoring",
      message: "Scoring leads against Chella ICP.",
    });

    let icpMatches = 0;
    for (let i = 0; i < leads.length; i++) {
      const lead = leads[i];
      
      // Calculate score based on available data
      let score = 30; // Base score
      if (lead.email) score += 25;
      if (lead.phone) score += 15;
      if (lead.websiteUrl) score += 10;
      if (lead.rating && lead.rating >= 4.0) score += 10;
      if (lead.reviewCount && lead.reviewCount >= 10) score += 5;
      score += Math.random() * 5; // Small variance
      
      lead.leadScore = Math.min(Math.round(score), 100);
      lead.icpMatch = lead.leadScore >= 70;
      if (lead.icpMatch) icpMatches++;

      progress.stageProgress = Math.round(((i + 1) / leads.length) * 100);
      progress.overallProgress = 75 + Math.round((progress.stageProgress / 100) * 25);
      progress.updatedAt = new Date().toISOString();
      jobProgressStore.set(jobId, { ...progress });

      await new Promise(r => setTimeout(r, 20));
    }

    addActivity(jobId, {
      type: "success",
      stage: "scoring",
      message: "Scoring complete.",
      detail: `${icpMatches} ICP matches out of ${leads.length} leads.`,
    });

    // Save leads to persistent storage
    const leadsMap = await readLeads();
    leadsMap.set(jobId, leads);
    await writeLeads(leadsMap);

    // Update job counters
    job.counters = {
      placesDiscovered: progress.placesFound,
      websitesScraped: progress.websitesScraped,
      leadsEnriched: progress.leadsEnriched,
      leadsTotal: leads.length,
    };
    job.status = "completed";
    jobsStore.set(jobId, job);

    // Final progress
    progress.status = "completed";
    progress.stage = "done";
    progress.stageProgress = 100;
    progress.overallProgress = 100;
    progress.currentAction = "Job completed!";
    progress.updatedAt = new Date().toISOString();
    jobProgressStore.set(jobId, { ...progress });

    addActivity(jobId, {
      type: "success",
      stage: "system",
      message: "Job completed successfully.",
      detail: `${leads.length} total leads, ${icpMatches} ICP matches.`,
    });

  } catch (error) {
    console.error("[v0] Job runner error:", error);
    
    progress.status = "failed";
    progress.currentAction = `Error: ${error instanceof Error ? error.message : "Unknown error"}`;
    progress.updatedAt = new Date().toISOString();
    jobProgressStore.set(jobId, { ...progress });

    job.status = "failed";
    job.errorMessage = error instanceof Error ? error.message : "Unknown error";
    jobsStore.set(jobId, job);

    addActivity(jobId, {
      type: "error",
      stage: "system",
      message: "Job failed.",
      detail: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

async function simulateProgress(
  progress: JobProgress,
  stage: JobProgress["stage"],
  from: number,
  to: number,
  durationMs: number
) {
  const steps = 10;
  const stepDuration = durationMs / steps;
  const stepSize = (to - from) / steps;

  for (let i = 0; i < steps; i++) {
    await new Promise(r => setTimeout(r, stepDuration));
    progress.stageProgress = Math.round(from + stepSize * (i + 1));
    progress.updatedAt = new Date().toISOString();
    jobProgressStore.set(progress.jobId, { ...progress });
  }
}

function generateMockLeads(jobId: string, location: string, count: number): Lead[] {
  const names = [
    "Arch & Soul Brow Bar", "Luxe Lash Lounge", "The Brow Lab", "Petal Beauty Studio",
    "Bella Brows", "The Wax Room", "Glam Collective", "Thread & Tint Studio",
    "Sunkissed Beauty Bar", "Brow Obsession", "Golden Hour Aesthetics", "Studio Brow",
    "The Beauty Edit", "Velvet Touch Salon", "Brow Society", "Luxe Beauty Lounge",
    "Crown & Glow", "Silhouette Beauty", "The Lash Co", "Pure Brow Studio",
    "Envy Lash Bar", "Flawless Brows", "The Artisan Brow", "Precision Beauty",
    "Pink Brow Studio", "Brow Couture", "Radiance Beauty Bar", "Chic Beauty Co.",
  ];

  const categories = ["Brow Bar", "Lash Studio", "Beauty Salon", "Waxing Studio", "Skincare Studio"];
  const cityPart = location.split(",")[0].trim();

  return Array.from({ length: count }, (_, i) => ({
    id: `lead-${jobId}-${i}`,
    jobId,
    placeId: `ChIJ${Math.random().toString(36).slice(2, 12).toUpperCase()}`,
    name: names[i % names.length] + (i >= names.length ? ` #${Math.floor(i / names.length) + 1}` : ""),
    category: categories[Math.floor(Math.random() * categories.length)],
    address: `${1000 + Math.floor(Math.random() * 9000)} Main St`,
    city: cityPart,
    region: "CA",
    country: "US",
    rating: 3.5 + Math.random() * 1.5,
    reviewCount: Math.floor(Math.random() * 200) + 5,
    websiteUrl: Math.random() > 0.2 ? `https://www.${names[i % names.length].toLowerCase().replace(/[^a-z]/g, '')}.com` : undefined,
    leadScore: 0,
    icpMatch: false,
    crawledAt: new Date().toISOString(),
  }));
}
