/// <reference types="jest" />
import * as child_process from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as devkit from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { dependencies } from '../../dependencies';
import { assertFirstLine, mockGenerateFiles } from '../../utils';
import { runRNStylesGenerator } from './generator';

jest.mock('child_process', () => ({
  execSync: jest.fn(),
}));

jest.mock('fs', () => ({
  existsSync: jest.fn(),
  readdirSync: jest.requireActual('fs').readdirSync,
  readFileSync: jest.requireActual('fs').readFileSync,
}));

jest.mock('@nx/devkit', () => ({
  generateFiles: jest.fn((tree, src, dest, vars) => {
    mockGenerateFiles(tree, src, dest, vars);
  }),
  formatFiles: jest.fn(),
  addDependenciesToPackageJson: jest.fn(),
  readJson: jest.fn(),
}));

const execSyncMock = child_process.execSync as jest.Mock;
const existsSyncMock = fs.existsSync as jest.Mock;
const generateFilesMock = devkit.generateFiles as jest.Mock;
const addDependenciesMock = devkit.addDependenciesToPackageJson as jest.Mock;
const formatFilesMock = devkit.formatFiles as jest.Mock;
const readJsonMock = devkit.readJson as jest.Mock;

describe('runRNStylesGenerator', () => {
  let tree: devkit.Tree;
  const options = {
    name: 'my-styles',
    directory: 'myapp',
  };
  const stylesDependencies = dependencies['rn-styles'];

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();

    tree.write('libs/myapp/shared/ui/styles/src/index.ts', 'export {};');

    readJsonMock.mockImplementation((_tree, path) => {
      if (path === 'package.json') {
        return { name: '@org/myapp' };
      }

      return {};
    });

    jest.clearAllMocks();
  });

  it('should generate lib, delete old index, create files, and match first lines', async () => {
    existsSyncMock.mockReturnValue(true);
    await runRNStylesGenerator(tree, options);

    expect(execSyncMock).toHaveBeenCalledWith(
      'npx nx g react-lib --app=myapp --scope=shared --type=ui --name=styles --withComponent=false',
      { stdio: 'inherit' },
    );

    expect(generateFilesMock).toHaveBeenCalled();

    const templateDir = path.join(__dirname, 'lib-files');
    const targetDir = `libs/${options.directory}`;
    assertFirstLine(templateDir, targetDir, tree);

    expect(addDependenciesMock).toHaveBeenCalledWith(tree, stylesDependencies, {});
    expect(addDependenciesMock).toHaveBeenCalledWith(
      tree,
      stylesDependencies,
      {},
      `apps/${options.directory}/package.json`,
    );
    expect(formatFilesMock).toHaveBeenCalledWith(tree);
  });

  it('should skip app package dependency if package.json missing', async () => {
    existsSyncMock.mockReturnValue(false);
    await runRNStylesGenerator(tree, options);

    expect(addDependenciesMock).toHaveBeenCalledTimes(1);
    expect(addDependenciesMock).toHaveBeenCalledWith(tree, stylesDependencies, {});
  });
});
