import type { Lead, JobQuery } from "./types";

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
 * Requires GOOGLE_PLACES_API_KEY environment variable.
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
    const businessTypesStr = query.businessTypes.join(", ");
    const searchQuery = `${businessTypesStr} in ${query.locationText}`.trim();

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(searchQuery)}&key=${apiKey}`
    );

    if (!response.ok) {
      throw new Error(`Google Places API error: ${response.statusText}`);
    }

    const data = (await response.json()) as {
      results?: Array<{ place_id: string; name: string; formatted_address: string }>;
    };
    const leads: Lead[] = (data.results || []).map((place) => ({
      id: `lead-${place.place_id}`,
      jobId: "",
      placeId: place.place_id,
      name: place.name,
      category: query.businessTypes[0] || "business",
      address: place.formatted_address,
      city: query.locationText.split(",")[0],
      country: "US",
      leadScore: 50 + Math.random() * 30,
      icpMatch: false,
      crawledAt: new Date().toISOString(),
    }));

    return { leads, nextPageToken: undefined };
  } catch (error) {
    console.error("[v0] Google Places API error:", error);
    return { leads: [], nextPageToken: undefined };
  }
}

/**
 * Scrape website to extract contact information.
 * Uses internal custom scraper (not a third-party API).
 */
export async function scrapeWebsite(url: string): Promise<{ html: string }> {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    if (!response.ok) {
      return {
        html: `<html><body><!-- Error fetching ${url} --></body></html>`,
      };
    }

    const html = await response.text();
    return { html };
  } catch (error) {
    console.warn(`[v0] Could not scrape ${url}:`, error);
    return {
      html: `<html><body><!-- Error fetching ${url} --></body></html>`,
    };
  }
}

/**
 * Extract contact information from HTML using regex patterns.
 */
export async function extractLeadDataFromHtml(
  html: string
): Promise<Partial<Lead>> {
  const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi;
  const phoneRegex =
    /(\+?1?\s*\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4})/gi;
  const instagramRegex =
    /instagram\.com\/([a-zA-Z0-9_\.]+)/gi;
  const facebookRegex =
    /facebook\.com\/([a-zA-Z0-9_\.]+)/gi;

  const emails = [...new Set(html.match(emailRegex) || [])];
  const phones = [...new Set(html.match(phoneRegex) || [])];
  const instagramMatches = instagramRegex.exec(html);
  const facebookMatches = facebookRegex.exec(html);

  return {
    email: emails[0],
    phone: phones[0],
    instagram: instagramMatches
      ? `https://instagram.com/${instagramMatches[1]}`
      : undefined,
    facebook: facebookMatches
      ? `https://facebook.com/${facebookMatches[1]}`
      : undefined,
  };
}
