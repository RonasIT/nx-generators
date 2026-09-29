import * as path from 'path';
import { addDependenciesToPackageJson, generateFiles, Tree } from '@nx/devkit';
import { tsquery } from '@phenomnomnominal/tsquery';
import { BinaryExpression } from 'typescript';
import { dependencies } from '../../../shared/dependencies';
import { updateFileContent } from '../../../shared/utils';
import { SentryGeneratorSchema } from '../schema';

const addRequiredImports = (content: string): string =>
  `const { withSentryConfig } = require('@sentry/nextjs/config');\n${content}`;

const moduleExportsAssignmentSelector =
  'ExpressionStatement:has(PropertyAccessExpression:has(Identifier[name="module"]):has(Identifier[name="exports"]))';

const sentryOptionsDeclaration = `/**
 * @type {import('@sentry/nextjs/config').SentryBuildOptions}
 **/
const sentryOptions = {
  silent: !process.env.CI,
  org: '',
  project: '',
  authToken: process.env.SENTRY_AUTH_TOKEN,
  widenClientFileUpload: true,
};`;

const wrapIntoSentryConfig = (content: string): string => {
  const [moduleExportsAssignment] = tsquery.query<BinaryExpression>(
    content,
    `${moduleExportsAssignmentSelector} > BinaryExpression`,
  );

  if (!moduleExportsAssignment) {
    return content;
  }

  const { left, operatorToken, right } = moduleExportsAssignment;
  const wrappedAssignment = `${left.getText()} ${operatorToken.getText()} withSentryConfig(${right.getText()}, sentryOptions)`;

  return [
    content.slice(0, moduleExportsAssignment.getStart()),
    `${sentryOptionsDeclaration}\n\n${wrappedAssignment}`,
    content.slice(moduleExportsAssignment.getEnd()),
  ].join('');
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
