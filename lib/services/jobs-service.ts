/**
 * Jobs Service
 * 
 * Handles job creation, retrieval, and status management.
 * Uses in-memory storage for development (mock-data.ts).
 */

import type { Job, JobQuery, JobStatus, ActivityEvent } from "@/lib/types";
import { jobsStore, leadsStore, exportsStore, createJobInStore, getActivityForJob } from "@/lib/mock-data";

/**
 * Create a new job with the given name and query parameters.
 */
export class JobsService {
  static async createJob(input: {
    name: string;
    query: JobQuery;
  }): Promise<Job> {
    return createJobInStore(input);
  }

  /**
   * Retrieve a job by ID.
   */
  static async getJob(jobId: string): Promise<Job | null> {
    return jobsStore.get(jobId) || null;
  }

  /**
   * List all jobs with optional filtering and pagination.
   */
  static async listJobs(options?: {
    status?: JobStatus;
    limit?: number;
    offset?: number;
  }): Promise<{ jobs: Job[]; total: number }> {
    let jobs = Array.from(jobsStore.values());

    // Filter by status if provided
    if (options?.status) {
      jobs = jobs.filter((job) => job.status === options.status);
    }

    // Sort by creation date, newest first
    jobs.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    const total = jobs.length;

    // Apply pagination
    if (options?.offset !== undefined) {
      jobs = jobs.slice(options.offset);
    }
    if (options?.limit !== undefined) {
      jobs = jobs.slice(0, options.limit);
    }

    return { jobs, total };
  }

  /**
   * Update a job's status.
   */
  static async updateJobStatus(
    jobId: string,
    status: JobStatus
  ): Promise<Job | null> {
    const job = jobsStore.get(jobId);
    if (!job) return null;

    job.status = status;
    jobsStore.set(jobId, job);
    return job;
  }

  /**
   * Get activity log for a job.
   */
  static async getActivity(jobId: string): Promise<ActivityEvent[]> {
    return getActivityForJob(jobId);
  }

  /**
   * Delete a job and its associated leads.
   */
  static async deleteJob(jobId: string): Promise<boolean> {
    jobsStore.delete(jobId);
    leadsStore.delete(jobId);
    exportsStore.delete(jobId);
    return true;
  }
}

// Export settingsStore for API routes
export { settingsStore } from "@/lib/mock-data";
