import { posix } from 'node:path';
import {
  addDependenciesToPackageJson,
  GeneratorCallback,
  NxJsonConfiguration,
  output,
  readJson,
  Tree,
  writeJson,
} from '@nx/devkit';
import { satisfies, subset, valid, validRange } from 'semver';
import { devDependencies } from '../../dependencies';

export type TestSuite = 'unit' | 'browser' | 'e2e';

const defaults = devDependencies['next-tests'];

export const configExtensions = ['js', 'cjs', 'mjs', 'ts', 'cts', 'mts'];

interface PackageVersions {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  optionalDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
}

function declaredVersions(tree: Tree, manifest: string): Record<string, string> {
  const pkg = tree.exists(manifest) ? readJson<PackageVersions>(tree, manifest) : {};

  return { ...pkg.peerDependencies, ...pkg.dependencies, ...pkg.optionalDependencies, ...pkg.devDependencies };
}

interface PreparedSuite {
  target: string;
  commit: () => void;
}

export interface TestWorkspace {
  prepare: (suite: TestSuite, config: string) => PreparedSuite;
  apply: () => GeneratorCallback | undefined;
}

export function createTestWorkspace(tree: Tree): TestWorkspace {
  const declared = declaredVersions(tree, 'package.json');
  const nx = readJson<NxJsonConfiguration>(tree, 'nx.json');
  const additions: Record<string, string> = {};
  const registrations = new Map<string, NonNullable<NxJsonConfiguration['plugins']>[number]>();
  let vitest = false;

  function installedVersion(name: string, root = '.'): string | undefined {
    const path = posix.join(root, 'node_modules', name, 'package.json');

    return tree.exists(path) ? readJson<{ version: string }>(tree, path).version : undefined;
  }

  function declaredVersion(name: string): string | undefined {
    return declared[name] ? (installedVersion(name) ?? valid(declared[name]) ?? undefined) : undefined;
  }

  function prepare(suite: TestSuite, config: string): PreparedSuite {
    const pending: Record<string, string> = {};
    const nxVersion = installedVersion('nx') ?? valid(declared.nx);
    const root = posix.dirname(config);
    const projectManifest = `${root}/package.json`;
    const local = declaredVersions(tree, projectManifest);

    if (!nxVersion || (declared.nx && !satisfies(nxVersion, declared.nx))) {
      throw new Error('Cannot resolve an Nx version matching package.json. Install workspace dependencies first.');
    }

    function requireVersion(name: string, supported: string, fallback = supported): void {
      const rootVersion = declaredVersion(name);
      const localVersion = installedVersion(name, root);
      const hoistedVersion =
        rootVersion && local[name] && satisfies(rootVersion, local[name]) ? rootVersion : undefined;

      function check(manifest: string, requested?: string, resolved?: string): void {
        const compatible = resolved
          ? satisfies(resolved, supported) && (!requested || satisfies(resolved, requested))
          : !requested || (validRange(requested) && subset(requested, supported));

        if (!compatible) {
          throw new Error(
            `${manifest} uses ${name}@${requested ?? resolved}${requested && resolved && requested !== resolved ? ` (resolved ${resolved})` : ''}; this setup requires ${supported}. No version was changed.`,
          );
        }
      }

      check('package.json', declared[name], rootVersion);
      check(projectManifest, local[name], localVersion ?? hoistedVersion);

      if (!declared[name]) {
        pending[name] = fallback;
      }
    }

    if (suite !== 'e2e') {
      requireVersion('@nx/vitest', nxVersion);

      if (declared['@nx/eslint']) {
        requireVersion('@nx/eslint', nxVersion);
      }

      const vitestRange = `^${defaults.vitest}`;
      const existingVitest = installedVersion('vitest') ?? valid(declared.vitest);
      const vitestVersion = existingVitest && satisfies(existingVitest, vitestRange) ? existingVitest : defaults.vitest;

      requireVersion('vitest', vitestRange, vitestVersion);
      requireVersion('vite', '^8.0.0', defaults.vite);
      requireVersion('@vitejs/plugin-react', '^5.2.0 || ^6.0.0', defaults['@vitejs/plugin-react']);

      if (suite === 'browser') {
        requireVersion('vitest', vitestVersion);
      }

      if (suite === 'browser' || declared['@vitest/browser-playwright']) {
        requireVersion('@vitest/browser-playwright', vitestVersion);
      }

      for (const name of ['@vitest/ui', '@vitest/coverage-v8']) {
        if (declared[name]) {
          requireVersion(name, vitestVersion);
        }
      }
    }

    if (suite === 'unit') {
      requireVersion('jsdom', '^27.0.0 || ^28.0.0 || ^29.0.0', defaults.jsdom);
      requireVersion('@testing-library/react', '^16.0.0', defaults['@testing-library/react']);
      requireVersion('@testing-library/dom', '^10.0.0', defaults['@testing-library/dom']);
    } else {
      const playwrightVersion =
        declaredVersion('@playwright/test') ?? declaredVersion('playwright') ?? defaults.playwright;

      if (!satisfies(playwrightVersion, `^${defaults.playwright}`)) {
        throw new Error(
          `Playwright ${playwrightVersion} is incompatible with this setup; use ${defaults.playwright} or later in the 1.x line.`,
        );
      }

      requireVersion('@playwright/test', playwrightVersion);

      if (suite === 'browser' || declared.playwright) {
        requireVersion('playwright', playwrightVersion);
      }

      if (suite === 'browser') {
        requireVersion('vitest-browser-react', '^2.0.0', defaults['vitest-browser-react']);
        requireVersion('sass', '^1.0.0', defaults.sass);
      } else {
        requireVersion('@nx/playwright', nxVersion);
      }
    }

    const plugin = suite === 'e2e' ? '@nx/playwright/plugin' : '@nx/vitest';
    const entries = (nx.plugins ?? [])
      .map((entry) => (typeof entry === 'string' ? { plugin: entry } : entry))
      .filter((entry) => entry.plugin === plugin);
    const matching = entries.filter(
      ({ include, exclude }) =>
        (!include?.length || include.some((pattern) => posix.matchesGlob(config, pattern))) &&
        !exclude?.some((pattern) => posix.matchesGlob(config, pattern)),
    );

    if (entries.length && matching.length !== 1) {
      throw new Error(
        `nx.json has ${matching.length === 0 ? 'no matching' : 'overlapping'} ${plugin} registrations for ${config}. Existing plugin options were kept.`,
      );
    }

    const options = matching[0]?.options as { targetName?: string; testTargetName?: string } | undefined;
    const target = suite === 'e2e' ? (options?.targetName ?? 'e2e') : (options?.testTargetName ?? 'test');

    if (!target) {
      throw new Error(`nx.json disables the ${plugin} target for ${config}.`);
    }

    return {
      target,
      commit: () => {
        Object.assign(additions, pending);

        if (!entries.length) {
          registrations.set(plugin, suite === 'e2e' ? { plugin, options: { ciTargetName: '' } } : plugin);
        }
        vitest ||= suite !== 'e2e';
      },
    };
  }

  function apply(): GeneratorCallback | undefined {
    if (registrations.size) {
      nx.plugins = [...(nx.plugins ?? []), ...registrations.values()];
      writeJson(tree, 'nx.json', nx);
    }

    if (vitest) {
      const runners = ['vite', 'vitest']
        .flatMap((runner) => configExtensions.map((extension) => `${runner}.config.${extension}`))
        .filter((file) => tree.exists(file));

      if (runners.length) {
        output.log({ title: 'Keeping the existing root test runner config:', bodyLines: runners });
      } else {
        tree.write(
          'vitest.config.mts',
          `import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    projects: ['{apps,libs}/**/{vite,vitest}.config.{js,cjs,mjs,ts,cts,mts}'],
  },
});
`,
        );
      }
    }

    return Object.keys(additions).length ? addDependenciesToPackageJson(tree, {}, additions) : undefined;
  }

  return { prepare, apply };
}
