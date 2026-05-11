/// <reference types="jest" />
import * as fs from 'fs';
import * as path from 'path';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import {
  assertFirstLine,
  expoAppConfigMinimal,
  expoMetroMinimal,
  expoRootLayoutMinimal,
  formatFilesMock,
  installPackagesTaskMock,
  nextConfigComposeWithNxMinimal,
} from '../../shared/tests-utils';
import * as utils from '../../shared/utils';
import { sentryGenerator } from './generator';
import * as sentryUtils from './utils';
import { generateSentryExpo } from './utils/generate-sentry-expo';
import { generateSentryNext } from './utils/generate-sentry-next';

jest.mock('../../shared/utils', () => {
  const actual = jest.requireActual('../../shared/utils');

  return {
    ...actual,
    selectProject: jest.fn(),
    getAppFrameworkName: jest.fn(),
  };
});

jest.mock('./utils', () => ({
  generateSentryNext: jest.fn(),
  generateSentryExpo: jest.fn(),
}));

describe('sentryGenerator', () => {
  let tree: ReturnType<typeof createTreeWithEmptyWorkspace>;
  const directory = 'apps/my-app';
  const templatesDir = path.join(__dirname, 'files');

  beforeEach(() => {
    jest.clearAllMocks();
    tree = createTreeWithEmptyWorkspace();
  });

  const simulateGenerateFiles = (
    tree: ReturnType<typeof createTreeWithEmptyWorkspace>,
    templateDir: string,
    targetDir: string,
  ): void => {
    const entries = fs.readdirSync(templateDir, { withFileTypes: true });

    for (const entry of entries) {
      const templatePath = path.join(templateDir, entry.name);
      const targetPath = path.join(targetDir, entry.name.replace(/\.template$/, '')).replace(/\\/g, '/');

      if (entry.isDirectory()) {
        simulateGenerateFiles(tree, templatePath, path.join(targetDir, entry.name));
      } else {
        const content = fs.readFileSync(templatePath, 'utf8');
        tree.write(targetPath, content);
      }
    }
  };

  it('should select project directory if not provided', async () => {
    (utils.selectProject as jest.Mock).mockResolvedValue({ path: directory });
    (utils.getAppFrameworkName as jest.Mock).mockReturnValue('next');

    (sentryUtils.generateSentryNext as jest.Mock).mockImplementation((tree, _opts, dir) => {
      simulateGenerateFiles(tree, path.join(__dirname, 'files'), dir);
    });

    const callback = await sentryGenerator(tree, { directory: undefined });

    expect(utils.selectProject).toHaveBeenCalledWith(tree, 'application', 'Select the application: ', true);
    expect(utils.getAppFrameworkName).toHaveBeenCalledWith(tree, directory);
    expect(sentryUtils.generateSentryNext).toHaveBeenCalledWith(tree, { directory }, directory);
    expect(sentryUtils.generateSentryExpo).not.toHaveBeenCalled();
    expect(formatFilesMock).toHaveBeenCalledWith(tree);

    assertFirstLine(templatesDir, directory, tree);

    callback();
    expect(installPackagesTaskMock).toHaveBeenCalledWith(tree);
  });

  it('should call generateSentryNext when framework is next', async () => {
    (utils.getAppFrameworkName as jest.Mock).mockReturnValue('next');

    (sentryUtils.generateSentryNext as jest.Mock).mockImplementation((tree, _opts, dir) => {
      simulateGenerateFiles(tree, path.join(__dirname, 'files'), dir);
    });

    await sentryGenerator(tree, { directory });

    expect(sentryUtils.generateSentryNext).toHaveBeenCalledWith(tree, { directory }, directory);
    expect(sentryUtils.generateSentryExpo).not.toHaveBeenCalled();

    assertFirstLine(templatesDir, directory, tree);
  });

  it('should call generateSentryExpo when framework is expo', async () => {
    const expoDirectory = 'apps/my-expo-app';
    (utils.getAppFrameworkName as jest.Mock).mockReturnValue('expo');

    (sentryUtils.generateSentryExpo as jest.Mock).mockImplementation((tree, _opts, dir) => {
      simulateGenerateFiles(tree, path.join(__dirname, 'files'), dir);
    });

    await sentryGenerator(tree, { directory: expoDirectory });

    expect(sentryUtils.generateSentryExpo).toHaveBeenCalledWith(tree, { directory: expoDirectory }, expoDirectory);
    expect(sentryUtils.generateSentryNext).not.toHaveBeenCalled();

    assertFirstLine(templatesDir, expoDirectory, tree);
  });

  it('should do nothing if framework is unknown', async () => {
    (utils.getAppFrameworkName as jest.Mock).mockReturnValue('unknown');

    await sentryGenerator(tree, { directory: 'apps/unknown' });

    expect(sentryUtils.generateSentryNext).not.toHaveBeenCalled();
    expect(sentryUtils.generateSentryExpo).not.toHaveBeenCalled();
    expect(formatFilesMock).toHaveBeenCalledWith(tree);
  });
});

