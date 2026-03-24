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
    tree.write('i18n/myapp/shared/en.json', '{}');
    tree.write('libs/myapp/shared/features/toast-provider/src/index.ts', 'export {};');
    tree.write('libs/myapp/shared/utils/toast-service/src/index.ts', 'export {};');

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

    // Verify ui-kit lib generation
    expect(execSyncMock).toHaveBeenCalledWith(
      'npx nx g react-lib --app=myapp --scope=shared --type=ui --name=ui-kit --withComponent=false',
      { stdio: 'inherit' },
    );

    // Verify toast-provider lib generation
    expect(execSyncMock).toHaveBeenCalledWith(
      'npx nx g react-lib --app=myapp --scope=shared --type=features --name=toast-provider --withComponent=false',
      { stdio: 'inherit' },
    );

    // Verify toast-service lib generation
    expect(execSyncMock).toHaveBeenCalledWith(
      'npx nx g react-lib --app=myapp --scope=shared --type=utils --name=toast-service',
      { stdio: 'inherit' },
    );

    expect(tree.delete).toHaveBeenCalledWith('libs/myapp/shared/ui/ui-kit/src/index.ts');
    expect(tree.delete).toHaveBeenCalledWith('apps/myapp/app/index.tsx');
    expect(tree.delete).toHaveBeenCalledWith('i18n/myapp/shared/en.json');
    expect(tree.delete).toHaveBeenCalledWith('libs/myapp/shared/features/toast-provider/src/index.ts');
    expect(tree.delete).toHaveBeenCalledWith('libs/myapp/shared/utils/toast-service/src/index.ts');

    expect(generateFilesMock).toHaveBeenCalledTimes(6);

    // Verify lib-files generation
    const libTemplateDir = path.join(__dirname, 'lib-files');
    const libTargetDir = `libs/${options.directory}`;
    assertFirstLine(libTemplateDir, libTargetDir, tree, {
      placeholders: { ...options, libPath },
    });

    // Verify app-files generation
    const appTemplateDir = path.join(__dirname, 'app-files');
    const appTargetDir = `apps/${options.directory}`;
    assertFirstLine(appTemplateDir, appTargetDir, tree, {
      placeholders: { ...options, libPath },
    });

    // Verify layout-files generation
    const layoutTemplateDir = path.join(__dirname, 'layout-files');
    const layoutTargetDir = `apps/${options.directory}/app`;
    assertFirstLine(layoutTemplateDir, layoutTargetDir, tree, {
      placeholders: { ...options, libPath },
    });

    // Verify i18n files generation
    const i18nTemplateDir = path.join(__dirname, 'i18n');
    const i18nTargetDir = `i18n/${options.directory}`;
    assertFirstLine(i18nTemplateDir, i18nTargetDir, tree, {
      placeholders: {},
    });

    // Verify toast-provider files generation
    const toastProviderTemplateDir = path.join(__dirname, 'toast-provider-files');
    const toastProviderTargetDir = `libs/${options.directory}/shared/features/toast-provider/src`;
    assertFirstLine(toastProviderTemplateDir, toastProviderTargetDir, tree, {
      placeholders: { ...options, libPath },
    });

    // Verify toast-service files generation
    const toastServiceTemplateDir = path.join(__dirname, 'toast-service-files');
    const toastServiceTargetDir = `libs/${options.directory}/shared/utils/toast-service/src`;
    assertFirstLine(toastServiceTemplateDir, toastServiceTargetDir, tree, {
      placeholders: {},
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
