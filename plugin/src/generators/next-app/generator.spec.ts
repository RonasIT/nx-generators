/// <reference types="jest" />
import * as childProcess from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as devkit from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import * as sharedGenerators from '../../shared/generators';
import * as sharedUtils from '../../shared/utils';
import { assertFirstLine, mockGenerateFiles } from '../../shared/utils';
import { nextAppGenerator } from './generator';

jest.mock('child_process');
jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  existsSync: jest.fn(),
}));

jest.mock('../../shared/generators', () => {
  const actual = jest.requireActual('../../shared/generators');

  return {
    ...actual,
    runAppEnvGenerator: jest.fn(),
    runApiClientGenerator: jest.fn(),
    runI18nNextGenerator: jest.fn(),
    runNavigationUtilsGenerator: jest.fn(),
  };
});

jest.mock('../../shared/utils', () => {
  const actual = jest.requireActual('../../shared/utils');

  return {
    ...actual,
    confirm: jest.fn(),
  };
});

jest.mock('@nx/devkit', () => {
  const actual = jest.requireActual('@nx/devkit');

  return {
    ...actual,
    readJson: jest.fn(),
    writeJson: jest.fn(),
    generateFiles: jest.fn((tree, src, dest, vars) => {
      mockGenerateFiles(tree, src, dest, vars);
    }),
    formatFiles: jest.fn(),
    addDependenciesToPackageJson: jest.fn(),
    installPackagesTask: jest.fn(),
  };
});

describe('nextAppGenerator with file content checks', () => {
  let tree: any;

  const optionsBase = {
    name: 'testapp',
    directory: 'web',
    withStore: false,
    withApiClient: false,
    withFormUtils: false,
    withSentry: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    tree = createTreeWithEmptyWorkspace();
    jest.spyOn(tree, 'write');
    jest.spyOn(tree, 'delete');
    tree.write(
      'eslint.constraints.json',
      JSON.stringify(
        [
          { sourceTag: 'app:shared', onlyDependOnLibsWithTags: ['app:shared'] },
          { sourceTag: 'scope:shared', onlyDependOnLibsWithTags: ['scope:shared'] },
        ],
        null,
        2,
      ),
    );
    (devkit.readJson as jest.Mock).mockImplementation((tree, filePath) => {
      if (filePath.endsWith('eslint.constraints.json')) {
        const content = tree.read(filePath)?.toString();

        return content ? JSON.parse(content) : [];
      }

      if (filePath.endsWith('tsconfig.json')) {
        return { include: [] };
      }

      return {};
    });
  });

  it('should install @nx/next plugin and generate app if app folder does not exist', async () => {
    (fs.existsSync as jest.Mock).mockReturnValue(false);
    (sharedUtils.confirm as jest.Mock).mockResolvedValue(true);

    await nextAppGenerator(tree, optionsBase);

    expect(childProcess.execSync).toHaveBeenCalledWith('npx nx add @nx/next', { stdio: 'inherit' });
    const tags = `app:${optionsBase.directory}, type:app`;
    const expectedCommand =
      `npx nx g @nx/next:app ${optionsBase.name} ` +
      `--directory=apps/${optionsBase.directory} ` +
      `--tags="${tags}" ` +
      `--linter=none --appDir=true --style=scss --src=false ` +
      `--unitTestRunner=none --e2eTestRunner=none`;

    expect(childProcess.execSync).toHaveBeenCalledWith(expectedCommand, { stdio: 'inherit' });
    expect(sharedGenerators.runAppEnvGenerator).toHaveBeenCalled();
    expect(sharedGenerators.runI18nNextGenerator).toHaveBeenCalled();
    expect(sharedGenerators.runNavigationUtilsGenerator).toHaveBeenCalled();
  });

  it('should skip api client creation if withApiClient is false', async () => {
    (fs.existsSync as jest.Mock).mockReturnValue(true);

    await nextAppGenerator(tree, { ...optionsBase, withApiClient: false });

    expect(sharedUtils.confirm).not.toHaveBeenCalled();
    expect(sharedGenerators.runApiClientGenerator).not.toHaveBeenCalled();
  });

  it('should delete files and update tsconfig include', async () => {
    (fs.existsSync as jest.Mock).mockReturnValue(true);

    await nextAppGenerator(tree, optionsBase);

    const appRoot = `apps/${optionsBase.directory}`;

    expect(tree.delete).toHaveBeenCalledWith(`${appRoot}/public/.gitkeep`);
    expect(tree.delete).toHaveBeenCalledWith(`${appRoot}/app/api`);
    expect(tree.delete).toHaveBeenCalledWith(`${appRoot}/app/page.tsx`);
    expect(tree.delete).toHaveBeenCalledWith(`${appRoot}/specs`);

    expect(devkit.writeJson).toHaveBeenCalledWith(
      expect.anything(),
      `${appRoot}/tsconfig.json`,
      expect.objectContaining({
        include: expect.arrayContaining(['.next/types/**/*.ts']),
      }),
    );
  });

  it('should generate files, add dependencies, and run formatFiles', async () => {
    (fs.existsSync as jest.Mock).mockReturnValue(true);

    await nextAppGenerator(tree, optionsBase);

    expect(devkit.generateFiles).toHaveBeenCalled();
    expect(devkit.addDependenciesToPackageJson).toHaveBeenCalled();
    expect(devkit.formatFiles).toHaveBeenCalledWith(tree);
  });

  it('should run post install tasks correctly', async () => {
    (fs.existsSync as jest.Mock).mockReturnValue(true);

    const post = await nextAppGenerator(tree, optionsBase);
    post?.();

    expect(devkit.installPackagesTask).toHaveBeenCalledWith(tree);
    expect(childProcess.execSync).toHaveBeenCalledWith('npx nx g lib-tags --skipRepoCheck', { stdio: 'inherit' });

    const optionsWithSentry = { ...optionsBase, withSentry: true };
    const postWithSentry = await nextAppGenerator(tree, optionsWithSentry);
    postWithSentry?.();

    expect(childProcess.execSync).toHaveBeenCalledWith(expect.stringContaining('npx nx g sentry'), {
      stdio: 'inherit',
    });
  });

  it('should generate files and validate their first line against templates', async () => {
    await nextAppGenerator(tree, {
      name: optionsBase.name,
      directory: optionsBase.directory,
      withStore: false,
      withApiClient: false,
      withFormUtils: false,
      withSentry: false,
    });

    const templatesDir = path.join(__dirname, 'files');
    const targetRoot = `apps/${optionsBase.directory}`;

    assertFirstLine(templatesDir, targetRoot, tree, {
      ignoreFiles: ['providers.tsx.template'],
      placeholders: {
        libPath: `/${optionsBase.directory}`,
      },
    });
  });
});
