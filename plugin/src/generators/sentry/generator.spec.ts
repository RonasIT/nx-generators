/// <reference types="jest" />
import * as fs from 'fs';
import * as path from 'path';
import { formatFiles, installPackagesTask } from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import * as utils from '../../shared/utils';
import { assertFirstLine } from '../../shared/utils';
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
    expect(formatFiles).toHaveBeenCalledWith(tree);

    assertFirstLine(templatesDir, directory, tree);

    callback();
    expect(installPackagesTask).toHaveBeenCalledWith(tree);
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
    expect(formatFiles).toHaveBeenCalledWith(tree);
  });
});
