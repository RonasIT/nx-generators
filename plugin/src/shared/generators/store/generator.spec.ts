/// <reference types="jest" />
import * as child_process from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as devkit from '@nx/devkit';
import { BaseGeneratorType } from '../../enums';
import * as utils from '../../utils';
import { runStoreGenerator } from './generator';
import { StoreGeneratorSchema } from './schema';

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
  generateFiles: jest.fn(),
  formatFiles: jest.fn(),
}));

jest.mock('../../utils', () => ({
  formatName: jest.fn().mockImplementation((name) => `formatted-${name}`),
  formatAppIdentifier: jest.fn().mockImplementation((name) => `id-${name}`),
  getImportPathPrefix: jest.fn(),
}));

describe('runStoreGenerator', () => {
  const tree = {
    delete: jest.fn(),
  } as unknown as devkit.Tree;

  const options: StoreGeneratorSchema = {
    directory: 'my-app',
    baseGeneratorType: BaseGeneratorType.EXPO_APP,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (utils.getImportPathPrefix as jest.Mock).mockReturnValue('@myorg');
    (path.join as jest.Mock).mockImplementation((...args) => args.join('/'));
  });

  it('should generate store lib, delete files, generate new files, and add dependencies', async () => {
    (fs.existsSync as jest.Mock).mockReturnValue(true);

    await runStoreGenerator(tree, options);

    expect(child_process.execSync).toHaveBeenCalledWith(
      'npx nx g react-lib --app=my-app --scope=shared --type=data-access --name=store',
      { stdio: 'inherit' },
    );

    expect(tree.delete).toHaveBeenCalledWith('libs/my-app/shared/data-access/store/src/index.ts');

    const [treeArg, sourcePath, targetPath, templateVars] = (devkit.generateFiles as jest.Mock).mock.calls[0];

    expect(treeArg).toBe(tree);
    expect(sourcePath).toEqual(expect.stringContaining(`${BaseGeneratorType.EXPO_APP}/lib-files`));
    expect(targetPath).toBe('libs/my-app');
    expect(templateVars).toMatchObject({
      baseGeneratorType: BaseGeneratorType.EXPO_APP,
      directory: 'my-app',
      libPath: '@myorg/my-app',
    });

    expect(devkit.addDependenciesToPackageJson).toHaveBeenCalledTimes(2);
    expect(devkit.formatFiles).toHaveBeenCalledWith(tree);
  });

  it('should only add root-level dependencies if package.json does not exist', async () => {
    (fs.existsSync as jest.Mock).mockReturnValue(false);

    await runStoreGenerator(tree, options);

    expect(devkit.addDependenciesToPackageJson).toHaveBeenCalledTimes(1);
  });
});
