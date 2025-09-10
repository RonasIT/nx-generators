/// <reference types="jest" />
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { Tree } from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { dependencies, devDependencies } from '../../dependencies';
import { BaseGeneratorType } from '../../enums';
import { assertFirstLine, addDependenciesMock, existsSyncMock } from '../../tests-utils';
import runAuthGenerator from './generator';

describe('auth generator (integration, mocked Nx + addDependenciesMock)', () => {
  let tempDir: string;
  let tree: Tree;

  const appName = 'my-app';
  const libsRoot = `libs/${appName}`;
  const appsRoot = `apps/${appName}`;
  const projAlias = '@proj';
  const storePath = `${libsRoot}/shared/data-access/store/src`;
  const apiPath = `${libsRoot}/shared/data-access/api/src`;
  const authPath = `${libsRoot}/shared/data-access/auth/src`;

  beforeAll(() => {
    // Create a temp directory for Nx workspace
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'nx-gen-test-'));
    process.chdir(tempDir);

    fs.mkdirSync(path.join(tempDir, appsRoot), { recursive: true });
    fs.mkdirSync(path.join(tempDir, storePath), { recursive: true });
    fs.mkdirSync(path.join(tempDir, apiPath), { recursive: true });
    fs.mkdirSync(path.join(tempDir, authPath), { recursive: true });

    fs.writeFileSync(
      path.join(tempDir, `${storePath}/store.ts`),
      `export const rootReducer = {}; export const middlewares = [];`,
    );

    fs.writeFileSync(
      path.join(tempDir, 'package.json'),
      JSON.stringify({ name: projAlias, devDependencies: { '@nx/devkit': '^3.0.0' } }),
    );

    fs.writeFileSync(
      path.join(tempDir, 'tsconfig.json'),
      JSON.stringify({
        compilerOptions: {
          baseUrl: '.',
          paths: {
            [`${projAlias}/${appName}/shared/data-access/api/src`]: [apiPath],
            [`${projAlias}/${appName}/shared/data-access/auth/src`]: [authPath],
            [`${projAlias}/${appName}/shared/data-access/store/src`]: [storePath],
          },
        },
      }),
    );

    tree = createTreeWithEmptyWorkspace();
    addDependenciesMock.mockClear();
  });

  afterAll(() => {
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch (err: any) {
      if (err.code === 'EBUSY') {
        setTimeout(() => {
          try {
            fs.rmSync(tempDir, { recursive: true, force: true });
          } catch (err) {
            if (process.env.DEBUG) {
              console.warn('Cleanup failed:', err);
            }
          }
        }, 100);
      } else {
        throw err;
      }
    }
  });

  it('should generate shared libs (Expo) and add auth dependencies', async () => {
    await runAuthGenerator(tree, { directory: appName, type: BaseGeneratorType.EXPO_APP });

    assertFirstLine(path.join(__dirname, 'common-files'), libsRoot, tree, { placeholders: { appName } });

    expect(addDependenciesMock).toHaveBeenCalledWith(
      tree,
      expect.objectContaining(dependencies.auth),
      expect.objectContaining(devDependencies.auth),
    );
  });

  it('should generate Next-specific libs/files and add root + app dependencies', async () => {
    existsSyncMock.mockImplementation((filePath: string) => {
      return filePath === `${appsRoot}/package.json`;
    });

    await runAuthGenerator(tree, { directory: appName, type: BaseGeneratorType.NEXT_APP });

    assertFirstLine(path.join(__dirname, 'common-files'), libsRoot, tree, { placeholders: { appName } });
    assertFirstLine(path.join(__dirname, 'next-libs-files'), libsRoot, tree, { placeholders: { appName } });
    assertFirstLine(path.join(__dirname, 'next-app-files'), appsRoot, tree, {
      placeholders: { appName, libPath: `${projAlias}/${appName}` },
    });

    expect(addDependenciesMock).toHaveBeenCalledWith(
      tree,
      expect.objectContaining(dependencies.auth),
      expect.objectContaining(devDependencies.auth),
    );
    expect(addDependenciesMock).toHaveBeenCalledWith(
      tree,
      expect.objectContaining(dependencies['next-auth']),
      expect.objectContaining(devDependencies['next-auth']),
    );

    expect(addDependenciesMock).toHaveBeenCalledWith(
      tree,
      expect.objectContaining(dependencies.auth),
      expect.objectContaining(devDependencies.auth),
      `${appsRoot}/package.json`,
    );
    expect(addDependenciesMock).toHaveBeenCalledWith(
      tree,
      expect.objectContaining(dependencies['next-auth']),
      expect.objectContaining(devDependencies['next-auth']),
      `${appsRoot}/package.json`,
    );
  });
});
