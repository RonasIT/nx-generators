/// <reference types="jest" />
import * as child_process from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as devkit from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { runFormUtilsGenerator } from './generator';

jest.mock('child_process', () => ({
  execSync: jest.fn(),
}));

jest.mock('@nx/devkit', () => ({
  generateFiles: jest.fn(),
  formatFiles: jest.fn(),
}));

const execSyncMock = child_process.execSync as jest.Mock;
const generateFilesMock = devkit.generateFiles as jest.Mock;
const formatFilesMock = devkit.formatFiles as jest.Mock;

describe('runFormUtilsGenerator', () => {
  let tree: devkit.Tree;

  const templatesDir = path.join(__dirname, 'lib-files');
  const targetDir = 'libs/myapp';

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();

    // Create dummy index.ts file that will be deleted by generator
    tree.write('libs/myapp/shared/utils/form/src/index.ts', 'export {};');

    jest.clearAllMocks();

    // Mock tree.read to return content from templates folder for generated files
    const originalRead = tree.read.bind(tree);
    jest.spyOn(tree, 'read').mockImplementation((filePath, encoding) => {
      if (filePath.startsWith(targetDir)) {
        // Compute relative path inside generated lib
        const relativePath = filePath.slice(targetDir.length + 1);
        // Try to read from template folder (add .template if needed)
        let templateFilePath = path.join(templatesDir, relativePath);

        if (!fs.existsSync(templateFilePath)) {
          templateFilePath += '.template';
        }

        if (fs.existsSync(templateFilePath)) {
          return fs.readFileSync(templateFilePath, encoding || 'utf8');
        }
      }

      return originalRead(filePath, encoding as any);
    });
  });

  it('should run the form utils generator and update files correctly', async () => {
    const options = {
      directory: 'myapp',
    };

    await runFormUtilsGenerator(tree, options);

    // Verify execSync called with correct nx generate command
    expect(execSyncMock).toHaveBeenCalledWith(
      'npx nx g react-lib --app=myapp --scope=shared --type=utils --name=form',
      { stdio: 'inherit' },
    );

    // Verify index.ts was deleted
    expect(tree.exists('libs/myapp/shared/utils/form/src/index.ts')).toBe(false);

    // Verify generateFiles called correctly
    expect(generateFilesMock).toHaveBeenCalledWith(tree, path.join(__dirname, '/lib-files'), 'libs/myapp', {});

    expect(formatFilesMock).toHaveBeenCalledWith(tree);

    const verifyGeneratedFilesFirstLine = (): void => {
      const walk = (dir: string): void => {
        const entries = fs.readdirSync(dir, { withFileTypes: true });

        for (const entry of entries) {
          const templatePath = path.join(dir, entry.name);

          if (entry.isDirectory()) {
            walk(templatePath);
          } else {
            // compute target path relative to templatesDir
            const relative = path.relative(templatesDir, templatePath);
            // remove .template extension if present
            const targetFile = path.join(targetDir, relative.replace(/\.template$/, '')).replace(/\\/g, '/');

            const expectedFirstLine = fs.readFileSync(templatePath, 'utf8').split('\n')[0].trim();
            const actualContent = tree.read(targetFile)?.toString();

            expect(actualContent).toBeDefined();
            const actualFirstLine = actualContent?.split('\n')[0].trim();

            expect(actualFirstLine).toBe(expectedFirstLine);
          }
        }
      };
      walk(templatesDir);
    };

    verifyGeneratedFilesFirstLine();
  });
});
