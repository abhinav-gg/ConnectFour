// db/withTransaction.ts
import pool from '../pool';
import { PoolClient } from 'pg';

/**
 * Runs a query function inside a transaction.
 * Automatically rolls back on error.
 *
 * @param fn - The function to execute with a transactional client
 * @returns The result of the function
 */
export async function withTransaction<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

// import { withTransaction } from './withTransaction';

// export async function transferCredits(senderId: number, receiverId: number, amount: number) {
//   return withTransaction(async (client) => {
//     await client.query('UPDATE users SET credits = credits - $1 WHERE id = $2', [amount, senderId]);
//     await client.query('UPDATE users SET credits = credits + $1 WHERE id = $2', [amount, receiverId]);
//   });
// }