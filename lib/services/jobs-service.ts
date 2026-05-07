/**
 * Jobs Service
 * 
 * Handles job creation, retrieval, and status management.
 * Uses persistent file-based storage for serverless environments.
 */

import type { Job, JobQuery, JobStatus, ActivityEvent, Settings } from "@/lib/types";
import { jobsStore, leadsStore, exportsStore, createJobInStore, getActivityForJob } from "@/lib/mock-data";
import { readJobs, writeJobs, readLeads, writeLeads, readExports, writeExports } from "@/lib/persistent-store";

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
 * Create a new job with the given name and query parameters.
 */
static async createJob(input: {
  name: string;
  query: JobQuery;
}): Promise<Job> {
  const job = createJobInStore(input);
  
  // Persist to file storage
  const jobs = await readJobs();
  jobs.set(job.id, job);
  await writeJobs(jobs);
  
  return job;
}

/**
 * Retrieve a job by ID.
 */
static async getJob(jobId: string): Promise<Job | null> {
  const jobs = await readJobs();
  return jobs.get(jobId) || null;
}

  /**
   * List all jobs with optional filtering and pagination.
   */
  static async listJobs(options?: {
    status?: JobStatus;
    limit?: number;
    offset?: number;
  }): Promise<{ jobs: Job[]; total: number }> {
    let jobs = Array.from((await readJobs()).values());

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
    const jobs = await readJobs();
    const job = jobs.get(jobId);
    if (!job) return null;

    job.status = status;
    jobs.set(jobId, job);
    await writeJobs(jobs);
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
    const jobs = await readJobs();
    const leads = await readLeads();
    const exports_data = await readExports();
    
    jobs.delete(jobId);
    leads.delete(jobId);
    exports_data.delete(jobId);
    
    await writeJobs(jobs);
    await writeLeads(leads);
    await writeExports(exports_data);
    
    return true;
  }
}

// Export settingsStore for API routes
export { settingsStore } from "@/lib/mock-data";
