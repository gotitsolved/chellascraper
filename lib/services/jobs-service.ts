import { prisma } from '@/lib/db';
import { InMemoryStorage } from '@/lib/storage';
import type { Job, JobQuery } from '@/lib/types';

export const JobsService = {
  /**
   * Create a new job in the database or fallback to in-memory storage
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

    if (prisma) {
      try {
        const dbJob = await prisma.job.create({
          data: {
            id,
            name: input.name,
            status: 'queued',
            query: input.query,
            placesDiscovered: 0,
            websitesScraped: 0,
            leadsEnriched: 0,
            leadsTotal: 0,
          },
        });
        console.log('[v0] Job created in database:', id);
        return this.mapJobRow(dbJob);
      } catch (error) {
        console.warn('[v0] Database error, using in-memory storage:', error);
      }
    }

    console.log('[v0] Job created in memory:', id);
    return InMemoryStorage.jobs.create(job);
  },

  /**
   * Get job by ID
   */
  async getJob(jobId: string): Promise<Job | null> {
    if (prisma) {
      try {
        const job = await prisma.job.findUnique({
          where: { id: jobId },
        });
        if (job) return this.mapJobRow(job);
      } catch (error) {
        console.warn('[v0] Database error, falling back to in-memory:', error);
      }
    }

    return InMemoryStorage.jobs.get(jobId);
  },

  /**
   * List all jobs
   */
  async listJobs(options?: {
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ jobs: Job[]; total: number }> {
    if (prisma) {
      try {
        const [jobs, total] = await Promise.all([
          prisma.job.findMany({
            orderBy: { createdAt: 'desc' },
            take: options?.limit || 50,
            skip: options?.offset || 0,
          }),
          prisma.job.count(),
        ]);

        return {
          jobs: jobs.map(job => this.mapJobRow(job)),
          total,
        };
      } catch (error) {
        console.warn('[v0] Database error, falling back to in-memory:', error);
      }
    }

    const allJobs = InMemoryStorage.jobs.list();
    const offset = options?.offset || 0;
    const limit = options?.limit || 50;
    return {
      jobs: allJobs.slice(offset, offset + limit),
      total: allJobs.length,
    };
  },

  /**
   * Update job status
   */
  async updateJobStatus(jobId: string, status: string): Promise<Job | null> {
    if (prisma) {
      try {
        const job = await prisma.job.update({
          where: { id: jobId },
          data: { status, updatedAt: new Date() },
        });
        return this.mapJobRow(job);
      } catch (error) {
        console.warn('[v0] Database error, falling back to in-memory:', error);
      }
    }

    return InMemoryStorage.jobs.update(jobId, { status });
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
    if (prisma) {
      try {
        await prisma.job.update({
          where: { id: jobId },
          data: {
            placesDiscovered: updates.places_discovered,
            websitesScraped: updates.websites_scraped,
            leadsEnriched: updates.leads_enriched,
            leadsTotal: updates.leads_total,
            updatedAt: new Date(),
          },
        });
        return;
      } catch (error) {
        console.warn('[v0] Database error, falling back to in-memory:', error);
      }
    }

    InMemoryStorage.jobs.update(jobId, {
      placesDiscovered: updates.places_discovered,
      websitesScraped: updates.websites_scraped,
      leadsEnriched: updates.leads_enriched,
      leadsTotal: updates.leads_total,
    });
  },

  /**
   * Delete job and associated data
   */
  async deleteJob(jobId: string): Promise<boolean> {
    if (prisma) {
      try {
        await prisma.job.delete({
          where: { id: jobId },
        });
        return true;
      } catch (error) {
        console.warn('[v0] Database error, falling back to in-memory:', error);
      }
    }

    InMemoryStorage.jobs.delete(jobId);
    return true;
  },

  /**
   * Get activity events for a job
   */
  async getActivity(jobId: string): Promise<any[]> {
    if (prisma) {
      try {
        const events = await prisma.activityEvent.findMany({
          where: { jobId },
          orderBy: { timestamp: 'desc' },
        });
        return events;
      } catch (error) {
        console.warn('[v0] Database error fetching activity:', error);
      }
    }
    // For now, return empty array - activity tracking can be added later
    return [];
  },

  /**
   * Map database row to Job object
   */
  mapJobRow(row: any): Job {
    const createdAt = row.createdAt instanceof Date ? row.createdAt.toISOString() : row.createdAt;
    const updatedAt = row.updatedAt instanceof Date ? row.updatedAt.toISOString() : row.updatedAt;

    return {
      id: row.id,
      name: row.name,
      status: row.status,
      query: row.query as JobQuery,
      placesDiscovered: row.placesDiscovered,
      websitesScraped: row.websitesScraped,
      leadsEnriched: row.leadsEnriched,
      leadsTotal: row.leadsTotal,
      createdAt,
      updatedAt,
    };
  },
};
