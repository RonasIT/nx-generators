/// <reference types="jest" />
import * as child_process from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as devkit from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { dependencies } from '../../dependencies';
import { runRNStylesGenerator } from './generator';

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
  readJson: jest.fn(),
}));

const execSyncMock = child_process.execSync as jest.Mock;
const existsSyncMock = fs.existsSync as jest.Mock;
const generateFilesMock = devkit.generateFiles as jest.Mock;
const addDependenciesMock = devkit.addDependenciesToPackageJson as jest.Mock;
const formatFilesMock = devkit.formatFiles as jest.Mock;
const readJsonMock = devkit.readJson as jest.Mock;

describe('runRNStylesGenerator', () => {
  let tree: devkit.Tree;

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();

    // Create dummy index.ts file to simulate deletion
    const libIndexPath = 'libs/myapp/shared/ui/styles/src/index.ts';
    tree.write(libIndexPath, 'export {};');

    readJsonMock.mockImplementation((tree, path) => {
      if (path === 'package.json') {
        return { name: '@org/myapp' }; // <- mocked name for getImportPathPrefix
      }

      return {};
    });

    jest.clearAllMocks();
  });

  it('should generate react-lib, delete old index, generate files, add dependencies, and format files', async () => {
    existsSyncMock.mockReturnValue(true);

    const options = {
      name: 'my-styles',
      directory: 'myapp',
    };

    await runRNStylesGenerator(tree, options);

    // Check execSync called with correct command
    expect(execSyncMock).toHaveBeenCalledWith(
      'npx nx g react-lib --app=myapp --scope=shared --type=ui --name=styles --withComponent=false',
      { stdio: 'inherit' },
    );

    // Check old index.ts is deleted
    expect(tree.exists('libs/myapp/shared/ui/styles/src/index.ts')).toBe(false);

    // Check files are generated from lib-files directory
    expect(generateFilesMock).toHaveBeenCalledWith(
      tree,
      path.join(__dirname, 'lib-files'),
      'libs/myapp',
      expect.objectContaining({
        name: 'my-styles',
        formatName: expect.any(Function),
        formatAppIdentifier: expect.any(Function),
        libPath: expect.any(String),
      }),
    );

    // Check dependencies are added globally
    expect(addDependenciesMock).toHaveBeenCalledWith(tree, dependencies['rn-styles'], {});

    // Check dependencies are added also scoped to app package.json (because existsSync returns true)
    expect(addDependenciesMock).toHaveBeenCalledWith(tree, dependencies['rn-styles'], {}, 'apps/myapp/package.json');

    // Check formatFiles is called
    expect(formatFilesMock).toHaveBeenCalled();
  });

  it('should not add dependencies scoped to app if app package.json does not exist', async () => {
    existsSyncMock.mockReturnValue(false);

    const options = {
      name: 'my-styles',
      directory: 'myapp',
    };

    await runRNStylesGenerator(tree, options);

    // Should only add dependencies globally once
    expect(addDependenciesMock).toHaveBeenCalledTimes(1);
    expect(addDependenciesMock).toHaveBeenCalledWith(tree, dependencies['rn-styles'], {});

    // Should NOT add dependencies scoped to app package.json
    expect(addDependenciesMock).not.toHaveBeenCalledWith(
      tree,
      dependencies['rn-styles'],
      {},
      'apps/myapp/package.json',
    );
  });
});
