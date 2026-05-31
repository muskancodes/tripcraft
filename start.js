// Starts both the Express backend and the Vite dev server
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const node = process.execPath;

const colors = { reset: '\x1b[0m', cyan: '\x1b[36m', yellow: '\x1b[33m' };

function spawnProc(name, args, color) {
  const proc = spawn(node, args, { stdio: 'pipe', cwd: __dirname });
  proc.stdout.on('data', d => process.stdout.write(`${color}[${name}]${colors.reset} ${d}`));
  proc.stderr.on('data', d => process.stderr.write(`${color}[${name}]${colors.reset} ${d}`));
  proc.on('close', code => console.log(`${color}[${name}]${colors.reset} exited with code ${code}`));
  return proc;
}

const backend = spawnProc('server', ['server.js'], colors.cyan);
const frontend = spawnProc('vite',
  ['node_modules/vite/bin/vite.js', '--host', '0.0.0.0', '--port', '5174', '--strictPort'],
  colors.yellow
);

process.on('SIGINT', () => { backend.kill(); frontend.kill(); process.exit(0); });
process.on('SIGTERM', () => { backend.kill(); frontend.kill(); process.exit(0); });
