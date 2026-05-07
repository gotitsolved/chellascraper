import type {
  Job,
  Lead,
  ExportRun,
  Settings,
  ActivityEvent,
} from "./types";

// ── In-memory store ──────────────────────────────────────────────────────────
export const jobsStore: Map<string, Job> = new Map();
export const leadsStore: Map<string, Lead[]> = new Map();
export const exportsStore: Map<string, ExportRun[]> = new Map();

// ── Settings ─────────────────────────────────────────────────────────────────
export let settingsStore: Settings = {
  googlePlacesApiKey: "",
  scraperApiKey: "",
  aiApiKey: "",
  scrapeMaxPages: 5,
  scrapeDepth: "shallow",
  scoringRule: {
    id: "default",
    name: "Default ICP Rule",
    weights: {
      rating: 25,
      reviewCount: 15,
      distance: 10,
      emailPresent: 25,
      phonePresent: 15,
      keywordMatch: 10,
    },
  },
};

export function updateSettings(partial: Partial<Settings>): Settings {
  settingsStore = { ...settingsStore, ...partial };
  return settingsStore;
}

// ── Seed data ─────────────────────────────────────────────────────────────────
const BEAUTY_NAMES = [
  "Arch & Soul Brow Bar",
  "Luxe Lash Lounge",
  "The Brow Lab",
  "Petal Beauty Studio",
  "Bella Brows",
  "The Wax Room",
  "Glam Collective",
  "Thread & Tint Studio",
  "Sunkissed Beauty Bar",
  "Brow Obsession",
  "Golden Hour Aesthetics",
  "Studio Brow + Skin",
  "The Beauty Edit",
  "Velvet Touch Salon",
  "Brow Society",
  "Luxe Beauty Lounge",
  "Crown & Glow",
  "Silhouette Beauty",
  "The Lash & Brow Co",
  "Pure Brow Studio",
  "Envy Lash Bar",
  "Flawless Brows LA",
  "The Artisan Brow",
  "Precision Beauty",
  "Pink Brow Studio",
  "Brow Couture",
  "Radiance Beauty Bar",
  "The Spa at Beverly",
  "Chic Beauty Co.",
  "Nuanced Beauty",
  "Bravo Brows",
  "Gloss Studio",
  "Tinted Beauty Bar",
  "Halo Beauty Lounge",
  "The Brow Artist",
];

const CITIES = [
  { city: "Los Angeles", region: "CA", country: "US", lat: 34.0522, lng: -118.2437 },
  { city: "Beverly Hills", region: "CA", country: "US", lat: 34.0736, lng: -118.4004 },
  { city: "Santa Monica", region: "CA", country: "US", lat: 34.0195, lng: -118.4912 },
  { city: "West Hollywood", region: "CA", country: "US", lat: 34.0900, lng: -118.3617 },
  { city: "Culver City", region: "CA", country: "US", lat: 34.0212, lng: -118.3965 },
  { city: "Pasadena", region: "CA", country: "US", lat: 34.1478, lng: -118.1445 },
  { city: "Glendale", region: "CA", country: "US", lat: 34.1425, lng: -118.2551 },
  { city: "Manhattan Beach", region: "CA", country: "US", lat: 33.8847, lng: -118.4109 },
];

const CATEGORIES = [
  "Brow Bar",
  "Lash Studio",
  "Beauty Salon",
  "Waxing Studio",
  "Threading Studio",
  "Day Spa",
  "Skincare Studio",
];

const SERVICES = [
  ["Microblading", "Brow Lamination", "Tinting"],
  ["Lash Extensions", "Lash Lifts", "Brow Tinting"],
  ["Waxing", "Threading", "Tinting"],
  ["Facials", "Brow Shaping", "Lash Lifts"],
  ["Full Brow Services", "Lamination", "Henna"],
];

const CONTACT_NAMES = [
  "Jessica Rivera",
  "Aisha Thompson",
  "Maria Gonzalez",
  "Priya Patel",
  "Sarah Kim",
  "Natalie Chen",
  "Olivia Martinez",
  "Jasmine Williams",
  "Chloe Anderson",
  "Diana Flores",
  "Tara Singh",
  "Bianca Torres",
  "Elena Novak",
  "Layla Hassan",
  "Megan Park",
  "Isabelle Dubois",
  "Rachel Okonkwo",
  "Vanessa Cruz",
  "Simone Adeyemi",
  "Yuki Tanaka",
];

const ABOUT_EXCERPTS = [
  "We are a boutique brow studio dedicated to enhancing your natural beauty using the latest techniques.",
  "Our expert team of beauty professionals specializes in precision brow artistry and lash transformations.",
  "Located in the heart of LA, we offer premium brow and lash services tailored to your unique features.",
  "We believe every face tells a story — we're here to frame it perfectly with artful brow design.",
  "From microblading to lamination, our certified artists deliver stunning results in a relaxing environment.",
];

