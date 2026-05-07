import { getSqlClient } from '@/lib/db-neon';
import type { Job, JobQuery } from '@/lib/types';

export const JobsService = {
  /**
   * Create a new job in the database
   */
  async createJob(input: { name: string; query: JobQuery }): Promise<Job> {
    const id = `job-${Date.now()}`;
    const now = new Date().toISOString();
    const sql = getSqlClient();

    try {
      const result = await sql`
        INSERT INTO jobs (
          id, name, status, location_text, radius_km, 
          business_types, created_by, created_at
        ) VALUES (
          ${id}, ${input.name}, 'queued', ${input.query.locationText}, 
          ${input.query.radiusKm}, ${JSON.stringify(input.query.businessTypes || [])}, 
          'admin', ${now}
        )
        RETURNING *
      `;

      return this.mapJobRow(result[0]);
    } catch (error) {
      console.error('[v0] Error creating job:', error);
      throw error;
    }
  },

  /**
   * Get job by ID
   */
  async getJob(jobId: string): Promise<Job | null> {
    const sql = getSqlClient();
    try {
      const result = await sql`SELECT * FROM jobs WHERE id = ${jobId}`;
      if (result.length === 0) return null;
      return this.mapJobRow(result[0]);
    } catch (error) {
      console.error('[v0] Error getting job:', error);
      return null;
    }
  },

  /**
   * List all jobs with optional filtering
   */
  async listJobs(options?: {
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ jobs: Job[]; total: number }> {
    const sql = getSqlClient();
    try {
      // Get total count
      const countResult = await sql`SELECT COUNT(*) as count FROM jobs`;
      const total = countResult[0]?.count || 0;

      // Get paginated results
      const jobs = await sql`
        SELECT * FROM jobs 
        ORDER BY created_at DESC 
        LIMIT ${options?.limit || 50} 
        OFFSET ${options?.offset || 0}
      `;

      return {
        jobs: jobs.map((row: any) => this.mapJobRow(row)),
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
    const sql = getSqlClient();
    try {
      const result = await sql`
        UPDATE jobs 
        SET status = ${status}, last_run_at = NOW()
        WHERE id = ${jobId}
        RETURNING *
      `;

      if (result.length === 0) return null;
      return this.mapJobRow(result[0]);
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
    const sql = getSqlClient();
    try {
      await sql`
        UPDATE jobs 
        SET 
          places_discovered = COALESCE(${updates.places_discovered}, places_discovered),
          websites_scraped = COALESCE(${updates.websites_scraped}, websites_scraped),
          leads_enriched = COALESCE(${updates.leads_enriched}, leads_enriched),
          leads_total = COALESCE(${updates.leads_total}, leads_total)
        WHERE id = ${jobId}
      `;
    } catch (error) {
      console.error('[v0] Error updating job counters:', error);
    }
  },

  /**
   * Delete job and associated data
   */
  async deleteJob(jobId: string): Promise<boolean> {
    const sql = getSqlClient();
    try {
      await sql`DELETE FROM jobs WHERE id = ${jobId}`;
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
      query: {
        locationText: row.location_text,
        radiusKm: row.radius_km,
        businessTypes: Array.isArray(row.business_types) ? row.business_types : [],
      },
      counters: {
        placesDiscovered: row.places_discovered || 0,
        websitesScraped: row.websites_scraped || 0,
        leadsEnriched: row.leads_enriched || 0,
        leadsTotal: row.leads_total || 0,
      },
      createdBy: row.created_by,
      createdAt: row.created_at,
      lastRunAt: row.last_run_at,
    };
  },
};
