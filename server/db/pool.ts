import pg from 'pg';

const { Pool } = pg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL ?? 'postgres://parterre:parterre@localhost:5432/parterre',
});