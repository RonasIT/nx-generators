import * as fs from 'node:fs';
import * as path from 'node:path';
import {
  addProjectConfiguration,
  generateFiles,
  output,
  OverwriteStrategy,
  ProjectConfiguration,
  readJson,
  TargetConfiguration,
  Tree,
  updateProjectConfiguration,
} from '@nx/devkit';
import { configExtensions, TestSuite, TestWorkspace } from './workspace';

const templates = path.join(__dirname, 'files');
const ownership = 'Scaffolded by @ronas-it/nx-generators:next-tests';
const testPattern =
  /(?:[.-](?:spec|test)\.[cm]?[jt]sx?$|\/__(?:tests|screenshots|snapshots)__\/|\.spec\.[cm]?[jt]sx?-snapshots\/)/;

type SuiteOptions = {
  root: string;
  projectName: string;
  project?: ProjectConfiguration;
  inferredTargets?: ProjectConfiguration['targets'];
} & (
  { suite: 'unit' } | { suite: 'browser'; globalStyles: string } | { suite: 'e2e'; directory: string; appName: string }
);

export function findTestConfig(tree: Tree, root: string, suite: TestSuite, ignore?: string): string | undefined {
  const runners =
    suite === 'e2e'
      ? ['playwright.config', 'cypress.config']
      : ['vitest.config', 'vite.config', 'jest.config', 'vitest.workspace'];
  const legacy = suite === 'e2e' ? 'cypress.json' : 'jest.config.json';

  return [...runners.flatMap((runner) => configExtensions.map((ext) => `${runner}.${ext}`)), legacy]
    .map((file) => `${root}/${file}`)
    .find((file) => file !== ignore && tree.exists(file));
}

function findTestFiles(tree: Tree, root: string): Array<string> {
  return tree.children(root).flatMap((name) => {
    const file = `${root}/${name}`;

    if (
      name.startsWith('.') ||
      ['node_modules', '.next', 'dist', 'coverage', 'out', 'test-results', 'playwright-report'].includes(name)
    ) {
      return [];
    }

    if (tree.isFile(file)) {
      return testPattern.test(file) ? [file] : [];
    }

    return tree.exists(`${file}/project.json`) ? [] : findTestFiles(tree, file);
  });
}

function isScaffolded(tree: Tree, file: string, suite: TestSuite): boolean {
  return tree.read(file, 'utf-8')?.split(/\r?\n/, 1)[0] === `// ${ownership} (${suite})`;
}

