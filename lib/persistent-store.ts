import type { Job, Lead, ExportRun } from "./types";

// Use a file-based approach for serverless persistence
const fs = require("fs").promises;
const path = require("path");

const DATA_DIR = "/tmp";
const JOBS_FILE = path.join(DATA_DIR, "jobs.json");
const LEADS_FILE = path.join(DATA_DIR, "leads.json");
const EXPORTS_FILE = path.join(DATA_DIR, "exports.json");

async function ensureFiles() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch (e) {
    // Directory might already exist
  }

  // Ensure files exist with default empty content
  for (const file of [JOBS_FILE, LEADS_FILE, EXPORTS_FILE]) {
    try {
      await fs.access(file);
    } catch {
      await fs.writeFile(file, JSON.stringify({}));
    }
  }
}

async function readJobs(): Promise<Map<string, Job>> {
  try {
    await ensureFiles();
    const content = await fs.readFile(JOBS_FILE, "utf8");
    const data = JSON.parse(content);
    return new Map(Object.entries(data));
  } catch {
    return new Map();
  }
}

async function writeJobs(map: Map<string, Job>) {
  try {
    await ensureFiles();
    const data = Object.fromEntries(map);
    await fs.writeFile(JOBS_FILE, JSON.stringify(data, null, 2));
  } catch (e) {
    console.error("[v0] Error writing jobs:", e);
  }
}

async function readLeads(): Promise<Map<string, Lead[]>> {
  try {
    await ensureFiles();
    const content = await fs.readFile(LEADS_FILE, "utf8");
    const data = JSON.parse(content);
    return new Map(Object.entries(data));
  } catch {
    return new Map();
  }
}

async function writeLeads(map: Map<string, Lead[]>) {
  try {
    await ensureFiles();
    const data = Object.fromEntries(map);
    await fs.writeFile(LEADS_FILE, JSON.stringify(data, null, 2));
  } catch (e) {
    console.error("[v0] Error writing leads:", e);
  }
}

async function readExports(): Promise<Map<string, ExportRun[]>> {
  try {
    await ensureFiles();
    const content = await fs.readFile(EXPORTS_FILE, "utf8");
    const data = JSON.parse(content);
    return new Map(Object.entries(data));
  } catch {
    return new Map();
  }
}

async function writeExports(map: Map<string, ExportRun[]>) {
  try {
    await ensureFiles();
    const data = Object.fromEntries(map);
    await fs.writeFile(EXPORTS_FILE, JSON.stringify(data, null, 2));
  } catch (e) {
    console.error("[v0] Error writing exports:", e);
  }
}

export { readJobs, writeJobs, readLeads, writeLeads, readExports, writeExports };
