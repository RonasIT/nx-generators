/// <reference types="jest" />
import * as child_process from 'child_process';
import * as path from 'path';
import * as devkit from '@nx/devkit';
import * as utils from '../../utils';
import { runStorageGenerator } from './generator';

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
  formatName: jest.fn().mockImplementation((s) => `formatted-${s}`),
  formatAppIdentifier: jest.fn().mockImplementation((s) => `app-${s}`),
  getImportPathPrefix: jest.fn(),
}));

describe('runStorageGenerator', () => {
  const tree = {
    delete: jest.fn(),
  } as unknown as devkit.Tree;

  const options = {
    name: 'storage',
    directory: 'mobile-app',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (utils.getImportPathPrefix as jest.Mock).mockReturnValue('@myorg');
    (path.join as jest.Mock).mockImplementation((...args) => args.join('/'));
  });

  it('should generate the library, delete the original index.ts, generate new files, and format', async () => {
    await runStorageGenerator(tree, options);

    expect(child_process.execSync).toHaveBeenCalledWith(
      `npx nx g react-lib --app=${options.directory} --scope=shared --type=data-access --name=storage`,
      { stdio: 'inherit' },
    );

    expect(tree.delete).toHaveBeenCalledWith('libs/mobile-app/shared/data-access/storage/src/index.ts');

    expect(devkit.generateFiles).toHaveBeenCalledWith(
      tree,
      expect.stringContaining('lib-files'),
      'libs/mobile-app',
      expect.objectContaining({
        name: 'storage',
        directory: 'mobile-app',
        formatName: expect.any(Function),
        formatAppIdentifier: expect.any(Function),
        libPath: '@myorg/mobile-app',
      }),
    );

    expect(devkit.formatFiles).toHaveBeenCalledWith(tree);
  });
});
