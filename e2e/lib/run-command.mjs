import { execSync } from 'node:child_process';

let lastCommand = null;

export function setupEnv() {
  process.env.NX_NON_INTERACTIVE = 'true';
  process.env.npm_config_yes = 'true';
}

export function run(command, options = {}) {
  lastCommand = command;
  const start = Date.now();
  console.log(`==> ${command}`);

  try {
    execSync(command, { stdio: 'inherit', ...options });
    console.log(`    (${((Date.now() - start) / 1000).toFixed(1)}s)`);
  } catch (error) {
    console.error(`    Failed after ${((Date.now() - start) / 1000).toFixed(1)}s`);
    throw error;
  }
}

export function runCapture(command, options = {}) {
  lastCommand = command;
  const start = Date.now();
  console.log(`==> ${command}`);

  try {
    const output = execSync(command, { encoding: 'utf8', ...options });
    console.log(`    (${((Date.now() - start) / 1000).toFixed(1)}s)`);
    return output;
  } catch (error) {
    console.error(`    Failed after ${((Date.now() - start) / 1000).toFixed(1)}s`);
    throw error;
  }
}

export function getLastCommand() {
  return lastCommand;
}
