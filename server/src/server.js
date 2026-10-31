import app from './app.js';
import { config } from './config/env.js';
import { testConnection, pool } from './config/db.js';

let server;

// Graceful shutdown handler: release port and close database connections cleanly
const gracefulShutdown = async (signal) => {
  console.log(`\n[SERVER] Received ${signal}. Shutting down gracefully...`);
  if (server) {
    server.close(async () => {
      console.log('[SERVER] HTTP server closed cleanly.');
      try {
        await pool.end();
        console.log('[DATABASE] Connection pool closed cleanly.');
      } catch (poolErr) {
        console.error('[DATABASE] Error closing connection pool:', poolErr.message);
      }
      process.exit(0);
    });
  } else {
    try {
      await pool.end();
      console.log('[DATABASE] Connection pool closed cleanly.');
    } catch {}
    process.exit(0);
  }
  // Safeguard: force exit after 3 seconds if cleanup hangs
  setTimeout(() => process.exit(0), 3000).unref();
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

const startServer = async () => {
  try {
    const dbStatus = await testConnection();
    console.log(`[DATABASE CONNECTED] Database: ${dbStatus.db_name} at ${dbStatus.current_time}`);

    server = app.listen(config.port, () => {
      console.log(`[SERVER RUNNING] Mode: ${config.env} | Port: ${config.port}`);
      console.log(`[HEALTH CHECK] http://localhost:${config.port}/api/v1/health`);
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`\n============================================================`);
        console.error(`[PORT CONFLICT] Port ${config.port} is already in use by another process.`);
        console.error(`Another instance of the backend is already running.`);
        console.error(`To find and terminate the existing process:`);
        console.error(`  PowerShell:`);
        console.error(`    Get-NetTCPConnection -LocalPort ${config.port} | Select-Object OwningProcess`);
        console.error(`    Stop-Process -Id <PID> -Force`);
        console.error(`  Command Prompt:`);
        console.error(`    netstat -ano | findstr :${config.port}`);
        console.error(`    taskkill /PID <PID> /F`);
        console.error(`============================================================\n`);
        process.exit(1);
      } else {
        console.error('[SERVER ERROR]:', err);
        process.exit(1);
      }
    });
  } catch (err) {
    if (err.code === 'ECONNREFUSED') {
      console.error(`\n============================================================`);
      console.error(`[DATABASE CONNECTION FAILED] Could not connect to PostgreSQL.`);
      console.error(`Host: ${config.db.host} | Port: ${config.db.port}`);
      console.error(`Connection was refused (ECONNREFUSED).`);
      console.error(`Please verify that PostgreSQL is active and accepting connections on port ${config.db.port}.`);
      console.error(`In local development, ensure your local PostgreSQL server or container is started.`);
      console.error(`============================================================\n`);
    } else {
      console.error('[FATAL SERVER INITIALIZATION ERROR]:', err);
    }
    process.exit(1);
  }
};

startServer();
