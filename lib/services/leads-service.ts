import { db as prisma } from '@/lib/db';
import type { Lead, LeadListFilters, ExportRun, ExportRequestPayload } from '@/lib/types';

export const LeadsService = {
  async addLeads(jobId: string, leads: Lead[]): Promise<void> {
    if (leads.length === 0) return;
    if (!prisma) {
      console.log('[v0] Database not initialized - leads not persisted');
      return;
    }

    try {
      await prisma.lead.createMany({
        data: leads.map(lead => ({
          id: `lead-${Date.now()}-${Math.random()}`,
          jobId,
          placeId: lead.placeId,
          businessName: lead.businessName,
          contactName: lead.contactName,
          category: lead.category,
          address: lead.address,
          city: lead.city,
          state: lead.state,
          country: lead.country || 'USA',
          phone: lead.phone,
          email: lead.email,
          emailVerified: lead.emailVerified || false,
          website: lead.website,
          rating: lead.rating,
          reviewCount: lead.reviewCount || 0,
          score: lead.score || 0,
          icpMatch: lead.icpMatch || false,
          source: lead.source || 'google_places',
        })),
        skipDuplicates: true,
      });
      console.log(`[v0] Added ${leads.length} leads for job ${jobId}`);
    } catch (error) {
      console.error('[v0] Error adding leads:', error);
    }
  },

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
    const page = filters?.page || 1;
    const pageSize = filters?.pageSize || 50;
    const skip = (page - 1) * pageSize;

    if (!prisma) {
      console.log('[v0] Database not initialized - returning empty leads');
      return { leads: [], total: 0, filtered: 0, page, pageSize };
    }

    try {
      const where: any = { jobId };
      if (filters?.minScore) where.score = { gte: filters.minScore };
      if (filters?.minRating) where.rating = { gte: filters.minRating };
      if (filters?.hasEmail) where.email = { not: null };
      if (filters?.hasWebsite) where.website = { not: null };
      if (filters?.icpMatch) where.icpMatch = true;

      const [leads, total] = await Promise.all([
        prisma.lead.findMany({
          where,
          orderBy: { score: 'desc' },
          take: pageSize,
          skip,
        }),
        prisma.lead.count({ where }),
      ]);

      return {
        leads: leads.map(l => this.mapLeadRow(l)),
        total: await prisma.lead.count({ where: { jobId } }),
        filtered: total,
        page,
        pageSize,
      };
    } catch (error) {
      console.error('[v0] Error listing leads:', error);
      return { leads: [], total: 0, filtered: 0, page, pageSize };
    }
  },

  async createExport(
    jobId: string,
    payload: ExportRequestPayload
  ): Promise<ExportRun> {
    const exportId = `export-${Date.now()}`;
    const filterParts: string[] = [];

    if (payload.minScore) filterParts.push(`Score >= ${payload.minScore}`);
    if (payload.minRating) filterParts.push(`Rating >= ${payload.minRating}`);
    if (payload.mustHaveEmail) filterParts.push('Has email');
    if (payload.mustHaveWebsite) filterParts.push('Has website');

    const filterSummary = filterParts.length > 0 ? filterParts.join(', ') : 'No filters';

    if (!prisma) {
      throw new Error('Database not initialized');
    }

    try {
      const { filtered } = await this.listLeads(jobId, {
        minScore: payload.minScore,
        minRating: payload.minRating,
        hasEmail: payload.mustHaveEmail,
        hasWebsite: payload.mustHaveWebsite,
      });

      const exportRun: ExportRun = {
        id: exportId,
        jobId,
        createdAt: new Date().toISOString(),
        format: 'csv',
        filterSummary,
        rowCount: filtered,
        status: 'ready',
        downloadUrl: `/api/jobs/${jobId}/export?${new URLSearchParams(
          Object.entries(payload)
            .filter(([, v]) => v !== undefined)
            .map(([k, v]) => [k, String(v)])
        ).toString()}`,
      };

      return exportRun;
    } catch (error) {
      console.error('[v0] Error creating export:', error);
      throw error;
    }
  },

  async getExportLeads(
    jobId: string,
    payload: ExportRequestPayload
  ): Promise<Lead[]> {
    const { leads } = await this.listLeads(jobId, {
      minScore: payload.minScore,
      minRating: payload.minRating,
      hasEmail: payload.mustHaveEmail,
      hasWebsite: payload.mustHaveWebsite,
    });
    return leads;
  },

  generateCsv(leads: Lead[]): string {
    if (leads.length === 0) {
      return 'Contact Name,Business Name,Email,Phone,Website,Address,City,State,Rating,Score\n';
    }

    const headers = ['Contact Name', 'Business Name', 'Email', 'Phone', 'Website', 'Address', 'City', 'State', 'Rating', 'Score'];
    const rows = leads.map(lead => [
      this.escapeCsvField(lead.contactName || ''),
      this.escapeCsvField(lead.businessName),
      this.escapeCsvField(lead.email || ''),
      this.escapeCsvField(lead.phone || ''),
      this.escapeCsvField(lead.website || ''),
      this.escapeCsvField(lead.address || ''),
      this.escapeCsvField(lead.city || ''),
      this.escapeCsvField(lead.state || ''),
      lead.rating?.toString() || '',
      lead.score?.toString() || '0',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(',')),
    ].join('\n');

    return csvContent;
  },

  escapeCsvField(field: string): string {
    if (field.includes(',') || field.includes('"') || field.includes('\n')) {
      return `"${field.replace(/"/g, '""')}"`;
    }
    return field;
  },

  mapLeadRow(row: any): Lead {
    return {
      id: row.id,
      jobId: row.jobId,
      placeId: row.placeId,
      businessName: row.businessName,
      contactName: row.contactName,
      category: row.category,
      address: row.address,
      city: row.city,
      state: row.state,
      country: row.country || 'USA',
      phone: row.phone,
      email: row.email,
      emailVerified: row.emailVerified,
      website: row.website,
      rating: row.rating,
      reviewCount: row.reviewCount || 0,
      score: row.score || 0,
      icpMatch: row.icpMatch,
      source: row.source || 'google_places',
      createdAt: row.createdAt?.toISOString?.() || new Date().toISOString(),
    };
  },
};
