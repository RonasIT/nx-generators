import * as path from 'path';
import { addDependenciesToPackageJson, generateFiles, Tree } from '@nx/devkit';
import { tsquery } from '@phenomnomnominal/tsquery';
import { BinaryExpression, isSourceFile, Node } from 'typescript';
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
  const moduleExportsAssignments = tsquery.query<BinaryExpression>(
    content,
    `${moduleExportsAssignmentSelector} > BinaryExpression`,
  );

  if (!moduleExportsAssignments.length) {
    return content;
  }

  const [firstAssignment] = moduleExportsAssignments;
  let firstTopLevelStatement: Node = firstAssignment;

  while (firstTopLevelStatement.parent && !isSourceFile(firstTopLevelStatement.parent)) {
    firstTopLevelStatement = firstTopLevelStatement.parent;
  }
  const declarationPosition = firstTopLevelStatement.getStart();

  const wrappedContent = [...moduleExportsAssignments]
    .sort((a, b) => b.getStart() - a.getStart())
    .reduce((result, assignment) => {
      const { left, operatorToken, right } = assignment;
      const wrappedAssignment = `${left.getText()} ${operatorToken.getText()} withSentryConfig(${right.getText()}, sentryOptions)`;

      return result.slice(0, assignment.getStart()) + wrappedAssignment + result.slice(assignment.getEnd());
    }, content);

  return [
    wrappedContent.slice(0, declarationPosition),
    `${sentryOptionsDeclaration}\n\n`,
    wrappedContent.slice(declarationPosition),
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
