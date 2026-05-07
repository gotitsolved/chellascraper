/**
 * Scraper Adapter Interface
 * 
 * This defines the contract for website scraping adapters.
 * Our internal scraper (based on ritac-property-scraper) will implement this interface.
 */

export interface ScrapeResult {
  websiteUrl: string
  emails: string[]
  phones: string[]
  socialLinks: string[]
  contactPageUrl?: string
  aboutText?: string
  rawTextSnippet?: string
  status: "success" | "partial" | "failed"
  error?: string
  scrapedAt: string
  pagesScraped: string[]
}

export interface ScraperConfig {
  depth: "homepage-only" | "homepage-contact" | "homepage-contact-about"
  timeout?: number
  maxPages?: number
}

export interface ScraperAdapter {
  name: string
  scrapeWebsite(url: string, config?: ScraperConfig): Promise<ScrapeResult>
  isAvailable(): Promise<boolean>
}

/**
 * Default pages to scrape based on depth setting
 */
export const SCRAPE_PATHS: Record<ScraperConfig["depth"], string[]> = {
  "homepage-only": ["/"],
  "homepage-contact": ["/", "/contact", "/contact-us", "/pages/contact"],
  "homepage-contact-about": ["/", "/contact", "/contact-us", "/pages/contact", "/about", "/about-us", "/pages/about"],
}
