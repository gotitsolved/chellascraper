import type { Job, JobQuery } from '@/lib/types';

// In-memory store for jobs
const jobsStore = new Map<string, Job>();

export const JobsService = {
  /**
   * Create a new job
   */
  async createJob(input: { name: string; query: JobQuery }): Promise<Job> {
    const id = `job-${Date.now()}`;
    const now = new Date().toISOString();

    const job: Job = {
      id,
      name: input.name,
      status: 'queued',
      query: input.query,
      placesDiscovered: 0,
      websitesScraped: 0,
      leadsEnriched: 0,
      leadsTotal: 0,
      createdAt: now,
      updatedAt: now,
    };

    jobsStore.set(id, job);
    console.log('[v0] Job created:', id);
    return job;
  },

  /**
   * Get job by ID
   */
  async getJob(jobId: string): Promise<Job | null> {
    return jobsStore.get(jobId) || null;
  },

  /**
   * List all jobs
   */
  async listJobs(options?: {
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ jobs: Job[]; total: number }> {
    const jobs = Array.from(jobsStore.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(options?.offset || 0, (options?.offset || 0) + (options?.limit || 50));

    return {
      jobs,
      total: jobsStore.size,
    };
  },

  /**
   * Update job status
   */
  async updateJobStatus(jobId: string, status: string): Promise<Job | null> {
    const job = jobsStore.get(jobId);
    if (!job) return null;

    job.status = status;
    job.updatedAt = new Date().toISOString();
    jobsStore.set(jobId, job);

    return job;
  },

  /**
   * Update job progress counters
   */
  async updateJobCounters(jobId: string, updates: {
    places_discovered?: number;
    websites_scraped?: number;
    leads_enriched?: number;
    leads_total?: number;
  }): Promise<void> {
    const job = jobsStore.get(jobId);
    if (!job) return;

    if (updates.places_discovered !== undefined) job.placesDiscovered = updates.places_discovered;
    if (updates.websites_scraped !== undefined) job.websitesScraped = updates.websites_scraped;
    if (updates.leads_enriched !== undefined) job.leadsEnriched = updates.leads_enriched;
    if (updates.leads_total !== undefined) job.leadsTotal = updates.leads_total;

    job.updatedAt = new Date().toISOString();
    jobsStore.set(jobId, job);
  },

  /**
   * Delete job
   */
  async deleteJob(jobId: string): Promise<boolean> {
    return jobsStore.delete(jobId);
  },

  /**
   * Helper to map database rows to Job objects (unused with in-memory store)
   */
  mapJobRow(row: any): Job {
    return {
      id: row.id,
      name: row.name,
      status: row.status,
      query: {
        locationText: row.location_text,
        radiusKm: row.radius_km,
        businessTypes: row.business_types || [],
      },
      placesDiscovered: row.places_discovered || 0,
      websitesScraped: row.websites_scraped || 0,
      leadsEnriched: row.leads_enriched || 0,
      leadsTotal: row.leads_total || 0,
      updatedAt: new Date().toISOString(),
    };
  },

  /**
   * Helper to map database rows to Job objects (unused with in-memory store)
   */
  mapJobRow(row: any): Job {
    return {
      id: row.id,
      name: row.name,
      status: row.status,
      query: {
        locationText: row.location_text,
        radiusKm: row.radius_km,
        businessTypes: row.business_types || [],
      },
      placesDiscovered: row.places_discovered || 0,
      websitesScraped: row.websites_scraped || 0,
      leadsEnriched: row.leads_enriched || 0,
      leadsTotal: row.leads_total || 0,
      createdAt: row.created_at,
      updatedAt: row.last_run_at || row.created_at,
    };
  },
};
