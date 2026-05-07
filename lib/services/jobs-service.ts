/**
 * Jobs Service
 * 
 * Handles job creation, retrieval, and status management using Prisma ORM.
 * Provides persistent storage across serverless invocations.
 */

import type { Job, JobQuery, JobStatus } from "@/lib/types";
import { db } from "@/lib/db";

export const JobsService = {
  /**
   * Create a new job with the given name and query parameters.
   */
  async createJob(input: {
    name: string;
    query: JobQuery;
  }): Promise<Job> {
    const job = await db.job.create({
      data: {
        name: input.name,
        status: "completed",
        query: input.query,
        counters: {
          placesDiscovered: 0,
          websitesScraped: 0,
          leadsEnriched: 0,
          leadsTotal: 0,
        },
        createdBy: "admin",
        lastRunAt: new Date(),
      },
    });

    return this.mapJobFromDb(job);
  },

  /**
   * Retrieve a job by ID.
   */
  async getJob(jobId: string): Promise<Job | null> {
    const job = await db.job.findUnique({
      where: { id: jobId },
    });

    return job ? this.mapJobFromDb(job) : null;
  },

  /**
   * List all jobs with optional filtering and pagination.
   */
  async listJobs(options?: {
    status?: JobStatus;
    limit?: number;
    offset?: number;
  }): Promise<{ jobs: Job[]; total: number }> {
    const where = options?.status ? { status: options.status } : {};
    const skip = options?.offset || 0;
    const take = options?.limit || 50;

    const [jobs, total] = await Promise.all([
      db.job.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take,
      }),
      db.job.count({ where }),
    ]);

    return {
      jobs: jobs.map((j) => this.mapJobFromDb(j)),
      total,
    };
  },

  /**
   * Update a job's status.
   */
  async updateJobStatus(
    jobId: string,
    status: JobStatus
  ): Promise<Job | null> {
    const job = await db.job.update({
      where: { id: jobId },
      data: { status, lastRunAt: new Date() },
    });

    return this.mapJobFromDb(job);
  },

  /**
   * Update job counters.
   */
  async updateJobCounters(
    jobId: string,
    counters: {
      placesDiscovered?: number;
      websitesScraped?: number;
      leadsEnriched?: number;
      leadsTotal?: number;
    }
  ): Promise<Job | null> {
    const job = await db.job.findUnique({ where: { id: jobId } });
    if (!job) return null;

    const currentCounters = job.counters as any;
    const updatedCounters = {
      ...currentCounters,
      ...counters,
    };

    const updated = await db.job.update({
      where: { id: jobId },
      data: { counters: updatedCounters },
    });

    return this.mapJobFromDb(updated);
  },

  /**
   * Delete a job and its associated leads and exports.
   */
  async deleteJob(jobId: string): Promise<boolean> {
    await db.job.delete({ where: { id: jobId } });
    return true;
  },

  /**
   * Map database job to application type.
   */
  mapJobFromDb(dbJob: any): Job {
    return {
      id: dbJob.id,
      name: dbJob.name,
      createdAt: dbJob.createdAt.toISOString(),
      createdBy: dbJob.createdBy,
      status: dbJob.status as JobStatus,
      query: dbJob.query as JobQuery,
      counters: dbJob.counters as any,
      lastRunAt: dbJob.lastRunAt?.toISOString(),
      errorMessage: dbJob.errorMessage,
    };
  },
};