const specFile = /\.(?:spec|test)\.[cm]?[jt]sx?$/;
const baselinePath = /\/__(?:screenshots|snapshots)__\/|\.[cm]?[jt]sx?-snapshots\//;
const unitTestFile = /\.(?:test|spec)\.tsx?$/;
const vitestImport = /^\s*import\s+(?!type\b)[^;]*?\bfrom\s+['"]vitest['"]|\brequire\(\s*['"]vitest['"]\s*\)/m;
const incompatibleTest = /(?:^|[^\w.$])jest\.|from\s+['"](?:@jest\/globals|@playwright\/test|node:test|bun:test)['"]/;

function isCompatibleTest(tree: Tree, root: string, file: string, suite: TestSuite): boolean {
  if (isScaffolded(tree, file, suite)) {
    return true;
  }

  if (suite !== 'unit' || !file.startsWith(`${root}/tests/`)) {
    return false;
  }

  if (file.includes('/__snapshots__/')) {
    return true;
  }

  if (!unitTestFile.test(file)) {
    return false;
  }

  const content = tree.read(file, 'utf-8') ?? '';

  return vitestImport.test(content) && !incompatibleTest.test(content);
}

function preservedSpecs(tests: Array<string>): Array<string> {
  return tests.filter((file) => specFile.test(file) && !baselinePath.test(file));
}

function checkTarget(tree: Tree, root: string, name: string, target: string, project?: ProjectConfiguration): void {
  const packagePath = `${root}/package.json`;
  const pkg = tree.exists(packagePath)
    ? readJson<{ scripts?: Record<string, string>; nx?: { targets?: Record<string, TargetConfiguration> } }>(
        tree,
        packagePath,
      )
    : {};

  if (pkg.scripts?.[target]) {
    throw new Error(`${packagePath} already defines the "${target}" script for ${name}.`);
  }

  const existing = project?.targets?.[target] ?? pkg.nx?.targets?.[target];

  if (existing && Object.keys(existing).some((key) => key !== 'cache')) {
    throw new Error(`${root} already defines the Nx target ${name}:${target}.`);
  }
}

function templateFiles(directory: string, prefix = ''): Array<string> {
  return fs
    .readdirSync(directory, { withFileTypes: true })
    .flatMap((entry) =>
      entry.isDirectory()
        ? templateFiles(path.join(directory, entry.name), `${prefix}${entry.name}/`)
        : [`${prefix}${entry.name.replace(/\.template$/, '')}`],
    );
}

function keepFiles(tree: Tree, template: string, root: string, substitutions: Record<string, string>): Array<string> {
  const templateDir = path.join(templates, template);
  const files = templateFiles(templateDir).map((file) => `${root}/${file}`);
  const skipped = files.filter((file) => tree.exists(file));

  if (skipped.length < files.length) {
    generateFiles(tree, templateDir, root, substitutions, {
      overwriteStrategy: OverwriteStrategy.KeepExisting,
    });
  }

  return skipped;
}

function reportSkipped(suite: TestSuite, root: string, files: Array<string>): void {
  if (!files.length) {
    return;
  }

  output.log({
    title: `Keeping existing ${suite} test files in ${root}:`,
    bodyLines: [...files].sort(),
  });
}

export function warnTestConflict(suite: TestSuite, projectName: string, message: string): void {
  output.warn({ title: `Skipping ${suite} tests for ${projectName}: ${message}` });
}

export function scaffoldTestSuite(tree: Tree, workspace: TestWorkspace, options: SuiteOptions): void {
  const { suite, root, projectName, project, inferredTargets } = options;
  const configName = suite === 'e2e' ? 'playwright.config.mts' : 'vite.config.mts';
  const config = `${root}/${configName}`;
  const hasConfig = isScaffolded(tree, config, suite);
  const setup = `${root}/tests/setup.ts`;
  const example = `${root}/tests/${suite === 'browser' ? 'button' : suite === 'unit' ? 'example' : 'home'}.spec.${suite === 'e2e' ? 'ts' : 'tsx'}`;

  try {
    if (tree.exists(`${root}/tests`) && tree.isFile(`${root}/tests`)) {
      throw new Error(`the file ${root}/tests prevents creating the tests directory.`);
    }

    const existingConfig = findTestConfig(tree, root, suite, hasConfig ? config : undefined);

    if (existingConfig) {
      throw new Error(`found existing config ${existingConfig}.`);
    }

    if (!hasConfig && suite !== 'e2e' && tree.exists(`${root}/tsconfig.spec.json`)) {
      throw new Error(`found existing config ${root}/tsconfig.spec.json.`);
    }

    const tests = findTestFiles(tree, root);
    const customTest = hasConfig ? undefined : tests.find((file) => !isCompatibleTest(tree, root, file, suite));

    if (customTest) {
      throw new Error(`found existing test or baseline ${customTest} without a compatible generated config.`);
    }

    if (!hasConfig && tree.exists(setup) && !isScaffolded(tree, setup, suite)) {
      throw new Error(`found existing setup file ${setup} without a compatible generated config.`);
    }

    if (suite === 'e2e' && !hasConfig && (project || tree.children(root).length)) {
      const occupant = project ? `Nx project "${project.name ?? projectName}"` : `${root}/${tree.children(root)[0]}`;

      throw new Error(`the E2E project location ${root} is already occupied by ${occupant}.`);
    }

    if (suite !== 'e2e' && !tree.exists(`${root}/tsconfig.json`) && !tree.exists(`${root}/tsconfig.lib.json`)) {
      throw new Error(`could not find ${root}/tsconfig.json or ${root}/tsconfig.lib.json.`);
    }

    const prepared = workspace.prepare(suite, config);

    checkTarget(tree, root, projectName, prepared.target, project);

    if (!hasConfig && inferredTargets?.[prepared.target] && !project?.targets?.[prepared.target]) {
      throw new Error(`${root} already has an inferred Nx target ${projectName}:${prepared.target}.`);
    }

    if (prepared.target !== (suite === 'e2e' ? 'e2e' : 'test')) {
      checkTarget(tree, root, projectName, suite === 'e2e' ? 'e2e' : 'test', project);
    }

    const addExample = !tree.exists(example) && !tests.length;
    const uncachedTargets = suite === 'unit' ? {} : { [prepared.target]: { cache: false } };

    if (suite === 'e2e' && !project) {
      addProjectConfiguration(tree, projectName, {
        root,
        sourceRoot: `${root}/tests`,
        projectType: 'application',
        implicitDependencies: [options.appName],
        tags: [`app:${options.directory}`, 'type:app'],
        targets: uncachedTargets,
      });
    } else if (suite !== 'unit' && project && project.targets?.[prepared.target]?.cache !== false) {
      updateProjectConfiguration(tree, projectName, {
        ...project,
        targets: { ...project.targets, ...uncachedTargets },
      });
    }

    const substitutions = {
      ownership,
      projectName: JSON.stringify(projectName),
      ...(suite === 'e2e' && {
        directory: options.directory,
        appName: JSON.stringify(options.appName),
      }),
      ...(suite === 'browser' && {
        globalStyles: path.posix.relative(`${root}/tests`, options.globalStyles).replace(/\.scss$/, ''),
      }),
      workspacePath: path.posix.relative(root, '.'),
      extendsConfig: tree.exists(`${root}/tsconfig.lib.json`) ? 'tsconfig.lib.json' : 'tsconfig.json',
    };

    const skipped = keepFiles(tree, suite, root, substitutions);

    if (addExample) {
      keepFiles(tree, `${suite}-example`, root, substitutions);
    } else {
      skipped.push(...preservedSpecs(tests));
    }

    reportSkipped(suite, root, skipped);
    prepared.commit();
  } catch (error) {
    if (!(error instanceof Error)) {
      throw error;
    }

    warnTestConflict(suite, projectName, error.message);
  }
}
