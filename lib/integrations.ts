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
 * Search Google Places using the Places API v1 (New).
 * Uses POST with FieldMask for phone, website, address in one round-trip.
 * Paginates up to 3 pages (60 results max).
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

    const fieldMask = [
      "places.id",
      "places.displayName",
      "places.formattedAddress",
      "places.addressComponents",
      "places.nationalPhoneNumber",
      "places.internationalPhoneNumber",
      "places.websiteUri",
      "places.rating",
      "places.userRatingCount",
      "places.businessStatus",
      "places.types",
      "places.primaryType",
      "nextPageToken",
    ].join(",");

    const results: PlaceV1[] = [];
    let pageToken: string | undefined = params.pageToken;
    let guard = 0;

    do {
      const response = await fetch(
        "https://places.googleapis.com/v1/places:searchText",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": apiKey,
            "X-Goog-FieldMask": fieldMask,
          },
          body: JSON.stringify({
            textQuery: searchQuery,
            pageSize: 20,
            ...(pageToken ? { pageToken } : {}),
          }),
        }
      );

      if (!response.ok) {
        const body = await response.text();
        console.error("[v0] Places API v1 error:", response.status, body);
        break;
      }

      const data = (await response.json()) as {
        places?: PlaceV1[];
        nextPageToken?: string;
      };
      results.push(...(data.places ?? []));
      pageToken = data.nextPageToken;

      if (pageToken) await new Promise((r) => setTimeout(r, 2000));
      guard++;
    } while (pageToken && guard < 3);

    const leads: Lead[] = results
      .filter((p) => p.businessStatus === "OPERATIONAL")
      .map((p) => {
        const city = componentOf(p.addressComponents, ["locality", "postal_town"]);
        const region = componentShortOf(p.addressComponents, [
          "administrative_area_level_1",
        ]);
        const country = componentShortOf(p.addressComponents, ["country"]) ?? "US";

        return {
          id: `lead-${p.id}`,
          jobId: "",
          placeId: p.id,
          name: p.displayName?.text ?? "Unknown",
          category: query.businessTypes[0] || "business",
          address: p.formattedAddress,
          city: city ?? query.locationText.split(",")[0],
          country,
          region,
          phone: p.nationalPhoneNumber || p.internationalPhoneNumber,
          website: p.websiteUri,
          rating: p.rating,
          ratingCount: p.userRatingCount,
          leadScore: 50 + Math.random() * 30,
          icpMatch: false,
          crawledAt: new Date().toISOString(),
        };
      });

    return { leads, nextPageToken: pageToken };
  } catch (error) {
    console.error("[v0] Google Places API error:", error);
    return { leads: [], nextPageToken: undefined };
  }
}

interface AddressComponent {
  longText?: string;
  shortText?: string;
  types?: string[];
}

interface PlaceV1 {
  id?: string;
  displayName?: { text?: string; languageCode?: string };
  formattedAddress?: string;
  addressComponents?: AddressComponent[];
  nationalPhoneNumber?: string;
  internationalPhoneNumber?: string;
  websiteUri?: string;
  rating?: number;
  userRatingCount?: number;
  businessStatus?: string;
  types?: string[];
  primaryType?: string;
}

function componentOf(
  comps: AddressComponent[] | undefined,
  wantedTypes: string[]
) {
  for (const c of comps ?? []) {
    if (c.types?.some((t) => wantedTypes.includes(t))) return c.longText;
  }
  return undefined;
}

function componentShortOf(
  comps: AddressComponent[] | undefined,
  wantedTypes: string[]
) {
  for (const c of comps ?? []) {
    if (c.types?.some((t) => wantedTypes.includes(t)))
      return c.shortText ?? c.longText;
  }
  return undefined;
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
