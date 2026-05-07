/**
 * Leads Service
 * 
 * Handles lead data retrieval, filtering, and scoring using Prisma ORM.
 */

import type { Lead, LeadListFilters, ExportRun, ExportRequestPayload } from "@/lib/types";
import { db } from "@/lib/db";

export const LeadsService = {
  async listLeads(
    jobId: string,
    filters?: LeadListFilters
  ): Promise<{
    leads: Lead[];
    total: number;
    filtered: number;
    page: number;
    pageSize: number;
  }> {
    const pageSize = filters?.pageSize || 50;
    const page = filters?.page || 1;
    const skip = (page - 1) * pageSize;

    const where: any = { jobId };

    // Apply filters
    if (filters?.minScore) where.score = { gte: filters.minScore };
    if (filters?.minRating) where.rating = { gte: filters.minRating };
    if (filters?.hasEmail) where.email = { not: null };
    if (filters?.hasWebsite) where.website = { not: null };

    const [leads, total] = await Promise.all([
      db.lead.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { score: "desc" },
      }),
      db.lead.count({ where }),
    ]);

    const allLeads = await db.lead.count({ where: { jobId } });

    return {
      leads: leads.map(this.mapLeadFromDb),
      total: allLeads,
      filtered: total,
      page,
      pageSize,
    };
  },

  /**
   * Add a lead to a job.
   */
  async addLead(jobId: string, leadData: Partial<Lead>): Promise<Lead> {
    const lead = await db.lead.create({
      data: {
        jobId,
        businessName: leadData.businessName || "",
        contactName: leadData.contactName,
        email: leadData.email,
        phone: leadData.phone,
        website: leadData.website,
        address: leadData.address,
        city: leadData.city,
        state: leadData.state,
        country: leadData.country,
        rating: leadData.rating,
        reviewCount: leadData.reviewCount,
        source: leadData.source || "direct_scrape",
        score: leadData.score || 0,
      },
    });

    return this.mapLeadFromDb(lead);
  },

  /**
   * Add multiple leads to a job.
   */
  async addLeads(jobId: string, leadsData: Partial<Lead>[]): Promise<Lead[]> {
    const leads = await db.lead.createMany({
      data: leadsData.map(lead => ({
        jobId,
        businessName: lead.businessName || "",
        contactName: lead.contactName,
        email: lead.email,
        phone: lead.phone,
        website: lead.website,
        address: lead.address,
        city: lead.city,
        state: lead.state,
        country: lead.country,
        rating: lead.rating,
        reviewCount: lead.reviewCount,
        source: lead.source || "direct_scrape",
        score: lead.score || 0,
      })),
    });

    const created = await db.lead.findMany({
      where: { jobId },
      orderBy: { createdAt: "desc" },
      take: leadsData.length,
    });

    return created.map(this.mapLeadFromDb);
  },

  /**
   * Update a lead.
   */
  async updateLead(leadId: string, updates: Partial<Lead>): Promise<Lead | null> {
    const lead = await db.lead.update({
      where: { id: leadId },
      data: {
        contactName: updates.contactName,
        email: updates.email,
        phone: updates.phone,
        website: updates.website,
        address: updates.address,
        city: updates.city,
        state: updates.state,
        country: updates.country,
        rating: updates.rating,
        reviewCount: updates.reviewCount,
        emailStatus: updates.emailStatus,
        score: updates.score,
        updatedAt: new Date(),
      },
    });

    return this.mapLeadFromDb(lead);
  },

  /**
   * List exports for a job.
   */
  async listExports(jobId: string): Promise<ExportRun[]> {
    const exports_list = await db.export.findMany({
      where: { jobId },
      orderBy: { createdAt: "desc" },
    });

    return exports_list.map(this.mapExportFromDb);
  },

  /**
   * Create a new export for a job.
   */
  async createExport(
    jobId: string,
    payload: ExportRequestPayload
  ): Promise<ExportRun> {
    const { leads } = await this.listLeads(jobId, {
      minScore: payload.minScore,
      minRating: payload.minRating,
      hasEmail: payload.mustHaveEmail,
      hasWebsite: payload.mustHaveWebsite,
      pageSize: 10000,
    });

    // Build filter summary string
    const filterParts: string[] = [];
    if (payload.minScore) filterParts.push(`Score >= ${payload.minScore}`);
    if (payload.minRating) filterParts.push(`Rating >= ${payload.minRating}`);
    if (payload.mustHaveEmail) filterParts.push("Has email");
    if (payload.mustHaveWebsite) filterParts.push("Has website");
    if (payload.city) filterParts.push(`City: ${payload.city}`);
    if (payload.country) filterParts.push(`Country: ${payload.country}`);

    const exportRun = await db.export.create({
      data: {
        jobId,
        format: "csv",
        status: "ready",
        filterSummary: filterParts.length > 0 ? filterParts.join(", ") : "No filters",
        rowCount: leads.length,
        downloadUrl: `/api/jobs/${jobId}/export?${new URLSearchParams(
          Object.entries(payload)
            .filter(([, v]) => v !== undefined)
            .map(([k, v]) => [k, String(v)])
        ).toString()}`,
      },
    });

    return this.mapExportFromDb(exportRun);
  },

  /**
   * Map database lead to application type.
   */
  mapLeadFromDb(dbLead: any): Lead {
    return {
      id: dbLead.id,
      jobId: dbLead.jobId,
      businessName: dbLead.businessName,
      contactName: dbLead.contactName,
      email: dbLead.email,
      phone: dbLead.phone,
      website: dbLead.website,
      address: dbLead.address,
      city: dbLead.city,
      state: dbLead.state,
      country: dbLead.country,
      rating: dbLead.rating,
      reviewCount: dbLead.reviewCount,
      source: dbLead.source,
      emailStatus: dbLead.emailStatus,
      score: dbLead.score || 0,
    };
  },

  /**
   * Map database export to application type.
   */
  mapExportFromDb(dbExport: any): ExportRun {
    return {
      id: dbExport.id,
      jobId: dbExport.jobId,
      format: dbExport.format as "csv" | "json",
      createdAt: dbExport.createdAt.toISOString(),
      status: dbExport.status,
      filterSummary: dbExport.filterSummary || "",
      rowCount: dbExport.rowCount,
      downloadUrl: dbExport.downloadUrl,
    };
  },
};
