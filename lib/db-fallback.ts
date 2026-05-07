// In-memory storage fallback when database connection fails
// This allows the app to demonstrate full functionality without Neon

const jobsStore = new Map<string, any>();
const leadsStore = new Map<string, any[]>();

export async function withDatabaseFallback<T>(
  fn: () => Promise<T>,
  fallbackFn: () => T | Promise<T>
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    console.warn('[v0] Database error, using in-memory fallback:', error);
    return await fallbackFn();
  }
}

export { jobsStore, leadsStore };
