export type JobStatus = "queued" | "running" | "completed" | "failed";

export interface JobQueryFilters {
  hasWebsite?: boolean;
  minRating?: number;
  excludeChains?: boolean;
  countriesInclude?: string[];
  countriesExclude?: string[];
}

export interface JobQuery {
  businessTypes: string[];
  locationText: string;
  radiusKm: number;
  filters: JobQueryFilters;
}

export interface JobCounters {
  placesDiscovered: number;
  websitesScraped: number;
  leadsEnriched: number;
  leadsTotal: number;
}

export interface Job {
  id: string;
  name: string;
  createdAt: string;
  createdBy?: string;
  status: JobStatus;
  query: JobQuery;
  counters: JobCounters;
  lastRunAt?: string;
  errorMessage?: string | null;
}

export interface Lead {
  id: string;
  jobId: string;
  placeId?: string;
  name: string;
  contactName?: string;
  category: string;
  rating?: number | null;
  reviewCount?: number | null;
  address?: string;
  city?: string;
  region?: string;
  country?: string;
  lat?: number | null;
  lng?: number | null;
  googleUrl?: string;
  websiteUrl?: string;
  email?: string;
  phone?: string;
  facebook?: string;
  instagram?: string;
  tiktok?: string;
  contactPageUrl?: string;
  aboutExcerpt?: string;
  servicesTags?: string[];
  leadScore: number;
  icpMatch: boolean;
  icpExplanation?: string;
  jurisdiction?: string;
  crawledAt?: string;
}

export type ExportFormat = "csv";
export type ExportStatus = "pending" | "ready" | "failed";

export interface ExportRun {
  id: string;
  jobId: string;
  createdAt: string;
  createdBy?: string;
  format: ExportFormat;
  filterSummary: string;
  rowCount: number;
  status: ExportStatus;
  downloadUrl?: string;
}

export interface ScoringWeights {
  rating: number;
  reviewCount: number;
  distance: number;
  emailPresent: number;
  phonePresent: number;
  keywordMatch: number;
}

export interface ScoringRule {
  id: string;
  name: string;
  weights: ScoringWeights;
}

export interface Settings {
  googlePlacesApiKey?: string;
  scraperApiKey?: string;
  aiApiKey?: string;
  scrapeMaxPages: number;
  scrapeDepth: "home-only" | "shallow" | "deep";
  scoringRule: ScoringRule;
}

export interface LeadListFilters {
  minScore?: number;
  minRating?: number;
  hasEmail?: boolean;
  hasWebsite?: boolean;
  icpMatch?: boolean;
  city?: string;
  country?: string;
  page?: number;
  pageSize?: number;
}

export interface ExportRequestPayload {
  minScore?: number;
  minRating?: number;
  mustHaveEmail?: boolean;
  mustHaveWebsite?: boolean;
  icpMatchOnly?: boolean;
  country?: string;
  city?: string;
}

export interface ActivityEvent {
  id: string;
  jobId: string;
  timestamp: string;
  type: "info" | "success" | "warning" | "error";
  stage: "places" | "scraping" | "enrichment" | "scoring" | "system";
  message: string;
  detail?: string;
}
