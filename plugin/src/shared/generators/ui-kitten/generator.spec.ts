/// <reference types="jest" />
import * as child_process from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as devkit from '@nx/devkit';
import * as utils from '../../utils';
import { runUIKittenGenerator } from './generator';

jest.mock('child_process', () => ({
  execSync: jest.fn(),
}));

jest.mock('fs', () => ({
  existsSync: jest.fn(),
}));

jest.mock('path', () => ({
  ...jest.requireActual('path'),
  join: jest.fn(),
}));

jest.mock('@nx/devkit', () => ({
  addDependenciesToPackageJson: jest.fn(),
  formatFiles: jest.fn(),
  generateFiles: jest.fn(),
}));

jest.mock('../../utils', () => ({
  formatName: jest.fn().mockImplementation((name) => `formatted-${name}`),
  formatAppIdentifier: jest.fn().mockImplementation((name) => `id-${name}`),
  getImportPathPrefix: jest.fn(),
  LibraryType: {
    FEATURES: 'features',
  },
}));

describe('runUIKittenGenerator', () => {
  const tree = {
    delete: jest.fn(),
    read: jest.fn().mockReturnValue('existing content\n'),
    write: jest.fn(),
  } as unknown as devkit.Tree;

  const options = { directory: 'test-app' };

  beforeEach(() => {
    jest.clearAllMocks();
    (utils.getImportPathPrefix as jest.Mock).mockReturnValue('@myorg');
    (path.join as jest.Mock).mockImplementation((...args) => args.join('/'));
  });

  it('should generate theme lib, delete template file, generate files, update index, and add deps', async () => {
    (fs.existsSync as jest.Mock).mockReturnValue(true);

    await runUIKittenGenerator(tree, options);

    expect(child_process.execSync).toHaveBeenCalledWith(
      'npx nx g react-lib --app=test-app --scope=shared --type=features --name=user-theme-provider --withComponent=false',
      { stdio: 'inherit' },
    );

    expect(tree.delete).toHaveBeenCalledWith('libs/test-app/shared/features/user-theme-provider/src/index.ts');

    expect(devkit.generateFiles).toHaveBeenCalledWith(
      tree,
      expect.stringContaining('lib-files'),
      'libs/test-app',
      expect.objectContaining({
        directory: 'test-app',
        libPath: '@myorg/test-app',
      }),
    );

    expect(tree.read).toHaveBeenCalledWith('libs/test-app/shared/ui/styles/src/lib/index.ts');

    expect(tree.write).toHaveBeenCalledWith(
      'libs/test-app/shared/ui/styles/src/lib/index.ts',
      expect.stringContaining('export * from \'./create-adaptive-styles\';'),
    );

    expect(devkit.addDependenciesToPackageJson).toHaveBeenCalledTimes(2);
    expect(devkit.formatFiles).toHaveBeenCalledWith(tree);
  });

  it('should skip app package update if package.json does not exist', async () => {
    (fs.existsSync as jest.Mock).mockReturnValue(false);

    await runUIKittenGenerator(tree, options);

    expect(devkit.addDependenciesToPackageJson).toHaveBeenCalledTimes(1);
  });
});
