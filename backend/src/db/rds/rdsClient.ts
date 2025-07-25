import { myConfig } from '@config/env'; // Adjust the import based on your configuration setup
import { Pool } from 'pg';

// SSL config based on environment
let ssl: boolean | object = false;

if (myConfig.NODE_ENV === 'production') {
  // Use full certificate verification in production
  ssl = {
    ca: myConfig.RDS_CA_CERT,
    rejectUnauthorized: true
  };
} else {
  // In development, use SSH tunnel + disable hostname check
  ssl = {
    rejectUnauthorized: false,
    checkServerIdentity: () => undefined
  };
}

const pool = new Pool({
  host: myConfig.RDS_HOST,
  port: parseInt(myConfig.RDS_PORT || '5432', 10),
  user: myConfig.RDS_USER,
  password: myConfig.RDS_PASSWORD,
  database: myConfig.RDS_NAME,
  max: 20, // Set max pool size
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
  ssl
});

pool.on('error', (err) => {
    console.error('Unexpected PostgreSQL error', err);
});

pool.on('connect', (client) => {
  console.log("[RDS] Connected Successfully!")
  client.query('SET search_path TO con4_schema').catch(err => {
    console.error('Failed to set search_path:', err);
  });
});

export default pool;