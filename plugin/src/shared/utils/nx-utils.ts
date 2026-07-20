import { execSync } from 'child_process';
import { existsSync, readFileSync, writeFileSync } from 'fs';

const npmrcPath = '.npmrc';

export function commentMinReleaseAgeInNpmrc(): string | null {
  if (!existsSync(npmrcPath)) {
    return null;
  }

  const original = readFileSync(npmrcPath, 'utf-8');
  const updated = original
    .split('\n')
    .map((line) => {
      const trimmed = line.trim();

      if (/^min-release-age\s*=/.test(trimmed) && !trimmed.startsWith('#')) {
        return `# ${line}`;
      }

      return line;
    })
    .join('\n');

  if (updated !== original) {
    writeFileSync(npmrcPath, updated);
  }

  return original;
}

export function restoreNpmrcContent(original: string | null): void {
  if (original === null) {
    return;
  }

  writeFileSync(npmrcPath, original);
}

// NOTE: nx add runs npm install, which can fail when .npmrc enforces min-release-age on freshly published @nx/* packages.
export function runNxAddCommand(plugin: string): void {
  const originalNpmrc = commentMinReleaseAgeInNpmrc();

  try {
    execSync(`npx --yes nx add ${plugin}`, { stdio: 'inherit' });
  } finally {
    restoreNpmrcContent(originalNpmrc);
  }
}
