/// <reference types="jest" />
import * as path from 'path';
import * as devkit from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { devDependencies } from '../../shared/dependencies';
import {
  addDependenciesMock,
  assertFirstLine,
  formatFilesMock,
  generateFilesMock,
  installPackagesTaskMock,
  readJsonMock,
  writeJsonMock,
} from '../../shared/tests-utils';
import engines from './engines';
import { repoConfigGenerator } from './generator';
import scripts from './scripts';

describe('repoConfigGenerator', () => {
  let tree: devkit.Tree;

  beforeEach(() => {
    jest.clearAllMocks();
    tree = createTreeWithEmptyWorkspace();
    readJsonMock.mockImplementation((targetTree: devkit.Tree, filePath: string) =>
      JSON.parse(targetTree.read(filePath, 'utf-8') as string),
    );
  });

  it('should update package.json, generate files, add dependencies, format files and return install callback', async () => {
    tree.root = '/myorg';
    tree.write('package.json', JSON.stringify({ name: '@myorg/source' }));

    const callback = await repoConfigGenerator(tree);

    expect(readJsonMock).toHaveBeenCalledWith(tree, 'package.json');

    expect(writeJsonMock).toHaveBeenCalledWith(
      tree,
      'package.json',
      expect.objectContaining({
        name: '@myorg/source',
        workspaces: ['apps/*'],
        scripts,
        engines,
      }),
    );

    expect(generateFilesMock).toHaveBeenCalledWith(
      tree,
      expect.stringContaining('files'),
      '.',
      expect.objectContaining({
        name: 'myorg',
        formatName: expect.any(Function),
      }),
    );

    const templatesDir = path.join(__dirname, 'files');
    assertFirstLine(templatesDir, '.', tree, {
      placeholders: { name: 'myorg' },
    });

    expect(addDependenciesMock).toHaveBeenCalledWith(tree, {}, devDependencies['repo-config']);
    expect(formatFilesMock).toHaveBeenCalledWith(tree);

    callback();
    expect(installPackagesTaskMock).toHaveBeenCalledWith(tree);
  });

  it('should set package name from workspace directory name', async () => {
    tree.root = '/my-project';
    tree.write('package.json', JSON.stringify({ name: '@org/source' }));
    tree.write(
      'tsconfig.base.json',
      JSON.stringify({ compilerOptions: { customConditions: ['@org/source', 'development'] } }),
    );

    await repoConfigGenerator(tree);

    expect(writeJsonMock).toHaveBeenCalledWith(
      tree,
      'package.json',
      expect.objectContaining({ name: '@my-project/source' }),
    );

    expect(writeJsonMock).toHaveBeenCalledWith(
      tree,
      'tsconfig.base.json',
      expect.objectContaining({
        compilerOptions: expect.objectContaining({
          customConditions: ['@my-project/source', 'development'],
        }),
      }),
    );

    expect(generateFilesMock).toHaveBeenCalledWith(
      tree,
      expect.stringContaining('files'),
      '.',
      expect.objectContaining({ name: 'my-project' }),
    );
  });

  it('should normalize workspace directory name using Nx naming rules', async () => {
    tree.root = '/MyProject';
    tree.write('package.json', JSON.stringify({ name: '@org/source' }));

    await repoConfigGenerator(tree);

    expect(writeJsonMock).toHaveBeenCalledWith(
      tree,
      'package.json',
      expect.objectContaining({ name: '@my-project/source' }),
    );
  });

  it('should keep a manually configured package name', async () => {
    tree.root = '/renamed-folder';
    tree.write('package.json', JSON.stringify({ name: '@acme/source' }));
    tree.write(
      'tsconfig.base.json',
      JSON.stringify({ compilerOptions: { customConditions: ['@org/source', '@renamed-folder/source'] } }),
    );

    await repoConfigGenerator(tree);

    expect(writeJsonMock).toHaveBeenCalledWith(tree, 'package.json', expect.objectContaining({ name: '@acme/source' }));

    expect(writeJsonMock).toHaveBeenCalledWith(
      tree,
      'tsconfig.base.json',
      expect.objectContaining({
        compilerOptions: expect.objectContaining({ customConditions: ['@acme/source', '@acme/source'] }),
      }),
    );

    expect(generateFilesMock).toHaveBeenCalledWith(
      tree,
      expect.stringContaining('files'),
      '.',
      expect.objectContaining({ name: 'acme' }),
    );
  });

  it('should use the provided name option over the package name and directory name', async () => {
    tree.root = '/renamed-folder';
    tree.write('package.json', JSON.stringify({ name: '@acme/source' }));
    tree.write('tsconfig.base.json', JSON.stringify({ compilerOptions: { customConditions: ['@acme/source'] } }));

    await repoConfigGenerator(tree, { name: 'custom-name' });

    expect(writeJsonMock).toHaveBeenCalledWith(
      tree,
      'package.json',
      expect.objectContaining({ name: '@custom-name/source' }),
    );

    expect(writeJsonMock).toHaveBeenCalledWith(
      tree,
      'tsconfig.base.json',
      expect.objectContaining({
        compilerOptions: expect.objectContaining({ customConditions: ['@custom-name/source'] }),
      }),
    );

    expect(generateFilesMock).toHaveBeenCalledWith(
      tree,
      expect.stringContaining('files'),
      '.',
      expect.objectContaining({ name: 'custom-name' }),
    );
  });

  it('should not update tsconfig.base.json when custom conditions already match the package name', async () => {
    tree.root = '/my-project';
    tree.write('package.json', JSON.stringify({ name: '@my-project/source' }));
    tree.write('tsconfig.base.json', JSON.stringify({ compilerOptions: { customConditions: ['@my-project/source'] } }));

    await repoConfigGenerator(tree);

    expect(writeJsonMock).not.toHaveBeenCalledWith(tree, 'tsconfig.base.json', expect.anything());
  });
});
