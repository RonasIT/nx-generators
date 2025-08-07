/// <reference types="jest" />
import * as path from 'path';
import { Tree } from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import {
  writeJsonMock,
  generateFilesMock,
  formatFilesMock,
  installPackagesTaskMock,
  assertFirstLine,
  existsSyncMock,
} from '../../shared/tests-utils';
import formGenerator from './generator';
import * as formUtils from './utils';

jest.mock('./utils', () => {
  const original = jest.requireActual('./utils');

  return {
    ...original,
    addFormUsage: jest.fn(),
    getFormUtilsDirectory: jest.fn(),
  };
});

const utilsLibFormsRoot = 'libs/shared/form-utils';
const targetPath = `${utilsLibFormsRoot}/lib/forms`;

describe('formGenerator', () => {
  let tree: Tree;
  let autoCompleteRunMock: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    tree = createTreeWithEmptyWorkspace();
    const { AutoComplete } = require('enquirer');

    // Add dummy library project to the tree
    writeJsonMock.mockClear();
    writeJsonMock.mockImplementation((tree, path, json) => {
      tree.write(path, JSON.stringify(json, null, 2));
    });
    tree.write(
      'workspace.json',
      JSON.stringify(
        {
          version: 2,
          projects: {
            'shared-form-utils': {
              root: utilsLibFormsRoot,
              projectType: 'library',
              targets: {},
            },
          },
        },
        null,
        2,
      ),
    );

    existsSyncMock.mockReturnValue(true);
    autoCompleteRunMock = jest.fn().mockResolvedValue(utilsLibFormsRoot);
    (AutoComplete as jest.Mock).mockImplementation(() => ({ run: autoCompleteRunMock }));

    (formUtils.addFormUsage as jest.Mock).mockResolvedValue(undefined);
    (formUtils.getFormUtilsDirectory as jest.Mock).mockResolvedValue(utilsLibFormsRoot);
  });

  it('should generate files with matching first lines', async () => {
    const options = { name: 'user', placeOfUse: 'MyComponent' };
    const callback = await formGenerator(tree, options);

    const templatesPath = path.join(__dirname, 'files');

    assertFirstLine(templatesPath, targetPath, tree, {
      placeholders: {
        fileName: 'user',
        placeOfUse: 'MyComponent',
      },
    });

    expect(generateFilesMock).toHaveBeenCalled();
    expect(formatFilesMock).toHaveBeenCalled();
    callback();
    expect(installPackagesTaskMock).toHaveBeenCalled();
  });

  it('should throw if form name is missing', async () => {
    await expect(formGenerator(tree, { name: '', placeOfUse: '' })).rejects.toThrow('Form name is required');
  });

  it('should throw if form already exists', async () => {
    tree.write(`${targetPath}/user.ts`, 'dummy content');

    await expect(formGenerator(tree, { name: 'user', placeOfUse: '' })).rejects.toThrow('The form already exists');
  });
});
