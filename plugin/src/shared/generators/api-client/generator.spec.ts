/// <reference types="jest" />
import { execSync } from 'child_process';
import { existsSync } from 'fs';
import * as path from 'path';
import * as devkit from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { dependencies } from '../../dependencies';
import { runApiClientGenerator } from './generator';

jest.mock('child_process', () => ({
  execSync: jest.fn(),
}));

jest.mock('fs', () => ({
  existsSync: jest.fn(),
}));

jest.mock('@nx/devkit', () => ({
  addDependenciesToPackageJson: jest.fn(),
  formatFiles: jest.fn(),
  generateFiles: jest.fn(),
}));

jest.mock('../../utils', () => ({
  formatName: jest.fn((s) => s),
  formatAppIdentifier: jest.fn((s) => s),
  getImportPathPrefix: jest.fn(() => '@myorg'),
}));

describe('runApiClientGenerator', () => {
  let tree: ReturnType<typeof createTreeWithEmptyWorkspace>;

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
    tree.delete = jest.fn();
    jest.clearAllMocks();
  });

  it('should generate the react-lib and delete index.ts', async () => {
    (existsSync as jest.Mock).mockReturnValue(true);

    await runApiClientGenerator(tree, { name: 'my-app', directory: 'my-app' });

    expect(execSync).toHaveBeenCalledWith(
      'npx nx g react-lib --app=my-app --scope=shared --type=data-access --name=api-client',
      { stdio: 'inherit' },
    );

    expect(devkit.generateFiles).toHaveBeenCalledWith(
      tree,
      path.join(__dirname, '/lib-files'),
      'libs/my-app',
      expect.objectContaining({
        name: 'my-app',
        libPath: '@myorg/my-app',
      }),
    );

    expect(devkit.addDependenciesToPackageJson).toHaveBeenCalledWith(tree, dependencies['api-client'], {});
    expect(devkit.addDependenciesToPackageJson).toHaveBeenCalledWith(
      tree,
      dependencies['api-client'],
      {},
      'apps/my-app/package.json',
    );

    expect(devkit.formatFiles).toHaveBeenCalledWith(tree);
  });

  it('should not add app package.json dependencies if package.json does not exist', async () => {
    (existsSync as jest.Mock).mockReturnValue(false);

    await runApiClientGenerator(tree, { name: 'test', directory: 'my-app' });

    expect(devkit.addDependenciesToPackageJson).toHaveBeenCalledWith(tree, dependencies['api-client'], {});
    expect(devkit.addDependenciesToPackageJson).not.toHaveBeenCalledWith(
      tree,
      dependencies['api-client'],
      {},
      expect.any(String),
    );
  });
});
