/**
 * Jobs Service
 * 
 * Handles job creation, retrieval, and status management.
 * Currently uses in-memory storage for development.
 * 
 * TODO: Replace with database integration (Supabase, Postgres, etc.)
 */

import type { Job, JobQuery, JobStatus } from "@/lib/types"
import { mockJobs } from "@/lib/mock-data"

// In-memory job storage for development
const jobsStore = new Map<string, Job>(mockJobs.map((job) => [job.id, job]))

export async function createJob(query: JobQuery): Promise<Job> {
  const id = `job_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
  
  const job: Job = {
    id,
    name: query.name || `${query.businessTypes[0]} in ${query.location}`,
    query,
    status: "queued",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    counters: {
      discovered: 0,
      withWebsite: 0,
      scraped: 0,
      withEmail: 0,
      verified: 0,
      exported: 0,
    },
    progress: 0,
  }

  jobsStore.set(id, job)
  
  return job
}

export async function getJob(jobId: string): Promise<Job | null> {
  return jobsStore.get(jobId) || null
}

export async function listJobs(options?: {
  status?: JobStatus
  limit?: number
  offset?: number
}): Promise<{ jobs: Job[]; total: number }> {
  let jobs = Array.from(jobsStore.values())

  // Filter by status if provided
  if (options?.status) {
    jobs = jobs.filter((job) => job.status === options.status)
  }

  // Sort by creation date, newest first
  jobs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  const total = jobs.length

  // Apply pagination
  if (options?.offset !== undefined) {
    jobs = jobs.slice(options.offset)
  }
  if (options?.limit !== undefined) {
    jobs = jobs.slice(0, options.limit)
  }

  return { jobs, total }
}

export async function updateJobStatus(jobId: string, status: JobStatus): Promise<Job | null> {
  const job = jobsStore.get(jobId)
  if (!job) return null

  job.status = status
  job.updatedAt = new Date().toISOString()

  if (status === "running") {
    job.startedAt = new Date().toISOString()
  } else if (status === "completed" || status === "failed") {
    job.completedAt = new Date().toISOString()
  }

  jobsStore.set(jobId, job)
  return job
}

export async function updateJobCounters(
  jobId: string,
  counters: Partial<Job["counters"]>
): Promise<Job | null> {
  const job = jobsStore.get(jobId)
  if (!job) return null

  job.counters = { ...job.counters, ...counters }
  job.updatedAt = new Date().toISOString()

  // Calculate progress based on pipeline stages
  const stages = [
    job.counters.discovered,
    job.counters.scraped,
    job.counters.withEmail,
    job.counters.verified,
  ]
  const maxDiscovered = job.counters.discovered || 1
  job.progress = Math.round(
    (stages.reduce((sum, val) => sum + (val || 0), 0) / (maxDiscovered * 4)) * 100
  )

  jobsStore.set(jobId, job)
  return job
}

export async function updateJobProgress(jobId: string, progress: number): Promise<Job | null> {
  const job = jobsStore.get(jobId)
  if (!job) return null

  job.progress = Math.max(0, Math.min(100, progress))
  job.updatedAt = new Date().toISOString()

  jobsStore.set(jobId, job)
  return job
}

export async function deleteJob(jobId: string): Promise<boolean> {
  return jobsStore.delete(jobId)
}

// Export for testing
export function _getJobsStore() {
  return jobsStore
}
