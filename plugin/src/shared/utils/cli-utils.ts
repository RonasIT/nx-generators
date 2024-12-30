import * as fs from 'fs';
import * as readline from 'readline';
import { getProjects, ProjectType, Tree } from '@nx/devkit';
import { constants } from './constants';
import { dynamicImport } from './dynamic-import';

export const createCliReadline = (): readline.Interface => readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

export const askQuestion = (
  question: string,
  defaultAnswer?: string,
  cliReadline?: readline.Interface,
): Promise<string> => {
  const rl = cliReadline || createCliReadline();

  if (defaultAnswer) {
    rl.write(defaultAnswer);
    // Move cursor to end of the line
    setTimeout(() => rl.write(null, { ctrl: true, name: 'e' }));
  }

  return new Promise((resolve) => rl.question(question, (answer) => {
    if (!cliReadline) {
      rl.close();
    }
    resolve(answer);
  }),);
};

export enum LibraryType {
  UI = 'ui',
  DATA_ACCESS = 'data-access',
  FEATURES = 'features',
  UTILS = 'utils'
}

const parseLibsPaths = (): Record<string, Array<string>> => {
  let tsconfig;

  if (fs.existsSync('tsconfig.base.json')) {
    tsconfig = JSON.parse(fs.readFileSync('tsconfig.base.json', 'utf8'));
  } else {
    tsconfig = JSON.parse(fs.readFileSync('tsconfig.json', 'utf8'));
  }

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

export const searchAliasPath = (input: string): string | undefined => {
  const libs = parseLibsPaths();
  const path = Object.keys(libs).find((key) => libs[key][0].includes(input));

  return path;
};

export const filterSource = async (input: string, source: Array<string>): Promise<Array<{ value: string }>> => {
  const filteredData = input
    ? source.filter((pathname) => pathname.toLowerCase().includes(input.toLowerCase()))
    : source;

  return filteredData.map((path) => ({ value: path }));
};

export const appendFileContent = (path: string, endContent: string, tree: Tree): void => {
  const content = tree.read(path, 'utf-8');
  const contentUpdate = (content || '') + endContent;

  tree.write(path, contentUpdate);
};

export const getProjectsDetails = (tree: Tree, projectType: ProjectType): Array<{ name: string; path: string; }> => Array.from(getProjects(tree))
  .filter(([_, project]) => project.projectType === projectType)
  .map(([name, project]) => ({ name, path: project.root }));

export const selectProject = async (
  tree: Tree,
  projectType: ProjectType,
  message: string,
): Promise<{ name: string; path: string }> => {
  const { default: autocomplete } = await dynamicImport<typeof import('inquirer-autocomplete-standalone')>(
    'inquirer-autocomplete-standalone',
  );
  const projects = getProjectsDetails(tree, projectType);

  if (!projects.length) {
    throw new Error(`No projects of type ${projectType} found.`);
  }

  return autocomplete({
    message,
    source: async (input) => {
      const entries = [...projects, { name: constants.sharedValue, path: constants.sharedValue }].map((project) => ({
        name: `${project.name} (${project.path})`,
        value: { ...project, name: projectType === 'application' ? project.path.replace('apps/', '') : project.name }
      }));

      if (!input) {
        return entries;
      }

      return entries.filter((entry) => entry.name.toLowerCase().includes(input.toLowerCase()));
    }
  });
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
