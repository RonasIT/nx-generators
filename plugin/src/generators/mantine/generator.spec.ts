/// <reference types="jest" />
import * as path from 'path';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import {
  addDependenciesMock,
  assertFirstLine,
  execSyncMock,
  formatFilesMock,
  generateFilesMock,
  installPackagesTaskMock,
  outputLogMock,
  readJsonMock,
  writeJsonMock,
} from '../../shared/tests-utils';
import { getAppFrameworkName } from '../../shared/utils';
import { runMantineGenerator } from './generator';

jest.mock('../../shared/utils/get-app-framework-name', () => ({
  getAppFrameworkName: jest.fn(),
}));

describe('runMantineGenerator', () => {
  let tree: ReturnType<typeof createTreeWithEmptyWorkspace>;
  const directory = 'web';
  const appRoot = `apps/${directory}`;
  const providersPath = `${appRoot}/app/[locale]/providers.tsx`;
  const layoutPath = `${appRoot}/app/[locale]/layout.tsx`;

  const providersWithStore = `'use client';

import { PropsWithChildren, ReactElement } from 'react';
import { Provider } from 'react-redux';
import { store } from '@proj/web/shared/data-access/store';

export function Providers({ children }: PropsWithChildren): ReactElement {
  return (
    <Provider store={store}>
      {children}
    </Provider>
  );
}
`;

  const layoutWithoutProviders = `import { ReactElement, ReactNode } from 'react';

export default function RootLayout({ children }: { children: ReactNode }): ReactElement {
  return (
    <html lang="en">
      <head>
        <meta name="robots" content="noindex" />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
`;

  const layoutWithMantineProvider = `import { ReactElement, ReactNode } from 'react';
import { MantineProvider } from '@mantine/core';
import { theme } from '@proj/web/shared/ui/ui-kit';

export default function RootLayout({ children }: { children: ReactNode }): ReactElement {
  return (
    <html lang="en">
      <head>
        <meta name="robots" content="noindex" />
      </head>
      <body>
        <MantineProvider theme={theme}>
          {children}
        </MantineProvider>
      </body>
    </html>
  );
}
`;

  beforeEach(() => {
    jest.clearAllMocks();
    tree = createTreeWithEmptyWorkspace();

    readJsonMock.mockImplementation((_tree, filePath) => {
      if (filePath === 'tsconfig.base.json') {
        return { compilerOptions: { paths: {} } };
      }

      return {};
    });
  });

  it('should throw if the target application is not a Next.js app', async () => {
    (getAppFrameworkName as jest.Mock).mockReturnValue('expo');

    await expect(runMantineGenerator(tree, { directory })).rejects.toThrow(
      `The Mantine generator can only be used in a Next.js application, but "${directory}" is not one.`,
    );
  });

  it('should add the mantine dependencies to package.json', async () => {
    (getAppFrameworkName as jest.Mock).mockReturnValue('next');
    tree.write(providersPath, providersWithStore);
    tree.write(layoutPath, layoutWithoutProviders);

    await runMantineGenerator(tree, { directory });

    expect(addDependenciesMock).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ '@mantine/core': expect.any(String), '@mantine/hooks': expect.any(String) }),
      expect.objectContaining({ postcss: expect.any(String) }),
    );
  });

  it('should wrap the existing redux Provider with MantineProvider when providers.tsx already exists', async () => {
    (getAppFrameworkName as jest.Mock).mockReturnValue('next');
    tree.write(providersPath, providersWithStore);
    tree.write(layoutPath, layoutWithoutProviders);

    await runMantineGenerator(tree, { directory });

    const content = tree.read(providersPath, 'utf-8');

    expect(content).toMatch(/import \{[^}]*MantineProvider[^}]*\} from '@mantine\/core';/);
    expect(content).toContain(`import { theme } from '@proj/${directory}/shared/ui/ui-kit';`);
    expect(content).toMatch(
      /<Provider store={store}>[\s\S]*<MantineProvider theme={theme}>[\s\S]*\{children\}[\s\S]*<\/MantineProvider>[\s\S]*<\/Provider>/,
    );
    expect(formatFilesMock).toHaveBeenCalledWith(tree);
  });

  it('should skip and log a message when MantineProvider is already set up in providers.tsx', async () => {
    (getAppFrameworkName as jest.Mock).mockReturnValue('next');

    const alreadySetUp = providersWithStore.replace(
      "import { Provider } from 'react-redux';",
      "import { Provider } from 'react-redux';\nimport { MantineProvider } from '@mantine/core';",
    );

    tree.write(providersPath, alreadySetUp);
    tree.write(layoutPath, layoutWithoutProviders);

    await runMantineGenerator(tree, { directory });

    expect(tree.read(providersPath, 'utf-8')).toBe(alreadySetUp);
    expect(outputLogMock).toHaveBeenCalledWith(
      expect.objectContaining({ title: expect.stringContaining('already set up') }),
    );
  });

  it('should wrap the body content of layout.tsx with MantineProvider when providers.tsx does not exist', async () => {
    (getAppFrameworkName as jest.Mock).mockReturnValue('next');
    tree.write(layoutPath, layoutWithoutProviders);

    await runMantineGenerator(tree, { directory });

    expect(tree.exists(providersPath)).toBe(false);

    const layoutContent = tree.read(layoutPath, 'utf-8') as string;

    expect(layoutContent).toMatch(/import \{[^}]*MantineProvider[^}]*\} from '@mantine\/core';/);
    expect(layoutContent).toContain(`import { theme } from '@proj/${directory}/shared/ui/ui-kit';`);
    expect(layoutContent).toMatch(
      /<body>[\s\S]*<MantineProvider theme={theme}>[\s\S]*\{children\}[\s\S]*<\/MantineProvider>[\s\S]*<\/body>/,
    );
  });

  it('should skip wrapping the body again when layout.tsx already has the MantineProvider', async () => {
    (getAppFrameworkName as jest.Mock).mockReturnValue('next');
    tree.write(layoutPath, layoutWithMantineProvider);

    await runMantineGenerator(tree, { directory });

    expect(outputLogMock).toHaveBeenCalledWith(
      expect.objectContaining({ title: expect.stringContaining('already set up') }),
    );

    const layoutContent = tree.read(layoutPath, 'utf-8') as string;

    expect(layoutContent?.match(/<MantineProvider/g)).toHaveLength(1);
  });

  it('should throw a helpful error if layout.tsx is missing and providers.tsx does not exist', async () => {
    (getAppFrameworkName as jest.Mock).mockReturnValue('next');

    await expect(runMantineGenerator(tree, { directory })).rejects.toThrow(`Could not find ${layoutPath}`);
  });

  it('should configure layout.tsx with mantineHtmlProps, ColorSchemeScript and style imports', async () => {
    (getAppFrameworkName as jest.Mock).mockReturnValue('next');
    tree.write(layoutPath, layoutWithoutProviders);

    await runMantineGenerator(tree, { directory });

    const layoutContent = tree.read(layoutPath, 'utf-8') as string;

    expect(layoutContent).toContain('{...mantineHtmlProps}');
    expect(layoutContent).toContain('<ColorSchemeScript />');
    expect(layoutContent).toContain(`import '@mantine/core/styles.layer.css';`);
    expect(layoutContent).toContain(`import '@proj/${directory}/shared/ui/styles/global';`);
  });

  it('should declare the global styles alias as an ambient module in index.d.ts', async () => {
    (getAppFrameworkName as jest.Mock).mockReturnValue('next');
    tree.write(layoutPath, layoutWithoutProviders);
    tree.write(`${appRoot}/index.d.ts`, `declare module '*.svg';\n`);

    await runMantineGenerator(tree, { directory });

    const indexDtsContent = tree.read(`${appRoot}/index.d.ts`, 'utf-8') as string;

    expect(indexDtsContent).toContain(`declare module '*.svg';`);
    expect(indexDtsContent).toContain(`declare module '@proj/${directory}/shared/ui/styles/global';`);
  });

  it('should create index.d.ts with the global styles declaration when it does not already exist', async () => {
    (getAppFrameworkName as jest.Mock).mockReturnValue('next');
    tree.write(layoutPath, layoutWithoutProviders);

    await runMantineGenerator(tree, { directory });

    const indexDtsContent = tree.read(`${appRoot}/index.d.ts`, 'utf-8') as string;

    expect(indexDtsContent).toContain(`declare module '@proj/${directory}/shared/ui/styles/global';`);
  });

  it('should not duplicate the global styles declaration when the generator runs again', async () => {
    (getAppFrameworkName as jest.Mock).mockReturnValue('next');
    tree.write(layoutPath, layoutWithoutProviders);

    await runMantineGenerator(tree, { directory });
    await runMantineGenerator(tree, { directory });

    const indexDtsContent = tree.read(`${appRoot}/index.d.ts`, 'utf-8') as string;
    const occurrences = indexDtsContent?.match(/declare module '@proj\/web\/shared\/ui\/styles\/global';/g);

    expect(occurrences).toHaveLength(1);
  });

  it('should generate root, styles and ui-kit files', async () => {
    (getAppFrameworkName as jest.Mock).mockReturnValue('next');
    tree.write(layoutPath, layoutWithoutProviders);

    await runMantineGenerator(tree, { directory });

    expect(generateFilesMock).toHaveBeenCalledTimes(3);

    assertFirstLine(path.join(__dirname, 'files/root'), '.', tree);
    assertFirstLine(path.join(__dirname, 'files/styles'), `libs/${directory}/shared/ui/styles`, tree);
    assertFirstLine(path.join(__dirname, 'files/ui-kit'), `libs/${directory}/shared/ui/ui-kit/src`, tree);

    const indexContent = tree.read(`libs/${directory}/shared/ui/ui-kit/src/index.ts`, 'utf-8');

    expect(indexContent).not.toContain('form-text-input');
  });

  it('should not generate ui-kit-form files when withFormComponents is false', async () => {
    (getAppFrameworkName as jest.Mock).mockReturnValue('next');
    tree.write(layoutPath, layoutWithoutProviders);

    await runMantineGenerator(tree, { directory, withFormComponents: false });

    expect(generateFilesMock).toHaveBeenCalledTimes(3);
  });

  it('should generate ui-kit-form files and append their exports to index.ts when withFormComponents is true', async () => {
    (getAppFrameworkName as jest.Mock).mockReturnValue('next');
    tree.write(layoutPath, layoutWithoutProviders);

    await runMantineGenerator(tree, { directory, withFormComponents: true });

    expect(generateFilesMock).toHaveBeenCalledTimes(4);

    // index.ts.template is checked separately below: its content gets merged into the base ui-kit index.ts
    assertFirstLine(path.join(__dirname, 'files/ui-kit-form'), `libs/${directory}/shared/ui/ui-kit/src`, tree, {
      ignoreFiles: ['index.ts.template'],
    });

    const indexContent = tree.read(`libs/${directory}/shared/ui/ui-kit/src/index.ts`, 'utf-8') as string;

    expect(indexContent).toContain(`export * from './lib/theme';`);
    expect(indexContent).toContain(`export * from './lib/form-text-input/component';`);
    expect(indexContent).toContain(`export * from './lib/form-textarea/component';`);
    expect(indexContent).toContain(`export * from './lib/form-checkbox/component';`);
    expect(indexContent).toContain(`export * from './lib/form-select/component';`);
    expect(indexContent.indexOf('lib/theme')).toBeLessThan(indexContent.indexOf('form-text-input'));
  });

  it('should generate the ui-kit library via react-lib and register styles paths in tsconfig.base.json', async () => {
    (getAppFrameworkName as jest.Mock).mockReturnValue('next');
    tree.write(layoutPath, layoutWithoutProviders);

    await runMantineGenerator(tree, { directory });

    expect(execSyncMock).toHaveBeenCalledWith(
      `npx nx g react-lib --app=${directory} --scope=shared --type=ui --name=ui-kit --withComponent=false`,
      { stdio: 'inherit' },
    );

    expect(writeJsonMock).toHaveBeenCalledWith(
      expect.anything(),
      'tsconfig.base.json',
      expect.objectContaining({
        compilerOptions: expect.objectContaining({
          paths: expect.objectContaining({
            [`@proj/${directory}/shared/ui/styles/variables`]: [`libs/${directory}/shared/ui/styles/_variables.scss`],
            [`@proj/${directory}/shared/ui/styles/global`]: [`libs/${directory}/shared/ui/styles/global.scss`],
          }),
        }),
      }),
    );
  });

  it('should return a callback that installs packages', async () => {
    (getAppFrameworkName as jest.Mock).mockReturnValue('next');
    tree.write(layoutPath, layoutWithoutProviders);

    const callback = await runMantineGenerator(tree, { directory });
    callback();

    expect(installPackagesTaskMock).toHaveBeenCalledWith(tree);
  });
});
