import type { Lead, JobQuery } from "./types";
import { CustomWebsiteScraper } from "./adapters/custom-website-scraper";
import { EmailVerificationAdapter } from "./adapters/email-verification-adapter";

export interface PlacesSearchParams {
  query: JobQuery;
  pageToken?: string;
}

export interface PlacesSearchResult {
  leads: Lead[];
  nextPageToken?: string;
}

/**
 * Search Google Places using the Places API.
 * Uses the OAuth credentials from Google Cloud console.
 * Endpoint: https://maps.googleapis.com/maps/api/place/textsearch/json
 */
export async function searchGooglePlaces(
  params: PlacesSearchParams
): Promise<PlacesSearchResult> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    console.warn("[v0] GOOGLE_PLACES_API_KEY not configured, using mock data");
    return { leads: [], nextPageToken: undefined };
  }

  try {
    const { query } = params;
    const searchQuery = `${query.industry} ${query.city} ${query.state}`.trim();

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(searchQuery)}&key=${apiKey}`
    );

    if (!response.ok) {
      throw new Error(`Google Places API error: ${response.statusText}`);
    }

    const data = (await response.json()) as { results?: Array<{ place_id: string; name: string; formatted_address: string }> };
    const leads: Lead[] = (data.results || []).map((place) => ({
      id: place.place_id,
      businessName: place.name,
      address: place.formatted_address,
      city: query.city,
      state: query.state,
      email: "",
      phone: "",
      instagram: "",
      website: "",
      aboutExcerpt: "",
      score: 0,
      verificationStatus: "pending",
      lastVerifiedAt: null,
      createdAt: new Date(),
    }));

    return { leads, nextPageToken: undefined };
  } catch (error) {
    console.error("[v0] Google Places API error:", error);
    return { leads: [], nextPageToken: undefined };
  }
}

/**
 * Scrape website using custom website scraper adapter.
 */
export async function scrapeWebsite(url: string): Promise<{ html: string }> {
  const scraper = new CustomWebsiteScraper();
  return scraper.scrapeWebsite(url);
}

/**
 * Extract lead data from HTML using AI (via Vercel AI Gateway) or regex.
 */
export async function extractLeadDataFromHtml(
  html: string
): Promise<Partial<Lead>> {
  const emailVerifier = new EmailVerificationAdapter();
  return emailVerifier.extractContactInfo(html);
}
