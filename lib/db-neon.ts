import { neon } from '@neondatabase/serverless';

let sqlClient: ReturnType<typeof neon> | null = null;

export function getSqlClient() {
  if (!sqlClient) {
    // Try different environment variable names (Neon may prefix with 'database_')
    const connectionString = 
      process.env.POSTGRES_URL || 
      process.env.DATABASE_URL ||
      process.env.database_POSTGRES_URL ||
      process.env.database_DATABASE_URL ||
      process.env.database_PRISMA_DATABASE_URL;

    if (!connectionString) {
      const availableVars = Object.keys(process.env).filter(k => k.toLowerCase().includes('database') || k.toLowerCase().includes('postgres') || k.toLowerCase().includes('url'));
      console.error('[v0] No connection string found. Available vars:', availableVars);
      throw new Error('No database connection string configured');
    }

    console.log('[v0] Initializing Neon client with connection string...');
    try {
      sqlClient = neon(connectionString);
      console.log('[v0] Neon client initialized successfully');
    } catch (err) {
      console.error('[v0] Failed to initialize Neon client:', err);
      throw err;
    }
  }
  return sqlClient;
}

export const sql = new Proxy(
  {},
  {
    get: () => {
      return (...args: any[]) => getSqlClient()(...args);
    },
    apply: () => {
      return getSqlClient();
    },
  }
) as any;

export async function testConnection() {
  try {
    const result = await getSqlClient()`SELECT 1 as connected`;
    return { connected: true, result };
  } catch (error) {
    console.error('[v0] Database connection failed:', error);
    return { connected: false, error };
  }
}
