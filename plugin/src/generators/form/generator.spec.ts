/// <reference types="jest" />
import * as path from 'path';
import { Tree } from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import {
  writeJsonMock,
  generateFilesMock,
  formatFilesMock,
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
    await formGenerator(tree, options);

    const templatesPath = path.join(__dirname, 'files');

    assertFirstLine(templatesPath, targetPath, tree, {
      placeholders: {
        fileName: 'user',
        placeOfUse: 'MyComponent',
      },
    });

    expect(generateFilesMock).toHaveBeenCalled();
    expect(formatFilesMock).toHaveBeenCalled();
  });

  it('should write the resolved form utils path into the generated import', async () => {
    const formUtilsImportPath = '@ronas-it/shared/utils/form';

    (formUtils.getFormUtilsDirectory as jest.Mock).mockResolvedValue(formUtilsImportPath);
    await formGenerator(tree, { name: 'user', placeOfUse: '' });

    const generatedForm = tree.read(`${targetPath}/user.ts`)?.toString();

    expect(generatedForm).toContain(`import { BaseFormSchema, FormValues } from '${formUtilsImportPath}';`);
  });

  it('should use kebab-case for the filename and barrel export while preserving the schema class name', async () => {
    tree.write(`${targetPath}/index.ts`, `export * from './existing-form';\n`);

    await formGenerator(tree, { name: 'XMLSettings', placeOfUse: 'MyComponent' });

    const generatedForm = tree.read(`${targetPath}/xml-settings.ts`)?.toString();
    const index = tree.read(`${targetPath}/index.ts`)?.toString();

    expect(generatedForm).toContain('export class XMLSettingsFormSchema');
    expect(index).toContain(`export * from './xml-settings';`);
    expect(index).toContain(`export * from './existing-form';`);
    expect(formUtils.addFormUsage).toHaveBeenCalledWith(
      utilsLibFormsRoot,
      targetPath,
      'MyComponent',
      'XMLSettingsFormSchema',
    );
  });

  it('should throw if form name is missing', async () => {
    await expect(formGenerator(tree, { name: '', placeOfUse: '' })).rejects.toThrow('Form name is required');
  });

  it('should reject an equivalent spelling of an existing canonical form without overwriting it', async () => {
    tree.write(`${targetPath}/profile-settings.ts`, 'dummy content');

    await expect(formGenerator(tree, { name: 'ProfileSettings', placeOfUse: '' })).rejects.toThrow(
      'The form already exists',
    );

    expect(tree.read(`${targetPath}/profile-settings.ts`)?.toString()).toBe('dummy content');
    expect(tree.read(`${targetPath}/index.ts`)).toBeNull();
  });
});
