import { spawn } from 'child_process';
import net from 'net';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const serverDir = path.resolve(projectRoot, 'server');
const clientDir = path.resolve(projectRoot, 'client');
const pgDataDir = process.env.PGDATA || path.resolve(process.env.USERPROFILE || process.env.HOME || '', '.gemini/antigravity/scratch/test_pg_data');
const pgBin = process.env.PGBIN || (process.platform === 'win32' ? 'C:\\Program Files\\PostgreSQL\\18\\bin\\postgres.exe' : 'postgres');

console.log('====================================================');
console.log('  B2B ORDER MANAGEMENT — UNIFIED DEV RUNNER         ');
console.log('====================================================');

// Helper: check if a TCP port is open
const isPortOpen = (port, host = '127.0.0.1') => {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(1500);
    socket.on('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.on('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    socket.on('error', () => {
      resolve(false);
    });
    socket.connect(port, host);
  });
};

let dbProcess = null;
let backendProcess = null;
let frontendProcess = null;
let isShuttingDown = false;

const cleanShutdown = (signal = 'SIGINT') => {
  if (isShuttingDown) return;
  isShuttingDown = true;
  console.log(`\n[DEV RUNNER] Received ${signal}. Shutting down all processes cleanly...`);

  if (backendProcess) {
    try {
      backendProcess.kill();
      console.log('[DEV RUNNER] Backend stopped.');
    } catch {}
  }

  if (frontendProcess) {
    try {
      frontendProcess.kill();
      console.log('[DEV RUNNER] Frontend stopped.');
    } catch {}
  }

  // Allow child processes a moment to release ports
  setTimeout(() => {
    console.log('[DEV RUNNER] All processes stopped. Goodbye!');
    process.exit(0);
  }, 1000);
};

process.on('SIGINT', () => cleanShutdown('SIGINT'));
process.on('SIGTERM', () => cleanShutdown('SIGTERM'));

async function main() {
  // 1. Check PostgreSQL on port 5433
  const dbUp = await isPortOpen(5433);
  if (dbUp) {
    console.log('[DATABASE] PostgreSQL is active and listening on port 5433.');
  } else {
    console.log('[DATABASE] Port 5433 is not listening.');
    if (fs.existsSync(pgBin) && fs.existsSync(pgDataDir)) {
      console.log('[DATABASE] Starting local PostgreSQL on port 5433...');
      dbProcess = spawn(pgBin, ['-D', pgDataDir, '-p', '5433'], {
        detached: true,
        stdio: 'ignore',
      });
      dbProcess.unref();

      // Wait up to 5 seconds for PostgreSQL to become ready
      let ready = false;
      for (let i = 0; i < 10; i++) {
        await new Promise((r) => setTimeout(r, 500));
        if (await isPortOpen(5433)) {
          ready = true;
          break;
        }
      }
      if (ready) {
        console.log('[DATABASE] PostgreSQL started successfully on port 5433.');
      } else {
        console.warn('[DATABASE WARNING] PostgreSQL startup on port 5433 timed out. Backend may report ECONNREFUSED.');
      }
    } else {
      console.warn('[DATABASE WARNING] test_pg_data directory not found. Please start PostgreSQL manually.');
    }
  }

  // 2. Check if port 5000 is already in use
  const port5000InUse = await isPortOpen(5000);
  if (port5000InUse) {
    console.error('\n[FATAL CONFLICT] Port 5000 is ALREADY occupied by an existing process!');
    console.error('Please terminate the existing backend instance before running dev.');
    console.error('On Windows: Get-NetTCPConnection -LocalPort 5000 | Select-Object OwningProcess');
    process.exit(1);
  }

  // 3. Start Backend
  console.log('[BACKEND] Starting Express server on port 5000...');
  backendProcess = spawn(
    process.execPath,
    ['--watch', 'src/server.js'],
    {
      cwd: serverDir,
      env: { ...process.env, NODE_ENV: 'development' },
      stdio: ['inherit', 'pipe', 'pipe'],
    }
  );

  backendProcess.stdout.on('data', (d) => {
    process.stdout.write(`[BACKEND] ${d.toString()}`);
  });
  backendProcess.stderr.on('data', (d) => {
    process.stderr.write(`[BACKEND ERROR] ${d.toString()}`);
  });
  backendProcess.on('exit', (code) => {
    if (!isShuttingDown && code !== 0) {
      console.error(`[BACKEND EXIT] Backend stopped with exit code: ${code}`);
    }
  });

  // 4. Start Frontend
  console.log('[FRONTEND] Starting Vite dev server on port 5173...');
  const npxCmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';
  frontendProcess = spawn(
    npxCmd,
    ['vite', '--port', '5173'],
    {
      cwd: clientDir,
      stdio: ['inherit', 'pipe', 'pipe'],
    }
  );

  frontendProcess.stdout.on('data', (d) => {
    process.stdout.write(`[FRONTEND] ${d.toString()}`);
  });
  frontendProcess.stderr.on('data', (d) => {
    process.stderr.write(`[FRONTEND ERROR] ${d.toString()}`);
  });
  frontendProcess.on('exit', (code) => {
    if (!isShuttingDown && code !== 0) {
      console.error(`[FRONTEND EXIT] Frontend stopped with exit code: ${code}`);
    }
  });

  console.log('\n[INFO] Both servers starting. Press Ctrl+C at any time to shut down both.\n');
}

main().catch((err) => {
  console.error('[DEV RUNNER ERROR]:', err);
  cleanShutdown();
});
