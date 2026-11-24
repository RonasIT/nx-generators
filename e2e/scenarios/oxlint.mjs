import assert from 'node:assert/strict';
import { mkdirSync, readFileSync, rmdirSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';

export function runOxlintScenario({ e2eWorkspace, run, runCapture }) {
  const options = { cwd: e2eWorkspace };

  run('npx nx g oxlint --no-interactive', options);

  const packageJson = JSON.parse(readFileSync(path.join(e2eWorkspace, 'package.json'), 'utf8'));
  const scope = packageJson.name.split('/')[0];

  for (const name of ['oxlint', 'oxfmt']) {
    assert.ok(packageJson.devDependencies[name], `Expected ${name} to be installed`);
  }

  for (const name of ['eslint', 'prettier']) {
    assert.ok(
      !packageJson.dependencies?.[name] && !packageJson.devDependencies?.[name],
      `Expected ${name} to be removed`,
    );
  }

  for (const type of ['features', 'ui']) {
    run(
      `npx nx g react-lib --app=web --scope=shared --type=${type} --name=oxlint-check --withComponent=false --no-interactive`,
      options,
    );
  }

  run('npx nx g lib-tags --skipRepoCheck --silent --no-interactive', options);

  const featureRoot = path.join(e2eWorkspace, 'libs/web/shared/features/oxlint-check/src');
  const uiFile = path.join(e2eWorkspace, 'libs/web/shared/ui/oxlint-check/src/index.ts');
  const uiSource = 'export const ui = 1;\n';
  const cycleA = path.join(featureRoot, 'a.ts');
  const cycleB = path.join(featureRoot, 'b.ts');
  const customAppRoot = 'apps/oxlint-native-check';
  const customLibRoot = 'libs/oxlint-native-check';
  const customEasConfig = `${customAppRoot}/eas.json`;
  const customAppFile = `${customAppRoot}/oxlint-check.tsx`;
  const customLibFile = `${customLibRoot}/oxlint-check.tsx`;
  const webAppFile = 'apps/web/app/oxlint-check.tsx';
  const webLibFile = 'libs/web/shared/ui/oxlint-check/src/oxlint-check.tsx';
  const unreachableFile = 'libs/web/shared/features/oxlint-check/src/unreachable.ts';
  const nativeFiles = [customAppFile, customLibFile];
  const webFiles = [webAppFile, webLibFile];
  const fixtureFiles = [...nativeFiles, ...webFiles, customEasConfig, unreachableFile];
  const fixtureDirectories = [];

  writeFileSync(path.join(featureRoot, 'index.ts'), 'export const feature = 1;\n');
  writeFileSync(uiFile, uiSource);

  run('npm run lint', options);
  run('npm run format', options);
  run('npx nx run-many -t lint', options);

  const assertLintError = (rule, message, command = 'npm run lint') => {
    assert.throws(
      () => runCapture(command, options),
      (error) => {
        assert.equal(error.status, 1);
        const output = `${error.stdout ?? ''}\n${error.stderr ?? ''}`;
        assert.match(output, rule);
        assert.match(output, message);
        return true;
      },
    );
  };

  try {
    const writeFixture = (file, source) => writeFileSync(path.join(e2eWorkspace, file), source);
    const mobileImport = "import { Text, View } from 'react-native';\n\nconst AppText = Text;\n";

    for (const root of [customAppRoot, customLibRoot]) {
      const directory = path.join(e2eWorkspace, root);
      mkdirSync(directory);
      fixtureDirectories.push(directory);
    }

    writeFixture(customEasConfig, '{}\n');

    for (const file of nativeFiles) {
      writeFixture(
        file,
        `${mobileImport}export const example = <View testID="example"><Text>Native text</Text><AppText>{'App text'}</AppText></View>;\n`,
      );
    }

    for (const file of webFiles) {
      writeFixture(file, 'export const example = <div>Web text</div>;\n');
    }

    run(`npx oxlint ${[...nativeFiles, ...webFiles].join(' ')}`, options);

    for (const [file, rawText] of [
      [customAppFile, 'Raw text'],
      [customLibFile, "{'Raw text'}"],
    ]) {
      writeFixture(file, `import { View } from 'react-native';\n\nexport const example = <View>${rawText}</View>;\n`);
      assertLintError(/react[(/]jsx-no-literals/, /Disallow literal text as JSX children/, `npx oxlint ${file}`);
    }

    writeFixture(unreachableFile, 'export function example(): number { return 1; return 2; }\n');
    assertLintError(/eslint[(/]no-unreachable/, /Unreachable code/, `npx oxlint ${unreachableFile}`);
  } finally {
    for (const file of fixtureFiles) {
      rmSync(path.join(e2eWorkspace, file), { force: true });
    }
    for (const directory of fixtureDirectories) {
      rmdirSync(directory);
    }
  }

  try {
    writeFileSync(
      uiFile,
      `import { feature } from '${scope}/web/shared/features/oxlint-check';\nexport const ui = feature;\n`,
    );
    assertLintError(/enforce-module-boundaries/, /A project tagged with "type:ui"/);
    writeFileSync(uiFile, uiSource);

    writeFileSync(cycleA, "import { b } from './b';\nexport function a(): number { return b(); }\n");
    writeFileSync(cycleB, "import { a } from './a';\nexport function b(): number { return a(); }\n");
    assertLintError(/import[(/]no-cycle/, /Dependency cycle detected/);
  } finally {
    writeFileSync(uiFile, uiSource);
    rmSync(cycleA, { force: true });
    rmSync(cycleB, { force: true });
  }
}
