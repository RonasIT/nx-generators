/// <reference types="jest" />
import { execSync } from 'child_process';
import * as path from 'path';
import * as devkit from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { assertFirstLine, mockGenerateFiles } from '../../shared/tests-utils';
import { addNxScopeTag, selectProject, confirm, askQuestion } from '../../shared/utils';
import { reactLibGenerator } from './generator';

jest.mock('child_process', () => ({
  execSync: jest.fn(),
}));

jest.mock('enquirer', () => ({
  AutoComplete: jest.fn().mockImplementation(() => ({
    run: jest.fn(),
  })),
}));

jest.mock('../../shared/utils', () => {
  const actualUtils = jest.requireActual('../../shared/utils');

  return {
    ...actualUtils,
    confirm: jest.fn(),
    askQuestion: jest.fn(),
    selectProject: jest.fn(),
  };
});

jest.mock('@nx/devkit', () => ({
  generateFiles: jest.fn((tree, src, dest, vars) => {
    mockGenerateFiles(tree, src, dest, vars);
  }),
  formatFiles: jest.fn(),
  output: {
    log: jest.fn(),
    warn: jest.fn(),
    bold: (text: string) => text,
  },
  readJson: jest.fn(),
  writeJson: jest.fn(),
  addDependenciesToPackageJson: jest.fn(),
  installPackagesTask: jest.fn(),
  readProjectConfiguration: jest.fn(() => ({ name: 'myapp', tags: [] })),
  getProjects: jest.fn(),
  Tree: jest.fn(),
}));

describe('reactLibGenerator', () => {
  let tree: devkit.Tree;

  const AutoCompleteMock = require('enquirer').AutoComplete;

  beforeEach(() => {
    jest.clearAllMocks();
    tree = createTreeWithEmptyWorkspace();
    jest.spyOn(tree, 'write');
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
    (devkit.readJson as jest.Mock).mockImplementation((tree, filePath) => {
      if (filePath.endsWith('eslint.constraints.json')) {
        const content = tree.read(filePath)?.toString();

        return content ? JSON.parse(content) : [];
      }

      if (filePath.endsWith('tsconfig.json')) {
        return { include: [] };
      }

      return {};
    });
    jest.spyOn(require('../../shared/utils'), 'addNxScopeTag');
  });

  it('should generate library with minimal options and no component', async () => {
    (selectProject as jest.Mock).mockResolvedValue({ name: 'myapp' });
    (askQuestion as jest.Mock).mockResolvedValue('myscope');
    (AutoCompleteMock as jest.Mock).mockImplementation(() => ({ run: jest.fn().mockResolvedValue('ui') }));
    (confirm as jest.Mock).mockResolvedValue(false);

    const options = {
      dryRun: false,
      name: 'mylib',
      withComponent: false,
      app: undefined,
      scope: undefined,
      type: undefined,
    };

    await reactLibGenerator(tree, options);

    expect(selectProject).toHaveBeenCalledWith(tree, 'application', expect.any(String));
    expect(askQuestion).toHaveBeenCalledWith("Enter the scope (e.g: profile) or 'shared': ");
    expect(AutoCompleteMock).toHaveBeenCalled();
    expect(execSync).toHaveBeenCalledWith(expect.stringContaining('npx nx g @nx/react:library'), { stdio: 'inherit' });
    expect(devkit.generateFiles).toHaveBeenCalledTimes(1);
    expect(devkit.generateFiles).toHaveBeenCalledWith(
      tree,
      path.join(__dirname, 'files/base'),
      'libs/myapp/myscope/ui/mylib',
      expect.objectContaining({ libName: 'myapp/myscope/ui/mylib' }),
    );

    expect(addNxScopeTag).toHaveBeenCalledWith(tree, 'myscope');
    expect(devkit.formatFiles).toHaveBeenCalledWith(tree);
  });

  it('should generate library with component', async () => {
    const libPath = 'libs/myapp/shared/features/mylib';
    (selectProject as jest.Mock).mockResolvedValue({ name: 'myapp' });
    (askQuestion as jest.Mock).mockImplementation((question) => {
      if (question.includes('scope')) return Promise.resolve('shared');
      if (question.includes('name of the library')) return Promise.resolve('mylib');

      return Promise.resolve('');
    });
    (AutoCompleteMock as jest.Mock).mockImplementation(() => ({ run: jest.fn().mockResolvedValue('features') }));
    (confirm as jest.Mock)
      .mockResolvedValueOnce(true) // withComponent
      .mockResolvedValueOnce(false);

    await reactLibGenerator(tree, {
      name: 'mylib',
      withComponent: true,
      app: 'myapp',
      scope: 'shared',
    });

    expect(devkit.generateFiles).toHaveBeenCalledTimes(2);
    expect(devkit.generateFiles).toHaveBeenCalledWith(
      tree,
      path.join(__dirname, 'files/base'),
      libPath,
      expect.objectContaining({ libName: 'myapp/shared/features/mylib' }),
    );

    expect(addNxScopeTag).toHaveBeenCalledWith(tree, 'shared');
    expect(devkit.formatFiles).toHaveBeenCalledWith(tree);

    // Verify generated files first line against templates
    assertFirstLine(path.join(__dirname, 'files/base'), libPath, tree, {
      placeholders: { libName: 'myapp/shared/features/mylib' },
    });
    assertFirstLine(path.join(__dirname, 'files/component'), libPath, tree, {
      placeholders: { name: 'Mylib' },
    });
  });
});
