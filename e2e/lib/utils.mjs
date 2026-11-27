import { rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';

export function generateLibs(e2eWorkspace, run) {
  const options = { cwd: e2eWorkspace };

  for (const type of ['features', 'ui']) {
    run(
      `npx nx g react-lib --app=web --scope=shared --type=${type} --name=oxlint-check --withComponent=false --no-interactive`,
      options,
    );
  }

  run('npx nx g lib-tags --skipRepoCheck --silent --no-interactive', options);

  writeFileSync(
    path.join(e2eWorkspace, 'libs/web/shared/features/oxlint-check/src/index.ts'),
    'export const feature = 1;\n',
  );
  restoreUiSource(e2eWorkspace);
}

export function introduceModuleBoundariesViolation({ e2eWorkspace, scope }) {
  writeFileSync(
    path.join(e2eWorkspace, 'libs/web/shared/ui/oxlint-check/src/index.ts'),
    `import { feature } from '${scope}/web/shared/features/oxlint-check';\nexport const ui = feature;\n`,
  );
}

export function restoreUiSource(e2eWorkspace) {
  writeFileSync(path.join(e2eWorkspace, 'libs/web/shared/ui/oxlint-check/src/index.ts'), 'export const ui = 1;\n');
}

export function introduceImportCycle(e2eWorkspace) {
  const featureRoot = path.join(e2eWorkspace, 'libs/web/shared/features/oxlint-check/src');

  writeFileSync(
    path.join(featureRoot, 'a.ts'),
    "import { b } from './b';\nexport function a(): number { return b(); }\n",
  );
  writeFileSync(
    path.join(featureRoot, 'b.ts'),
    "import { a } from './a';\nexport function b(): number { return a(); }\n",
  );
}

export function removeImportCycle(e2eWorkspace) {
  const featureRoot = path.join(e2eWorkspace, 'libs/web/shared/features/oxlint-check/src');

  rmSync(path.join(featureRoot, 'a.ts'), { force: true });
  rmSync(path.join(featureRoot, 'b.ts'), { force: true });
}
