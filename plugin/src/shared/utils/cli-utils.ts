import * as readline from 'readline';
import * as fs from 'fs';

export const askQuestion = (question: string): Promise<string> => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) =>
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    })
  );
};

export enum LibraryType {
  UI = 'ui',
  DATA_ACCESS = 'data-access',
  FEATURES = 'features',
  UTILS = 'utils',
}

export const getNxLibsPaths = (types: Array<LibraryType>) => {
  const tsconfig = JSON.parse(fs.readFileSync('tsconfig.base.json', 'utf8'));
  const libs = tsconfig.compilerOptions.paths;
  return Object.values(libs)
    .map((value) => value[0].replace('/index.ts', ''))
    .filter((value) => types.some((type) => value.includes(type)));
}

export const searchNxLibsPaths = (paths: Array<string>, input: string) => {
  return paths.filter((path) => path.includes(input));
}
