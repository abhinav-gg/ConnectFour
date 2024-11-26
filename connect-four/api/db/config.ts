import { Pool } from 'pg';

export const dbConfig = {
  pool: new Pool({
    connectionString: process.env.DATABASE_URL,
    // CockroachDB specific settings
    ssl: {
      rejectUnauthorized: false, // Required for CockroachDB serverless
    },
    // Optional: Configure connection pool size
    max: 25,
  })
};
