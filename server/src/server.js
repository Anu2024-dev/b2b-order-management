import app from './app.js';
import { config } from './config/env.js';
import { testConnection } from './config/db.js';

const startServer = async () => {
  try {
    const dbStatus = await testConnection();
    console.log(`[DATABASE CONNECTED] Database: ${dbStatus.db_name} at ${dbStatus.current_time}`);

    app.listen(config.port, () => {
      console.log(`[SERVER RUNNING] Mode: ${config.env} | Port: ${config.port}`);
      console.log(`[HEALTH CHECK] http://localhost:${config.port}/api/v1/health`);
    });
  } catch (err) {
    console.error('[FATAL SERVER INITIALIZATION ERROR]:', err);
    process.exit(1);
  }
};

startServer();
