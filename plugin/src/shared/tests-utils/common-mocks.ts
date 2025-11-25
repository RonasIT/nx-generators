/// <reference types="jest" />
import * as child_process from 'child_process';
import * as fs from 'fs';
import * as devkit from '@nx/devkit';
import { mockGenerateFiles } from './utils';

// Mock child_process.execSync globally
jest.mock('child_process', () => ({
  execSync: jest.fn(),
}));

// Mock fs methods commonly used
jest.mock('fs', () => {
  const actualFs = jest.requireActual('fs');

  return {
    ...actualFs,
    existsSync: jest.fn(),
    readdirSync: actualFs.readdirSync,
    readFileSync: actualFs.readFileSync,
  };
});

// Mock @nx/devkit utilities commonly used in generators
jest.mock('@nx/devkit', () => ({
  readJson: jest.fn(),
  writeJson: jest.fn(),
  generateFiles: jest.fn((tree, src, dest, vars) => {
    mockGenerateFiles(tree, src, dest, vars);
  }),
  formatFiles: jest.fn(),
  addDependenciesToPackageJson: jest.fn(),
  removeDependenciesFromPackageJson: jest.fn(),
  installPackagesTask: jest.fn(),
  readProjectConfiguration: jest.fn(),
  updateProjectConfiguration: jest.fn(),
  getProjects: jest.fn(),
  output: {
    log: jest.fn(),
    warn: jest.fn(),
    bold: (text: string) => text,
  },
  Tree: jest.fn(),
}));

// Mock enquirer AutoComplete used in some generators
jest.mock('enquirer', () => ({
  Confirm: jest.fn().mockImplementation(() => ({
    run: jest.fn().mockResolvedValue(true), // simulate user confirmed "yes"
  })),
  AutoComplete: jest.fn().mockImplementation(() => ({
    run: jest.fn().mockResolvedValue('libs/shared/ui'),
  })),
}));

// Mock cli-utils common functions partially
jest.mock('../utils/cli-utils', () => {
  const actualUtils = jest.requireActual('../utils/cli-utils');

  return {
    ...actualUtils,
    confirm: jest.fn(() => Promise.resolve(true)),
    askQuestion: jest.fn(),
    getLibraryDetailsByName: jest.fn(),
  };
});

// Mock config-utils common functions partially
jest.mock('../utils/config-utils', () => {
  const actualUtils = jest.requireActual('../utils/config-utils');

  return {
    ...actualUtils,
    getImportPathPrefix: jest.fn(() => '@proj'),
  };
});

jest.mock('../utils/get-app-framework-name', () => ({
  getAppFrameworkName: jest.fn(),
}));

export const installPackagesTaskMock = devkit.installPackagesTask as jest.Mock;
export const execSyncMock = child_process.execSync as jest.Mock;
export const existsSyncMock = fs.existsSync as jest.Mock;
export const generateFilesMock = devkit.generateFiles as jest.Mock;
export const formatFilesMock = devkit.formatFiles as jest.Mock;
export const addDependenciesMock = devkit.addDependenciesToPackageJson as jest.Mock;
export const readJsonMock = devkit.readJson as jest.Mock;
export const writeJsonMock = devkit.writeJson as jest.Mock;
export const readProjectConfigurationMock = devkit.readProjectConfiguration as jest.Mock;
export const getProjectsMock = devkit.getProjects as jest.Mock;
export const confirmMock = require('../utils/cli-utils').confirm as jest.Mock;
export const askQuestionMock = require('../utils/cli-utils').askQuestion as jest.Mock;
export const getLibraryDetailsByNameMock = require('../utils/cli-utils').getLibraryDetailsByName as jest.Mock;
export const getImportPathPrefixMock = require('../utils/config-utils').getImportPathPrefix as jest.Mock;
