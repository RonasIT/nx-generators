/// <reference types="jest" />
import * as child_process from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as devkit from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { BaseGeneratorType } from '../../enums';
import { runStoreGenerator } from './generator';

jest.mock('child_process', () => ({
  execSync: jest.fn(),
}));

jest.mock('@nx/devkit', () => {
  const original = jest.requireActual('@nx/devkit');

  return {
    ...original,
    generateFiles: jest.fn(),
    formatFiles: jest.fn(),
    addDependenciesToPackageJson: jest.fn(),
  };
});

jest.mock('fs', () => ({
  existsSync: jest.fn(),
}));

const execSyncMock = child_process.execSync as jest.Mock;
const generateFilesMock = devkit.generateFiles as jest.Mock;
const formatFilesMock = devkit.formatFiles as jest.Mock;
const addDependenciesMock = devkit.addDependenciesToPackageJson as jest.Mock;
const existsSyncMock = fs.existsSync as jest.Mock;

describe('runStoreGenerator', () => {
  let tree: devkit.Tree;

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
    jest.clearAllMocks();
  });

  it('should call execSync to generate react-lib', async () => {
    const options = {
      directory: 'myapp',
      baseGeneratorType: BaseGeneratorType.NEXT_APP,
    };
    await runStoreGenerator(tree, options);

    expect(execSyncMock).toHaveBeenCalledWith(
      'npx nx g react-lib --app=myapp --scope=shared --type=data-access --name=store',
      { stdio: 'inherit' },
    );
  });

  it('should delete the index.ts file', async () => {
    const options = {
      directory: 'myapp',
      baseGeneratorType: BaseGeneratorType.NEXT_APP,
    };
    const indexPath = `libs/myapp/shared/data-access/store/src/index.ts`;
    tree.write(indexPath, 'export {}');
    expect(tree.exists(indexPath)).toBe(true);

    await runStoreGenerator(tree, options);

    expect(tree.exists(indexPath)).toBe(false);
  });

  it('should call generateFiles with correct arguments', async () => {
    const options = {
      directory: 'myapp',
      baseGeneratorType: BaseGeneratorType.NEXT_APP,
    };

    await runStoreGenerator(tree, options);

    expect(generateFilesMock).toHaveBeenCalledTimes(1);
    const [calledTree, calledSourcePath, calledDestPath, calledVars] = generateFilesMock.mock.calls[0];

    expect(calledTree).toBe(tree);
    expect(calledSourcePath).toBe(path.join(__dirname, `${options.baseGeneratorType}/lib-files`));
    expect(calledDestPath).toBe(`libs/${options.directory}`);

    expect(calledVars).toMatchObject({
      directory: options.directory,
      baseGeneratorType: options.baseGeneratorType,
      formatName: expect.any(Function),
      formatAppIdentifier: expect.any(Function),
      libPath: expect.any(String),
    });
  });

  it('should add dependencies', async () => {
    existsSyncMock.mockReturnValue(false);

    const options = {
      directory: 'myapp',
      baseGeneratorType: BaseGeneratorType.NEXT_APP,
    };
    await runStoreGenerator(tree, options);

    expect(addDependenciesMock).toHaveBeenCalledWith(tree, expect.any(Object), {});
    expect(addDependenciesMock).toHaveBeenCalledTimes(1);
  });

  it('should add dependencies to app package.json if exists', async () => {
    existsSyncMock.mockReturnValue(true);

    const options = {
      directory: 'myapp',
      baseGeneratorType: BaseGeneratorType.NEXT_APP,
    };
    await runStoreGenerator(tree, options);

    expect(addDependenciesMock).toHaveBeenCalledWith(tree, expect.any(Object), {}, `apps/myapp/package.json`);
  });

  it('should call formatFiles once', async () => {
    const options = {
      directory: 'myapp',
      baseGeneratorType: BaseGeneratorType.NEXT_APP,
    };
    await runStoreGenerator(tree, options);
    expect(formatFilesMock).toHaveBeenCalledWith(tree);
  });
});
