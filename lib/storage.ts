import type { Job, Lead } from '@/lib/types';

// In-memory storage that persists for the current deployment
const jobsStore = new Map<string, Job>();
const leadsStore = new Map<string, Lead[]>();

export const InMemoryStorage = {
  // Jobs
  jobs: {
    create: (job: Job) => {
      jobsStore.set(job.id, job);
      return job;
    },
    get: (jobId: string) => jobsStore.get(jobId) || null,
    list: () => Array.from(jobsStore.values()).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    update: (jobId: string, updates: Partial<Job>) => {
      const job = jobsStore.get(jobId);
      if (!job) return null;
      const updated = { ...job, ...updates, updatedAt: new Date().toISOString() };
      jobsStore.set(jobId, updated);
      return updated;
    },
    delete: (jobId: string) => {
      jobsStore.delete(jobId);
      leadsStore.delete(jobId);
    },
  },

  // Leads
  leads: {
    add: (jobId: string, leads: Lead[]) => {
      const existing = leadsStore.get(jobId) || [];
      leadsStore.set(jobId, [...existing, ...leads]);
    },
    list: (jobId: string) => leadsStore.get(jobId) || [],
    get: (jobId: string, leadId: string) => {
      return (leadsStore.get(jobId) || []).find(l => l.id === leadId) || null;
    },
  },
};
