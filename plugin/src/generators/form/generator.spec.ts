/// <reference types="jest" />
import * as path from 'path';
import { Tree } from '@nx/devkit';
import * as deps from '../../shared/dependencies';
import { formatName, getNxLibsPaths, LibraryType } from '../../shared/utils';
import { formGenerator } from './generator';
import * as genUtils from './utils';

const mockRun = jest.fn().mockResolvedValue('libs/my-feature');
const mockAutoComplete = jest.fn().mockImplementation(() => ({
  run: mockRun,
}));

jest.mock('enquirer', () => ({
  AutoComplete: mockAutoComplete,
}));

jest.mock('../../shared/utils', () => ({
  getNxLibsPaths: jest.fn(),
  formatName: jest.fn(),
  LibraryType: { FEATURES: 'features', UI: 'ui' },
}));

jest.mock('./utils', () => ({
  getFormUtilsDirectory: jest.fn(),
  updateIndex: jest.fn(),
  addFormUsage: jest.fn(),
  getAppName: jest.fn(),
}));

jest.mock('@nx/devkit', () => ({
  addDependenciesToPackageJson: jest.fn(),
  generateFiles: jest.fn(),
  formatFiles: jest.fn(),
  installPackagesTask: jest.fn(),
}));

describe('formGenerator', () => {
  let tree: Tree;

  beforeEach(() => {
    jest.clearAllMocks();
    tree = {
      exists: jest.fn(),
    } as unknown as Tree;

    (getNxLibsPaths as jest.Mock).mockReturnValue(['libs/my-feature', 'libs/other-feature']);
    (formatName as jest.Mock).mockImplementation((name, _) => name.charAt(0).toUpperCase() + name.slice(1));
    (genUtils.getFormUtilsDirectory as jest.Mock).mockResolvedValue('libs/my-feature/utils/form-utils');
    (genUtils.getAppName as jest.Mock).mockReturnValue('my-feature');
    (tree.exists as jest.Mock).mockReturnValue(false);
  });

  it('should throw if form name is not provided', async () => {
    await expect(formGenerator(tree, { name: '', placeOfUse: undefined })).rejects.toThrow('Form name is required');
  });

  it('should throw if form already exists', async () => {
    (tree.exists as jest.Mock).mockImplementation(
      (filePath: string) => filePath === 'libs/my-feature/lib/forms/testForm.ts',
    );
    await expect(formGenerator(tree, { name: 'testForm', placeOfUse: undefined })).rejects.toThrow(
      'The form already exists',
    );
  });

  it('should generate form files and update index', async () => {
    await formGenerator(tree, { name: 'testForm', placeOfUse: undefined });

    expect(getNxLibsPaths).toHaveBeenCalledWith([LibraryType.FEATURES, LibraryType.UI]);
    expect(genUtils.getFormUtilsDirectory).toHaveBeenCalledWith(tree, 'my-feature');

    expect(genUtils.updateIndex).toHaveBeenCalledWith('libs/my-feature/lib/forms', 'testForm', tree);

    expect(mockAutoComplete).toHaveBeenCalled();
    expect(mockRun).toHaveBeenCalled();

    expect(genUtils.addFormUsage).not.toHaveBeenCalled();
    expect(require('@nx/devkit').generateFiles).toHaveBeenCalledWith(
      tree,
      path.join(__dirname, 'files'),
      'libs/my-feature/lib/forms',
      expect.objectContaining({
        className: 'TestFormFormSchema',
        fileName: 'testForm',
        formUtilsDirectory: 'libs/my-feature/utils/form-utils',
      }),
    );
    expect(require('@nx/devkit').addDependenciesToPackageJson).toHaveBeenCalledWith(tree, deps.dependencies.form, {});
    expect(require('@nx/devkit').formatFiles).toHaveBeenCalledWith(tree);
  });

  it('should call addFormUsage if placeOfUse provided', async () => {
    await formGenerator(tree, { name: 'testForm', placeOfUse: 'app' });

    expect(genUtils.addFormUsage).toHaveBeenCalledWith('libs/my-feature', 'app', 'TestFormFormSchema');
  });

  it('should return a callback that calls installPackagesTask', async () => {
    const callback = await formGenerator(tree, { name: 'testForm', placeOfUse: undefined });
    expect(typeof callback).toBe('function');

    callback();
    expect(require('@nx/devkit').installPackagesTask).toHaveBeenCalledWith(tree);
  });
});