describe('generateSentryExpo', () => {
  let tree: ReturnType<typeof createTreeWithEmptyWorkspace>;
  const projectRoot = 'apps/my-expo-app';

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
    tree.write(`${projectRoot}/package.json`, JSON.stringify({ name: 'my-expo-app' }, null, 2));
    tree.write(`${projectRoot}/app/_layout.tsx`, expoRootLayoutMinimal);
    tree.write(`${projectRoot}/app.config.ts`, expoAppConfigMinimal);
    tree.write(`${projectRoot}/metro.config.js`, expoMetroMinimal);
  });

  it('should append Sentry.init using Constants.expoConfig extra dsn to _layout.tsx', () => {
    const dsn = 'https://examplePublicKey@o0.ingest.sentry.io/0';

    generateSentryExpo(tree, { dsn }, projectRoot);

    const layout = tree.read(`${projectRoot}/app/_layout.tsx`, 'utf-8');

    expect(layout).toContain('Sentry.init({');
    expect(layout).toContain('dsn: Constants.expoConfig?.extra?.sentry?.dsn');

    const appConfig = tree.read(`${projectRoot}/app.config.ts`, 'utf-8');

    expect(appConfig).toContain(`dsn: "${dsn}"`);
    expect(appConfig).toContain('sentry:');
  });
});

describe('generateSentryNext', () => {
  let tree: ReturnType<typeof createTreeWithEmptyWorkspace>;
  const projectRoot = 'apps/my-next-app';

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
    tree.write(`${projectRoot}/package.json`, JSON.stringify({ name: 'my-next-app' }, null, 2));
    tree.write(`${projectRoot}/next.config.js`, nextConfigComposeWithNxMinimal);
    tree.write(`${projectRoot}/.env`, '');
    tree.write(`${projectRoot}/.env.development`, '');
    tree.write(`${projectRoot}/.env.production`, '');
  });

  it('should wrap next.config.js with withSentryConfig and generate templates with dsn', () => {
    const dsn = 'https://examplePublicKey@o0.ingest.sentry.io/0';

    generateSentryNext(tree, { directory: projectRoot, dsn }, projectRoot);

    const nextConfigContent = tree.read(`${projectRoot}/next.config.js`, 'utf-8');

    expect(nextConfigContent).toContain('withSentryConfig');
    expect(nextConfigContent).toContain('@sentry/nextjs');
    expect(nextConfigContent).toContain('sentryWebpackPluginOptions');

    const instrumentationClient = tree.read(`${projectRoot}/instrumentation-client.ts`, 'utf-8');

    expect(instrumentationClient).toContain(dsn);

    expect(tree.read(`${projectRoot}/.env`, 'utf-8')).toContain('SENTRY_AUTH_TOKEN=');
  });
});
