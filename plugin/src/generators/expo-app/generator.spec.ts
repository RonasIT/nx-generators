/// <reference types="jest" />
import * as childProcess from 'child_process';
import * as fs from 'fs';
import * as devkit from '@nx/devkit';
import {
  runAppEnvGenerator,
  runApiClientGenerator,
  runStorageGenerator,
  runRNStylesGenerator,
  runFormUtilsGenerator,
  runStoreGenerator,
  runUIKittenGenerator,
} from '../../shared/generators';
import { addNxAppTag, confirm } from '../../shared/utils';
import { expoAppGenerator } from './generator';
import scripts from './scripts';

jest.mock('child_process', () => ({
  execSync: jest.fn(),
}));

jest.mock('fs', () => ({
  existsSync: jest.fn(),
  rmSync: jest.fn(),
}));

jest.mock('@nx/devkit', () => ({
  readProjectConfiguration: jest.fn(),
  updateProjectConfiguration: jest.fn(),
  readJson: jest.fn(),
  writeJson: jest.fn(),
  generateFiles: jest.fn(),
  addDependenciesToPackageJson: jest.fn(),
  formatFiles: jest.fn(),
  installPackagesTask: jest.fn(),
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

jest.mock('../../shared/utils', () => ({
  formatName: jest.fn((name) => name),
  formatAppIdentifier: jest.fn(),
  addNxAppTag: jest.fn(),
  getImportPathPrefix: jest.fn(() => 'libs'),
  confirm: jest.fn(),
}));

jest.mock('./scripts', () => ({
  __esModule: true,
  default: { start: 'start', test: 'test' },
}));

describe('expoAppGenerator', () => {
  const tree = {
    delete: jest.fn(),
  } as unknown as devkit.Tree;

  const options = {
    directory: 'myapp',
    name: 'MyApp',
    withStore: true,
    withFormUtils: true,
    withUIKitten: true,
    withSentry: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (confirm as jest.Mock).mockResolvedValue(true);
    (fs.existsSync as jest.Mock).mockReturnValue(false);
    (devkit.readProjectConfiguration as jest.Mock).mockReturnValue({ name: options.directory, tags: [] });
    (devkit.readJson as jest.Mock).mockReturnValue({ scripts: { oldScript: 'old' } });
  });

  it('should run generator with all options enabled and update project config if exists', async () => {
    (fs.existsSync as jest.Mock).mockImplementation((path) => path === `apps/${options.directory}`);

    const callback = await expoAppGenerator(tree, options);

    expect(childProcess.execSync).toHaveBeenCalledWith('npx nx add @nx/expo', { stdio: 'inherit' });
    expect(devkit.readProjectConfiguration).toHaveBeenCalledWith(tree, options.directory);
    expect(devkit.updateProjectConfiguration).toHaveBeenCalled();

    expect(runAppEnvGenerator).toHaveBeenCalledWith(
      tree,
      expect.objectContaining({ baseGeneratorType: expect.anything() }),
    );
    expect(runStorageGenerator).toHaveBeenCalledWith(tree, options);
    expect(runRNStylesGenerator).toHaveBeenCalledWith(tree, options);
    expect(runStoreGenerator).toHaveBeenCalledWith(tree, expect.any(Object));
    expect(runApiClientGenerator).toHaveBeenCalledWith(tree, options);
    expect(runFormUtilsGenerator).toHaveBeenCalledWith(tree, options);
    expect(runUIKittenGenerator).toHaveBeenCalledWith(tree, options);

    expect(tree.delete).toHaveBeenCalledWith(`apps/${options.directory}/src`);
    expect(devkit.readJson).toHaveBeenCalledWith(tree, `apps/${options.directory}/package.json`);
    expect(devkit.writeJson).toHaveBeenCalledWith(
      tree,
      `apps/${options.directory}/package.json`,
      expect.objectContaining({
        main: 'expo-router/entry',
        scripts: expect.objectContaining({
          ...scripts,
          oldScript: 'old',
        }),
      }),
    );
    expect(devkit.generateFiles).toHaveBeenCalledTimes(2);
    expect(devkit.addDependenciesToPackageJson).toHaveBeenCalledTimes(2);
    expect(devkit.formatFiles).toHaveBeenCalledWith(tree);
    expect(addNxAppTag).toHaveBeenCalledWith(tree, options.directory);

    callback();

    expect(devkit.installPackagesTask).toHaveBeenCalledWith(tree);
    expect(childProcess.execSync).toHaveBeenCalledWith('npx expo install --fix', { stdio: 'inherit' });
    expect(childProcess.execSync).toHaveBeenCalledWith(`npx nx g auth ${options.directory}`, { stdio: 'inherit' });
    expect(childProcess.execSync).toHaveBeenCalledWith(`npx nx g sentry --directory=apps/${options.directory}`, {
      stdio: 'inherit',
    });
    expect(childProcess.execSync).toHaveBeenCalledWith('npx nx g lib-tags --skipRepoCheck', { stdio: 'inherit' });
  });

  it('should run generator with non-existing app root and not update project config', async () => {
    (fs.existsSync as jest.Mock).mockReturnValue(false);

    const callback = await expoAppGenerator(tree, options);

    expect(childProcess.execSync).toHaveBeenCalledWith('npx nx add @nx/expo', { stdio: 'inherit' });
    expect(devkit.readProjectConfiguration).not.toHaveBeenCalled();
    expect(devkit.updateProjectConfiguration).not.toHaveBeenCalled();

    expect(childProcess.execSync).toHaveBeenCalledWith(
      expect.stringContaining(`npx nx g @nx/expo:app ${options.name}`),
      { stdio: 'inherit' },
    );

    expect(callback).toBeInstanceOf(Function);
  });

  it('should delete e2e folder if exists', async () => {
    (fs.existsSync as jest.Mock).mockImplementation((p) => p === `apps/${options.directory}-e2e`);

    await expoAppGenerator(tree, options);

    expect(fs.rmSync).toHaveBeenCalledWith(`apps/${options.directory}-e2e`, { recursive: true, force: true });
  });

  it('should skip generating api client and auth libs if confirm returns false', async () => {
    (confirm as jest.Mock)
      .mockResolvedValueOnce(false) // shouldGenerateApiClientLib false
      .mockResolvedValueOnce(false);

    const opts = { ...options, withStore: true };
    const callback = await expoAppGenerator(tree, opts);

    expect(runApiClientGenerator).not.toHaveBeenCalled();
    // Callback should not run auth lib generation because API client lib was not generated
    callback();
    expect(childProcess.execSync).not.toHaveBeenCalledWith(`npx nx g auth ${opts.directory}`, expect.anything());
  });
});