function rand(min: number, max: number) {
  return Math.random() * (max - min) + min;
}
function randInt(min: number, max: number) {
  return Math.floor(rand(min, max + 1));
}
function pick<T>(arr: T[]): T {
  return arr[randInt(0, arr.length - 1)];
}

function generateLeadsForJob(jobId: string, count: number): Lead[] {
  const leads: Lead[] = [];
  const usedNames = new Set<string>();

  for (let i = 0; i < count; i++) {
    let name = pick(BEAUTY_NAMES);
    let attempts = 0;
    while (usedNames.has(name) && attempts < 20) {
      name = pick(BEAUTY_NAMES) + " " + pick(["& Co.", "Studio", "Boutique", ""]).trim();
      attempts++;
    }
    usedNames.add(name);

    const location = pick(CITIES);
    const category = pick(CATEGORIES);
    const rating = Math.round(rand(3.5, 5.0) * 10) / 10;
    const reviewCount = randInt(12, 480);
    const hasEmail = Math.random() > 0.35;
    const hasWebsite = Math.random() > 0.2;
    const hasPhone = Math.random() > 0.15;
    const hasInsta = Math.random() > 0.4;
    const hasFb = Math.random() > 0.5;
    const hasTiktok = Math.random() > 0.65;

    const slug = name.toLowerCase().replace(/[^a-z0-9]/g, "");
    const icpMatch = hasEmail && rating >= 4.0 && reviewCount >= 30;

    // Compute lead score deterministically based on attributes
    let score = 0;
    score += Math.round((rating / 5) * 25);
    score += Math.min(Math.round((reviewCount / 200) * 15), 15);
    score += hasEmail ? 25 : 0;
    score += hasPhone ? 15 : 0;
    score += icpMatch ? 10 : 0;
    score += hasTiktok || hasInsta ? 10 : 0;
    score = Math.min(score, 100);

    const hasContactName = Math.random() > 0.3;

    leads.push({
      id: `lead-${jobId}-${i}`,
      jobId,
      placeId: `ChIJ${Math.random().toString(36).slice(2, 12).toUpperCase()}`,
      name,
      contactName: hasContactName ? pick(CONTACT_NAMES) : undefined,
      category,
      rating,
      reviewCount,
      address: `${randInt(100, 9999)} ${pick(["Sunset Blvd", "Wilshire Blvd", "Santa Monica Blvd", "Melrose Ave", "La Brea Ave"])}`,
      city: location.city,
      region: location.region,
      country: location.country,
      lat: location.lat + rand(-0.05, 0.05),
      lng: location.lng + rand(-0.05, 0.05),
      googleUrl: `https://maps.google.com/?cid=${randInt(1e12, 9e12)}`,
      websiteUrl: hasWebsite ? `https://www.${slug}.com` : undefined,
      email: hasEmail ? `hello@${slug}.com` : undefined,
      phone: hasPhone ? `(${randInt(200, 999)}) ${randInt(200, 999)}-${randInt(1000, 9999)}` : undefined,
      facebook: hasFb ? `https://facebook.com/${slug}` : undefined,
      instagram: hasInsta ? `https://instagram.com/${slug}` : undefined,
      tiktok: hasTiktok ? `https://tiktok.com/@${slug}` : undefined,
      contactPageUrl: hasWebsite ? `https://www.${slug}.com/contact` : undefined,
      aboutExcerpt: pick(ABOUT_EXCERPTS),
      servicesTags: pick(SERVICES),
      leadScore: score,
      icpMatch,
      icpExplanation: icpMatch
        ? `High rating (${rating}★), ${reviewCount} reviews, verified email, matches brow/lash ICP keywords.`
        : `Partial match — missing ${!hasEmail ? "email" : ""}${rating < 4 ? " low rating" : ""}${reviewCount < 30 ? " low reviews" : ""}.`,
      jurisdiction: location.country,
      crawledAt: new Date(Date.now() - randInt(0, 86400000)).toISOString(),
    });
  }
  return leads;
}

