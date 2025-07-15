/// <reference types="jest" />
import * as path from 'path';
import * as devkit from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { BaseGeneratorType } from '../../enums';
import * as utils from '../../utils';
import { assertFirstLine, execSyncMock, generateFilesMock } from '../../utils';
import { runNavigationUtilsGenerator } from './generator';

jest.mock('../../utils', () => ({
  ...jest.requireActual('../../utils'),
  appendFileContent: jest.fn(),
}));

const appendFileContentMock = utils.appendFileContent as jest.Mock;

describe('runNavigationUtilsGenerator', () => {
  let tree: devkit.Tree;
  const libsPath = 'libs/myapp';
  const commonLibFiles = 'common-lib-files';
  const nextAppLibFiles = 'next-app-lib-files';
  const indexFilePath = 'libs/myapp/shared/utils/navigation/src/index.ts';
  const appDirectory = 'myapp';
  const createOptions = (type: BaseGeneratorType): { appDirectory: string; baseGeneratorType: BaseGeneratorType } => ({
    appDirectory: 'myapp',
    baseGeneratorType: type,
  });

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();

    // Create dummy index.ts file that should be deleted
    tree.write(indexFilePath, 'export {};');

    jest.clearAllMocks();
  });

  it('should run react-lib generation and generate common files', async () => {
    await runNavigationUtilsGenerator(tree, createOptions(BaseGeneratorType.EXPO_APP));

    expect(execSyncMock).toHaveBeenCalledWith(
      `npx nx g react-lib --app=${appDirectory} --scope=shared --type=utils --name=navigation`,
      { stdio: 'inherit' },
    );

    expect(generateFilesMock).toHaveBeenCalledWith(tree, path.join(__dirname, `/${commonLibFiles}`), libsPath, {});

    expect(appendFileContentMock).not.toHaveBeenCalled();
  });

  it('should generate additional next-app files and append content for NEXT_APP type', async () => {
    await runNavigationUtilsGenerator(tree, createOptions(BaseGeneratorType.NEXT_APP));

    expect(generateFilesMock).toHaveBeenCalledWith(tree, path.join(__dirname, `/${commonLibFiles}`), libsPath, {});

    expect(generateFilesMock).toHaveBeenCalledWith(tree, path.join(__dirname, `/${nextAppLibFiles}`), libsPath, {});

    expect(appendFileContentMock).toHaveBeenCalledWith(
      'libs/myapp/shared/utils/navigation/src/lib/index.ts',
      `export * from './hooks';\nexport * from './types';`,
      tree,
    );
  });

  it('should validate first lines of generated files against templates', async () => {
    await runNavigationUtilsGenerator(tree, createOptions(BaseGeneratorType.NEXT_APP));

    assertFirstLine(path.join(__dirname, commonLibFiles), libsPath, tree);
    assertFirstLine(path.join(__dirname, nextAppLibFiles), libsPath, tree);
  });
});
