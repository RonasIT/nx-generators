/// <reference types="jest" />
import * as child_process from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as devkit from '@nx/devkit';
import { dependencies } from '../../dependencies';
import * as utils from '../../utils';
import { runRNStylesGenerator } from './generator';

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
  formatAppIdentifier: jest.fn().mockImplementation((name) => `app-${name}`),
  getImportPathPrefix: jest.fn(),
}));

describe('runRNStylesGenerator', () => {
  const tree = {
    delete: jest.fn(),
  } as unknown as devkit.Tree;

  const options = { name: 'testName', directory: 'testDir' };

  beforeEach(() => {
    jest.clearAllMocks();
    (path.join as jest.Mock).mockImplementation((...args) => args.join('/'));
    (utils.getImportPathPrefix as jest.Mock).mockReturnValue('@org');
    (fs.existsSync as jest.Mock).mockReturnValue(false);
  });

  it('should generate lib, delete index.ts, generate files, add dependencies and format files', async () => {
    await runRNStylesGenerator(tree, options);

    expect(child_process.execSync).toHaveBeenCalledWith(
      `npx nx g react-lib --app=${options.directory} --scope=shared --type=ui --name=styles --withComponent=false`,
      { stdio: 'inherit' },
    );

    expect(tree.delete).toHaveBeenCalledWith(`libs/${options.directory}/shared/ui/styles/src/index.ts`);

    expect(devkit.generateFiles).toHaveBeenCalledWith(
      tree,
      expect.stringContaining('lib-files'),
      `libs/${options.directory}`,
      expect.objectContaining({
        ...options,
        formatName: expect.any(Function),
        formatAppIdentifier: expect.any(Function),
        libPath: `@org/${options.directory}`,
      }),
    );

    expect(devkit.addDependenciesToPackageJson).toHaveBeenCalledWith(tree, dependencies['rn-styles'], {});

    // Since existsSync returns false, second addDependenciesToPackageJson should not be called again with appPackagePath
    expect(devkit.addDependenciesToPackageJson).toHaveBeenCalledTimes(1);

    expect(devkit.formatFiles).toHaveBeenCalledWith(tree);
  });

  it('should add dependencies with appPackagePath when package.json exists', async () => {
    (fs.existsSync as jest.Mock).mockReturnValue(true);

    await runRNStylesGenerator(tree, options);

    const appPackagePath = `apps/${options.directory}/package.json`;

    expect(devkit.addDependenciesToPackageJson).toHaveBeenCalledWith(
      tree,
      dependencies['rn-styles'],
      {},
      appPackagePath,
    );
  });
});
