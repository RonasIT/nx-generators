import * as readline from 'readline';
import * as fs from 'fs';

export const askQuestion = (question: string, defaultAnswer?: string): Promise<string> => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) =>
    rl.question(question, (answer) => {
      if (defaultAnswer) {
        answer = defaultAnswer;
      }

      rl.close();
      resolve(answer.startsWith('/') ? answer : `/${answer}`);
    })
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
}

export const getNxLibsPaths = (types: Array<LibraryType>) => {
  const libs = parseLibsPaths();

  return Object.values(libs)
    .map((value) => value[0].replace('/index.ts', ''))
    .filter((value) => types.some((type) => value.includes(type)));
}

export const searchNxLibsPaths = (paths: Array<string>, input: string) => {
  return paths.filter((path) => path.includes(input));
}

export const searchAliasPath = (input: string) => {
  const libs = parseLibsPaths();
  const path = Object.keys(libs).find((key) => libs[key][0].includes(input));

  return path;
}
