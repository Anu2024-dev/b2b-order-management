import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from project root
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const isTest = process.env.NODE_ENV === 'test';
const dbName = isTest ? (process.env.DB_TEST_NAME || 'b2b_order_db_test') : (process.env.DB_NAME || 'b2b_order_db');

const hasSsl = process.env.DB_SSL === 'true' || Boolean(process.env.DATABASE_URL && process.env.DATABASE_URL.includes('sslmode=require'));
const sslConfig = hasSsl
  ? {
      rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false',
      ...(process.env.DB_CA_CERT ? { ca: process.env.DB_CA_CERT } : {}),
    }
  : false;

const poolConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: sslConfig,
    }
  : {
      host: process.env.DB_HOST || '127.0.0.1',
      port: parseInt(process.env.DB_PORT || '5433', 10),
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || '',
      database: dbName,
      ssl: sslConfig,
    };

const pool = new pg.Pool(poolConfig);

async function runMigrations() {
  console.log(`[MIGRATIONS] Starting migrations for database: "${dbName}"...`);
  const client = await pool.connect();

  try {
    // 1. Create migration tracking table if not present
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. Fetch already executed migrations
    const executedRes = await client.query('SELECT filename FROM schema_migrations ORDER BY id ASC;');
    const executedFiles = new Set(executedRes.rows.map(r => r.filename));

    // 3. Read migration directory
    const migrationsDir = path.resolve(__dirname, 'migrations');
    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    let count = 0;
    for (const file of files) {
      if (executedFiles.has(file)) {
        console.log(`[MIGRATIONS] - ${file} (already executed)`);
        continue;
      }

      console.log(`[MIGRATIONS] -> Executing: ${file}...`);
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');

      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query('INSERT INTO schema_migrations (filename) VALUES ($1);', [file]);
        await client.query('COMMIT');
        console.log(`[MIGRATIONS] [OK] Successfully applied ${file}`);
        count++;
      } catch (err) {
        await client.query('ROLLBACK');
        console.error(`[MIGRATIONS] [FAILED] Error applying ${file}:`, err.message);
        throw err;
      }
    }

    console.log(`[MIGRATIONS] Completed. Applied ${count} new migration(s).`);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigrations().catch(err => {
  console.error('[MIGRATIONS FATAL ERROR]', err);
  process.exit(1);
});
