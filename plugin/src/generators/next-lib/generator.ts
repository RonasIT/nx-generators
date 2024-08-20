import {
  addDependenciesToPackageJson,
  formatFiles,
  GeneratorCallback,
  joinPathFragments,
  runTasksInSerial,
  Tree,
  updateJson,
} from '@nx/devkit';
import { nextInitGenerator } from '@nx/next/src/generators/init/init';
import { libraryGenerator as reactLibraryGenerator } from '@nx/react/src/generators/library/library';
import { initGenerator as jsInitGenerator } from '@nx/js';
import { testingLibraryReactVersion } from '@nx/react/src/utils/versions';
import { normalizeOptions } from '@nx/next/src/generators/library/lib/normalize-options';
import { eslintConfigNextVersion, tsLibVersion } from '@nx/next/src/utils/versions';
import { Schema } from './schema';

export async function libraryGenerator(host: Tree, rawOptions: Schema) {
  return await libraryGeneratorInternal(host, {
    addPlugin: false,
    projectNameAndRootFormat: 'derived',
    ...rawOptions,
  });
}

export async function libraryGeneratorInternal(host: Tree, rawOptions: Schema) {
  const options = await normalizeOptions(host, rawOptions);
  const tasks: GeneratorCallback[] = [];

  const jsInitTask = await jsInitGenerator(host, {
    js: options.js,
    skipPackageJson: options.skipPackageJson,
    skipFormat: true,
  });
  tasks.push(jsInitTask);

  const initTask = await nextInitGenerator(host, {
    ...options,
    skipFormat: true,
  });
  tasks.push(initTask);

  const libTask = await reactLibraryGenerator(host, {
    ...options,
    compiler: 'swc',
    skipFormat: true,
  });
  tasks.push(libTask);

  if (!options.skipPackageJson) {
    const devDependencies: Record<string, string> = {};
    if (options.linter === 'eslint') {
      devDependencies['eslint-config-next'] = eslintConfigNextVersion;
    }

    if (options.unitTestRunner && options.unitTestRunner !== 'none') {
      devDependencies['@testing-library/react'] = testingLibraryReactVersion;
    }

    tasks.push(
      addDependenciesToPackageJson(
        host,
        { tslib: tsLibVersion },
        devDependencies
      )
    );
  }

  const indexPath = joinPathFragments(
    options.projectRoot,
    'src',
    `index.${options.js ? 'js' : 'ts'}`
  );
  const indexContent = host.read(indexPath, 'utf-8');
  host.write(
    indexPath,
    `// Use this file to export React client components (e.g. those with 'use client' directive) or other non-server utilities\n${indexContent}`
  );

  updateJson(
    host,
    joinPathFragments(options.projectRoot, 'tsconfig.json'),
    (json) => {
      if (options.style === '@emotion/styled') {
        json.compilerOptions.jsxImportSource = '@emotion/react';
      }
      return json;
    }
  );

  updateJson(
    host,
    joinPathFragments(options.projectRoot, 'tsconfig.lib.json'),
    (json) => {
      if (!json.compilerOptions) {
        json.compilerOptions = {
          types: [],
        };
      }
      if (!json.compilerOptions.types) {
        json.compilerOptions.types = [];
      }
      json.compilerOptions.types = [
        ...json.compilerOptions.types,
        'next',
        '@nx/next/typings/image.d.ts',
      ];
      return json;
    }
  );

  if (!options.skipFormat) {
    await formatFiles(host);
  }

  return runTasksInSerial(...tasks);
}

export default libraryGenerator;