/// <reference types="jest" />
import * as fs from 'fs';
import { Tree } from '@nx/devkit';
import * as devkit from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { BaseGeneratorType } from '../../shared/enums';
import * as sharedGenerators from '../../shared/generators';
import * as utils from '../../shared/utils';
import { nextAppGenerator } from './generator';

jest.mock('fs');
jest.mock('child_process');
jest.mock('@nx/devkit', () => ({
  ...jest.requireActual('@nx/devkit'),
  readJson: jest.fn(),
  writeJson: jest.fn(),
  generateFiles: jest.fn(),
  formatFiles: jest.fn(),
  installPackagesTask: jest.fn(),
  addDependenciesToPackageJson: jest.fn(),
}));
jest.mock('../../shared/generators');
jest.mock('../../shared/utils');

describe('nextAppGenerator', () => {
  let tree: Tree;

  const options = {
    name: 'test-app',
    directory: 'test-app',
    withStore: true,
    withFormUtils: true,
    withSentry: false,
  };

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();

    jest.spyOn(utils, 'confirm').mockResolvedValue(true);
    jest.spyOn(utils, 'getImportPathPrefix').mockReturnValue('@myorg');
    jest.spyOn(fs, 'existsSync').mockReturnValue(false);
    jest.spyOn(devkit, 'readJson').mockReturnValue({ include: [] });

    jest.spyOn(tree, 'delete').mockImplementation(undefined);
    jest.spyOn(tree, 'write').mockImplementation(undefined);
  });

  it('should call required generators and utilities', async () => {
    await nextAppGenerator(tree, options);

    expect(sharedGenerators.runAppEnvGenerator).toHaveBeenCalledWith(
      tree,
      expect.objectContaining({
        baseGeneratorType: BaseGeneratorType.NEXT_APP,
      }),
    );

    expect(sharedGenerators.runI18nNextGenerator).toHaveBeenCalled();
    expect(sharedGenerators.runStoreGenerator).toHaveBeenCalled();
    expect(sharedGenerators.runApiClientGenerator).toHaveBeenCalled();

    expect(devkit.generateFiles).toHaveBeenCalled();
    expect(devkit.writeJson).toHaveBeenCalledWith(
      tree,
      expect.stringContaining('tsconfig.json'),
      expect.objectContaining({
        include: expect.arrayContaining(['.next/types/**/*.ts']),
      }),
    );
  });

  it('should delete default files', async () => {
    await nextAppGenerator(tree, options);

    expect(tree.delete).toHaveBeenCalledWith(expect.stringContaining('public/.gitkeep'));
    expect(tree.delete).toHaveBeenCalledWith(expect.stringContaining('page.tsx'));
  });

  it('should install dependencies', async () => {
    await nextAppGenerator(tree, options);

    expect(devkit.addDependenciesToPackageJson).toHaveBeenCalled();
  });
});
