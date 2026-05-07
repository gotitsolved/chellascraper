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
  name?: string;
  businessName: string;
  contactName?: string;
  category?: string;
  rating?: number | null;
  reviewCount?: number | null;
  address?: string;
  city?: string;
  state?: string;
  region?: string;
  country?: string;
  lat?: number | null;
  lng?: number | null;
  googleUrl?: string;
  website?: string;
  websiteUrl?: string;
  
  // Email-first fields
  email?: string;
  primaryEmail?: string;
  emails?: string[];
  emailCount?: number;
  hasEmail?: boolean;
  emailVerified?: boolean;
  
  // Social media
  facebook?: string;
  instagram?: string;
  tiktok?: string;
  linkedin?: string;
  
  // Beauty & ICP fields
  icpMatch?: boolean;
  icpSegments?: string[];
  beautyRelevanceScore?: number;
  sellsBeautyProducts?: boolean;
  offersBeautyServices?: boolean;
  healthcareBeautyOverlap?: boolean;
  beautySignals?: string[];
  
  // Contact & enrichment
  phone?: string;
  contactPageUrl?: string;
  enrichedDescription?: string;
  aboutExcerpt?: string;
  servicesTags?: string[];
  icpExplanation?: string;
  
  // Scoring & source
  score?: number;
  leadScore?: number;
  source?: string;
  jurisdiction?: string;
  
  // Metadata
  crawledAt?: string;
  createdAt?: string;
  updatedAt?: string;
  
  // Email verification fields
  verificationStatus?: "unverified" | "valid" | "invalid" | "risky" | "unknown";
  verificationReason?: string;
  verificationConfidence?: number;
  verifiedAt?: string;
  isDisposable?: boolean;
  isRoleBased?: boolean;
  hasMxRecords?: boolean;
  smtpCheckAttempted?: boolean;
  smtpCheckResult?: "passed" | "failed" | "unknown";
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
  beautyServicesOnly?: boolean;
  beautyRetailOnly?: boolean;
  medSpaAestheticsOnly?: boolean;
  healthcareBeautyOnly?: boolean;
  socialsPresent?: boolean;
  minBeautyScore?: number;
  icpSegments?: string[];
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
  beautyServicesOnly?: boolean;
  beautyRetailOnly?: boolean;
  medSpaAestheticsOnly?: boolean;
  healthcareBeautyOnly?: boolean;
  minBeautyScore?: number;
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

// Email Verification Types
export interface EmailVerificationResult {
  email: string;
  status: "valid" | "invalid" | "risky" | "unknown";
  reason: string;
  confidence: number;
  isDisposable: boolean;
  isRoleBased: boolean;
  hasMxRecords: boolean;
  smtpCheckAttempted: boolean;
  smtpCheckResult: "passed" | "failed" | "unknown";
  verifiedAt: string;
}

export interface EmailVerifierAdapter {
  name: string;
  verifyEmail(email: string): Promise<EmailVerificationResult>;
  verifyEmails?(emails: string[]): Promise<EmailVerificationResult[]>;
}
