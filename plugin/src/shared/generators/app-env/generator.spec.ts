/// <reference types="jest" />
import * as child_process from 'child_process';
import * as path from 'path';
import * as devkit from '@nx/devkit';
import { BaseGeneratorType } from '../../enums';
import { runAppEnvGenerator } from './generator';

jest.mock('child_process', () => ({
  execSync: jest.fn(),
}));

jest.mock('path', () => ({
  ...jest.requireActual('path'),
  join: jest.fn(),
}));

jest.mock('@nx/devkit', () => ({
  generateFiles: jest.fn(),
  formatFiles: jest.fn(),
}));

jest.mock('../../utils', () => ({
  formatName: jest.fn((name) => `formatted-${name}`),
  formatAppIdentifier: jest.fn((id) => `appId-${id}`),
  getImportPathPrefix: jest.fn(() => '@prefix'),
}));

describe('runAppEnvGenerator', () => {
  const tree = {
    delete: jest.fn(),
  } as unknown as devkit.Tree;

  const options = {
    name: 'MyApp',
    directory: 'my-app',
    baseGeneratorType: BaseGeneratorType.EXPO_APP,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (path.join as jest.Mock).mockImplementation((...args) => args.join('/'));
  });

  it('should run nx generate command, delete file, generate files, and format files', async () => {
    await runAppEnvGenerator(tree, options);

    expect(child_process.execSync).toHaveBeenCalledWith(
      `npx nx g react-lib --app=${options.directory} --scope=shared --type=utils --name=app-env`,
      { stdio: 'inherit' },
    );

    expect(tree.delete).toHaveBeenCalledWith(`libs/${options.directory}/shared/utils/app-env/src/index.ts`);

    expect(devkit.generateFiles).toHaveBeenCalledWith(
      tree,
      expect.stringContaining('lib-files'),
      `libs/${options.directory}`,
      expect.objectContaining({
        ...options,
        formatName: expect.any(Function),
        formatAppIdentifier: expect.any(Function),
        libPath: '@prefix/my-app',
        appType: BaseGeneratorType.EXPO_APP.split('-')[0].toUpperCase(),
      }),
    );

    expect(devkit.formatFiles).toHaveBeenCalledWith(tree);
  });
});
