/**
 * Jobs Service
 * 
 * Handles job creation, retrieval, and status management.
 * Uses in-memory storage with pre-seeded demo data.
 */

import type { Job, JobQuery, JobStatus, ActivityEvent } from "@/lib/types";
import { jobsStore, leadsStore, exportsStore, createJobInStore, getActivityForJob, generateLeadsForJob } from "@/lib/mock-data";

export class JobsService {
  /**
   * Create a new job with the given name and query parameters.
   * In mock mode, jobs complete instantly with generated leads.
   */
  static async createJob(input: {
    name: string;
    query: JobQuery;
  }): Promise<Job> {
    const job = createJobInStore(input);
    
    // In mock mode, immediately generate leads and mark complete
    const leadCount = Math.floor(Math.random() * 30) + 20; // 20-50 leads
    const leads = generateLeadsForJob(job.id, leadCount);
    leadsStore.set(job.id, leads);
    
    // Update job to completed status
    job.status = "completed";
    job.lastRunAt = new Date().toISOString();
    job.counters = {
      placesDiscovered: leadCount,
      websitesScraped: Math.floor(leadCount * 0.9),
      leadsEnriched: leadCount,
      leadsTotal: leadCount,
    };
    jobsStore.set(job.id, job);
    
    return job;
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
   * Update a job.
   */
  static async updateJob(jobId: string, updates: Partial<Job>): Promise<Job | null> {
    const job = jobsStore.get(jobId);
    if (!job) return null;
    
    const updated = { ...job, ...updates };
    jobsStore.set(jobId, updated);
    return updated;
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
