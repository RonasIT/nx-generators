/// <reference types="jest" />
import * as child_process from 'child_process';
import * as fs from 'fs';
import * as devkit from '@nx/devkit';
import { dependencies } from '../../dependencies';
import { runApiClientGenerator } from './generator';

jest.mock('child_process', () => ({
  execSync: jest.fn(),
}));

jest.mock('fs', () => ({
  existsSync: jest.fn(),
}));

jest.mock('@nx/devkit', () => ({
  generateFiles: jest.fn(),
  addDependenciesToPackageJson: jest.fn(),
  formatFiles: jest.fn(),
}));

jest.mock('../../utils', () => ({
  formatName: jest.fn((name) => `formatted-${name}`),
  formatAppIdentifier: jest.fn((id) => `appId-${id}`),
  getImportPathPrefix: jest.fn(() => '@prefix'),
}));

describe('runApiClientGenerator', () => {
  const tree = {
    delete: jest.fn(),
  } as unknown as devkit.Tree;

  const options = {
    name: 'MyApp',
    directory: 'my-app',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should run nx generate command, delete files, generate files, add dependencies, and format files', async () => {
    (fs.existsSync as jest.Mock).mockReturnValue(true);

    await runApiClientGenerator(tree, options);

    expect(child_process.execSync).toHaveBeenCalledWith(
      `npx nx g react-lib --app=${options.directory} --scope=shared --type=data-access --name=api-client`,
      { stdio: 'inherit' },
    );

    expect(tree.delete).toHaveBeenCalledWith(`libs/${options.directory}/shared/data-access/api-client/src/index.ts`);

    // Check generateFiles called with proper args
    const [treeArg, sourcePath, targetPath, templateVars] = (devkit.generateFiles as jest.Mock).mock.calls[0];

    expect(treeArg).toBe(tree);
    expect(sourcePath).toEqual(expect.stringContaining('generator'));
    expect(sourcePath).toEqual(expect.stringContaining('/lib-files'));
    expect(targetPath).toBe(`libs/${options.directory}`);
    expect(templateVars).toMatchObject({
      ...options,
      formatName: expect.any(Function),
      formatAppIdentifier: expect.any(Function),
      libPath: '@prefix/my-app',
    });

    expect(devkit.addDependenciesToPackageJson).toHaveBeenCalledWith(tree, dependencies['api-client'], {});
    expect(devkit.addDependenciesToPackageJson).toHaveBeenCalledWith(
      tree,
      dependencies['api-client'],
      {},
      `apps/${options.directory}/package.json`,
    );

    expect(devkit.formatFiles).toHaveBeenCalledWith(tree);
  });

  it('should add dependencies without app package.json if app package.json does not exist', async () => {
    (fs.existsSync as jest.Mock).mockReturnValue(false);

    await runApiClientGenerator(tree, options);

    expect(devkit.addDependenciesToPackageJson).toHaveBeenCalledTimes(1);
    expect(devkit.addDependenciesToPackageJson).toHaveBeenCalledWith(tree, dependencies['api-client'], {});
  });
});