function generateActivityForJob(jobId: string): ActivityEvent[] {
  const base = Date.now() - 1800000;
  return [
    {
      id: `act-${jobId}-1`,
      jobId,
      timestamp: new Date(base).toISOString(),
      type: "info",
      stage: "system",
      message: "Job queued for processing.",
    },
    {
      id: `act-${jobId}-2`,
      jobId,
      timestamp: new Date(base + 5000).toISOString(),
      type: "info",
      stage: "places",
      message: "Google Places search started.",
      detail: "Querying: brow bar, salon — Los Angeles, CA — 25km radius",
    },
    {
      id: `act-${jobId}-3`,
      jobId,
      timestamp: new Date(base + 18000).toISOString(),
      type: "success",
      stage: "places",
      message: "Page 1 results retrieved.",
      detail: "20 places found",
    },
    {
      id: `act-${jobId}-4`,
      jobId,
      timestamp: new Date(base + 32000).toISOString(),
      type: "success",
      stage: "places",
      message: "Page 2 results retrieved.",
      detail: "15 additional places found",
    },
    {
      id: `act-${jobId}-5`,
      jobId,
      timestamp: new Date(base + 45000).toISOString(),
      type: "info",
      stage: "scraping",
      message: "Website scraping started.",
      detail: "Targeting 28 businesses with websites",
    },
    {
      id: `act-${jobId}-6`,
      jobId,
      timestamp: new Date(base + 120000).toISOString(),
      type: "warning",
      stage: "scraping",
      message: "3 domains returned 403 Forbidden.",
      detail: "Skipping: luxelashlounge.com, browsociety.com, thebeautyedit.com",
    },
    {
      id: `act-${jobId}-7`,
      jobId,
      timestamp: new Date(base + 240000).toISOString(),
      type: "success",
      stage: "scraping",
      message: "Website scraping complete.",
      detail: "25 of 28 sites scraped successfully",
    },
    {
      id: `act-${jobId}-8`,
      jobId,
      timestamp: new Date(base + 260000).toISOString(),
      type: "info",
      stage: "enrichment",
      message: "AI enrichment & email extraction started.",
    },
    {
      id: `act-${jobId}-9`,
      jobId,
      timestamp: new Date(base + 420000).toISOString(),
      type: "success",
      stage: "enrichment",
      message: "Email extraction complete.",
      detail: "22 emails found across 25 scraped sites",
    },
    {
      id: `act-${jobId}-10`,
      jobId,
      timestamp: new Date(base + 440000).toISOString(),
      type: "info",
      stage: "scoring",
      message: "Scoring leads against Chella ICP.",
    },
    {
      id: `act-${jobId}-11`,
      jobId,
      timestamp: new Date(base + 480000).toISOString(),
      type: "success",
      stage: "scoring",
      message: "Scoring complete. Job finished.",
      detail: "35 total leads, 22 ICP matches",
    },
  ];
}

// ── Seed two demo jobs ────────────────────────────────────────────────────────
function seedDemoJobs() {
  const job1: Job = {
    id: "job-demo-1",
    name: "LA Brow Bars — Q2 2025",
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    createdBy: "admin",
    status: "completed",
    query: {
      businessTypes: ["brow bar", "lash studio"],
      locationText: "Los Angeles, CA",
      radiusKm: 25,
      filters: { hasWebsite: true, minRating: 3.5, excludeChains: true },
    },
    counters: {
      placesDiscovered: 35,
      websitesScraped: 28,
      leadsEnriched: 35,
      leadsTotal: 35,
    },
    lastRunAt: new Date(Date.now() - 3 * 86400000 + 600000).toISOString(),
  };

  const job2: Job = {
    id: "job-demo-2",
    name: "Beverly Hills Salons",
    createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    createdBy: "admin",
    status: "completed",
    query: {
      businessTypes: ["salon", "beauty studio"],
      locationText: "Beverly Hills, CA",
      radiusKm: 10,
      filters: { hasWebsite: true, minRating: 4.0, excludeChains: false },
    },
    counters: {
      placesDiscovered: 20,
      websitesScraped: 18,
      leadsEnriched: 20,
      leadsTotal: 20,
    },
    lastRunAt: new Date(Date.now() - 86400000 + 600000).toISOString(),
  };

  jobsStore.set(job1.id, job1);
  jobsStore.set(job2.id, job2);

  const leads1 = generateLeadsForJob(job1.id, 35);
  const leads2 = generateLeadsForJob(job2.id, 20);
  leadsStore.set(job1.id, leads1);
  leadsStore.set(job2.id, leads2);

  const export1: ExportRun = {
    id: "exp-demo-1",
    jobId: job1.id,
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    createdBy: "admin",
    format: "csv",
    filterSummary: "All leads, min score 0",
    rowCount: 35,
    status: "ready",
    downloadUrl: `/api/jobs/${job1.id}/export/download?id=exp-demo-1`,
  };
  exportsStore.set(job1.id, [export1]);
}

// Seed once on module load
seedDemoJobs();

// ── Helpers ───────────────────────────────────────────────────────────────────
export function createJobInStore(input: {
  name: string;
  query: Job["query"];
}): Job {
  const id = `job-${Date.now()}`;
  const job: Job = {
    id,
    name: input.name,
    createdAt: new Date().toISOString(),
    createdBy: "admin",
    status: "queued", // Start as queued - job runner will set to running
    query: input.query,
    counters: {
      placesDiscovered: 0,
      websitesScraped: 0,
      leadsEnriched: 0,
      leadsTotal: 0,
    },
  };
  jobsStore.set(id, job);
  leadsStore.set(id, []);
  exportsStore.set(id, []);

  return job;
}

export function getActivityForJob(jobId: string): ActivityEvent[] {
  return generateActivityForJob(jobId);
}

// simulatePipeline removed - job-runner.ts handles execution now
