import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = fileURLToPath(new URL('../', import.meta.url));
const viteCli = path.join(projectRoot, 'node_modules', 'vite', 'bin', 'vite.js');
const playwrightCli = path.join(projectRoot, 'node_modules', '@playwright', 'test', 'cli.js');
const appUrl = 'http://127.0.0.1:4173/';
const playwrightArgs = process.argv.slice(2).filter(argument => argument !== '--');
const server = spawn(process.execPath, [viteCli, '--host', '127.0.0.1', '--port', '4173', '--strictPort'], {
  cwd: projectRoot,
  stdio: 'inherit',
});

let serverError;
server.on('error', error => { serverError = error; });

async function waitForServer() {
  const deadline = Date.now() + 30_000;
  let lastError;
  while (Date.now() < deadline) {
    if (serverError) throw serverError;
    if (server.exitCode !== null) throw new Error(`Vite exited before becoming ready (code ${server.exitCode}).`);
    try {
      const response = await fetch(appUrl);
      if (response.ok && /<title>ECG Lab<\/title>/i.test(await response.text())) return;
      lastError = new Error(`Unexpected response from ${appUrl}.`);
    } catch (error) {
      lastError = error;
    }
    await delay(200);
  }
  throw new Error(`Vite did not become ready within 30 seconds: ${lastError}`);
}

function runPlaywright() {
  return new Promise(resolve => {
    const runner = spawn(process.execPath, [playwrightCli, 'test', ...playwrightArgs], {
      cwd: projectRoot,
      env: process.env,
      stdio: 'inherit',
    });
    runner.once('error', error => {
      console.error('Could not start Playwright:', error);
      resolve(1);
    });
    runner.once('close', (code, signal) => resolve(code ?? (signal ? 1 : 0)));
  });
}

async function stopServer() {
  if (server.exitCode !== null || server.signalCode !== null) return;
  const exited = new Promise(resolve => server.once('exit', resolve));
  server.kill();
  await Promise.race([exited, delay(3_000)]);
  if (server.exitCode === null && server.signalCode === null) server.kill('SIGKILL');
}

let exitCode = 1;
try {
  await waitForServer();
  exitCode = await runPlaywright();
} catch (error) {
  console.error(error);
} finally {
  await stopServer();
}

process.exitCode = exitCode;
