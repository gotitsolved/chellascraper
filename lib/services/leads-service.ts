/**
 * Leads Service
 * 
 * Handles lead data retrieval, filtering, and scoring.
 * Uses mock data from mock-data.ts.
 */

import type { Lead, LeadListFilters, ExportRun, ExportRequestPayload } from "@/lib/types";
import { leadsStore, exportsStore } from "@/lib/mock-data";

export class LeadsService {
  /**
   * Get leads for a job with optional filtering and pagination.
   */
  static async listLeads(
    jobId: string,
    filters?: LeadListFilters
  ): Promise<{
    leads: Lead[];
    total: number;
    filtered: number;
    page: number;
    pageSize: number;
  }> {
    let leads = leadsStore.get(jobId) || [];
    const total = leads.length;

    // Apply filters
    if (filters) {
      if (filters.minScore !== undefined) {
        leads = leads.filter((lead) => lead.leadScore >= filters.minScore!);
      }
      if (filters.minRating !== undefined) {
        leads = leads.filter((lead) => (lead.rating || 0) >= filters.minRating!);
      }
      if (filters.hasEmail) {
        leads = leads.filter((lead) => !!lead.email);
      }
      if (filters.hasWebsite) {
        leads = leads.filter((lead) => !!lead.websiteUrl);
      }
      if (filters.icpMatch === true) {
        leads = leads.filter((lead) => lead.icpMatch);
      } else if (filters.icpMatch === false) {
        leads = leads.filter((lead) => !lead.icpMatch);
      }
      if (filters.city) {
        leads = leads.filter(
          (lead) =>
            lead.city?.toLowerCase().includes(filters.city!.toLowerCase())
        );
      }
      if (filters.country) {
        leads = leads.filter(
          (lead) =>
            lead.country?.toLowerCase().includes(filters.country!.toLowerCase())
        );
      }
    }

    // Sort by score descending
    leads.sort((a, b) => b.leadScore - a.leadScore);

    const filtered = leads.length;
    const page = filters?.page || 1;
    const pageSize = filters?.pageSize || 50;

    // Apply pagination
    const offset = (page - 1) * pageSize;
    const paginatedLeads = leads.slice(offset, offset + pageSize);

    return { leads: paginatedLeads, total, filtered, page, pageSize };
  }

  /**
   * Get a single lead by ID.
   */
  static async getLead(jobId: string, leadId: string): Promise<Lead | null> {
    const leads = leadsStore.get(jobId) || [];
    return leads.find((lead) => lead.id === leadId) || null;
  }

  /**
   * List exports for a job.
   */
  static async listExports(jobId: string): Promise<ExportRun[]> {
    return exportsStore.get(jobId) || [];
  }

  /**
   * Create a new export for a job.
   */
  static async createExport(
    jobId: string,
    payload: ExportRequestPayload
  ): Promise<ExportRun> {
    const { leads } = await this.listLeads(jobId, {
      minScore: payload.minScore,
      minRating: payload.minRating,
      hasEmail: payload.mustHaveEmail,
      hasWebsite: payload.mustHaveWebsite,
      icpMatch: payload.icpMatchOnly ? true : undefined,
      pageSize: 10000,
    });

    // Build filter summary string
    const filterParts: string[] = [];
    if (payload.minScore) filterParts.push(`Score >= ${payload.minScore}`);
    if (payload.minRating) filterParts.push(`Rating >= ${payload.minRating}`);
    if (payload.mustHaveEmail) filterParts.push("Has email");
    if (payload.mustHaveWebsite) filterParts.push("Has website");
    if (payload.icpMatchOnly) filterParts.push("ICP match only");
    if (payload.city) filterParts.push(`City: ${payload.city}`);
    if (payload.country) filterParts.push(`Country: ${payload.country}`);

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
  }

  /**
   * Generate CSV from leads.
   */
  static generateCsv(leads: Lead[]): string {
    const headers = [
      "Name",
      "Category",
      "Address",
      "City",
      "Country",
      "Phone",
      "Email",
      "Website",
      "Rating",
      "Lead Score",
      "ICP Match",
    ];

    const rows = leads.map((lead) => [
      lead.name,
      lead.category,
      lead.address || "",
      lead.city || "",
      lead.country || "",
      lead.phone || "",
      lead.email || "",
      lead.websiteUrl || "",
      lead.rating?.toFixed(1) || "",
      lead.leadScore.toFixed(0),
      lead.icpMatch ? "Yes" : "No",
    ]);

    const escape = (val: string) => {
      if (val.includes(",") || val.includes('"') || val.includes("\n")) {
        return `"${val.replace(/"/g, '""')}"`;
      }
      return val;
    };

    const csvRows = [
      headers.join(","),
      ...rows.map((row) => row.map(escape).join(",")),
    ];

    return csvRows.join("\n");
  }
}
