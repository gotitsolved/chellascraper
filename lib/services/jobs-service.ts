import { sql } from '@/lib/db';
import { InMemoryStorage } from '@/lib/storage';
import type { Job, JobQuery } from '@/lib/types';

export const JobsService = {
  /**
   * Create a new job in the database
   */
  async createJob(input: { name: string; query: JobQuery }): Promise<Job> {
    const id = `job-${Date.now()}`;
    const now = new Date();

    const job: Job = {
      id,
      name: input.name,
      status: 'queued',
      query: input.query,
      placesDiscovered: 0,
      websitesScraped: 0,
      leadsEnriched: 0,
      leadsTotal: 0,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    if (sql) {
      try {
        await sql`
          INSERT INTO "Job" (id, name, status, query, "placesDiscovered", "websitesScraped", "leadsEnriched", "leadsTotal", "createdAt", "updatedAt", "createdBy")
          VALUES (${id}, ${input.name}, 'queued', ${JSON.stringify(input.query)}, 0, 0, 0, 0, ${now}, ${now}, 'admin')
        `;
        console.log('[v0] Job created in Neon database:', id);
        return job;
      } catch (error) {
        console.error('[v0] Database error creating job:', error);
      }
    }

    console.log('[v0] Job created in memory (no database):', id);
    return InMemoryStorage.jobs.create(job);
  },

  /**
   * Get job by ID
   */
  async getJob(jobId: string): Promise<Job | null> {
    if (sql) {
      try {
        const rows = await sql`SELECT * FROM "Job" WHERE id = ${jobId}`;
        if (rows.length > 0) {
          return this.mapJobRow(rows[0]);
        }
      } catch (error) {
        console.error('[v0] Database error getting job:', error);
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
    const limit = options?.limit || 50;
    const offset = options?.offset || 0;

    if (sql) {
      try {
        const [jobRows, countRows] = await Promise.all([
          sql`SELECT * FROM "Job" ORDER BY "createdAt" DESC LIMIT ${limit} OFFSET ${offset}`,
          sql`SELECT COUNT(*) as count FROM "Job"`,
        ]);

        return {
          jobs: jobRows.map((row: any) => this.mapJobRow(row)),
          total: parseInt(countRows[0]?.count || '0', 10),
        };
      } catch (error) {
        console.error('[v0] Database error listing jobs:', error);
      }
    }

    const allJobs = InMemoryStorage.jobs.list();
    return {
      jobs: allJobs.slice(offset, offset + limit),
      total: allJobs.length,
    };
  },

  /**
   * Update job status
   */
  async updateJobStatus(jobId: string, status: string): Promise<Job | null> {
    const now = new Date();

    if (sql) {
      try {
        await sql`UPDATE "Job" SET status = ${status}, "updatedAt" = ${now} WHERE id = ${jobId}`;
        return this.getJob(jobId);
      } catch (error) {
        console.error('[v0] Database error updating job status:', error);
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
    const now = new Date();

    if (sql) {
      try {
        await sql`
          UPDATE "Job" 
          SET 
            "placesDiscovered" = COALESCE(${updates.places_discovered}, "placesDiscovered"),
            "websitesScraped" = COALESCE(${updates.websites_scraped}, "websitesScraped"),
            "leadsEnriched" = COALESCE(${updates.leads_enriched}, "leadsEnriched"),
            "leadsTotal" = COALESCE(${updates.leads_total}, "leadsTotal"),
            "updatedAt" = ${now}
          WHERE id = ${jobId}
        `;
        return;
      } catch (error) {
        console.error('[v0] Database error updating job counters:', error);
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
    if (sql) {
      try {
        // Delete leads first (foreign key constraint)
        await sql`DELETE FROM "Lead" WHERE "jobId" = ${jobId}`;
        await sql`DELETE FROM "Export" WHERE "jobId" = ${jobId}`;
        await sql`DELETE FROM "ActivityEvent" WHERE "jobId" = ${jobId}`;
        await sql`DELETE FROM "Job" WHERE id = ${jobId}`;
        return true;
      } catch (error) {
        console.error('[v0] Database error deleting job:', error);
      }
    }

    InMemoryStorage.jobs.delete(jobId);
    return true;
  },

  /**
   * Get activity events for a job
   */
  async getActivity(jobId: string): Promise<any[]> {
    if (sql) {
      try {
        const rows = await sql`SELECT * FROM "ActivityEvent" WHERE "jobId" = ${jobId} ORDER BY timestamp DESC`;
        return rows;
      } catch (error) {
        console.error('[v0] Database error fetching activity:', error);
      }
    }
    return [];
  },

  /**
   * Map database row to Job object
   */
  mapJobRow(row: any): Job {
    return {
      id: row.id,
      name: row.name,
      status: row.status,
      query: typeof row.query === 'string' ? JSON.parse(row.query) : row.query,
      placesDiscovered: row.placesDiscovered || 0,
      websitesScraped: row.websitesScraped || 0,
      leadsEnriched: row.leadsEnriched || 0,
      leadsTotal: row.leadsTotal || 0,
      createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : row.createdAt,
      updatedAt: row.updatedAt instanceof Date ? row.updatedAt.toISOString() : row.updatedAt,
    };
  },
};
