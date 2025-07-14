/// <reference types="jest" />
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as devkit from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { dependencies } from '../../dependencies';
import { assertFirstLine, mockGenerateFiles } from '../../utils';
import { runApiClientGenerator } from './generator';

jest.mock('child_process', () => ({
  execSync: jest.fn(),
}));

jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  existsSync: jest.fn(),
}));

jest.mock('@nx/devkit', () => ({
  generateFiles: jest.fn((tree, src, dest, vars) => {
    mockGenerateFiles(tree, src, dest, vars);
  }),
  formatFiles: jest.fn(),
  output: {
    log: jest.fn(),
    warn: jest.fn(),
    bold: (text: string) => text,
  },
  addDependenciesToPackageJson: jest.fn(),
}));

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
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    const appLibs = `libs/${appName}`;

    await runApiClientGenerator(tree, { name: appName, directory: appName });

    expect(execSync).toHaveBeenCalledWith(
      `npx nx g react-lib --app=${appName} --scope=shared --type=data-access --name=api-client`,
      { stdio: 'inherit' },
    );

    expect(devkit.generateFiles).toHaveBeenCalledWith(
      tree,
      path.join(__dirname, '/lib-files'),
      appLibs,
      expect.objectContaining({
        name: appName,
        libPath: `/${appName}`,
      }),
    );

    expect(devkit.addDependenciesToPackageJson).toHaveBeenCalledWith(tree, deps, {});
    expect(devkit.addDependenciesToPackageJson).toHaveBeenCalledWith(tree, deps, {}, `apps/${appName}/package.json`);

    expect(devkit.formatFiles).toHaveBeenCalledWith(tree);

    assertFirstLine(path.join(__dirname, 'lib-files'), appLibs, tree, {
      placeholders: {
        libPath: `/${appName}`,
        name: appName,
      },
    });
  });

  it('should not add app package.json dependencies if package.json does not exist', async () => {
    (fs.existsSync as jest.Mock).mockReturnValue(false);

    await runApiClientGenerator(tree, { name: 'test', directory: appName });

    expect(devkit.addDependenciesToPackageJson).toHaveBeenCalledWith(tree, deps, {});
    expect(devkit.addDependenciesToPackageJson).not.toHaveBeenCalledWith(tree, deps, {}, expect.any(String));
  });
});
