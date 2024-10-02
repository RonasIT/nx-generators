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
  ObjectLiteralExpression,
  PropertyAssignment,
} from 'typescript';

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

    const nextConfigContent2 = tree
      .read(`${projectRoot}/next.config.js`)
      .toString();

    const ast = tsquery.ast(nextConfigContent2);

    const updatedNextConfig = tsquery.map(
      ast,
      'Identifier[name="nextConfig"] ~ ObjectLiteralExpression',
      (node: ObjectLiteralExpression) => {
        return factory.updateObjectLiteralExpression(node, [
          factory.createPropertyAssignment(
            factory.createIdentifier('sentry'),
            factory.createObjectLiteralExpression([
              factory.createPropertyAssignment(
                factory.createIdentifier('firstKey'),
                factory.createStringLiteral('string expression'),
              ),
            ]),
          ),
          ...node.properties,
        ]);
      },
      {
        visitAllChildren: true,
      },
    );

    const newFile = createPrinter().printFile(updatedNextConfig);
    tree.write(`${projectRoot}/next.config.js`, newFile);

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
