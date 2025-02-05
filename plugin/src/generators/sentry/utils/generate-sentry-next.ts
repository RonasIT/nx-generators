import * as path from 'path';
import { addDependenciesToPackageJson, generateFiles, Tree } from '@nx/devkit';
import { tsquery } from '@phenomnomnominal/tsquery';
import { createPrinter, factory, ObjectLiteralExpression } from 'typescript';
import { updateFile } from '../../../shared/utils';
import { SentryGeneratorSchema } from '../schema';
import { createObjectLiteralExpression } from './create-object-literal-expression';

const nextAppDependencies = {
  '@sentry/nextjs': '^8.35.0',
};

const addRequiredImports = (content: string): string =>
  tsquery.replace(
    content,
    'VariableStatement:has(Identifier[name="withNx"]):has(CallExpression:has(Identifier[name="require"]))',
    (node) => `${node.getText()}
      const { withSentryConfig } = require('@sentry/nextjs');`,
    {},
  );

const modifyNextConfig = (content: string): string =>
  createPrinter().printFile(
    tsquery.map(
      tsquery.ast(content),
      'Identifier[name="nextConfig"] ~ ObjectLiteralExpression',
      (node) => {
        return createObjectLiteralExpression(
          [
            {
              key: 'widenClientFileUpload',
              initializer: factory.createTrue(),
              comment: 'Upload a larger set of source maps for prettier stack traces (increases build time)',
            },
            {
              key: 'transpileClientSDK',
              initializer: factory.createTrue(),
              comment: 'Transpiles SDK to be compatible with IE11 (increases bundle size)',
            },
            {
              key: 'tunnelRoute',
              initializer: factory.createStringLiteral('/monitoring'),
              comment:
                'Routes browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers (increases server load)',
            },
            {
              key: 'hideSourceMaps',
              initializer: factory.createTrue(),
              comment: 'Hides source maps from generated client bundles',
            },
            {
              key: 'disableLogger',
              initializer: factory.createTrue(),
              comment: 'Automatically tree-shake Sentry logger statements to reduce bundle size',
            },
          ],
          (node as ObjectLiteralExpression).properties,
        );
      },
      {
        visitAllChildren: true,
      },
    ),
  );

const wrapIntoSentryConfig = (content: string): string => {
  const withSentryWebpackPluginOptions = tsquery.replace(
    content,
    'ExpressionStatement:has(CallExpression Identifier[name="withNx"])',
    (node) => {
      return `
      /**
      * @type {import('@sentry/nextjs').SentryWebpackPluginOptions}
      **/

      const sentryWebpackPluginOptions = {
        silent: true,
        org: '',
        project: 'web-next-js-client',
        authToken: process.env.SENTRY_AUTH_TOKEN,
      };

      ${node.getText()}`;
    },
    {
      visitAllChildren: true,
    },
  );

  return tsquery.replace(
    withSentryWebpackPluginOptions,
    'CallExpression > CallExpression:has(Identifier[name="withNx"]) Identifier[name="nextConfig"]',
    (node) => `withSentryConfig(${node.getText()}, sentryWebpackPluginOptions)`,
    {
      visitAllChildren: true,
    },
  );
};

export function generateSentryNext(tree: Tree, options: SentryGeneratorSchema, projectRoot: string) {
  addDependenciesToPackageJson(tree, nextAppDependencies, {});

  updateFile(tree, `${projectRoot}/next.config.js`, (fileContent) =>
    wrapIntoSentryConfig(modifyNextConfig(addRequiredImports(fileContent))),
  );

  const envFiles = ['.env', '.env.development', '.env.production'];
  envFiles.forEach((file) => {
    updateFile(tree, `${projectRoot}/${file}`, (fileContent) => fileContent + 'SENTRY_AUTH_TOKEN=');
  });

  generateFiles(tree, path.join(__dirname, '../files'), projectRoot, options);
}
