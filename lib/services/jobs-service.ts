import type { Job, JobQuery, JobStatus } from "@/lib/types";

// In-memory storage (temporary fallback until Prisma/Neon is configured)
const jobsStore = new Map<string, Job>();

export const JobsService = {
  async createJob(input: {
    name: string;
    query: JobQuery;
  }): Promise<Job> {
    const id = `job-${Date.now()}`;
    const job: Job = {
      id,
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
      createdAt: new Date().toISOString(),
      lastRunAt: new Date().toISOString(),
    };
    jobsStore.set(id, job);
    return job;
  },

  async getJob(jobId: string): Promise<Job | null> {
    return jobsStore.get(jobId) || null;
  },

  async listJobs(): Promise<{ jobs: Job[]; total: number }> {
    const jobs = Array.from(jobsStore.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 50);
    return { jobs, total: jobs.length };
  },

  async updateJob(jobId: string, updates: Partial<Job>): Promise<Job | null> {
    const job = jobsStore.get(jobId);
    if (!job) return null;
    const updated = { ...job, ...updates };
    jobsStore.set(jobId, updated);
    return updated;
  },

  async updateJobStatus(jobId: string, status: JobStatus): Promise<Job | null> {
    const job = jobsStore.get(jobId);
    if (!job) return null;
    job.status = status;
    job.lastRunAt = new Date().toISOString();
    jobsStore.set(jobId, job);
    return job;
  },

  async deleteJob(jobId: string): Promise<boolean> {
    jobsStore.delete(jobId);
    return true;
  },
};
