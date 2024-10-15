import * as readline from 'readline';
import * as fs from 'fs';
import { getProjects, ProjectType, Tree } from '@nx/devkit';
import { dynamicImport } from './dynamic-import';
import { constants } from './constants';

export const askQuestion = (question: string, defaultAnswer?: string): Promise<string> => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  if (defaultAnswer) {
    rl.write(defaultAnswer);
    // Move cursor to end of the line
    setTimeout(() => rl.write(null, { ctrl: true, name: 'e' }));
  }

  return new Promise((resolve) =>
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    }),
  );
};

export enum LibraryType {
  UI = 'ui',
  DATA_ACCESS = 'data-access',
  FEATURES = 'features',
  UTILS = 'utils',
}

const parseLibsPaths = () => {
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
}

export const getNxLibsPaths = (types: Array<LibraryType>) => {
  const libs = parseLibsPaths();

  return Object.values(libs)
    .map((value) => value[0].replace('/index.ts', ''))
    .filter((value) => types.some((type) => value.includes(type)));
};

export const searchNxLibsPaths = (
  paths: Array<string>,
  input: string,
  method: 'includes' | 'startsWith' | 'endsWith' = 'includes',
) => {
  return paths.filter((path) => path[method](input));
};

export const searchAliasPath = (input: string) => {
  const libs = parseLibsPaths();
  const path = Object.keys(libs).find((key) => libs[key][0].includes(input));

  return path;
};

export const filterSource = async (input: string, source: Array<string>) => {
  const filteredData = input
    ? source.filter((pathname) => pathname.toLowerCase().includes(input.toLowerCase()))
    : source;

  return filteredData.map((path) => ({ value: path }));
};

export const appendFileContent = (path: string, endContent: string, tree: Tree) => {
  const content = tree.read(path, 'utf-8');
  const contentUpdate = (content || '') + endContent;

  tree.write(path, contentUpdate);
};

export const getProjectsDetails = (tree: Tree, projectType: ProjectType) => Array.from(getProjects(tree))
  .filter(([_, project]) => project.projectType === projectType)
  .map(([name, project]) => ({ name, path: project.root }));

export const selectProject = async (tree: Tree, projectType: ProjectType, message: string): Promise<{ name: string, path: string }> => {
  const { default: autocomplete } = await dynamicImport<typeof import('inquirer-autocomplete-standalone')>('inquirer-autocomplete-standalone');
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
