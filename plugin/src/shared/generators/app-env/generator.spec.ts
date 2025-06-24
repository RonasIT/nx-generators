/// <reference types="jest" />
import * as path from 'path';
import * as devkit from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { vol } from 'memfs';
import { BaseGeneratorType } from '../../enums';
import { runAppEnvGenerator } from './generator';

jest.mock('child_process', () => ({
  execSync: jest.fn(),
}));

jest.mock('@nx/devkit', () => {
  const original = jest.requireActual('@nx/devkit');

  return {
    ...original,
    generateFiles: jest.fn(),
    formatFiles: jest.fn(),
  };
});

jest.mock('../../utils', () => ({
  formatName: jest.fn((name: string) => `Formatted${name}`),
  formatAppIdentifier: jest.fn((name: string) => `AppId${name}`),
  getImportPathPrefix: jest.fn(() => '@org'),
}));

const execSyncMock = require('child_process').execSync;

const generateFilesMock = devkit.generateFiles as jest.Mock;
const formatFilesMock = devkit.formatFiles as jest.Mock;

describe('runAppEnvGenerator', () => {
  let tree: devkit.Tree;

  beforeEach(() => {
    vol.reset();
    tree = createTreeWithEmptyWorkspace();

    // Setup a dummy file that will be deleted
    tree.write('libs/myapp/shared/utils/app-env/src/index.ts', 'export {}');

    jest.clearAllMocks();
  });

  it('should generate app-env lib, delete default index.ts and generate custom files', async () => {
    const options = {
      name: 'myapp',
      directory: 'myapp',
      baseGeneratorType: BaseGeneratorType.EXPO_APP,
    };

    await runAppEnvGenerator(tree, options);

    // Check execSync called with expected nx generate command
    expect(execSyncMock).toHaveBeenCalledWith(
      'npx nx g react-lib --app=myapp --scope=shared --type=utils --name=app-env',
      { stdio: 'inherit' },
    );

    // Check the default index.ts was deleted
    expect(tree.exists('libs/myapp/shared/utils/app-env/src/index.ts')).toBe(false);

    // Check generateFiles called with correct arguments
    expect(generateFilesMock).toHaveBeenCalledWith(
      tree,
      path.join(__dirname, 'lib-files'),
      'libs/myapp',
      expect.objectContaining({
        name: 'myapp',
        directory: 'myapp',
        baseGeneratorType: 'expo-app',
        libPath: '@org/myapp',
        appType: 'EXPO',
        formatName: expect.any(Function),
        formatAppIdentifier: expect.any(Function),
      }),
    );

    // Check formatFiles was called
    expect(formatFilesMock).toHaveBeenCalledWith(tree);
  });
});
