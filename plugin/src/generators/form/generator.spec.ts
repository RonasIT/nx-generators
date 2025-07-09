/// <reference types="jest" />
import * as fs from 'fs';
import * as path from 'path';
import * as devkit from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import * as sharedUtils from '../../shared/utils';
import formGenerator from './generator';
import * as formUtils from './utils';

jest.mock('enquirer', () => ({
  AutoComplete: jest.fn(),
}));

jest.mock('@nx/devkit', () => ({
  generateFiles: jest.fn(),
  getProjects: jest.fn(),
  formatFiles: jest.fn(),
  addDependenciesToPackageJson: jest.fn(),
  installPackagesTask: jest.fn(),
  writeJson: jest.fn(),
}));

// mock getNxLibsPaths to have deterministic libs path
jest.mock('../../shared/utils', () => {
  const actual = jest.requireActual('../../shared/utils');

  return {
    ...actual,
    getNxLibsPaths: jest.fn(() => ['libs/ui/my-lib']),
  };
});

jest.mock('./utils', () => {
  const original = jest.requireActual('./utils');

  return {
    ...original,
    addFormUsage: jest.fn(),
    // mock getFormUtilsDirectory partially to avoid prompts:
    getFormUtilsDirectory: jest.fn(async () => 'libs/shared/form-utils'),
  };
});

// Mock generateFiles to actually copy files to the Nx virtual FS
(devkit.generateFiles as jest.Mock).mockImplementation((tree, srcDir, destDir, templateVars) => {
  function copyRecursive(src: string, dest: string): void {
    const entries = fs.readdirSync(src, { withFileTypes: true });

    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);

      if (entry.isDirectory()) {
        copyRecursive(srcPath, path.join(dest, entry.name));
      } else {
        // Replace placeholders in filename like __fileName__ using templateVars
        let fileName = entry.name.replace(/\.template$/, '');

        if (templateVars) {
          Object.entries(templateVars).forEach(([key, value]) => {
            if (typeof value === 'string') {
              fileName = fileName.replace(new RegExp(`__${key}__`, 'g'), value);
            }
          });
        }

        const destPath = path.join(dest, fileName).split(path.sep).join('/');
        let content = fs.readFileSync(srcPath, 'utf8');

        if (templateVars) {
          Object.entries(templateVars).forEach(([key, value]) => {
            if (typeof value === 'string') {
              const regex = new RegExp(`__${key}__`, 'g');
              content = content.replace(regex, value);
            }
          });
        }

        tree.write(destPath, content);
      }
    }
  }
  copyRecursive(srcDir, destDir.split(path.sep).join('/'));
});

describe('formGenerator', () => {
  let tree: devkit.Tree;
  let autoCompleteRunMock: jest.Mock;
  const { AutoComplete } = require('enquirer');

  function assertFirstLine(
    sourceDir: string,
    targetDir: string,
    tree: devkit.Tree,
    placeholders: Record<string, string> = {},
  ): void {
    const entries = fs.readdirSync(sourceDir, { withFileTypes: true });

    for (const entry of entries) {
      const srcPath = path.join(sourceDir, entry.name);

      if (entry.isDirectory()) {
        assertFirstLine(srcPath, path.join(targetDir, entry.name), tree, placeholders);
      } else {
        let fileName = entry.name.replace(/\.template$/, '');

        Object.entries(placeholders).forEach(([key, value]) => {
          fileName = fileName.replace(new RegExp(`__${key}__`, 'g'), value);
        });

        const targetFile = path.join(targetDir, fileName).split(path.sep).join('/');

        const expectedFirstLine = fs.readFileSync(srcPath, 'utf8').split('\n')[0].trim();
        const generatedContent = tree.read(targetFile)?.toString();

        if (!generatedContent) {
          throw new Error(`Expected file not found in virtual tree: ${targetFile}`);
        }
        const actualFirstLine = generatedContent.split('\n')[0].trim();
        expect(actualFirstLine).toBe(expectedFirstLine);
      }
    }
  }

  beforeEach(() => {
    jest.clearAllMocks();

    tree = createTreeWithEmptyWorkspace();

    // Add dummy library project to the tree
    devkit.writeJson(tree, 'workspace.json', {
      version: 2,
      projects: {
        'shared-form-utils': {
          root: 'libs/shared/form-utils',
          projectType: 'library',
          targets: {},
        },
      },
    });

    autoCompleteRunMock = jest.fn().mockResolvedValue('libs/shared/form-utils');
    (AutoComplete as jest.Mock).mockImplementation(() => ({ run: autoCompleteRunMock }));

    (sharedUtils.getNxLibsPaths as jest.Mock).mockReturnValue(['libs/ui/my-lib']);
    (formUtils.addFormUsage as jest.Mock).mockResolvedValue(undefined);
  });

  it('should generate files with matching first lines', async () => {
    const options = { name: 'user', placeOfUse: 'MyComponent' };
    await formGenerator(tree, options);

    const templatesPath = path.join(__dirname, 'files');
    const targetPath = 'libs/shared/form-utils/lib/forms';

    assertFirstLine(templatesPath, targetPath, tree, { fileName: 'user' });
  });

  it('should throw if form name is missing', async () => {
    await expect(formGenerator(tree, { name: '', placeOfUse: '' })).rejects.toThrow('Form name is required');
  });

  it('should throw if form already exists', async () => {
    tree.write('libs/shared/form-utils/lib/forms/user.ts', 'dummy content');

    await expect(formGenerator(tree, { name: 'user', placeOfUse: '' })).rejects.toThrow('The form already exists');
  });
});
