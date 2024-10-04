import {
  addDependenciesToPackageJson,
  formatFiles,
  generateFiles,
  Tree,
} from '@nx/devkit';
import * as path from 'path';
import { SentryGeneratorSchema } from './schema';
import { isExpoApp, isNextApp } from '../../shared/utils';
import { tsquery } from '@phenomnomnominal/tsquery';
import {
  createPrinter,
  factory,
  transform,
  NodeFlags,
  ObjectLiteralExpression,
  PropertyAssignment,
  SyntaxKind,
  addSyntheticLeadingComment,
  Expression,
  NodeArray,
  ObjectLiteralElementLike,
} from 'typescript';

type PropertyAssignmentData = {
  key: string;
  initializer: Expression;
  comment?: string;
};

/*
  Разобраться, что происходит с форматированием
*/

const generatePropertyAssignment = ({
  key,
  initializer,
  comment,
}: PropertyAssignmentData): PropertyAssignment => {
  const property = factory.createPropertyAssignment(
    factory.createIdentifier(key),
    initializer,
  );

  if (comment) {
    addSyntheticLeadingComment(
      property,
      SyntaxKind.SingleLineCommentTrivia,
      ` ${comment}`,
    );
  }

  return property;
};

const generateObjectLiteralExpression = (
  objectData: Array<PropertyAssignmentData>,
  restProperties: NodeArray<ObjectLiteralElementLike>,
): ObjectLiteralExpression => {
  return factory.createObjectLiteralExpression([
    ...objectData.map(generatePropertyAssignment),
    ...restProperties,
  ]);
};

const nextAppDependencies = {
  '@sentry/nextjs': '^8.21.0',
};

const expoAppDependencies = {
  '@sentry/react-native': '~5.22.0',
};

export async function sentryGenerator(
  tree: Tree,
  options: SentryGeneratorSchema,
) {
  const projectRoot = `apps/${options.directory}`;

  if (isNextApp(tree, projectRoot)) {
    addDependenciesToPackageJson(tree, nextAppDependencies, {});

    const nextConfigContent = tree
      .read(`${projectRoot}/next.config.js`)
      .toString();

    const nextWithImports = tsquery.replace(
      nextConfigContent,
      'VariableStatement:has(Identifier[name="withNx"]):has(CallExpression:has(Identifier[name="require"]))',
      (node) => `${node.getText()}
        const { withSentryConfig } = require('@sentry/nextjs');
        
        `,
      {},
    );

    const updatedNextConfig = tsquery.map(
      tsquery.ast(nextWithImports),
      'Identifier[name="nextConfig"] ~ ObjectLiteralExpression',
      (node: ObjectLiteralExpression) => {
        return generateObjectLiteralExpression(
          [
            {
              key: 'widenClientFileUpload',
              initializer: factory.createTrue(),
              comment:
                'Upload a larger set of source maps for prettier stack traces (increases build time)',
            },
            {
              key: 'transpileClientSDK',
              initializer: factory.createTrue(),
              comment:
                'Transpiles SDK to be compatible with IE11 (increases bundle size)',
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
              comment:
                'Automatically tree-shake Sentry logger statements to reduce bundle size',
            },
          ],
          node.properties,
        );
      },
      {
        visitAllChildren: true,
      },
    );

    const withSentryWebpackPluginOptions = tsquery.replace(
      createPrinter().printFile(updatedNextConfig),
      'ExpressionStatement:has(CallExpression > Identifier[name="composePlugins"])',
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

    const withSentryConfig = tsquery.replace(
      withSentryWebpackPluginOptions,
      'CallExpression > CallExpression:has(Identifier[name="composePlugins"]) > Identifier[name="nextConfig"]',
      (node) =>
        `withSentryConfig(${node.getText()}, sentryWebpackPluginOptions)`,
      {
        visitAllChildren: true,
      },
    );

    tree.write(`${projectRoot}/next.config.js`, withSentryConfig);

    // const nextConfigContent = tree
    //   .read(`${projectRoot}/next.config.js`)
    //   .toString()
    //   .replace(
    //     /^const { withNx } = require\('@nrwl\/next\/plugins\/with-nx'\);$/gm,
    //     `const { withSentryConfig } = require("@sentry/nextjs");
    //      const { withNx } = require('@nrwl/next/plugins/with-nx');`,
    //   )
    //   .replace(
    //     /^const nextConfig = {/gm,
    //     `const nextConfig = {
    //       sentry: {
    //         // Upload a larger set of source maps for prettier stack traces (increases build time)
    //         widenClientFileUpload: true,

    //         // Transpiles SDK to be compatible with IE11 (increases bundle size)
    //         transpileClientSDK: true,

    //         // Routes browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers (increases server load)
    //         tunnelRoute: '/monitoring',

    //         // Hides source maps from generated client bundles
    //         hideSourceMaps: true,

    //         // Automatically tree-shake Sentry logger statements to reduce bundle size
    //         disableLogger: true
    //       },
    //     `,
    //   )
    //   .replace(
    //     /\(nextConfig\)/gm,
    //     `(withSentryConfig(nextConfig, sentryWebpackPluginOptions))`,
    //   );

    // tree.write(
    //   `${projectRoot}/next.config.js`,
    //   nextConfigContent +
    //     `
    //        /**
    //    * @type {import('@sentry/nextjs').SentryWebpackPluginOptions}
    //    **/

    //   const sentryWebpackPluginOptions = {
    //     silent: true,
    //     org: '',
    //     project: 'web-next-js-client',
    //     authToken: process.env.SENTRY_AUTH_TOKEN,
    //   };

    //   `,
    // );

    // const envFiles = ['.env', '.env.development', '.env.production'];
    // envFiles.forEach((file) => {
    //   const envContent = tree.read(`${projectRoot}/${file}`).toString();
    //   tree.write(`${projectRoot}/${file}`, envContent + 'SENTRY_AUTH_TOKEN=');
    // });

    // generateFiles(tree, path.join(__dirname, 'files'), projectRoot, options);
  } else if (isExpoApp(tree, projectRoot)) {
    addDependenciesToPackageJson(tree, expoAppDependencies, {});

    const layoutContent = tree
      .read(`${projectRoot}/app/_layout.tsx`)
      .toString()
      .replace(
        /^import { Stack } from 'expo-router';$/gm,
        `import { Stack } from 'expo-router';import * as Sentry from "@sentry/react-native";import Constants from "expo-constants";`,
      )
      .replace(/^export default function RootLayout/gm, `function RootLayout`);

    tree.write(
      `${projectRoot}/app/_layout.tsx`,
      layoutContent +
        `
      const routingInstrumentation = new Sentry.ReactNavigationInstrumentation();

      Sentry.init({
        dsn: Constants.expoConfig?.extra?.sentry?.dsn,
        environment: Constants.expoConfig?.extra?.env,
        debug: false,
        integrations: [new Sentry.ReactNativeTracing({ routingInstrumentation })],
        enabled: !__DEV__
      });

      export default Sentry.wrap(RootLayout);`,
    );

    const appConfigContent = tree
      .read(`${projectRoot}/app.config.ts`)
      .toString()
      .replace(
        /plugins: \[/g,
        `plugins: [ [
        '@sentry/react-native/expo',
        {
          // TODO Update organization and project name
          organization: '',
          project: ''
        }
      ],`,
      );

    tree.write(`${projectRoot}/app.config.ts`, appConfigContent);
  }

  await formatFiles(tree);
}

export default sentryGenerator;
