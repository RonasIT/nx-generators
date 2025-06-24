/// <reference types="jest" />
import { Tree } from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import * as enquirer from 'enquirer';
import * as utils from '../../shared/utils';
import formGenerator from './generator';
import * as formUtils from './utils';

jest.mock('enquirer', () => ({
  AutoComplete: jest.fn(() => ({ run: jest.fn() })),
}));

jest.mock('../../shared/utils', () => ({
  ...jest.requireActual('../../shared/utils'),
  getNxLibsPaths: jest.fn(),
  formatName: jest.fn((n: string) => n),
}));

jest.mock('./utils', () => ({
  getFormUtilsDirectory: jest.fn(),
  getAppName: jest.fn(),
  addFormUsage: jest.fn(),
  updateIndex: jest.fn(),
}));

describe('formGenerator', () => {
  let tree: Tree;

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
    (utils.getNxLibsPaths as jest.Mock).mockReturnValue(['libs/ui/my-lib']);
    (formUtils.getAppName as jest.Mock).mockReturnValue('my-app');
    (formUtils.getFormUtilsDirectory as jest.Mock).mockResolvedValue('libs/shared/form-utils');

    const mockRun = jest.fn().mockResolvedValue('libs/ui/my-lib');
    ((enquirer as any).AutoComplete as jest.Mock).mockImplementation(() => ({ run: mockRun }));
  });

  it('should generate a form and update index', async () => {
    const options = { name: 'user', placeOfUse: 'MyComponent' };

    await formGenerator(tree, options);

    const filePath = 'libs/ui/my-lib/lib/forms/user.ts';
    expect(tree.exists(filePath)).toBe(true);

    const content = tree.read(filePath)?.toString();
    expect(content).toContain('export class userFormSchema');

    expect(formUtils.updateIndex).toHaveBeenCalledWith('libs/ui/my-lib/lib/forms', 'user', tree);
    expect(formUtils.addFormUsage).toHaveBeenCalledWith('libs/ui/my-lib', 'MyComponent', 'userFormSchema');
  });

  it('should throw if name is not provided', async () => {
    await expect(formGenerator(tree, { name: '', placeOfUse: '' })).rejects.toThrow('Form name is required');
  });

  it('should throw if form already exists', async () => {
    tree.write('libs/ui/my-lib/lib/forms/user.ts', 'dummy');
    await expect(formGenerator(tree, { name: 'user', placeOfUse: '' })).rejects.toThrow('The form already exists');
  });
});
