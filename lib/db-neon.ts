import { neon } from '@neondatabase/serverless';

let sqlClient: ReturnType<typeof neon> | null = null;

export function getSqlClient() {
  if (!sqlClient) {
    const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('No database connection string configured');
    }
    sqlClient = neon(connectionString);
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
