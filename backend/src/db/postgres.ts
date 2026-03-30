import { Pool } from 'pg';
import { logger } from '../server.js';

let pool: Pool | null = null;

export function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 10,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 5_000,
    });

    pool.on('error', (err) => logger.error({ err }, 'Erro inesperado no pool PostgreSQL'));
    pool.on('connect', () => logger.debug('PostgreSQL: nova conexão no pool'));
  }
  return pool;
}

export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

export async function query<T = unknown>(
  sql: string,
  params?: unknown[],
): Promise<T[]> {
  const client = getPool();
  const result = await client.query<T>(sql, params);
  return result.rows;
}

export async function queryOne<T = unknown>(
  sql: string,
  params?: unknown[],
): Promise<T | null> {
  const rows = await query<T>(sql, params);
  return rows[0] ?? null;
}
