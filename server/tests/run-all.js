import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../..');

console.log('====================================================');
console.log('  B2B ORDER MANAGEMENT PLATFORM — TEST SUITE RUNNER  ');
console.log('====================================================');

const testFiles = [
  'tests/auth.test.js',
  'tests/products-inventory.test.js',
  'tests/orders-cart.test.js',
  'tests/invoices-admin.test.js',
];

const evidencePath = path.resolve(projectRoot, 'evidence/test-output.txt');
const logStream = fs.createWriteStream(evidencePath, { flags: 'w' });

const startTime = Date.now();
const child = spawn(
  process.execPath,
  ['--test', '--test-concurrency=1', ...testFiles],
  {
    cwd: path.resolve(projectRoot, 'server'),
    env: {
      ...process.env,
      NODE_ENV: 'test',
    },
    stdio: ['inherit', 'pipe', 'pipe'],
  }
);

let fullOutput = '';

child.stdout.on('data', (data) => {
  const str = data.toString();
  process.stdout.write(str);
  logStream.write(str);
  fullOutput += str;
});

child.stderr.on('data', (data) => {
  const str = data.toString();
  process.stderr.write(str);
  logStream.write(str);
  fullOutput += str;
});

child.on('close', (code) => {
  logStream.end();
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log('----------------------------------------------------');
  console.log(`Test Execution Completed in ${elapsed}s with exit code: ${code}`);
  console.log(`Output saved to: ${evidencePath}`);
  console.log('====================================================');
  process.exit(code);
});
