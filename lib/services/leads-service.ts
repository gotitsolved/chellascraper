import { getSqlClient } from '@/lib/db-neon';
import type { Lead, LeadListFilters, ExportRun, ExportRequestPayload } from '@/lib/types';

export const LeadsService = {
  /**
   * Add leads to the database
   */
  async addLeads(jobId: string, leads: Lead[]): Promise<void> {
    if (leads.length === 0) return;
    const sql = getSqlClient();

    try {
      for (const lead of leads) {
        await sql`
          INSERT INTO leads (
            id, job_id, place_id, business_name, contact_name, category,
            address, city, state, country, phone, email, email_verified,
            website, rating, review_count, score, icp_match, source, created_at
          ) VALUES (
            ${lead.id}, ${jobId}, ${lead.placeId || null}, ${lead.businessName},
            ${lead.contactName || null}, ${lead.category || null},
            ${lead.address || null}, ${lead.city || null}, ${lead.state || null},
            ${lead.country || 'USA'}, ${lead.phone || null}, ${lead.email || null},
            ${lead.emailVerified || false}, ${lead.website || null},
            ${lead.rating || null}, ${lead.reviewCount || 0}, ${lead.score || 0},
            ${lead.icpMatch || false}, ${lead.source || 'google_places'}, NOW()
          )
          ON CONFLICT (id) DO UPDATE SET
            email = EXCLUDED.email,
            email_verified = EXCLUDED.email_verified,
            score = EXCLUDED.score
        `;
      }
    } catch (error) {
      console.error('[v0] Error adding leads:', error);
      throw error;
    }
  },

  /**
   * List leads for a job with filtering and pagination
   */
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
    const sql = getSqlClient();
    try {
      const page = filters?.page || 1;
      const pageSize = filters?.pageSize || 50;
      const offset = (page - 1) * pageSize;

      // Build WHERE clause with filters
      const conditions = [`job_id = ${jobId}`];
      
      if (filters?.minScore) conditions.push(`score >= ${filters.minScore}`);
      if (filters?.minRating) conditions.push(`rating >= ${filters.minRating}`);
      if (filters?.hasEmail) conditions.push(`email IS NOT NULL`);
      if (filters?.hasWebsite) conditions.push(`website IS NOT NULL`);
      if (filters?.icpMatch) conditions.push(`icp_match = true`);

      const whereClause = conditions.join(' AND ');

      // Get total count for job
      const countResult = await sql`SELECT COUNT(*) as count FROM leads WHERE job_id = ${jobId}`;
      const total = countResult[0]?.count || 0;

      // Get filtered results
      const leads = await sql(`
        SELECT * FROM leads 
        WHERE ${whereClause}
        ORDER BY score DESC 
        LIMIT ${pageSize} 
        OFFSET ${offset}
      `);

      return {
        leads: leads.map((row: any) => this.mapLeadRow(row)),
        total,
        filtered: leads.length,
        page,
        pageSize,
      };
    } catch (error) {
      console.error('[v0] Error listing leads:', error);
      return { leads: [], total: 0, filtered: 0, page: 1, pageSize: 50 };
    }
  },

  /**
   * Create CSV export record
   */
  async createExport(
    jobId: string,
    payload: ExportRequestPayload
  ): Promise<ExportRun> {
    const sql = getSqlClient();
    try {
      const exportId = `export-${Date.now()}`;
      const filterParts: string[] = [];

      if (payload.minScore) filterParts.push(`Score >= ${payload.minScore}`);
      if (payload.minRating) filterParts.push(`Rating >= ${payload.minRating}`);
      if (payload.mustHaveEmail) filterParts.push('Has email');
      if (payload.mustHaveWebsite) filterParts.push('Has website');

      const filterSummary = filterParts.length > 0 ? filterParts.join(', ') : 'No filters';

      // Get filtered leads count
      const conditions = [`job_id = ${jobId}`];
      if (payload.minScore) conditions.push(`score >= ${payload.minScore}`);
      if (payload.minRating) conditions.push(`rating >= ${payload.minRating}`);
      if (payload.mustHaveEmail) conditions.push(`email IS NOT NULL`);
      if (payload.mustHaveWebsite) conditions.push(`website IS NOT NULL`);

      const countResult = await sql(`
        SELECT COUNT(*) as count FROM leads 
        WHERE ${conditions.join(' AND ')}
      `);

      const rowCount = countResult[0]?.count || 0;

      // Insert export record
      await sql`
        INSERT INTO exports (id, job_id, format, filter_summary, row_count, status, created_at)
        VALUES (${exportId}, ${jobId}, 'csv', ${filterSummary}, ${rowCount}, 'ready', NOW())
      `;

      return {
        id: exportId,
        jobId,
        createdAt: new Date().toISOString(),
        format: 'csv',
        filterSummary,
        rowCount,
        status: 'ready',
        downloadUrl: `/api/jobs/${jobId}/export?${new URLSearchParams(
          Object.entries(payload)
            .filter(([, v]) => v !== undefined)
            .map(([k, v]) => [k, String(v)])
        ).toString()}`,
      };
    } catch (error) {
      console.error('[v0] Error creating export:', error);
      throw error;
    }
  },

  /**
   * Get leads for CSV download with filters applied
   */
  async getExportLeads(
    jobId: string,
    payload: ExportRequestPayload
  ): Promise<Lead[]> {
    const sql = getSqlClient();
    try {
      const conditions = [`job_id = ${jobId}`];
      
      if (payload.minScore) conditions.push(`score >= ${payload.minScore}`);
      if (payload.minRating) conditions.push(`rating >= ${payload.minRating}`);
      if (payload.mustHaveEmail) conditions.push(`email IS NOT NULL`);
      if (payload.mustHaveWebsite) conditions.push(`website IS NOT NULL`);

      const leads = await sql(`
        SELECT * FROM leads 
        WHERE ${conditions.join(' AND ')}
        ORDER BY score DESC
      `);

      return leads.map((row: any) => this.mapLeadRow(row));
    } catch (error) {
      console.error('[v0] Error getting export leads:', error);
      return [];
    }
  },

  /**
   * Generate CSV content from leads
   */
  generateCsv(leads: Lead[]): string {
    const headers = [
      'Business Name',
      'Contact Name',
      'Email',
      'Phone',
      'Website',
      'Address',
      'City',
      'State',
      'Category',
      'Rating',
      'Review Count',
      'Lead Score',
    ];

    const rows = leads.map((lead) => [
      lead.businessName || '',
      lead.contactName || '',
      lead.email || '',
      lead.phone || '',
      lead.website || '',
      lead.address || '',
      lead.city || '',
      lead.state || '',
      lead.category || '',
      lead.rating?.toFixed(1) || '',
      lead.reviewCount?.toString() || '0',
      lead.score?.toString() || '0',
    ]);

    const escape = (val: string) => {
      if (val.includes(',') || val.includes('"') || val.includes('\n')) {
        return `"${val.replace(/"/g, '""')}"`;
      }
      return val;
    };

    const csvRows = [
      headers.join(','),
      ...rows.map((row) => row.map(escape).join(',')),
    ];

    return csvRows.join('\n');
  },

  /**
   * Map database row to Lead object
   */
  mapLeadRow(row: any): Lead {
    return {
      id: row.id,
      jobId: row.job_id,
      placeId: row.place_id,
      businessName: row.business_name,
      contactName: row.contact_name,
      category: row.category,
      address: row.address,
      city: row.city,
      state: row.state,
      country: row.country,
      phone: row.phone,
      email: row.email,
      emailVerified: row.email_verified,
      website: row.website,
      rating: row.rating ? parseFloat(row.rating) : undefined,
      reviewCount: row.review_count,
      score: row.score,
      icpMatch: row.icp_match,
      source: row.source,
      createdAt: row.created_at,
    };
  },
};
