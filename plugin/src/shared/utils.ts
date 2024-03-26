import * as readline from 'readline';

export const formatName = (value: string, withoutSpaces = false) =>
  value
    .split('-')
    .map((word) => `${word.charAt(0).toUpperCase()}${word.substring(1)}`)
    .join(withoutSpaces ? '' : ' ');

export const getProjectName = (str: string) => {
  const parts = str.split('@');

  return parts.length > 1 ? parts[1].split('/')[0] : parts[0];
};

export const getLibName = (path: string) => path.split('/').pop();

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
}

export const convertToKebabCase = (value: string) =>
  value
    .trim()
    .replace(/(.)([A-Z])/g, (_, p1, p2) => p1 + '-' + p2)
    .toLowerCase();
