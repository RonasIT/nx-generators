import { readFileSync } from 'node:fs';
import path from 'node:path';
import {
  assertEslintAndPrettierRemoved,
  assertImportCycleError,
  assertLintAndFormatPass,
  assertModuleBoundariesError,
  assertOxlintAndOxfmtInstalled,
} from '../lib/assertions.mjs';
import {
  generateLibs,
  introduceImportCycle,
  introduceModuleBoundariesViolation,
  removeImportCycle,
  restoreUiSource,
} from '../lib/utils.mjs';

export function runOxlintScenario({ e2eWorkspace, run, runCapture }) {
  run('npx nx g oxlint --no-interactive', { cwd: e2eWorkspace });

  const packageJson = JSON.parse(readFileSync(path.join(e2eWorkspace, 'package.json'), 'utf8'));
  const scope = packageJson.name.split('/')[0];

  assertOxlintAndOxfmtInstalled(packageJson);
  assertEslintAndPrettierRemoved(packageJson);

  generateLibs(e2eWorkspace, run);
  assertLintAndFormatPass(e2eWorkspace, run);

  try {
    introduceModuleBoundariesViolation({ e2eWorkspace, scope });
    assertModuleBoundariesError({ e2eWorkspace, runCapture });
    restoreUiSource(e2eWorkspace);

    introduceImportCycle(e2eWorkspace);
    assertImportCycleError({ e2eWorkspace, runCapture });
  } finally {
    restoreUiSource(e2eWorkspace);
    removeImportCycle(e2eWorkspace);
  }
}
