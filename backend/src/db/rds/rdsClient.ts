import { myConfig } from '@config/env';
import { Pool, PoolClient } from 'pg';

// SSL config based on environment
let ssl: boolean | object = false;

if (myConfig.NODE_ENV === 'production') {
  ssl = {
    ca: myConfig.RDS_CA_CERT,
    rejectUnauthorized: true,
  };
} else {
  ssl = {
    rejectUnauthorized: false,
    checkServerIdentity: () => undefined,
  };
}

// Create the pool with connection setup
const pool = new Pool({
  host: myConfig.RDS_HOST,
  port: Number(myConfig.RDS_PORT) || 5432,
  user: myConfig.RDS_USER,
  password: myConfig.RDS_PASSWORD,
  database: myConfig.RDS_NAME,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  ssl,
});

pool.on('error', (err) => {
  console.error('[RDS] Unexpected error on idle client:', err);
});

pool.on('connect', async (client) => {
  try {
    await client.query('SET search_path TO con4_schema');
    console.log('[RDS] Connected, search_path set to con4_schema');
  } catch (err) {
    console.error('[RDS] Failed to set search_path:', err);
  }
});

/**
 * Checks RDS health by attempting a simple query.
 * @returns Promise<boolean> true if connection is healthy, false otherwise
 */
export async function checkRDSHealth(): Promise<boolean> {
  try {
    // Use a simple lightweight query
    await pool.query('SELECT 1');
    return true;
  } catch (error) {
    console.error('[RDS] Health check failed:', error);
    return false;
  }
}

export default pool;
