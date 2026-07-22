import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import { getProjects, ProjectType, Tree } from '@nx/devkit';
import { compact } from 'lodash';
import { constants } from './constants';

export const createCliReadline = (): readline.Interface =>
  readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

export const askQuestion = async (question: string, defaultAnswer?: string): Promise<string> => {
  const { Input } = require('enquirer');
  const prompt = new Input({
    message: question,
    initial: defaultAnswer,
  });

  return await prompt.run();
};

export const confirm = async (confirmationMessage: string): Promise<boolean> => {
  const { Confirm } = require('enquirer');

  const prompt = new Confirm({
    name: 'question',
    message: confirmationMessage,
  });

  return await prompt.run();
};

export enum LibraryType {
  UI = 'ui',
  DATA_ACCESS = 'data-access',
  FEATURES = 'features',
  UTILS = 'utils',
}

const parseLibsPaths = (workspaceRoot = process.cwd()): Record<string, Array<string>> => {
  const tsconfigPath = fs.existsSync(path.join(workspaceRoot, 'tsconfig.base.json'))
    ? path.join(workspaceRoot, 'tsconfig.base.json')
    : path.join(workspaceRoot, 'tsconfig.json');

  const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));

  return tsconfig.compilerOptions.paths;
};

export const validateLibraryType = (type: string): string => {
  const allLibraryTypes = Object.values(LibraryType);

  if (!allLibraryTypes.includes(type as LibraryType)) {
    throw new Error(`Invalid library type: ${type}.\nAvailable types: ${allLibraryTypes.join(', ')}`);
  }

  return type;
};

export const getNxLibsPaths = (types: Array<LibraryType>): Array<string> => {
  const libs = parseLibsPaths();

  return Object.values(libs)
    .map((value) => value[0].replace('/index.ts', ''))
    .filter((value) => types.some((type) => value.includes(type)));
};

export const searchNxLibsPaths = (
  paths: Array<string>,
  input: string,
  method: 'includes' | 'startsWith' | 'endsWith' = 'includes',
): Array<string> => {
  return paths.filter((path) => path[method](input));
};

export const searchAliasPath = (input: string, workspaceRoot?: string): string | undefined => {
  const libs = parseLibsPaths(workspaceRoot);

  return Object.keys(libs).find((key) => libs[key][0].includes(input));
};

export const filterSource = async (input: string, source: Array<string>): Promise<Array<{ value: string }>> => {
  const filteredData = input
    ? source.filter((pathname) => pathname.toLowerCase().includes(input.toLowerCase()))
    : source;

  return filteredData.map((path) => ({ value: path }));
};

export const updateFileContent = (path: string, updater: (fileContent: string) => string, tree: Tree): void => {
  const fileContent = tree.read(path, 'utf-8');

  tree.write(path, updater(fileContent || ''));
};

export const appendFileContent = (path: string, endContent: string, tree: Tree): void => {
  updateFileContent(path, (fileContent) => fileContent + endContent, tree);
};

export const getProjectsDetails = (tree: Tree, projectType: ProjectType): Array<{ name: string; path: string }> =>
  Array.from(getProjects(tree))
    .filter(([_, project]) => project.projectType === projectType)
    .map(([name, project]) => ({ name, path: project.root }));

export const selectProject = async (
  tree: Tree,
  projectType: ProjectType,
  message: string,
  applicationsOnly: boolean = false,
): Promise<{ name: string; path: string }> => {
  const { AutoComplete } = require('enquirer');
  const projects = getProjectsDetails(tree, projectType);

  if (!projects.length) {
    throw new Error(`No projects of type ${projectType} found.`);
  }

  const records = compact([
    ...projects,
    !applicationsOnly && { name: constants.sharedValue, path: constants.sharedValue },
  ]).map((project) => ({
    name: `${project.name} (${project.path})`,
    value: { ...project, name: projectType === 'application' ? project.path.replace('apps/', '') : project.name },
  }));

  const selectedProjectName = await new AutoComplete({
    name: 'project',
    message,
    limit: 10,
    choices: records.map((record) => record.name),
  }).run();

  const selectedProject = records.find((record) => record.name === selectedProjectName)?.value;

  if (!selectedProject) {
    throw new Error(`Project ${selectedProjectName} not found.`);
  }

  return selectedProject;
};

export const getLibraryDetailsByName = async (
  tree: Tree,
  libraryName?: string,
): Promise<{ name: string; path: string }> => {
  let selectedLibraryName: string;
  let selectedLibraryPath: string;

  if (libraryName) {
    selectedLibraryName = libraryName;

    const library = getProjectsDetails(tree, 'library').find((library) => library.name === selectedLibraryName);

    if (!library) {
      throw new Error(`Library ${selectedLibraryName} not found`);
    }

    selectedLibraryPath = library.path;
  } else {
    const selectedLibrary = await selectProject(tree, 'library', 'Select the library to move: ');

    selectedLibraryName = selectedLibrary.name;
    selectedLibraryPath = selectedLibrary.path;
  }

  return { name: selectedLibraryName, path: selectedLibraryPath };
};
