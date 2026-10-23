import pg from 'pg';
import { config } from './env.js';

const buildSslConfig = () => {
  if (!config.db.ssl) {
    return false;
  }
  const sslOptions = {
    rejectUnauthorized: config.db.rejectUnauthorized,
  };
  if (config.db.ca) {
    sslOptions.ca = config.db.ca;
  }
  return sslOptions;
};

const poolConfig = config.db.connectionString
  ? {
      connectionString: config.db.connectionString,
      ssl: buildSslConfig(),
      max: config.db.maxConnections,
      idleTimeoutMillis: config.db.idleTimeoutMillis,
      connectionTimeoutMillis: config.db.connectionTimeoutMillis,
    }
  : {
      host: config.db.host,
      port: config.db.port,
      user: config.db.user,
      password: config.db.password,
      database: config.db.name,
      ssl: buildSslConfig(),
      max: config.db.maxConnections,
      idleTimeoutMillis: config.db.idleTimeoutMillis,
      connectionTimeoutMillis: config.db.connectionTimeoutMillis,
    };

const pool = new pg.Pool(poolConfig);

pool.on('error', (err) => {
  console.error('[DATABASE POOL ERROR]:', err);
});

export const query = async (text, params) => {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  if (config.env === 'development' && duration > 100) {
    console.log(`[SLOW QUERY ${duration}ms]:`, text.substring(0, 100));
  }
  return res;
};

export const getClient = async () => {
  const client = await pool.connect();
  return client;
};

export const testConnection = async () => {
  const res = await pool.query('SELECT NOW() as current_time, current_database() as db_name;');
  return res.rows[0];
};

export default {
  pool,
  query,
  getClient,
  testConnection,
};
