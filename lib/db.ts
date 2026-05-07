import { neon } from '@neondatabase/serverless';

// Create Neon SQL client using DATABASE_URL
const connectionString = process.env.DATABASE_URL;

export const sql = connectionString ? neon(connectionString) : null;
