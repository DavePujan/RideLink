import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from './schema.ts';

const { Pool } = pg;

// Function to create a new connection pool.
export const createPool = () => {
  return new Pool({
    host: process.env.SQL_HOST,
    user: process.env.SQL_USER,
    password: process.env.SQL_PASSWORD,
    database: process.env.SQL_DB_NAME,
    connectionTimeoutMillis: 15000,
    idleTimeoutMillis: 10000, // Close idle connections after 10 seconds to avoid stale TCP sockets
    max: 10, // Maximum number of clients in the pool
  });
};

// Create a pool instance.
const pool = createPool();

// Prevent unhandled pool-level errors from crashing the application
pool.on('error', (err) => {
  console.error('Unexpected error on idle SQL pool client:', err);
});

// Wrap the pool instance to automatically retry queries
// if they fail due to transient "Connection terminated unexpectedly" or scale-to-zero issues.
const originalQuery = pool.query.bind(pool);
pool.query = (function (this: any, ...args: any[]) {
  const lastArg = args[args.length - 1];
  if (typeof lastArg === 'function') {
    return originalQuery(...args);
  }

  return (async () => {
    let attempts = 0;
    const maxAttempts = 10; // Up to 10 attempts to cover scale-to-zero instance cold start (~15 seconds)
    while (true) {
      try {
        return await originalQuery(...args);
      } catch (err: any) {
        attempts++;
        const errMsg = err.message || '';
        const errCode = err.code || '';
        const isConnectionError =
          errMsg.includes('Connection terminated unexpectedly') ||
          errMsg.includes('connection') ||
          errMsg.includes('socket') ||
          errMsg.includes('ECONNRESET') ||
          errCode === '57P01' || // admin_shutdown
          errCode === '57P02' || // crash_shutdown
          errCode === '57P03';  // cannot_connect_now

        if (isConnectionError && attempts < maxAttempts) {
          const delay = Math.min(500 * attempts, 2000);
          console.warn(`[SQL Retry] Query failed (attempt ${attempts}/${maxAttempts}). Retrying in ${delay}ms... Error: ${errMsg}`);
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }
        throw err;
      }
    }
  })();
} as any).bind(pool);

// Initialize Drizzle with the pool and schema.
export const db = drizzle(pool, { schema });
export default db;
