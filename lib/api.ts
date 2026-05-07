import type {
  Job,
  Lead,
  ExportRun,
  Settings,
  LeadListFilters,
  ExportRequestPayload,
} from "./types";
import {
  jobsStore,
  leadsStore,
  exportsStore,
  settingsStore,
  updateSettings as _updateSettings,
  createJobInStore,
  getActivityForJob,
} from "./mock-data";
import type { ActivityEvent } from "./types";

export async function listJobs(): Promise<Job[]> {
  return Array.from(jobsStore.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function getJob(jobId: string): Promise<Job | null> {
  return jobsStore.get(jobId) ?? null;
}

export async function listLeads(
  jobId: string,
  filters: LeadListFilters = {}
): Promise<{ leads: Lead[]; total: number }> {
  const all = leadsStore.get(jobId) ?? [];
  let filtered = all;

  if (filters.minScore !== undefined) {
    filtered = filtered.filter((l) => l.leadScore >= (filters.minScore ?? 0));
  }
  if (filters.minRating !== undefined) {
    filtered = filtered.filter(
      (l) => (l.rating ?? 0) >= (filters.minRating ?? 0)
    );
  }
  if (filters.hasEmail) {
    filtered = filtered.filter((l) => !!l.email);
  }
  if (filters.hasWebsite) {
    filtered = filtered.filter((l) => !!l.websiteUrl);
  }
  if (filters.icpMatch !== undefined) {
    filtered = filtered.filter((l) => l.icpMatch === filters.icpMatch);
  }
  if (filters.city) {
    filtered = filtered.filter((l) =>
      l.city?.toLowerCase().includes(filters.city!.toLowerCase())
    );
  }
  if (filters.country) {
    filtered = filtered.filter((l) =>
      l.country?.toLowerCase() === filters.country!.toLowerCase()
    );
  }

  const total = filtered.length;
  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? 50;
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  return { leads: paginated, total };
}

export async function listExports(jobId: string): Promise<ExportRun[]> {
  return exportsStore.get(jobId) ?? [];
}

export async function createJob(input: {
  name: string;
  query: Job["query"];
}): Promise<Job> {
  return createJobInStore(input);
}

export async function createExport(
  jobId: string,
  payload: ExportRequestPayload
): Promise<ExportRun> {
  const { leads } = await listLeads(jobId, {
    minScore: payload.minScore,
    minRating: payload.minRating,
    hasEmail: payload.mustHaveEmail,
    hasWebsite: payload.mustHaveWebsite,
    icpMatch: payload.icpMatchOnly ? true : undefined,
    city: payload.city,
    country: payload.country,
    pageSize: 10000,
  });

  const exportRun: ExportRun = {
    id: `exp-${Date.now()}`,
    jobId,
    createdAt: new Date().toISOString(),
    createdBy: "admin",
    format: "csv",
    filterSummary: buildFilterSummary(payload),
    rowCount: leads.length,
    status: "ready",
    downloadUrl: `/api/jobs/${jobId}/export?${new URLSearchParams(
      Object.entries(payload)
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => [k, String(v)])
    ).toString()}`,
  };

  const existing = exportsStore.get(jobId) ?? [];
  exportsStore.set(jobId, [exportRun, ...existing]);

  return exportRun;
}

export async function getSettings(): Promise<Settings> {
  return settingsStore;
}

export async function updateSettings(
  partial: Partial<Settings>
): Promise<Settings> {
  return _updateSettings(partial);
}

export async function getActivity(jobId: string): Promise<ActivityEvent[]> {
  return getActivityForJob(jobId);
}

function buildFilterSummary(payload: ExportRequestPayload): string {
  const parts: string[] = [];
  if (payload.minScore) parts.push(`Score ≥ ${payload.minScore}`);
  if (payload.minRating) parts.push(`Rating ≥ ${payload.minRating}`);
  if (payload.mustHaveEmail) parts.push("Has email");
  if (payload.mustHaveWebsite) parts.push("Has website");
  if (payload.icpMatchOnly) parts.push("ICP match only");
  if (payload.city) parts.push(`City: ${payload.city}`);
  if (payload.country) parts.push(`Country: ${payload.country}`);
  return parts.length ? parts.join(", ") : "All leads";
}

export function generateCsv(leads: Lead[]): string {
  const headers = [
    "Name",
    "Category",
    "City",
    "Region",
    "Country",
    "Rating",
    "Review Count",
    "Website",
    "Email",
    "Phone",
    "Facebook",
    "Instagram",
    "TikTok",
    "Lead Score",
    "ICP Match",
    "ICP Explanation",
  ];

  const escape = (val: string | number | boolean | null | undefined) => {
    if (val === undefined || val === null) return "";
    const str = String(val);
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const rows = leads.map((l) =>
    [
      l.name,
      l.category,
      l.city,
      l.region,
      l.country,
      l.rating,
      l.reviewCount,
      l.websiteUrl,
      l.email,
      l.phone,
      l.facebook,
      l.instagram,
      l.tiktok,
      l.leadScore,
      l.icpMatch ? "Yes" : "No",
      l.icpExplanation,
    ]
      .map(escape)
      .join(",")
  );

  return [headers.join(","), ...rows].join("\n");
}
