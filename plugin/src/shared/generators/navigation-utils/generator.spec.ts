/// <reference types="jest" />
import * as child_process from 'child_process';
import * as path from 'path';
import * as devkit from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { BaseGeneratorType } from '../../enums';
import * as utils from '../../utils';
import { runNavigationUtilsGenerator } from './generator';

jest.mock('child_process', () => ({
  execSync: jest.fn(),
}));

jest.mock('@nx/devkit', () => {
  const original = jest.requireActual('@nx/devkit');

  return {
    ...original,
    generateFiles: jest.fn(),
  };
});

jest.mock('../../utils', () => ({
  appendFileContent: jest.fn(),
}));

const execSyncMock = child_process.execSync as jest.Mock;
const generateFilesMock = devkit.generateFiles as jest.Mock;
const appendFileContentMock = utils.appendFileContent as jest.Mock;

describe('runNavigationUtilsGenerator', () => {
  let tree: devkit.Tree;

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();

    // Create dummy index.ts file that should be deleted
    const libPath = 'libs/myapp/shared/utils/navigation/src/index.ts';
    tree.write(libPath, 'export {};');

    jest.clearAllMocks();
  });

  it('should run react-lib generation and generate common files', async () => {
    const options = {
      appDirectory: 'myapp',
      baseGeneratorType: BaseGeneratorType.NEXT_APP,
    };

    await runNavigationUtilsGenerator(tree, options);

    expect(execSyncMock).toHaveBeenCalledWith(
      'npx nx g react-lib --app=myapp --scope=shared --type=utils --name=navigation',
      { stdio: 'inherit' },
    );

    // index.ts should be deleted
    expect(tree.exists('libs/myapp/shared/utils/navigation/src/index.ts')).toBe(false);

    // generateFiles should be called once for common-lib-files
    expect(generateFilesMock).toHaveBeenCalledWith(tree, path.join(__dirname, '/common-lib-files'), 'libs/myapp', {});

    // appendFileContent should NOT be called for non NEXT_APP
    expect(appendFileContentMock).not.toHaveBeenCalled();
  });

  it('should generate additional next-app files and append content for NEXT_APP type', async () => {
    const options = {
      appDirectory: 'myapp',
      baseGeneratorType: BaseGeneratorType.NEXT_APP,
    };

    await runNavigationUtilsGenerator(tree, options);

    expect(generateFilesMock).toHaveBeenCalledWith(tree, path.join(__dirname, '/common-lib-files'), 'libs/myapp', {});

    expect(generateFilesMock).toHaveBeenCalledWith(tree, path.join(__dirname, '/next-app-lib-files'), 'libs/myapp', {});

    expect(appendFileContentMock).toHaveBeenCalledWith(
      'libs/myapp/shared/utils/navigation/src/lib/index.ts',
      `export * from './hooks';\nexport * from './types';`,
      tree,
    );
  });
});
