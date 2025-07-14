/// <reference types="jest" />
import * as path from 'path';
import * as devkit from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { assertFirstLine, mockGenerateFiles } from '../../shared/utils';
import formGenerator from './generator';
import * as formUtils from './utils';

jest.mock('enquirer', () => ({
  AutoComplete: jest.fn(),
}));

jest.mock('@nx/devkit', () => ({
  generateFiles: jest.fn((tree, src, dest, vars) => {
    mockGenerateFiles(tree, src, dest, vars);
  }),
  getProjects: jest.fn(),
  formatFiles: jest.fn(),
  addDependenciesToPackageJson: jest.fn(),
  installPackagesTask: jest.fn(),
  writeJson: jest.fn(),
}));

const utilsLibFormsRoot = 'libs/shared/form-utils';

jest.mock('./utils', () => {
  const original = jest.requireActual('./utils');

  return {
    ...original,
    addFormUsage: jest.fn(),
    // mock getFormUtilsDirectory partially to avoid prompts:
    getFormUtilsDirectory: jest.fn(async () => utilsLibFormsRoot),
  };
});

describe('formGenerator', () => {
  let tree: devkit.Tree;
  let autoCompleteRunMock: jest.Mock;
  const { AutoComplete } = require('enquirer');
  const targetPath = `${utilsLibFormsRoot}/lib/forms`;

  beforeEach(() => {
    jest.clearAllMocks();

    tree = createTreeWithEmptyWorkspace();

    // Add dummy library project to the tree
    devkit.writeJson(tree, 'workspace.json', {
      version: 2,
      projects: {
        'shared-form-utils': {
          root: utilsLibFormsRoot,
          projectType: 'library',
          targets: {},
        },
      },
    });

    autoCompleteRunMock = jest.fn().mockResolvedValue(utilsLibFormsRoot);
    (AutoComplete as jest.Mock).mockImplementation(() => ({ run: autoCompleteRunMock }));
    (formUtils.addFormUsage as jest.Mock).mockResolvedValue(undefined);
  });

  it('should generate files with matching first lines', async () => {
    const options = { name: 'user', placeOfUse: 'MyComponent' };
    await formGenerator(tree, options);

    const templatesPath = path.join(__dirname, 'files');

    assertFirstLine(templatesPath, targetPath, tree, {
      placeholders: {
        fileName: 'user',
        placeOfUse: 'MyComponent',
      },
    });
  });

  it('should throw if form name is missing', async () => {
    await expect(formGenerator(tree, { name: '', placeOfUse: '' })).rejects.toThrow('Form name is required');
  });

  it('should throw if form already exists', async () => {
    tree.write(`${targetPath}/user.ts`, 'dummy content');

    await expect(formGenerator(tree, { name: 'user', placeOfUse: '' })).rejects.toThrow('The form already exists');
  });
});
