import { db as prisma } from '@/lib/db';
import type { Job, JobQuery } from '@/lib/types';

export const JobsService = {
  /**
   * Create a new job in the database
   */
  async createJob(input: { name: string; query: JobQuery }): Promise<Job> {
    if (!prisma) {
      throw new Error('Database not initialized');
    }

    const id = `job-${Date.now()}`;

    const job = await prisma.job.create({
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
    return this.mapJobRow(job);
  },

  /**
   * Get job by ID
   */
  async getJob(jobId: string): Promise<Job | null> {
    if (!prisma) {
      console.error('[v0] Database not initialized');
      return null;
    }

    try {
      const job = await prisma.job.findUnique({
        where: { id: jobId },
      });

      if (!job) return null;
      return this.mapJobRow(job);
    } catch (error) {
      console.error('[v0] Error getting job:', error);
      return null;
    }
  },

  /**
   * List all jobs
   */
  async listJobs(options?: {
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ jobs: Job[]; total: number }> {
    if (!prisma) {
      return { jobs: [], total: 0 };
    }

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
      console.error('[v0] Error listing jobs:', error);
      return { jobs: [], total: 0 };
    }
  },

  /**
   * Update job status
   */
  async updateJobStatus(jobId: string, status: string): Promise<Job | null> {
    if (!prisma) {
      return null;
    }

    try {
      const job = await prisma.job.update({
        where: { id: jobId },
        data: { status, updatedAt: new Date() },
      });

      return this.mapJobRow(job);
    } catch (error) {
      console.error('[v0] Error updating job status:', error);
      return null;
    }
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
    if (!prisma) {
      return;
    }

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
    } catch (error) {
      console.error('[v0] Error updating job counters:', error);
    }
  },

  /**
   * Delete job and associated data
   */
  async deleteJob(jobId: string): Promise<boolean> {
    if (!prisma) {
      return false;
    }

    try {
      await prisma.job.delete({
        where: { id: jobId },
      });
      return true;
    } catch (error) {
      console.error('[v0] Error deleting job:', error);
      return false;
    }
  },

  /**
   * Map database row to Job object
   */
  mapJobRow(row: any): Job {
    return {
      id: row.id,
      name: row.name,
      status: row.status,
      query: row.query as JobQuery,
      placesDiscovered: row.placesDiscovered,
      websitesScraped: row.websitesScraped,
      leadsEnriched: row.leadsEnriched,
      leadsTotal: row.leadsTotal,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  },
};
