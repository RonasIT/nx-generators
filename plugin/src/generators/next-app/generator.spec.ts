/// <reference types="jest" />
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as devkit from '@nx/devkit';
import {
  runAppEnvGenerator,
  runApiClientGenerator,
  runStoreGenerator,
  runI18nNextGenerator,
  runNavigationUtilsGenerator,
} from '../../shared/generators';
import { confirm } from '../../shared/utils';
import { nextAppGenerator } from './generator';

jest.mock('child_process', () => ({
  execSync: jest.fn(),
}));

jest.mock('fs', () => ({
  existsSync: jest.fn(),
}));

jest.mock('../../shared/generators', () => ({
  runAppEnvGenerator: jest.fn(),
  runApiClientGenerator: jest.fn(),
  runFormUtilsGenerator: jest.fn(),
  runStoreGenerator: jest.fn(),
  runI18nNextGenerator: jest.fn(),
  runNavigationUtilsGenerator: jest.fn(),
}));

jest.mock('../../shared/utils', () => ({
  confirm: jest.fn(),
  formatName: jest.fn((name) => name),
  getImportPathPrefix: jest.fn(() => '@myorg'),
  addNxAppTag: jest.fn(),
}));

jest.mock('@nx/devkit', () => {
  const original = jest.requireActual('@nx/devkit');

  return {
    ...original,
    readJson: jest.fn(),
    writeJson: jest.fn(),
    generateFiles: jest.fn(),
    formatFiles: jest.fn(),
    addDependenciesToPackageJson: jest.fn(),
    installPackagesTask: jest.fn(),
  };
});

describe('nextAppGenerator', () => {
  const tree = {} as any;
  const optionsBase = {
    name: 'testapp',
    directory: 'testapp',
    withStore: true,
    withApiClient: undefined,
    withFormUtils: false,
    withSentry: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should install @nx/next plugin and generate app if app folder does not exist', async () => {
    (fs.existsSync as jest.Mock).mockReturnValue(false);
    (confirm as jest.Mock).mockResolvedValue(true);
    (devkit.readJson as jest.Mock).mockReturnValue({ include: [] });

    await nextAppGenerator(tree, optionsBase);

    expect(execSync).toHaveBeenCalledWith('npx nx add @nx/next', { stdio: 'inherit' });
    expect(execSync).toHaveBeenCalledWith(expect.stringContaining(`npx nx g @nx/next:app ${optionsBase.name}`), {
      stdio: 'inherit',
    });
    expect(runAppEnvGenerator).toHaveBeenCalled();
    expect(runI18nNextGenerator).toHaveBeenCalled();
    expect(runNavigationUtilsGenerator).toHaveBeenCalled();
    expect(runStoreGenerator).toHaveBeenCalled();
  });

  it('should ask to create api client lib if withStore true and withApiClient undefined', async () => {
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    (confirm as jest.Mock).mockResolvedValue(true);
    (devkit.readJson as jest.Mock).mockReturnValue({ include: [] });

    const options = { ...optionsBase, withApiClient: undefined };
    await nextAppGenerator(tree, options);

    expect(confirm).toHaveBeenCalledWith('Do you want to create api client lib?');
    expect(runApiClientGenerator).toHaveBeenCalled();
  });

  it('should not ask to create api client lib if withApiClient boolean', async () => {
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    (devkit.readJson as jest.Mock).mockReturnValue({ include: [] });

    const options = { ...optionsBase, withApiClient: false };
    await nextAppGenerator(tree, options);

    expect(confirm).not.toHaveBeenCalled();
    expect(runApiClientGenerator).not.toHaveBeenCalled();
  });

  it('should delete unnecessary files and update tsconfig.json include', async () => {
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    (devkit.readJson as jest.Mock).mockReturnValue({ include: [] });

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

  it('should add files and dependencies and run formatFiles', async () => {
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    (devkit.readJson as jest.Mock).mockReturnValue({ include: ['.next/types/**/*.ts'] });

    await nextAppGenerator(tree, optionsBase);

    expect(devkit.generateFiles).toHaveBeenCalled();
    expect(devkit.addDependenciesToPackageJson).toHaveBeenCalledWith(
      tree,
      expect.objectContaining({}),
      expect.any(Object),
    );
    expect(devkit.formatFiles).toHaveBeenCalledWith(tree);
  });

  it('should run installPackagesTask and sentry & lib-tags generators after completion', async () => {
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    (devkit.readJson as jest.Mock).mockReturnValue({ include: ['.next/types/**/*.ts'] });

    const post = await nextAppGenerator(tree, optionsBase);

    post?.();

    expect(devkit.installPackagesTask).toHaveBeenCalledWith(tree);
    expect(execSync).not.toHaveBeenCalledWith(expect.stringContaining('sentry'));
    expect(execSync).toHaveBeenCalledWith('npx nx g lib-tags --skipRepoCheck', { stdio: 'inherit' });

    const optionsWithSentry = { ...optionsBase, withSentry: true };
    const postWithSentry = await nextAppGenerator(tree, optionsWithSentry);

    postWithSentry?.();

    expect(execSync).toHaveBeenCalledWith(
      expect.stringContaining('npx nx g sentry'),
      expect.objectContaining({ stdio: 'inherit' }),
    );
  });
});
