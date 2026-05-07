/**
 * Leads Service
 * 
 * Handles lead data retrieval, filtering, and scoring.
 * Uses mock data from mock-data.ts.
 */

import type { Lead, LeadListFilters } from "@/lib/types";
import { leadsStore } from "@/lib/mock-data";

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
}
