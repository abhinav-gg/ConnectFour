// db/utils/withDbClient.ts
import pool from '../rdsClient';
import { PoolClient } from 'pg';

/**
 * Runs a function using a dedicated PostgreSQL client.
 * Automatically releases the client back to the pool, even if an error occurs.
 *
 * @param fn - The function that receives the client
 * @returns The result of the function
 */
export async function withDbClient<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    return await fn(client);
  } catch (error) {
    throw error;
  } finally {
    client.release();
  }
}


// return withDbClient(async (client) => {
//     const userRes = await client.query('SELECT * FROM users WHERE id = $1', [userId]);
//     const postRes = await client.query(
//       'SELECT * FROM posts WHERE user_id = $1 ORDER BY created_at DESC LIMIT 5',
//       [userId]
//     );

//     return {
//       user: userRes.rows[0],
//       posts: postRes.rows,
//     };
//   });