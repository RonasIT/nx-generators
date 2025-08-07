/// <reference types="jest" />
import * as path from 'path';
import * as devkit from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { dependencies } from '../../dependencies';
import {
  addDependenciesMock,
  assertFirstLine,
  execSyncMock,
  existsSyncMock,
  formatFilesMock,
  generateFilesMock,
  readJsonMock,
} from '../../tests-utils';
import { runRNStylesGenerator } from './generator';

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
