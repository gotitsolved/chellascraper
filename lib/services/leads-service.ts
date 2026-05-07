import type { Lead, LeadListFilters, ExportRun, ExportRequestPayload } from "@/lib/types";

// In-memory storage (temporary fallback until Prisma/Neon is configured)
const leadsStore = new Map<string, Lead[]>();
const exportsStore = new Map<string, ExportRun[]>();

export const LeadsService = {
  async listLeads(jobId: string, filters?: LeadListFilters) {
    let leads = leadsStore.get(jobId) || [];

    // Apply filters
    if (filters?.hasEmail) {
      leads = leads.filter((l) => l.email);
    }
    if (filters?.hasWebsite) {
      leads = leads.filter((l) => l.website);
    }
    if (filters?.minRating !== undefined) {
      leads = leads.filter((l) => (l.rating || 0) >= filters.minRating);
    }
    if (filters?.minScore !== undefined) {
      leads = leads.filter((l) => (l.score || 0) >= filters.minScore);
    }

    const page = filters?.page || 1;
    const pageSize = filters?.pageSize || 20;
    const offset = (page - 1) * pageSize;

    return {
      leads: leads.slice(offset, offset + pageSize),
      total: leadsStore.get(jobId)?.length || 0,
      filtered: leads.length,
      page,
      pageSize,
    };
  },

  async listExports(jobId: string): Promise<ExportRun[]> {
    return exportsStore.get(jobId) || [];
  },

  async createExport(jobId: string, payload: ExportRequestPayload): Promise<ExportRun> {
    const { leads } = await this.listLeads(jobId, {
      minScore: payload.minScore,
      minRating: payload.minRating,
      hasEmail: payload.mustHaveEmail,
      hasWebsite: payload.mustHaveWebsite,
      pageSize: 10000,
    });

    const filterParts: string[] = [];
    if (payload.minScore) filterParts.push(`Score >= ${payload.minScore}`);
    if (payload.minRating) filterParts.push(`Rating >= ${payload.minRating}`);
    if (payload.mustHaveEmail) filterParts.push("Has email");
    if (payload.mustHaveWebsite) filterParts.push("Has website");

    const exportRun: ExportRun = {
      id: `export-${Date.now()}`,
      jobId,
      createdAt: new Date().toISOString(),
      format: "csv",
      filterSummary: filterParts.length > 0 ? filterParts.join(", ") : "No filters",
      rowCount: leads.length,
      status: "ready",
      downloadUrl: `/api/jobs/${jobId}/export?${new URLSearchParams(
        Object.entries(payload)
          .filter(([, v]) => v !== undefined)
          .map(([k, v]) => [k, String(v)])
      ).toString()}`,
    };

    const existing = exportsStore.get(jobId) || [];
    exportsStore.set(jobId, [exportRun, ...existing]);
    return exportRun;
  },

  // Helper to store leads for a job (used by job-runner)
  _setLeads(jobId: string, leads: Lead[]): void {
    leadsStore.set(jobId, leads);
  },
};
