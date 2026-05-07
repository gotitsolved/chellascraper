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
 * TODO: Replace with real Google Places API implementation.
 * Endpoint: https://maps.googleapis.com/maps/api/place/textsearch/json
 */
export async function searchGooglePlaces(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _params: PlacesSearchParams
): Promise<PlacesSearchResult> {
  // Mock: returns empty leads — actual seeding is done in createJobInStore
  return { leads: [], nextPageToken: undefined };
}

/**
 * TODO: Replace with real scraping provider (e.g., Browserless, ScraperAPI, Playwright).
 */
export async function scrapeWebsite(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _url: string
): Promise<{ html: string }> {
  return {
    html: `<html><body>
      <h1>Welcome to Our Brow Studio</h1>
      <p>Contact us at hello@studio.com or call (310) 555-0100</p>
      <a href="/contact">Contact Page</a>
    </body></html>`,
  };
}

/**
 * TODO: Replace with AI or regex-based contact extractor.
 * Could use GPT-4o structured output or a specialized parser.
 */
export async function extractLeadDataFromHtml(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _html: string
): Promise<Partial<Lead>> {
  return {
    email: "hello@example.com",
    phone: "(310) 555-0100",
    instagram: "https://instagram.com/example",
    aboutExcerpt: "A premier brow and lash studio in the heart of LA.",
  };
}
