/// <reference types="jest" />
import * as path from 'path';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { dependencies } from '../../dependencies';
import {
  addDependenciesMock,
  assertFirstLine,
  execSyncMock,
  existsSyncMock,
  formatFilesMock,
  generateFilesMock,
} from '../../tests-utils';
import { runApiClientGenerator } from './generator';

describe('runApiClientGenerator', () => {
  let tree: any;
  let fileMap: Record<string, string>;
  const appName = 'my-app';
  const deps = dependencies['api-client'];

  beforeEach(() => {
    fileMap = {};
    tree = createTreeWithEmptyWorkspace();

    tree.write = jest.fn((filePath: string, content: string) => {
      fileMap[filePath.replace(/\\/g, '/')] = content;
    });

    tree.read = jest.fn((filePath: string) => {
      const normalized = filePath.replace(/\\/g, '/');

      return fileMap[normalized] ? Buffer.from(fileMap[normalized]) : null;
    });

    tree.exists = jest.fn((filePath: string) => {
      const normalized = filePath.replace(/\\/g, '/');

      return Object.prototype.hasOwnProperty.call(fileMap, normalized);
    });

    tree.delete = jest.fn();
    jest.clearAllMocks();
  });

  it('should generate the react-lib and delete index.ts', async () => {
    existsSyncMock.mockReturnValue(true);
    const appLibs = `libs/${appName}`;

    await runApiClientGenerator(tree, { name: appName, directory: appName });

    expect(execSyncMock).toHaveBeenCalledWith(
      `npx nx g react-lib --app=${appName} --scope=shared --type=data-access --name=api-client`,
      { stdio: 'inherit' },
    );

    expect(generateFilesMock).toHaveBeenCalledWith(
      tree,
      path.join(__dirname, '/lib-files'),
      appLibs,
      expect.objectContaining({
        name: appName,
        libPath: `@proj/${appName}`,
      }),
    );

    expect(addDependenciesMock).toHaveBeenCalledWith(tree, deps, {});
    expect(addDependenciesMock).toHaveBeenCalledWith(tree, deps, {}, `apps/${appName}/package.json`);

    expect(formatFilesMock).toHaveBeenCalledWith(tree);

    assertFirstLine(path.join(__dirname, 'lib-files'), appLibs, tree, {
      placeholders: {
        libPath: `@proj/${appName}`,
        name: appName,
      },
    });
  });

  it('should not add app package.json dependencies if package.json does not exist', async () => {
    existsSyncMock.mockReturnValue(false);

    await runApiClientGenerator(tree, { name: 'test', directory: appName });

    expect(addDependenciesMock).toHaveBeenCalledWith(tree, deps, {});
    expect(addDependenciesMock).not.toHaveBeenCalledWith(tree, deps, {}, expect.any(String));
  });
});
