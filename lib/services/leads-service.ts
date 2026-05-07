import { sql } from '@/lib/db';
import { InMemoryStorage } from '@/lib/storage';
import type { Lead, LeadListFilters, ExportRun, ExportRequestPayload } from '@/lib/types';

export const LeadsService = {
  async addLeads(jobId: string, leads: Lead[]): Promise<void> {
    if (leads.length === 0) return;

    if (sql) {
      try {
        for (const lead of leads) {
          const id = `lead-${Date.now()}-${Math.random().toString(36).slice(2)}`;
          const now = new Date();
          await sql`
            INSERT INTO "Lead" (
              id, "jobId", "placeId", "businessName", "contactName", category,
              address, city, state, country, phone, email, "emailVerified",
              website, rating, "reviewCount", score, "icpMatch", source, "createdAt", "updatedAt"
            ) VALUES (
              ${id}, ${jobId}, ${lead.placeId || null}, ${lead.businessName}, ${lead.contactName || null}, ${lead.category || null},
              ${lead.address || null}, ${lead.city || null}, ${lead.state || null}, ${lead.country || 'USA'}, ${lead.phone || null}, ${lead.email || null}, ${lead.emailVerified || false},
              ${lead.website || null}, ${lead.rating || null}, ${lead.reviewCount || 0}, ${lead.score || 0}, ${lead.icpMatch || false}, ${lead.source || 'google_places'}, ${now}, ${now}
            )
          `;
        }
        console.log(`[v0] Added ${leads.length} leads for job ${jobId} to Neon database`);
        return;
      } catch (error) {
        console.error('[v0] Database error adding leads:', error);
      }
    }

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
    const offset = (page - 1) * pageSize;

    if (sql) {
      try {
        const rows = await sql`SELECT * FROM "Lead" WHERE "jobId" = ${jobId} ORDER BY score DESC LIMIT ${pageSize} OFFSET ${offset}`;
        const countRows = await sql`SELECT COUNT(*) as count FROM "Lead" WHERE "jobId" = ${jobId}`;

        let leads = rows as any[];
        const total = parseInt(countRows[0]?.count || '0', 10);

        // Apply filters
        if (filters?.minScore) leads = leads.filter(l => (l.score || 0) >= filters.minScore!);
        if (filters?.minRating) leads = leads.filter(l => (l.rating || 0) >= filters.minRating!);
        if (filters?.hasEmail) leads = leads.filter(l => !!l.email);
        if (filters?.hasWebsite) leads = leads.filter(l => !!l.website);
        if (filters?.icpMatch) leads = leads.filter(l => l.icpMatch);

        return {
          leads: leads.map(this.mapLeadRow),
          total,
          filtered: leads.length,
          page,
          pageSize,
        };
      } catch (error) {
        console.error('[v0] Database error listing leads:', error);
      }
    }

    // Fallback to in-memory storage
    let leads = InMemoryStorage.leads.list(jobId);

    if (filters?.minScore) leads = leads.filter(l => (l.score || 0) >= filters.minScore!);
    if (filters?.minRating) leads = leads.filter(l => (l.rating || 0) >= filters.minRating!);
    if (filters?.hasEmail) leads = leads.filter(l => !!l.email);
    if (filters?.hasWebsite) leads = leads.filter(l => !!l.website);
    if (filters?.icpMatch) leads = leads.filter(l => l.icpMatch);

    leads.sort((a, b) => (b.score || 0) - (a.score || 0));

    return {
      leads: leads.slice(offset, offset + pageSize),
      total: leads.length,
      filtered: leads.length,
      page,
      pageSize,
    };
  },

  async createExport(jobId: string, payload: ExportRequestPayload): Promise<ExportRun> {
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

    return {
      id: exportId,
      jobId,
      createdAt: new Date().toISOString(),
      format: 'csv',
      filterSummary,
      rowCount: filtered,
      status: 'ready',
      downloadUrl: `/api/jobs/${jobId}/export`,
    };
  },

  async listExports(jobId: string): Promise<ExportRun[]> {
    const { filtered } = await this.listLeads(jobId);
    return [{
      id: `export-recent-${jobId}`,
      jobId,
      createdAt: new Date().toISOString(),
      format: 'csv',
      filterSummary: 'No filters',
      rowCount: filtered,
      status: 'ready',
      downloadUrl: `/api/jobs/${jobId}/export`,
    }];
  },

  async getExportLeads(jobId: string, payload: ExportRequestPayload): Promise<Lead[]> {
    const { leads } = await this.listLeads(jobId, {
      minScore: payload.minScore,
      minRating: payload.minRating,
      hasEmail: payload.mustHaveEmail,
      hasWebsite: payload.mustHaveWebsite,
    });
    return leads;
  },

  generateCsv(leads: Lead[]): string {
    const headers = ['Contact Name', 'Business Name', 'Email', 'Phone', 'Website', 'Address', 'City', 'State', 'Rating', 'Score'];
    if (leads.length === 0) return headers.join(',') + '\n';

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
