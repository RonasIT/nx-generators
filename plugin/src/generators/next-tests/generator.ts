import { basename } from 'node:path';
import {
  formatFiles,
  GeneratorCallback,
  getProjects,
  normalizePath,
  ProjectConfiguration,
  readCachedProjectGraph,
  readJson,
  Tree,
  workspaceRoot,
} from '@nx/devkit';
import { findTestConfig, scaffoldTestSuite, warnTestConflict } from '../../shared/generators/next-tests/suites';
import { createTestWorkspace } from '../../shared/generators/next-tests/workspace';
import { isNextApp, runWithMinReleaseAgeDisabled } from '../../shared/utils';
import { NextTestsGeneratorSchema } from './schema';

interface LocatedProject {
  projectName: string;
  project: ProjectConfiguration;
  inferredTargets?: ProjectConfiguration['targets'];
}

function cachedProjects(tree: Tree): Map<string, ProjectConfiguration> {
  if (normalizePath(tree.root) === normalizePath(workspaceRoot)) {
    try {
      return new Map(Object.entries(readCachedProjectGraph().nodes).map(([name, node]) => [name, node.data]));
    } catch {
      return new Map();
    }
  }

  return new Map();
}

// Projects created in a child Nx process (e.g. @nx/next:app) can be missing from getProjects and the cached graph.
function treeProject(tree: Tree, root: string): [string, ProjectConfiguration] | undefined {
  const projectJsonPath = `${root}/project.json`;
  const config = tree.exists(projectJsonPath)
    ? readJson<Omit<ProjectConfiguration, 'root'>>(tree, projectJsonPath)
    : undefined;

  if (config?.name) {
    return [config.name, { ...config, root }];
  }

  const packageJsonPath = `${root}/package.json`;
  const pkg = tree.exists(packageJsonPath)
    ? readJson<{ name?: string; nx?: Omit<ProjectConfiguration, 'root'> }>(tree, packageJsonPath)
    : undefined;
  const localConfig = config ?? pkg?.nx;

  return localConfig ? [localConfig.name ?? pkg?.name ?? basename(root), { ...localConfig, root }] : undefined;
}

export async function nextTestsGenerator(
  tree: Tree,
  { directory }: NextTestsGeneratorSchema,
): Promise<GeneratorCallback | undefined> {
  const root = `apps/${directory}`;
  const inferred = cachedProjects(tree);
  const projects = getProjects(tree);

  const projectAt = (path: string): LocatedProject | undefined => {
    const atRoot = ([, project]: [string, ProjectConfiguration]): boolean => project.root === path;
    const match = [...projects].find(atRoot) ?? treeProject(tree, path) ?? [...inferred].find(atRoot);

    if (match) {
      const [projectName, project] = match;
      const cached = inferred.get(projectName);

      return { projectName, project, inferredTargets: cached?.root === path ? cached.targets : undefined };
    }
  };
  const app = /^[\w-]+(?:\/[\w-]+)*$/.test(directory ?? '') ? projectAt(root) : undefined;

  if (!app) {
    throw new Error(
      `No Nx project found at "${root}". Set --directory to an existing Next.js app directory under apps/.`,
    );
  }

  const { projectName: appName } = app;

  if (app.project.projectType === 'library' || !isNextApp(tree, root)) {
    throw new Error(`Nx project "${appName}" at "${root}" is not a Next.js application.`);
  }

  const workspace = createTestWorkspace(tree);
  scaffoldTestSuite(tree, workspace, { ...app, suite: 'unit', root });

  const uiRoot = `libs/${directory}/shared/ui/ui-kit`;
  const globalStyles = `libs/${directory}/shared/ui/styles/global.scss`;
  const uiKit = projectAt(uiRoot);

  if (uiKit && tree.exists(`${uiRoot}/src/lib/button/component.tsx`) && tree.exists(`${uiRoot}/src/lib/theme.tsx`)) {
    if (tree.exists(globalStyles)) {
      scaffoldTestSuite(tree, workspace, {
        ...uiKit,
        suite: 'browser',
        root: uiRoot,
        globalStyles,
      });
    } else {
      warnTestConflict('browser', uiKit.projectName, `could not find the app's global styles at ${globalStyles}.`);
    }
  }

  const e2eName = `${directory.replace(/\//g, '-')}-e2e`;
  const e2eRoot = `${root}-e2e`;
  const e2eProject = projectAt(e2eRoot);
  const rootOfE2eName = (projects.get(e2eName) ?? inferred.get(e2eName))?.root;
  const appE2e =
    findTestConfig(tree, root, 'e2e') ??
    (app.project.targets?.e2e || app.inferredTargets?.e2e ? `target ${appName}:e2e` : undefined);
  const e2eConflict =
    (appE2e && `found existing ${appE2e} in the Next.js app.`) ||
    (rootOfE2eName && rootOfE2eName !== e2eRoot && `the Nx project name is already used at ${rootOfE2eName}.`) ||
    (e2eProject &&
      e2eProject.projectName !== e2eName &&
      `${e2eRoot} is already the root of Nx project "${e2eProject.projectName}".`);

  if (e2eConflict) {
    warnTestConflict('e2e', e2eName, e2eConflict);
  } else {
    scaffoldTestSuite(tree, workspace, {
      ...e2eProject,
      suite: 'e2e',
      root: e2eRoot,
      projectName: e2eName,
      directory,
      appName,
    });
  }

  const install = workspace.apply();

  await formatFiles(tree);

  return install && (() => runWithMinReleaseAgeDisabled(install));
}

export default nextTestsGenerator;
