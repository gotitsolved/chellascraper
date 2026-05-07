import { db as prisma } from '@/lib/db';
import { InMemoryStorage } from '@/lib/storage';
import type { Lead, LeadListFilters, ExportRun, ExportRequestPayload } from '@/lib/types';

export const LeadsService = {
  async addLeads(jobId: string, leads: Lead[]): Promise<void> {
    if (leads.length === 0) return;

    if (prisma) {
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
        console.log(`[v0] Added ${leads.length} leads for job ${jobId} to database`);
        return;
      } catch (error) {
        console.warn('[v0] Database error adding leads, using in-memory:', error);
      }
    }

    // Fallback to in-memory storage
    console.log(`[v0] Added ${leads.length} leads for job ${jobId} to memory`);
    InMemoryStorage.leads.add(jobId, leads);
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

    if (prisma) {
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
          leads: leads.map(this.mapLeadRow),
          total: await prisma.lead.count({ where: { jobId } }),
          filtered: total,
          page,
          pageSize,
        };
      } catch (error) {
        console.warn('[v0] Database error listing leads, using in-memory:', error);
      }
    }

    // Fallback to in-memory storage
    let leads = InMemoryStorage.leads.list(jobId);

    if (filters?.minScore) leads = leads.filter(l => (l.score || 0) >= filters.minScore);
    if (filters?.minRating) leads = leads.filter(l => (l.rating || 0) >= filters.minRating);
    if (filters?.hasEmail) leads = leads.filter(l => !!l.email);
    if (filters?.hasWebsite) leads = leads.filter(l => !!l.website);
    if (filters?.icpMatch) leads = leads.filter(l => l.icpMatch);

    leads.sort((a, b) => (b.score || 0) - (a.score || 0));

    return {
      leads: leads.slice(skip, skip + pageSize),
      total: leads.length,
      filtered: leads.length,
      page,
      pageSize,
    };
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

    const { filtered } = await this.listLeads(jobId, {
      minScore: payload.minScore,
      minRating: payload.minRating,
      hasEmail: payload.mustHaveEmail,
      hasWebsite: payload.mustHaveWebsite,
    });

    const downloadUrl = `/api/jobs/${jobId}/export?${new URLSearchParams(
      Object.entries(payload)
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => [k, String(v)])
    ).toString()}`;

    const exportRun: ExportRun = {
      id: exportId,
      jobId,
      createdAt: new Date().toISOString(),
      format: 'csv',
      filterSummary,
      rowCount: filtered,
      status: 'ready',
      downloadUrl,
    };

    return exportRun;
  },

  async listExports(jobId: string): Promise<ExportRun[]> {
    // For now, return a single recent export based on the current state
    // In a real system, you would query the database for all exports for this job
    const { filtered } = await this.listLeads(jobId);
    return [
      {
        id: `export-recent-${jobId}`,
        jobId,
        createdAt: new Date().toISOString(),
        format: 'csv',
        filterSummary: 'No filters',
        rowCount: filtered,
        status: 'ready',
        downloadUrl: `/api/jobs/${jobId}/export`,
      },
    ];
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

    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
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
      createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : row.createdAt,
    };
  },
};
