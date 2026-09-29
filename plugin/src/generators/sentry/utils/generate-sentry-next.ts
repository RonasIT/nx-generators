import * as path from 'path';
import { addDependenciesToPackageJson, generateFiles, Tree } from '@nx/devkit';
import { tsquery } from '@phenomnomnominal/tsquery';
import { BinaryExpression } from 'typescript';
import { dependencies } from '../../../shared/dependencies';
import { updateFileContent } from '../../../shared/utils';
import { SentryGeneratorSchema } from '../schema';

const addRequiredImports = (content: string): string =>
  tsquery.replace(
    content,
    'VariableStatement:has(Identifier[name="nextConfig"])',
    (node) => `const { withSentryConfig } = require('@sentry/nextjs');

${node.getText()}`,
  );

const moduleExportsAssignmentSelector =
  'ExpressionStatement:has(PropertyAccessExpression:has(Identifier[name="module"]):has(Identifier[name="exports"]))';

const wrapIntoSentryConfig = (content: string): string => {
  const withSentryOptions = tsquery.replace(content, moduleExportsAssignmentSelector, (node) => {
    return `
      /**
      * @type {import('@sentry/nextjs').SentryBuildOptions}
      **/
      const sentryOptions = {
        silent: !process.env.CI,
        org: '',
        project: '',
        authToken: process.env.SENTRY_AUTH_TOKEN,
        widenClientFileUpload: true,
      };

      ${node.getText()}`;
  });

  return tsquery.replace(withSentryOptions, `${moduleExportsAssignmentSelector} > BinaryExpression`, (node) => {
    const { left, operatorToken, right } = node as BinaryExpression;

    return `${left.getText()} ${operatorToken.getText()} withSentryConfig(${right.getText()}, sentryOptions)`;
  });
};

export function generateSentryNext(tree: Tree, options: SentryGeneratorSchema, projectRoot: string): void {
  addDependenciesToPackageJson(tree, dependencies.sentry.next, {});

  updateFileContent(
    `${projectRoot}/next.config.js`,
    (fileContent) => wrapIntoSentryConfig(addRequiredImports(fileContent)),
    tree,
  );

  const envFiles = ['.env', '.env.development', '.env.production'];
  envFiles.forEach((file) => {
    updateFileContent(`${projectRoot}/${file}`, (fileContent) => fileContent + 'SENTRY_AUTH_TOKEN=', tree);
  });

  generateFiles(tree, path.join(__dirname, '../files'), projectRoot, options);
}
