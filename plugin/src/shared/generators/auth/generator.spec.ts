/// <reference types="jest" />
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { Tree } from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { BaseGeneratorType } from '../../enums';
import { assertFirstLine } from '../../tests-utils';
import { runAuthGenerator } from './generator';

describe('auth generator (integration, mocked Nx)', () => {
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

    // Minimal tsconfig.json for path resolution
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

  it('should generate shared libs (Expo) with correct first lines', async () => {
    await runAuthGenerator(tree, { directory: appName, type: BaseGeneratorType.EXPO_APP });

    assertFirstLine(path.join(__dirname, 'common-files'), libsRoot, tree, { placeholders: { appName } });
  });

  it('should generate Next-specific libs/files with correct first lines', async () => {
    await runAuthGenerator(tree, { directory: appName, type: BaseGeneratorType.NEXT_APP });

    assertFirstLine(path.join(__dirname, 'common-files'), libsRoot, tree, { placeholders: { appName } });

    assertFirstLine(path.join(__dirname, 'next-libs-files'), libsRoot, tree, { placeholders: { appName } });

    assertFirstLine(path.join(__dirname, 'next-app-files'), appsRoot, tree, {
      placeholders: { appName, libPath: `${projAlias}/${appName}` },
    });
  });
});
