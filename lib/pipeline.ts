/**
 * Lead generation pipeline stub.
 *
 * TODO: Orchestrate the full pipeline:
 * 1. searchGooglePlaces() → gather raw place data
 * 2. scrapeWebsite() → fetch HTML for each business with a website
 * 3. extractLeadDataFromHtml() → extract emails, socials, about text
 * 4. Score each lead against the active ScoringRule
 * 5. Persist to database, update job counters & status
 *
 * For now, this is mocked by createJobInStore() in mock-data.ts.
 */

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function runLeadGenPipeline(_jobId: string): Promise<void> {
  // TODO: implement full orchestration
  console.log(
    "[pipeline] runLeadGenPipeline called — currently mocked in mock-data.ts"
  );
}
