import { Tree } from '@nx/devkit';

const EASIGNORE_PATH = '.easignore';

const COMMON_LINES = `# Whitelist — ignore everything except what's needed for the mobile EAS build

# Ignore everything
*
.*

# Mobile apps
!apps
apps/*
apps/*/.expo
apps/*/android
apps/*/ios

# Shared libraries
!libs
libs/*
!libs/shared
!libs/shared/**

# i18n translations
!i18n
i18n/*
!i18n/shared
!i18n/shared/**

# Dependency patches for React Native packages
!patches
!patches/**

# Tools
!tools
!tools/**

# Root config files required for the build
!package.json
!package-lock.json
!tsconfig.json
!tsconfig.base.json
!babel.config.json
!jest.config.ts
!jest.preset.js
!types.d.ts`;

function getAppSpecificLines(directory: string): string {
  return `
# Mobile app: ${directory}
!apps/${directory}
!apps/${directory}/**
apps/${directory}/.expo

# Libraries: ${directory}
!libs/${directory}
!libs/${directory}/**

# i18n: ${directory}
!i18n/${directory}
!i18n/${directory}/**`;
}

export function generateEasignore(tree: Tree, directory: string): void {
  const appSpecificLines = getAppSpecificLines(directory);

  if (!tree.exists(EASIGNORE_PATH)) {
    tree.write(EASIGNORE_PATH, COMMON_LINES + '\n' + appSpecificLines + '\n');

    return;
  }

  const existingContent = tree.read(EASIGNORE_PATH, 'utf-8')!;

  if (existingContent.includes(`!apps/${directory}\n`)) {
    return;
  }

  tree.write(EASIGNORE_PATH, existingContent.trimEnd() + '\n' + appSpecificLines + '\n');
}
