import * as readline from 'readline';
import * as fs from 'fs';
import { Tree } from '@nx/devkit';

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
