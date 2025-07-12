import { myConfig } from '@config/env'; // Adjust the import based on your configuration setup
import { Pool } from 'pg';

console.log('Initializing PostgreSQL connection pool with the following configuration:', myConfig.DB_HOST, myConfig.DB_PORT, myConfig.DB_NAME);

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
  host: myConfig.DB_HOST,
  port: parseInt(myConfig.DB_PORT || '5432', 10),
  user: myConfig.DB_USER,
  password: myConfig.DB_PASSWORD,
  database: myConfig.DB_NAME,
  max: 20, // Set max pool size
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
  ssl
});

pool.on('error', (err) => {
    console.error('Unexpected PostgreSQL error', err);
});

export default pool;