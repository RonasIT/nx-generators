/// <reference types="jest" />
import * as path from 'path';
import { Tree } from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { assertFirstLine, mockGenerateFiles } from '../../shared/utils';
import expoAppGenerator from './generator';

const appName = 'myapp';
const directory = 'mobile';

jest.mock('@nx/devkit', () => ({
  readJson: jest.fn((_tree, filePath) => {
    if (filePath.endsWith('package.json')) {
      return { scripts: { dev: 'old-dev' } };
    }

    if (filePath.endsWith('eslint.constraints.json')) {
      return [{ sourceTag: `app:${appName}` }];
    }

    return {};
  }),
  writeJson: jest.fn(),
  readProjectConfiguration: jest.fn(() => ({ name: appName, tags: [] })),
  updateProjectConfiguration: jest.fn(),
  addDependenciesToPackageJson: jest.fn(),
  formatFiles: jest.fn(),
  generateFiles: jest.fn((tree, src, dest, vars) => {
    mockGenerateFiles(tree, src, dest, vars);
  }),
  installPackagesTask: jest.fn(),
}));

jest.mock('child_process', () => ({ execSync: jest.fn() }));

jest.mock('../../shared/utils', () => {
  const actualUtils = jest.requireActual('../../shared/utils');

  return {
    ...actualUtils,
    confirm: jest.fn(() => Promise.resolve(true)), // Confirm mocked to avoid prompt
  };
});

describe('expoAppGenerator integration with file content checks', () => {
  let tree: Tree;

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
    jest.clearAllMocks();
    tree.write(
      'eslint.constraints.json',
      JSON.stringify(
        [
          { sourceTag: 'app:shared', onlyDependOnLibsWithTags: ['app:shared'] },
          { sourceTag: 'scope:shared', onlyDependOnLibsWithTags: ['scope:shared'] },
        ],
        null,
        2,
      ),
    );
  });

  it('should generate files and validate their first line', async () => {
    const callback = await expoAppGenerator(tree, {
      name: appName,
      directory: directory,
      withStore: false,
      withFormUtils: false,
      withUIKitten: false,
      withSentry: false,
    });

    const appFilesDir = path.join(__dirname, 'app-files');
    const i18nDir = path.join(__dirname, 'i18n');

    assertFirstLine(appFilesDir, `apps/${directory}`, tree, {
      placeholders: {
        libPath: `/${directory}`,
      },
    });
    assertFirstLine(path.join(i18nDir, 'app'), `i18n/${directory}/app`, tree);
    assertFirstLine(path.join(i18nDir, 'shared'), `i18n/${directory}/shared`, tree);

    expect(callback).toBeInstanceOf(Function);
  });
});
