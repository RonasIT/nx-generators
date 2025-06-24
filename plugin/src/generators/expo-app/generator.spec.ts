/// <reference types="jest" />
import * as fs from 'fs';
import * as devkit from '@nx/devkit';
import { Tree } from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import * as utils from '../../shared/utils';
import expoAppGenerator from './generator';

jest.mock('child_process', () => ({ execSync: jest.fn() }));
jest.mock('fs', () => ({ existsSync: jest.fn(), rmSync: jest.fn() }));
jest.mock('../../shared/utils', () => ({
  ...jest.requireActual('../../shared/utils'),
  confirm: jest.fn(() => Promise.resolve(true)),
  getImportPathPrefix: jest.fn(() => 'libs'),
  addNxAppTag: jest.fn(),
  formatName: jest.fn((v) => v),
  formatAppIdentifier: jest.fn(() => 'my-app-id'),
}));

jest.mock('../../shared/generators', () => ({
  runAppEnvGenerator: jest.fn(),
  runApiClientGenerator: jest.fn(),
  runStorageGenerator: jest.fn(),
  runRNStylesGenerator: jest.fn(),
  runFormUtilsGenerator: jest.fn(),
  runStoreGenerator: jest.fn(),
  runUIKittenGenerator: jest.fn(),
  runNavigationUtilsGenerator: jest.fn(),
}));

jest.mock('@nx/devkit', () => ({
  ...jest.requireActual('@nx/devkit'),
  readJson: jest.fn(() => ({ scripts: { dev: 'old-dev' } })),
  writeJson: jest.fn(),
  readProjectConfiguration: jest.fn(() => ({ name: 'myapp', tags: [] })),
  updateProjectConfiguration: jest.fn(),
  addDependenciesToPackageJson: jest.fn(),
  formatFiles: jest.fn(),
  generateFiles: jest.fn(),
  installPackagesTask: jest.fn(),
}));

describe('expoAppGenerator integration', () => {
  let tree: Tree;

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
    jest.clearAllMocks();
  });

  it('should generate files and update project configuration correctly', async () => {
    (fs.existsSync as jest.Mock).mockImplementation((path: string) => {
      return path.includes('apps/myapp') || path.includes('apps/myapp-e2e');
    });

    const callback = await expoAppGenerator(tree, {
      name: 'MyApp',
      directory: 'myapp',
      withStore: true,
      withFormUtils: true,
      withUIKitten: true,
      withSentry: true,
    });

    expect(devkit.readProjectConfiguration).toHaveBeenCalledWith(tree, 'myapp');
    expect(devkit.updateProjectConfiguration).toHaveBeenCalledWith(tree, 'myapp', expect.any(Object));

    expect(devkit.generateFiles).toHaveBeenCalledWith(
      tree,
      expect.stringContaining('app-files'),
      expect.stringContaining('apps/myapp'),
      expect.objectContaining({ appDirectory: 'myapp' }),
    );

    expect(devkit.generateFiles).toHaveBeenCalledWith(
      tree,
      expect.stringContaining('i18n'),
      expect.stringContaining('i18n/myapp'),
      {},
    );

    expect(devkit.writeJson).toHaveBeenCalledWith(
      tree,
      expect.stringContaining('apps/myapp/package.json'),
      expect.objectContaining({
        main: 'expo-router/entry',
        scripts: expect.objectContaining({ dev: 'old-dev' }),
      }),
    );

    expect(utils.addNxAppTag).toHaveBeenCalledWith(tree, 'myapp');
    expect(callback).toBeInstanceOf(Function);
  });
});
