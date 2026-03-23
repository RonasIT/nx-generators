import * as fs from 'fs';
import * as path from 'path';
import * as devkit from '@nx/devkit';
import { Tree } from '@nx/devkit';

const BINARY_FILE_PATTERN = /\.(ttf|otf|eot|woff2?|png|jpe?g|gif|ico|webp|pdf)$/i;

function fileNameMatchesIgnorePattern(fileName: string, pattern: string): boolean {
  if (!pattern.includes('*')) {
    return fileName === pattern;
  }

  const regexSource = pattern
    .split('*')
    .map((segment) => segment.replace(/[.+^${}()|[\]\\]/g, '\\$&'))
    .join('.*');

  return new RegExp(`^${regexSource}$`).test(fileName);
}

interface AssertFirstLineOptions {
  placeholders?: Record<string, string>;
  /** Basename match, or glob with `*` (e.g. `*.ttf`). */
  ignoreFiles?: Array<string>;
}

export function assertFirstLine(
  sourceDir: string,
  targetDir: string,
  tree: devkit.Tree,
  options: AssertFirstLineOptions = {},
): void {
  const { placeholders = {}, ignoreFiles = [] } = options;

  const entries = fs.readdirSync(sourceDir, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(sourceDir, entry.name);

    if (entry.isDirectory()) {
      assertFirstLine(srcPath, path.join(targetDir, entry.name), tree, options);
    } else {
      if (ignoreFiles.some((p) => fileNameMatchesIgnorePattern(entry.name, p))) {
        continue;
      }

      let fileName = entry.name.replace(/\.template$/, '');

      Object.entries(placeholders).forEach(([key, value]) => {
        fileName = fileName.replace(new RegExp(`__${key}__`, 'g'), value);
      });

      const targetFile = path.join(targetDir, fileName).split(path.sep).join('/');

      let expectedFirstLine = fs.readFileSync(srcPath, 'utf8').split('\n')[0].trim();

      // Substitute placeholders in first line
      Object.entries(placeholders).forEach(([key, value]) => {
        expectedFirstLine = expectedFirstLine.replace(new RegExp(`<%=\\s*${key}\\s*%>`, 'g'), value);
        expectedFirstLine = expectedFirstLine.replace(new RegExp(`__${key}__`, 'g'), value);
      });

      // Check for unresolved placeholders in expected line
      const unresolved = expectedFirstLine.match(/<%=?\s*\w+\s*%>|__\w+__/);

      if (unresolved) {
        throw new Error(
          `Unresolved placeholder '${unresolved[0]}' found in template '${srcPath}' first line: '${expectedFirstLine}'. ` +
            `You may have forgotten to pass it in placeholders.`,
        );
      }

      const generatedContent = tree.read(targetFile)?.toString();

      if (!generatedContent) {
        throw new Error(`Expected generated file not found: ${targetFile}`);
      }

      const actualFirstLine = generatedContent.split('\n')[0].trim();
      expect(actualFirstLine).toBe(expectedFirstLine);
    }
  }
}

export function mockGenerateFiles(
  tree: Tree,
  srcDir: string,
  destDir: string,
  templateVars?: Record<string, string>,
): void {
  function copyRecursive(src: string, dest: string): void {
    const entries = fs.readdirSync(src, { withFileTypes: true });

    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);

      if (entry.isDirectory()) {
        copyRecursive(srcPath, path.join(dest, entry.name));
      } else {
        let fileName = entry.name.replace(/\.template$/, '');

        if (templateVars) {
          Object.entries(templateVars).forEach(([key, value]) => {
            fileName = fileName.replace(new RegExp(`__${key}__`, 'g'), value);
          });
        }

        const destPath = path.join(dest, fileName).split(path.sep).join('/');

        if (BINARY_FILE_PATTERN.test(fileName)) {
          tree.write(destPath, fs.readFileSync(srcPath));
          continue;
        }

        let content = fs.readFileSync(srcPath, 'utf8');

        if (templateVars) {
          Object.entries(templateVars).forEach(([key, value]) => {
            const regex1 = new RegExp(`<%=\\s*${key}\\s*%>`, 'g');
            const regex2 = new RegExp(`__${key}__`, 'g');
            content = content.replace(regex1, value);
            content = content.replace(regex2, value);
          });
        }

        tree.write(destPath, content);
      }
    }
  }
  copyRecursive(srcDir, destDir.split(path.sep).join('/'));
}
