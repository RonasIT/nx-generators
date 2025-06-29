/// <reference types="jest" />
import * as devkit from '@nx/devkit';
import { devDependencies } from '../../shared/dependencies';
import { repoConfigGenerator } from './generator';

jest.mock('@nx/devkit', () => {
  const original = jest.requireActual('@nx/devkit');

  return {
    ...original,
    readJson: jest.fn(),
    writeJson: jest.fn(),
    generateFiles: jest.fn(),
    addDependenciesToPackageJson: jest.fn(),
    formatFiles: jest.fn(),
    installPackagesTask: jest.fn(),
  };
});

jest.mock('../../shared/utils', () => ({
  formatName: jest.fn((name) => name.toUpperCase()),
  getProjectName: jest.fn((pkgName) => pkgName.split('/').pop()),
}));

describe('repoConfigGenerator', () => {
  const tree = {
    delete: jest.fn(),
  } as any;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should delete README.md, update package.json, generate files, add dependencies, format files and return install callback', async () => {
    const mockPackageJson = {
      name: '@myorg/my-project',
      scripts: {
        oldScript: 'echo old',
      },
    };
    (devkit.readJson as jest.Mock).mockReturnValue(mockPackageJson);

    const callback = await repoConfigGenerator(tree);

    expect(tree.delete).toHaveBeenCalledWith('README.md');

    expect(devkit.readJson).toHaveBeenCalledWith(tree, 'package.json');

    expect(devkit.writeJson).toHaveBeenCalledWith(
      tree,
      'package.json',
      expect.objectContaining({
        workspaces: ['apps/*'],
        scripts: expect.objectContaining({
          oldScript: 'echo old',
        }),
      }),
    );

    const [calledTree, calledTemplatePath, calledTargetPath, calledTemplateOptions] = (
      devkit.generateFiles as jest.Mock
    ).mock.calls[0];

    expect(calledTree).toBe(tree);
    expect(typeof calledTemplatePath).toBe('string');
    expect(calledTemplatePath).toContain('files');
    expect(calledTargetPath).toBe('.');
    expect(calledTemplateOptions).toMatchObject({
      name: 'my-project',
      formatName: expect.any(Function),
    });

    expect(devkit.addDependenciesToPackageJson).toHaveBeenCalledWith(tree, {}, devDependencies['repo-config']);

    expect(devkit.formatFiles).toHaveBeenCalledWith(tree);

    // The returned callback runs installPackagesTask
    callback();
    expect(devkit.installPackagesTask).toHaveBeenCalledWith(tree);
  });
});
