/// <reference types="jest" />
import * as fs from 'fs';
import * as path from 'path';
import { formatFiles, installPackagesTask, Tree } from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import * as utils from '../../shared/utils';
import { sentryGenerator } from './generator';
import * as sentryUtils from './utils';

jest.mock('@nx/devkit', () => ({
  formatFiles: jest.fn(),
  installPackagesTask: jest.fn(),
}));

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

  beforeEach(() => {
    jest.clearAllMocks();
    tree = createTreeWithEmptyWorkspace();
  });

  const simulateGenerateFiles = (tree: Tree, templateDir: string, targetDir: string): void => {
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

  const verifyGeneratedFilesFirstLine = (tree: Tree, templatesDir: string, targetDir: string): void => {
    const entries = fs.readdirSync(templatesDir, { withFileTypes: true });

    for (const entry of entries) {
      const templatePath = path.join(templatesDir, entry.name);

      if (entry.isDirectory()) {
        verifyGeneratedFilesFirstLine(tree, templatePath, path.join(targetDir, entry.name));
      } else if (entry.isFile()) {
        const expectedFirstLine = fs.readFileSync(templatePath, 'utf8').split('\n')[0].trim();
        const targetPath = path.join(targetDir, entry.name.replace(/\.template$/, '')).replace(/\\/g, '/');
        const actualContent = tree.read(targetPath)?.toString();

        expect(actualContent).toBeDefined();
        const actualFirstLine = actualContent?.split('\n')[0].trim();
        expect(actualFirstLine).toBe(expectedFirstLine);
      }
    }
  };

  it('should select project directory if not provided', async () => {
    (utils.selectProject as jest.Mock).mockResolvedValue({ path: 'apps/my-app' });
    (utils.getAppFrameworkName as jest.Mock).mockReturnValue('next');

    (sentryUtils.generateSentryNext as jest.Mock).mockImplementation((tree, opts, dir) => {
      simulateGenerateFiles(tree, path.join(__dirname, 'files'), dir);
    });

    const callback = await sentryGenerator(tree, { directory: undefined });

    expect(utils.selectProject).toHaveBeenCalledWith(tree, 'application', 'Select the application: ', true);
    expect(utils.getAppFrameworkName).toHaveBeenCalledWith(tree, 'apps/my-app');
    expect(sentryUtils.generateSentryNext).toHaveBeenCalledWith(tree, { directory: 'apps/my-app' }, 'apps/my-app');
    expect(sentryUtils.generateSentryExpo).not.toHaveBeenCalled();
    expect(formatFiles).toHaveBeenCalledWith(tree);

    verifyGeneratedFilesFirstLine(tree, path.join(__dirname, 'files'), 'apps/my-app');

    callback();
    expect(installPackagesTask).toHaveBeenCalledWith(tree);
  });

  it('should call generateSentryNext when framework is next', async () => {
    (utils.getAppFrameworkName as jest.Mock).mockReturnValue('next');

    (sentryUtils.generateSentryNext as jest.Mock).mockImplementation((tree, opts, dir) => {
      simulateGenerateFiles(tree, path.join(__dirname, 'files'), dir);
    });

    await sentryGenerator(tree, { directory: 'apps/my-app' });

    expect(sentryUtils.generateSentryNext).toHaveBeenCalledWith(tree, { directory: 'apps/my-app' }, 'apps/my-app');
    expect(sentryUtils.generateSentryExpo).not.toHaveBeenCalled();

    verifyGeneratedFilesFirstLine(tree, path.join(__dirname, 'files'), 'apps/my-app');
  });

  it('should call generateSentryExpo when framework is expo', async () => {
    (utils.getAppFrameworkName as jest.Mock).mockReturnValue('expo');

    (sentryUtils.generateSentryExpo as jest.Mock).mockImplementation((tree, opts, dir) => {
      simulateGenerateFiles(tree, path.join(__dirname, 'files'), dir);
    });

    await sentryGenerator(tree, { directory: 'apps/my-expo-app' });

    expect(sentryUtils.generateSentryExpo).toHaveBeenCalledWith(
      tree,
      { directory: 'apps/my-expo-app' },
      'apps/my-expo-app',
    );
    expect(sentryUtils.generateSentryNext).not.toHaveBeenCalled();

    verifyGeneratedFilesFirstLine(tree, path.join(__dirname, 'files'), 'apps/my-expo-app');
  });

  it('should do nothing if framework is unknown', async () => {
    (utils.getAppFrameworkName as jest.Mock).mockReturnValue('unknown');

    await sentryGenerator(tree, { directory: 'apps/unknown' });

    expect(sentryUtils.generateSentryNext).not.toHaveBeenCalled();
    expect(sentryUtils.generateSentryExpo).not.toHaveBeenCalled();
    expect(formatFiles).toHaveBeenCalledWith(tree);
  });
});
