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
import { runUiKitGenerator } from './generator';

describe('runUiKitGenerator', () => {
  let tree: devkit.Tree;
  const options = {
    name: 'ui-kit',
    directory: 'myapp',
  };
  const uiKitDependencies = dependencies['ui-kit'];
  const libPath = '@proj/myapp';

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
    jest.spyOn(tree, 'delete');

    tree.write('libs/myapp/shared/ui/ui-kit/src/index.ts', 'export {};');
    tree.write('apps/myapp/app/index.tsx', 'export {};');

    readJsonMock.mockImplementation((_tree, path) => {
      if (path === 'package.json') {
        return { name: '@org/myapp' };
      }

      return {};
    });

    jest.clearAllMocks();
  });

  it('should generate lib, delete files, create files from templates, and add dependencies', async () => {
    existsSyncMock.mockReturnValue(true);
    await runUiKitGenerator(tree, options);

    expect(execSyncMock).toHaveBeenCalledWith(
      'npx nx g react-lib --app=myapp --scope=shared --type=ui --name=ui-kit --withComponent=false',
      { stdio: 'inherit' },
    );

    expect(tree.delete).toHaveBeenCalledWith('libs/myapp/shared/ui/ui-kit/src/index.ts');
    expect(tree.delete).toHaveBeenCalledWith('apps/myapp/app/index.tsx');

    expect(generateFilesMock).toHaveBeenCalledTimes(3);

    const libTemplateDir = path.join(__dirname, 'lib-files');
    const libTargetDir = `libs/${options.directory}`;
    assertFirstLine(libTemplateDir, libTargetDir, tree, {
      placeholders: { ...options, libPath },
    });

    const appTemplateDir = path.join(__dirname, 'app-files');
    const appTargetDir = `apps/${options.directory}`;
    assertFirstLine(appTemplateDir, appTargetDir, tree, {
      placeholders: { ...options, libPath },
    });

    const layoutTemplateDir = path.join(__dirname, 'layout-files');
    const layoutTargetDir = `apps/${options.directory}/app`;
    assertFirstLine(layoutTemplateDir, layoutTargetDir, tree, {
      placeholders: { ...options, libPath },
    });

    expect(addDependenciesMock).toHaveBeenCalledWith(tree, uiKitDependencies, {});
    expect(addDependenciesMock).toHaveBeenCalledWith(
      tree,
      uiKitDependencies,
      {},
      `apps/${options.directory}/package.json`,
    );
    expect(formatFilesMock).toHaveBeenCalledWith(tree);
  });

  it('should skip app package dependency if package.json missing', async () => {
    existsSyncMock.mockReturnValue(false);
    await runUiKitGenerator(tree, options);

    expect(addDependenciesMock).toHaveBeenCalledTimes(1);
    expect(addDependenciesMock).toHaveBeenCalledWith(tree, uiKitDependencies, {});
  });
});
