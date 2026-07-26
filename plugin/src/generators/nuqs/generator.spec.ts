/// <reference types="jest" />
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { addDependenciesMock, formatFilesMock, installPackagesTaskMock, outputLogMock } from '../../shared/tests-utils';
import { getAppFrameworkName } from '../../shared/utils';
import { runNuqsGenerator } from './generator';

jest.mock('../../shared/utils/get-app-framework-name', () => ({
  getAppFrameworkName: jest.fn(),
}));

describe('runNuqsGenerator', () => {
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
      <body>
        {children}
      </body>
    </html>
  );
}
`;

  const layoutWithNuqsAdapter = `import { ReactElement, ReactNode } from 'react';
import { NuqsAdapter } from 'nuqs/adapters/next/app';

export default function RootLayout({ children }: { children: ReactNode }): ReactElement {
  return (
    <html lang="en">
      <body>
        <NuqsAdapter>
          {children}
        </NuqsAdapter>
      </body>
    </html>
  );
}
`;

  beforeEach(() => {
    jest.clearAllMocks();
    tree = createTreeWithEmptyWorkspace();
  });

  it('should throw if the target application is not a Next.js app', async () => {
    (getAppFrameworkName as jest.Mock).mockReturnValue('expo');

    await expect(runNuqsGenerator(tree, { directory })).rejects.toThrow(
      `The nuqs generator can only be used in a Next.js application, but "${directory}" is not one.`,
    );
  });

  it('should add the nuqs dependency to package.json', async () => {
    (getAppFrameworkName as jest.Mock).mockReturnValue('next');
    tree.write(providersPath, providersWithStore);

    await runNuqsGenerator(tree, { directory });

    expect(addDependenciesMock).toHaveBeenCalledWith(expect.anything(), { nuqs: expect.any(String) }, {});
  });

  it('should wrap the existing redux Provider with NuqsAdapter when providers.tsx already exists', async () => {
    (getAppFrameworkName as jest.Mock).mockReturnValue('next');
    tree.write(providersPath, providersWithStore);

    await runNuqsGenerator(tree, { directory });

    const content = tree.read(providersPath, 'utf-8');

    expect(content).toContain(`import { NuqsAdapter } from 'nuqs/adapters/next/app';`);
    expect(content).toMatch(
      /<Provider store={store}>[\s\S]*<NuqsAdapter>[\s\S]*\{children\}[\s\S]*<\/NuqsAdapter>[\s\S]*<\/Provider>/,
    );
    expect(formatFilesMock).toHaveBeenCalledWith(tree);
  });

  it('should skip and log a message when NuqsAdapter is already set up', async () => {
    (getAppFrameworkName as jest.Mock).mockReturnValue('next');

    const alreadySetUp = providersWithStore.replace(
      "import { Provider } from 'react-redux';",
      "import { Provider } from 'react-redux';\nimport { NuqsAdapter } from 'nuqs/adapters/next/app';",
    );

    tree.write(providersPath, alreadySetUp);

    await runNuqsGenerator(tree, { directory });

    expect(tree.read(providersPath, 'utf-8')).toBe(alreadySetUp);
    expect(outputLogMock).toHaveBeenCalledWith(
      expect.objectContaining({ title: expect.stringContaining('already set up') }),
    );
  });

  it('should wrap the body content of layout.tsx with NuqsAdapter when providers.tsx does not exist', async () => {
    (getAppFrameworkName as jest.Mock).mockReturnValue('next');
    tree.write(layoutPath, layoutWithoutProviders);

    await runNuqsGenerator(tree, { directory });

    expect(tree.exists(providersPath)).toBe(false);

    const layoutContent = tree.read(layoutPath, 'utf-8') as string;

    expect(layoutContent).toContain(`import { NuqsAdapter } from 'nuqs/adapters/next/app';`);
    expect(layoutContent).toMatch(/<body>[\s\S]*<NuqsAdapter>[\s\S]*\{children\}[\s\S]*<\/NuqsAdapter>[\s\S]*<\/body>/);
  });

  it('should skip and log a message when layout.tsx already has the NuqsAdapter', async () => {
    (getAppFrameworkName as jest.Mock).mockReturnValue('next');
    tree.write(layoutPath, layoutWithNuqsAdapter);

    await runNuqsGenerator(tree, { directory });

    expect(tree.read(layoutPath, 'utf-8')).toBe(layoutWithNuqsAdapter);
    expect(outputLogMock).toHaveBeenCalledWith(
      expect.objectContaining({ title: expect.stringContaining('already set up') }),
    );
  });

  it('should throw a helpful error if layout.tsx is missing and providers.tsx does not exist', async () => {
    (getAppFrameworkName as jest.Mock).mockReturnValue('next');

    await expect(runNuqsGenerator(tree, { directory })).rejects.toThrow(`Could not find ${layoutPath}`);
  });

  it('should return a callback that installs packages', async () => {
    (getAppFrameworkName as jest.Mock).mockReturnValue('next');
    tree.write(providersPath, providersWithStore);

    const callback = await runNuqsGenerator(tree, { directory });
    callback();

    expect(installPackagesTaskMock).toHaveBeenCalledWith(tree);
  });
});
