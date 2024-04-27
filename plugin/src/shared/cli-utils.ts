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

export const getNxLibsPaths = () => {
  const tsconfig = JSON.parse(fs.readFileSync('tsconfig.json', 'utf8'));
  const libs = tsconfig.compilerOptions.paths;
  return Object.values(libs)
    .map((value) => value[0].replace('/index.ts', ''))
    .filter((value) => value.includes('features') || value.includes('ui'))
}
