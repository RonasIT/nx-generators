/// <reference types="jest" />
import * as child_process from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as devkit from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { BaseGeneratorType } from '../../enums';
import { runStoreGenerator } from './generator';

jest.mock('child_process', () => ({
  execSync: jest.fn(),
}));

jest.mock('@nx/devkit', () => ({
  generateFiles: jest.fn((tree, src, dest) => {
    function copyRecursive(srcDir: string, destDir: string): void {
      const entries = fs.readdirSync(srcDir, { withFileTypes: true });

      for (const entry of entries) {
        const srcPath = path.join(srcDir, entry.name);

        if (entry.isDirectory()) {
          copyRecursive(srcPath, path.join(destDir, entry.name));
        } else {
          const filename = entry.name.replace(/\.template$/, '');
          const destPath = path.join(destDir, filename).split(path.sep).join('/');
          const content = fs.readFileSync(srcPath, 'utf8');
          tree.write(destPath, content);
        }
      }
    }
    copyRecursive(src, dest.split(path.sep).join('/'));
  }),
  formatFiles: jest.fn(),
  addDependenciesToPackageJson: jest.fn(),
  readJson: jest.fn(),
}));

jest.mock('fs', () => {
  const actualFs = jest.requireActual('fs');

  return {
    ...actualFs,
    existsSync: jest.fn(),
  };
});

const execSyncMock = child_process.execSync as jest.Mock;
const generateFilesMock = devkit.generateFiles as jest.Mock;
const formatFilesMock = devkit.formatFiles as jest.Mock;
const addDependenciesMock = devkit.addDependenciesToPackageJson as jest.Mock;
const existsSyncMock = fs.existsSync as jest.Mock;
const readJsonMock = devkit.readJson as jest.Mock;

function assertFirstLine(sourceDir: string, targetDir: string, tree: devkit.Tree): void {
  const entries = fs.readdirSync(sourceDir, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(sourceDir, entry.name);

    if (entry.isDirectory()) {
      assertFirstLine(srcPath, path.join(targetDir, entry.name), tree);
    } else {
      const targetFile = path
        .join(targetDir, entry.name.replace(/\.template$/, ''))
        .split(path.sep)
        .join('/');
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

describe('runStoreGenerator', () => {
  let tree: devkit.Tree;
  const appDirectory = 'myapp';
  const optionsNext = {
    directory: appDirectory,
    baseGeneratorType: BaseGeneratorType.NEXT_APP,
  };

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
    readJsonMock.mockImplementation((_tree, path) => {
      if (path === 'package.json') {
        return { name: '@org/myapp' }; // <- mocked name for getImportPathPrefix
      }

      return {};
    });
    jest.clearAllMocks();
  });

  it('should call execSync to generate react-lib', async () => {
    await runStoreGenerator(tree, optionsNext);

    expect(execSyncMock).toHaveBeenCalledWith(
      `npx nx g react-lib --app=${appDirectory} --scope=shared --type=data-access --name=store`,
      { stdio: 'inherit' },
    );
  });

  it('should replace index.ts file with content from template', async () => {
    const indexPath = `libs/${appDirectory}/shared/data-access/store/src/index.ts`;

    // Write dummy content to simulate previous file
    tree.write(indexPath, '// old index file');
    expect(tree.exists(indexPath)).toBe(true);

    await runStoreGenerator(tree, optionsNext);

    // Check that the file was replaced (exists + has expected content)
    expect(tree.exists(indexPath)).toBe(true);

    const content = tree.read(indexPath)?.toString();
    const templatePath = path.join(__dirname, 'next-app/lib-files/shared/data-access/store/src/index.ts.template');
    const templateContent = fs.readFileSync(templatePath, 'utf8');

    const expectedFirstLine = templateContent.split('\n')[0].trim();
    const actualFirstLine = content?.split('\n')[0].trim();

    expect(actualFirstLine).toBe(expectedFirstLine);
  });

  it('should call generateFiles with correct arguments', async () => {
    await runStoreGenerator(tree, optionsNext);

    expect(generateFilesMock).toHaveBeenCalledTimes(1);
    const [calledTree, calledSourcePath, calledDestPath, calledVars] = generateFilesMock.mock.calls[0];

    expect(calledTree).toBe(tree);
    expect(calledSourcePath).toBe(path.join(__dirname, `${optionsNext.baseGeneratorType}/lib-files`));
    expect(calledDestPath).toBe(`libs/${optionsNext.directory}`);

    expect(calledVars).toMatchObject({
      directory: optionsNext.directory,
      baseGeneratorType: optionsNext.baseGeneratorType,
      formatName: expect.any(Function),
      formatAppIdentifier: expect.any(Function),
      libPath: expect.any(String),
    });
  });

  it('should add dependencies', async () => {
    existsSyncMock.mockReturnValue(false);
    await runStoreGenerator(tree, optionsNext);

    expect(addDependenciesMock).toHaveBeenCalledWith(tree, expect.any(Object), {});
    expect(addDependenciesMock).toHaveBeenCalledTimes(1);
  });

  it('should add dependencies to app package.json if exists', async () => {
    existsSyncMock.mockReturnValue(true);
    await runStoreGenerator(tree, optionsNext);

    expect(addDependenciesMock).toHaveBeenCalledWith(tree, expect.any(Object), {}, `apps/${appDirectory}/package.json`);
  });

  it('should call formatFiles once', async () => {
    await runStoreGenerator(tree, optionsNext);
    expect(formatFilesMock).toHaveBeenCalledWith(tree);
  });

  const generatorTypes = [BaseGeneratorType.NEXT_APP, BaseGeneratorType.EXPO_APP];

  generatorTypes.forEach((baseGeneratorType) => {
    it(`should match first lines of generated files with templates for baseGeneratorType=${baseGeneratorType}`, async () => {
      const options = {
        directory: appDirectory,
        baseGeneratorType,
      };

      await runStoreGenerator(tree, options);

      const templateDir = path.join(__dirname, baseGeneratorType, 'lib-files');
      const destDir = `libs/${options.directory}`;

      assertFirstLine(templateDir, destDir, tree);
    });
  });
});
