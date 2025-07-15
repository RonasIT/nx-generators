/// <reference types="jest" />
import * as path from 'path';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import * as sharedGenerators from '../../shared/generators';
import {
  addDependenciesMock,
  assertFirstLine,
  confirmMock,
  execSyncMock,
  existsSyncMock,
  formatFilesMock,
  generateFilesMock,
  installPackagesTaskMock,
  readJsonMock,
  writeJsonMock,
} from '../../shared/utils';
import { nextAppGenerator } from './generator';

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
    readJsonMock.mockImplementation((tree, filePath) => {
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
    existsSyncMock.mockReturnValue(false);
    confirmMock.mockResolvedValue(true);

    await nextAppGenerator(tree, optionsBase);

    expect(execSyncMock).toHaveBeenCalledWith('npx nx add @nx/next', { stdio: 'inherit' });
    const tags = `app:${optionsBase.directory}, type:app`;
    const expectedCommand =
      `npx nx g @nx/next:app ${optionsBase.name} ` +
      `--directory=apps/${optionsBase.directory} ` +
      `--tags="${tags}" ` +
      `--linter=none --appDir=true --style=scss --src=false ` +
      `--unitTestRunner=none --e2eTestRunner=none`;

    expect(execSyncMock).toHaveBeenCalledWith(expectedCommand, { stdio: 'inherit' });
    expect(sharedGenerators.runAppEnvGenerator).toHaveBeenCalled();
    expect(sharedGenerators.runI18nNextGenerator).toHaveBeenCalled();
    expect(sharedGenerators.runNavigationUtilsGenerator).toHaveBeenCalled();
  });

  it('should skip api client creation if withApiClient is false', async () => {
    existsSyncMock.mockReturnValue(true);

    await nextAppGenerator(tree, { ...optionsBase, withApiClient: false });

    expect(confirmMock).not.toHaveBeenCalled();
    expect(sharedGenerators.runApiClientGenerator).not.toHaveBeenCalled();
  });

  it('should delete files and update tsconfig include', async () => {
    existsSyncMock.mockReturnValue(true);

    await nextAppGenerator(tree, optionsBase);

    const appRoot = `apps/${optionsBase.directory}`;

    expect(tree.delete).toHaveBeenCalledWith(`${appRoot}/public/.gitkeep`);
    expect(tree.delete).toHaveBeenCalledWith(`${appRoot}/app/api`);
    expect(tree.delete).toHaveBeenCalledWith(`${appRoot}/app/page.tsx`);
    expect(tree.delete).toHaveBeenCalledWith(`${appRoot}/specs`);

    expect(writeJsonMock).toHaveBeenCalledWith(
      expect.anything(),
      `${appRoot}/tsconfig.json`,
      expect.objectContaining({
        include: expect.arrayContaining(['.next/types/**/*.ts']),
      }),
    );
  });

  it('should generate files, add dependencies, and run formatFiles', async () => {
    existsSyncMock.mockReturnValue(true);

    await nextAppGenerator(tree, optionsBase);

    expect(generateFilesMock).toHaveBeenCalled();
    expect(addDependenciesMock).toHaveBeenCalled();
    expect(formatFilesMock).toHaveBeenCalledWith(tree);
  });

  it('should run post install tasks correctly', async () => {
    existsSyncMock.mockReturnValue(true);

    const post = await nextAppGenerator(tree, optionsBase);
    post?.();

    expect(installPackagesTaskMock).toHaveBeenCalledWith(tree);
    expect(execSyncMock).toHaveBeenCalledWith('npx nx g lib-tags --skipRepoCheck', { stdio: 'inherit' });

    const optionsWithSentry = { ...optionsBase, withSentry: true };
    const postWithSentry = await nextAppGenerator(tree, optionsWithSentry);
    postWithSentry?.();

    expect(execSyncMock).toHaveBeenCalledWith(expect.stringContaining('npx nx g sentry'), {
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
        libPath: `@proj/${optionsBase.directory}`,
      },
    });
  });
});
